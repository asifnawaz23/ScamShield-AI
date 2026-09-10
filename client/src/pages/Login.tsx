import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MailCheck, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from '../components/auth/AuthShell';
import { GoogleButton } from '../components/auth/GoogleButton';
import { Field } from '../components/auth/Field';
import { OtpInput } from '../components/auth/OtpInput';
import { Button, Spinner } from '../components/ui/primitives';
import { cx } from '../lib/utils';

type Method = 'code' | 'password';

export function Login() {
  const { user, login, sendOtp, verifyOtp, openGoogleLogin, loginWithGoogleDemo, googleEnabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const from = location.state?.from || '/dashboard';

  const [method, setMethod] = useState<Method>('code');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [otpStep, setOtpStep] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  useEffect(() => {
    let active = true;
    if (otpStep && resendIn > 0) {
      timerRef.current = setInterval(() => {
        setResendIn((v) => {
          if (v <= 1) {
            clearTimer();
            return 0;
          }
          return v - 1;
        });
      }, 1000);
    }
    return () => {
      active = false;
      clearTimer();
    };
  }, [otpStep, resendIn > 0]);

  // Auto-verify once all 6 digits are entered.
  useEffect(() => {
    if (otpStep && code.length === 6 && !otpBusy) {
      handleVerify();
    }
  }, [code, otpStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

  const sendCode = async () => {
    setError(null);
    setInfo(null);
    if (!validEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSending(true);
    try {
      const result = await sendOtp(email.trim());
      setMaskedEmail(result.email);
      setCode('');
      setOtpStep(true);
      setResendIn(result.resendAfter || 60);
      setInfo(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not send the code. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6 || otpBusy) return;
    setError(null);
    setInfo(null);
    setOtpBusy(true);
    try {
      await verifyOtp(email.trim(), code);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code could not be verified. Please try again.');
      setCode('');
    } finally {
      setOtpBusy(false);
    }
  };

  const resend = () => {
    if (resendIn > 0 || sending) return;
    sendCode();
  };

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validEmail(email) || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setPasswordBusy(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Please try again.');
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <AuthShell
      heading={otpStep ? 'Enter your code' : 'Welcome back'}
      subtext={
        otpStep
          ? `We sent a 6-digit code to ${maskedEmail}.`
          : 'Sign in to access your dashboard, history and connected analyses.'
      }
      footer={
        <p className="text-center text-sm text-slate-400">
          New to ScamShield AI?{' '}
          <Link className="font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" to="/signup">
            Create an account
          </Link>
        </p>
      }
    >
      {otpStep ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4">
            <MailCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-slate-300">
              <span className="font-semibold text-white">Check your inbox.</span> The code expires in 10 minutes. It was
              never stored or returned in plain text — only a secure hash.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="otp-code" className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
              Verification code
            </label>
            <OtpInput value={code} onChange={setCode} disabled={otpBusy} ariaLabel="Six digit verification code" />
            <p className="text-xs text-slate-600">Auto-checks when all 6 digits are entered.</p>
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-risk-red/30 bg-risk-red/10 px-3 py-2 text-sm text-risk-red">
              {error}
            </p>
          )}
          {info && <p className="rounded-lg border border-risk-green/25 bg-risk-green/10 px-3 py-2 text-sm text-risk-green">{info}</p>}

          <Button onClick={handleVerify} disabled={otpBusy || code.length !== 6} className="w-full">
            {otpBusy ? <Spinner className="size-4" /> : null}
            {otpBusy ? 'Verifying…' : 'Verify & continue'}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              onClick={() => {
                clearTimer();
                setOtpStep(false);
                setCode('');
                setError(null);
                setInfo(null);
              }}
              className="inline-flex items-center gap-1.5 text-slate-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Use a different email
            </button>
            <button
              onClick={resend}
              disabled={resendIn > 0 || sending}
              className={cx(
                'font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                resendIn > 0 ? 'cursor-not-allowed text-slate-600' : 'text-accent hover:underline',
              )}
            >
              {sending ? 'Sending…' : resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {googleEnabled && (
            <GoogleButton
              onClick={async () => {
                setGoogleBusy(true);
                setError(null);
                try {
                  await openGoogleLogin();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Could not open Google sign-in.');
                } finally {
                  setGoogleBusy(false);
                }
              }}
              loading={googleBusy}
            />
          )}

          <GoogleButton
            demo
            label="Continue with Google (Demo)"
            onClick={async () => {
              setGoogleBusy(true);
              setError(null);
              try {
                await loginWithGoogleDemo();
                navigate(from, { replace: true });
              } catch {
                setError('Demo Google sign-in failed. Please try again.');
              } finally {
                setGoogleBusy(false);
              }
            }}
            loading={googleBusy}
            disabled={googleBusy}
          />
          <div id="google-input-hint" className="sr-only">
            Demo sign-in creates a sample account and never contacts Google.
          </div>

          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-white/10" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">or continue with email</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div role="tablist" aria-label="Sign-in method" className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {(['code', 'password'] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={method === m}
                onClick={() => {
                  setMethod(m);
                  setError(null);
                }}
                className={cx(
                  'rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-widest transition',
                  method === m ? 'bg-accent text-ink-950' : 'text-slate-400 hover:text-white',
                )}
              >
                {m === 'code' ? 'Email code' : 'Password'}
              </button>
            ))}
          </div>

          {method === 'code' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendCode();
              }}
              className="space-y-4"
              noValidate
            >
              <Field
                id="otp-email"
                label="Email address"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              {error && (
                <p role="alert" className="rounded-lg border border-risk-red/30 bg-risk-red/10 px-3 py-2 text-sm text-risk-red">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={sending} className="w-full">
                {sending ? <Spinner className="size-4" /> : null}
                {sending ? 'Sending code…' : 'Send code'}
              </Button>
              <p className="text-xs leading-relaxed text-slate-600">
                A 6-digit code will be sent to your inbox. New? You'll be signed up automatically.
              </p>
            </form>
          ) : (
            <form onSubmit={submitPassword} className="space-y-4" noValidate>
              <Field
                id="pw-email"
                label="Email address"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Field
                id="pw-password"
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
              {error && (
                <p role="alert" className="rounded-lg border border-risk-red/30 bg-risk-red/10 px-3 py-2 text-sm text-risk-red">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={passwordBusy} className="w-full">
                {passwordBusy ? <Spinner className="size-4" /> : null}
                {passwordBusy ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          )}

          {method === 'password' && user && (
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="size-3.5 text-accent" aria-hidden="true" />
              Passwords are stored as salted scrypt hashes — never in plain text.
            </p>
          )}
        </div>
      )}
    </AuthShell>
  );
}