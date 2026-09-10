import { Link } from 'react-router-dom';
import { Shield, Info, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Footer() {
  const { user } = useAuth();
  return (
    <footer className="relative z-10 border-t border-white/5 bg-ink-950/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
                <Shield className="size-5" aria-hidden="true" />
              </span>
              <span className="font-display text-sm font-bold tracking-widest text-white uppercase">
                ScamShield<span className="text-accent"> AI</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              See the scam before it sees you. Explainable AI-powered scam intelligence for everyone.
            </p>
            <p className="mt-4 text-xs text-slate-500">
              Demo build for hackathon judging. Not a substitute for your own judgement.
            </p>
          </div>

          <nav aria-label="Product">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li><Link to="/analyze" className="transition-colors hover:text-white">Analyze a threat</Link></li>
              {user && (
                <>
                  <li><Link to="/dashboard" className="transition-colors hover:text-white">Security dashboard</Link></li>
                  <li><Link to="/history" className="transition-colors hover:text-white">Analysis history</Link></li>
                </>
              )}
              <li><Link to="/learn" className="transition-colors hover:text-white">Scam education center</Link></li>
            </ul>
          </nav>

          <nav aria-label="Trust">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Trust</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li><Link to="/about" className="transition-colors hover:text-white">About</Link></li>
              <li><Link to="/privacy" className="transition-colors hover:text-white">Privacy</Link></li>
              <li><Link to="/privacy/#responsible" className="transition-colors hover:text-white">Responsible AI</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-xs text-slate-600 md:flex-row">
          <p>© {new Date().getFullYear()} ScamShield AI. Built for the opportunity.</p>
          <p className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-accent" aria-hidden="true" />
            Evidence-based · Privacy-first · Human-in-the-loop
          </p>
        </div>
      </div>
    </footer>
  );
}