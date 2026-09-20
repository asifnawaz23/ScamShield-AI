import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MailCheck, ShieldCheck, LayoutDashboard, Home, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from '../components/auth/AuthShell';
import { GoogleButton } from '../components/auth/GoogleButton';
import { Field } from '../components/auth/Field';
import { Button, Spinner } from '../components/ui/primitives';

export function Signup() {
  const { user, register, resendVerification, openGoogleLogin, googleEnabled } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  // After a successful signup we switch to a "check your email" confirmation view.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [delivered, setDelivered] = useState(true);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resendBusy, setResendBusy] = useState(false);

  const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

  // Google signup logs the user in immediately → go straight to the dashboard
  // instead of staying on the signup page.
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Please enter your name.');
    if (!validEmail(email)) return setError('Please enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters long.');
    if (password !== confirm) return setError('Passwords do not match.');

    setBusy(true);
    try {
      const result = await register(name.trim(), email.trim(), password);
      // Account created (unverified). Show the confirmation screen.
      setMaskedEmail(result.email || email.trim());
      setDelivered(result.delivered);
      setSentTo(email.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const doResend = async () => {
    if (!sentTo) return;
    setResendMsg(null);
    setResendBusy(true);
    try {
      const r = await resendVerification(sentTo);
      setResendMsg(r.message);
    } catch {
      setResendMsg('Could not resend right now. Please try again shortly.');
    } finally {
      setResendBusy(false);
    }
  };

  const footer = (
    <div className="space-y-3">
      <p className="text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link className="font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" to="/login">
          Sign in
        </Link>
      </p>
      <div className="flex items-center justify-center gap-4 border-t border-white/10 pt-3 text-xs text-slate-500">
        <Link to={user ? '/dashboard' : '/login'} className="inline-flex items-center gap-1.5 transition hover:text-white">
          <LayoutDashboard className="size-3.5" aria-hidden="true" />
          Return to Dashboard
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/" className="inline-flex items-center gap-1.5 transition hover:text-white">
          <Home className="size-3.5" aria-hidden="true" />
          Go to Landing Page
        </Link>
      </div>
    </div>
  );

  // ── Confirmation screen (after successful signup) ──────────────────────────
  if (sentTo) {
    return (
      <AuthShell
        heading="Welcome to ScamShield AI"
        subtext="Your account has been created. One quick step to activate it."
        footer={footer}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-risk-green/25 bg-risk-green/10 p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-risk-green" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-slate-300">
              <span className="font-semibold text-white">Account created.</span> We&apos;ve sent a verification link to{' '}
              <span className="font-semibold text-white">{maskedEmail}</span>. Open it to activate your account — you&apos;ll be
              taken straight to your dashboard.
            </p>
          </div>

          {!delivered && (
            <p className="rounded-lg border border-risk-yellow/30 bg-risk-yellow/10 px-3 py-2 text-sm text-risk-yellow">
              We couldn&apos;t confirm the email was sent. Use “Resend verification email” below.
            </p>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4">
            <MailCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-slate-300">
              Didn&apos;t get it? Check your spam folder, or resend the link. It expires after a short while for your security.
            </p>
          </div>

          {resendMsg && (
            <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">{resendMsg}</p>
          )}

          <Button className="w-full" onClick={doResend} disabled={resendBusy}>
            {resendBusy ? <Spinner className="size-4" /> : null}
            {resendBusy ? 'Sending…' : 'Resend verification email'}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Link to="/login" className="font-semibold text-accent hover:underline">
              Go to Sign in
            </Link>
            <Link to="/" className="text-slate-400 hover:text-white">
              Go to Landing Page
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  // ── Signup form ────────────────────────────────────────────────────────────
  return (
    <AuthShell heading="Create your account" subtext="Sign up and connect every analysis to your dashboard." footer={footer}>
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

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-white/10" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">or sign up with email</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field id="su-name" label="Full name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <Field id="su-email" label="Email address" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Field id="su-password" label="Password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" hint="Use at least 8 characters. We only store a salted hash — never the plain password." />
          <Field id="su-confirm" label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password" />
          {error && (
            <p role="alert" className="rounded-lg border border-risk-red/30 bg-risk-red/10 px-3 py-2 text-sm text-risk-red">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? <Spinner className="size-4" /> : null}
            {busy ? 'Creating your account…' : 'Create account'}
          </Button>
          <p className="text-xs leading-relaxed text-slate-600">
            After signing up we&apos;ll email you a verification link. Click it to activate your account and jump to your dashboard.
          </p>
        </form>

        <p className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="size-3.5 text-accent" aria-hidden="true" />
          Your password is stored as a salted scrypt hash — never in plain text.
        </p>
        <p className="text-xs leading-relaxed text-slate-600">
          By continuing you agree to the <Link to="/privacy" className="text-slate-400 underline hover:text-white">Privacy &amp; Responsible AI</Link> policy.
        </p>
      </div>
    </AuthShell>
  );
}
