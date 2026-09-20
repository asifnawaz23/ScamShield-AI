import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from '../components/auth/AuthShell';
import { Field } from '../components/auth/Field';
import { Button, Spinner } from '../components/ui/primitives';

type Status = 'loading' | 'success' | 'error' | 'no-token';

export function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();
  const handled = useRef(false);
  const redirectTimer = useRef<number | null>(null);

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState<string>('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendBusy, setResendBusy] = useState(false);
  const [resendInfo, setResendInfo] = useState<string | null>(null);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = params.get('token');
    if (!token) {
      setStatus('no-token');
      setMessage('No verification token was provided.');
      return;
    }

    verifyEmail(token)
      .then(() => {
        setStatus('success');
        // Clean the token out of the URL.
        window.history.replaceState({}, '', '/verify-email');
        // Auto-redirect to the dashboard shortly after showing the confirmation,
        // so the user doesn't have to click anything. Manual buttons remain as
        // a fallback (e.g. if the timer is interrupted).
        redirectTimer.current = window.setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1800);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'This verification link is invalid or has expired.');
      });
  }, [params, verifyEmail, navigate]);

  // Clean up the auto-redirect timer on unmount.
  useEffect(() => () => {
    if (redirectTimer.current) window.clearTimeout(redirectTimer.current);
  }, []);

  const doResend = async () => {
    setResendInfo(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(resendEmail.trim())) {
      setResendInfo('Please enter a valid email address.');
      return;
    }
    setResendBusy(true);
    try {
      const r = await resendVerification(resendEmail.trim());
      setResendInfo(r.message);
    } catch {
      setResendInfo('Could not resend right now. Please try again shortly.');
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <AuthShell
      heading={
        status === 'success' ? 'Email verified' : status === 'loading' ? 'Verifying your email' : 'Verification link problem'
      }
      subtext={
        status === 'success'
          ? 'Your email address has been confirmed and you are now signed in.'
          : status === 'loading'
            ? 'Please wait while we confirm your verification link.'
            : 'We could not verify this link. You can request a fresh one below.'
      }
      footer={
        <p className="text-center text-sm text-slate-400">
          <Link className="font-semibold text-accent hover:underline" to="/">
            Go to Landing Page
          </Link>
        </p>
      }
    >
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-6 text-slate-400">
          <Spinner className="size-6" />
          <p className="text-sm">Completing verification…</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-risk-green/25 bg-risk-green/10 p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-risk-green" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-slate-300">
              <span className="font-semibold text-white">Email verified successfully.</span> Taking you to your dashboard…
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="w-full" onClick={() => navigate('/dashboard', { replace: true })}>
              Go to Dashboard now
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/', { replace: true })}>
              Go to Landing Page
            </Button>
          </div>
        </div>
      )}

      {(status === 'error' || status === 'no-token') && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-risk-red/25 bg-risk-red/10 p-4">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-risk-red" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-slate-300">{message}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <MailCheck className="size-4 text-accent" aria-hidden="true" />
              Resend verification email
            </div>
            <Field
              id="resend-email"
              label="Email address"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {resendInfo && (
              <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">{resendInfo}</p>
            )}
            <Button className="w-full" onClick={doResend} disabled={resendBusy}>
              {resendBusy ? <Spinner className="size-4" /> : null}
              {resendBusy ? 'Sending…' : 'Resend verification email'}
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link className="font-semibold text-accent hover:underline" to="/login">
              Go to Login
            </Link>
            <Link className="text-slate-400 hover:text-white" to="/">
              Go to Landing Page
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
