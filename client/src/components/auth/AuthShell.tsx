import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { GlassCard } from '../ui/primitives';

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
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full items-stretch gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="relative hidden overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-accent/10 via-transparent to-transparent p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-violet/10 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <span className="grid size-11 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent shadow-glow">
              <Shield className="size-6" strokeWidth={2} aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-display text-3xl leading-tight font-bold text-white">
              One account.
              <br />
              Every scan, connected.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Sign in to keep your analysis history, threat reports and dashboard activity
              synced across the whole platform — so every threat you check stays in one place.
            </p>
          </div>
          <ul className="relative mt-8 space-y-3 text-xs text-slate-400">
            {['Private history synced to your account', 'Dashboard cards built from your real scans', 'One-click Google sign-in when configured'].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <GlassCard className="p-8 sm:p-10">
          <div className="lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2" aria-label="ScamShield AI home">
              <span className="grid size-9 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
                <Shield className="size-5" aria-hidden="true" />
              </span>
              <span className="font-display text-sm font-bold tracking-widest text-white uppercase">
                ScamShield<span className="text-accent"> AI</span>
              </span>
            </Link>
          </div>

          <h1 className="mt-6 font-display text-2xl font-bold text-white sm:text-3xl lg:mt-2">{heading}</h1>
          <p className="mt-2 text-sm text-slate-400">{subtext}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-6">{footer}</div>
        </GlassCard>
      </div>
    </div>
  );
}