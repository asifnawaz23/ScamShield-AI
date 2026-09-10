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

export function Signup() {
  const { sendSignupOtp, verifyOtp, openGoogleLogin, loginWithGoogleDemo, googleEnabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const from = location.state?.from || '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const [otpStep, setOtpStep] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [info, setInfo] = useState<string | null>(null);
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
      clearTimer();
    };
  }, [otpStep, resendIn > 0]);

  // Auto-verify once all 6 digits are entered.
  useEffect(() => {
    if (otpStep && code.length === 6 && !otpBusy) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, otpStep]);

  const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
  const validPassword = (value: string) => value.length >= 8;

  const sendCode = async () => {
    setError(null);
    setInfo(null);
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!validEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!validPassword(password)) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setSending(true);
    try {
      const result = await sendSignupOtp(name.trim(), email.trim(), password);
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
      const user = await verifyOtp(email.trim(), code);
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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    sendCode();
  };

  return (
    <AuthShell
      heading={otpStep ? 'Confirm your email' : 'Create your account'}
      subtext={
        otpStep
          ? `We sent a 6-digit code to ${maskedEmail}.`
          : 'Sign up and connect every analysis to your dashboard.'
      }
      footer={
        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link className="font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" to="/login">
            Sign in
          </Link>
        </p>
      }
    >
      {otpStep ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4">
            <MailCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-slate-300">
              <span className="font-semibold text-white">Check your inbox.</span> The code was sent only to{' '}
              {maskedEmail} — the account is created only after you confirm it. It expires in 10 minutes.
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
            {otpBusy ? 'Creating your account…' : 'Confirm & continue'}
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
            label="Sign up with Google (Demo)"
            onClick={async () => {
              setGoogleBusy(true);
              setError(null);
              try {
                await loginWithGoogleDemo();
                navigate(from, { replace: true });
              } catch {
                setError('Demo Google sign-up failed. Please try again.');
              } finally {
                setGoogleBusy(false);
              }
            }}
            loading={googleBusy}
            disabled={googleBusy}
          />
          <div className="sr-only">Demo sign-up creates a sample account and never contacts Google.</div>

          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-white/10" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">or sign up with email</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field
              id="su-name"
              label="Full name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <Field
              id="su-email"
              label="Email address"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Field
              id="su-password"
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              hint="Use at least 8 characters. We only store a salted hash — never the plain password."
            />
            {error && (
              <p role="alert" className="rounded-lg border border-risk-red/30 bg-risk-red/10 px-3 py-2 text-sm text-risk-red">
                {error}
              </p>
            )}
            <Button type="submit" disabled={sending} className="w-full">
              {sending ? <Spinner className="size-4" /> : null}
              {sending ? 'Sending code…' : 'Send verification code'}
            </Button>
            <p className="text-xs leading-relaxed text-slate-600">
              A 6-digit code is sent to <span className="text-slate-400">your email</span> to confirm it. Your account is
              created only after you prove you own that inbox.
            </p>
          </form>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="size-3.5 text-accent" aria-hidden="true" />
            Your password is stored as a salted scrypt hash — never in plain text.
          </p>
          <p className="text-xs leading-relaxed text-slate-600">
            By continuing you agree to the <Link to="/privacy" className="text-slate-400 underline hover:text-white">Privacy & Responsible AI</Link> policy.
          </p>
        </div>
      )}
    </AuthShell>
  );
}