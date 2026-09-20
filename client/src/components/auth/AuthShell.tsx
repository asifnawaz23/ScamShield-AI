import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

/** Angular HUD corner brackets, like a sci-fi targeting frame. */
function HudCorners() {
  const base = 'pointer-events-none absolute h-6 w-6 border-accent';
  return (
    <>
      <span className={`${base} left-0 top-0 border-l-2 border-t-2`} />
      <span className={`${base} right-0 top-0 border-r-2 border-t-2`} />
      <span className={`${base} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${base} bottom-0 right-0 border-b-2 border-r-2`} />
    </>
  );
}

/**
 * Cyber/HUD auth frame used by Login & Signup.
 * Props are unchanged so the auth pages work exactly as before — this only
 * changes the visual chrome (background + glowing bracketed card).
 */
export function AuthShell({
  heading,
  subtext,
  children,
  footer,
}: {
  heading: string;
  subtext: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
      {/* ── Cyber background ─────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        {/* deep radial glow like a distant globe */}
        <div className="absolute right-[-15%] top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),rgba(34,211,238,0.04)_40%,transparent_70%)]" />
        <div className="absolute right-[-10%] top-1/2 hidden h-[520px] w-[520px] -translate-y-1/2 rounded-full border border-accent/15 md:block" />
        <div className="absolute right-[-4%] top-1/2 hidden h-[360px] w-[360px] -translate-y-1/2 rounded-full border border-accent/10 md:block" />
        {/* dotted grid + scan sheen */}
        <div className="absolute inset-0 bg-grid-faint bg-[length:38px_38px] opacity-60" />
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[150px]" />
        <div className="absolute -bottom-48 left-1/4 h-[420px] w-[420px] rounded-full bg-violet/10 blur-[160px]" />
      </div>

      <div className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_minmax(380px,440px)]">
        {/* ── Left: brand / tagline (hidden on small screens) ─────────────── */}
        <div className="relative hidden lg:block">
          <span className="inline-grid size-12 place-items-center rounded-xl border border-accent/40 bg-accent/10 text-accent shadow-glow">
            <Shield className="size-7" strokeWidth={2} aria-hidden="true" />
          </span>
          <h2 className="mt-6 font-display text-4xl font-bold leading-tight text-white">
            Secure access to
            <br />
            <span className="text-accent">ScamShield AI</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Evidence-based scam &amp; phishing intelligence. Sign in to keep your analysis history,
            threat reports and dashboard synced across every scan.
          </p>
          <ul className="mt-8 space-y-3 font-mono text-xs uppercase tracking-widest text-slate-500">
            {['Encrypted session tokens', 'Private, per-account history', 'Evidence-first detection engine'].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(34,211,238,0.8)]" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right: HUD card ─────────────────────────────────────────────── */}
        <div className="relative mx-auto w-full max-w-md">
          {/* outer glow */}
          <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-accent/20 opacity-40 blur-xl" aria-hidden="true" />
          <div className="relative rounded-2xl border border-accent/30 bg-ink-900/70 p-7 shadow-[0_0_40px_-8px_rgba(34,211,238,0.35)] backdrop-blur-xl sm:p-9">
            <HudCorners />

            {/* mobile brand */}
            <div className="mb-6 lg:hidden">
              <Link to="/" className="inline-flex items-center gap-2" aria-label="ScamShield AI home">
                <span className="grid size-9 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
                  <Shield className="size-5" aria-hidden="true" />
                </span>
                <span className="font-display text-sm font-bold uppercase tracking-widest text-white">
                  ScamShield<span className="text-accent"> AI</span>
                </span>
              </Link>
            </div>

            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-accent">Secure Access</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">{heading}</h1>
            <p className="mt-2 text-sm text-slate-400">{subtext}</p>

            <div className="mt-7">{children}</div>

            <div className="mt-6">{footer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
