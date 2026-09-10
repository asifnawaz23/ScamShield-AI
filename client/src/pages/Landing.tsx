import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Shield, ScanSearch, ArrowRight, Sparkles, Activity, BrainCircuit, Route, MessageSquareHeart, Lock, FileSearch, Eye, LayoutDashboard, LogIn } from 'lucide-react';
import { ShieldScene } from '../components/three/ShieldScene';
import { PhoneMockup } from '../components/scan/PhoneMockup';
import { ScanOverlay } from '../components/scan/ScanOverlay';
import { Button, Badge, Magnetic } from '../components/ui/primitives';
import { useCountUp } from '../hooks/useCountUp';
import { usePrefersReducedMotion } from '../hooks/useObserver';
import { apiAnalyze } from '../lib/api';
import { useToast } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';

const DEMO_MESSAGE =
  'Congratulations! You have been selected to receive a cash prize of Rs. 50,000. Claim your reward immediately: http://festive-win2026.xyz/claim Hurry! Offer expires tonight!';

const FEATURES = [
  { icon: BrainCircuit, title: 'Explainable AI', desc: 'Every score comes with evidence, inference, and honest uncertainty. You always know why.', gradient: 'from-accent/15 to-transparent' },
  { icon: ScanSearch, title: 'Deep signal extraction', desc: 'Urgency, reward bait, authority impersonation, credential requests and link risk analyzed in seconds.', gradient: 'from-violet/15 to-transparent' },
  { icon: Route, title: 'Attack-chain insight', desc: 'See what could happen next if you engage — a defensive simulation, never instructions.', gradient: 'from-rose-500/10 to-transparent' },
  { icon: MessageSquareHeart, title: 'Safe reply generator', desc: 'Politely decline an unwanted request without revealing a single sensitive detail.', gradient: 'from-emerald-500/10 to-transparent' },
  { icon: Lock, title: 'Privacy-first', desc: 'Your content is analyzed without being stored as raw messages. No secrets, no password harvesting.', gradient: 'from-cyan-500/10 to-transparent' },
  { icon: FileSearch, title: 'Any format, one place', desc: 'Paste text, upload a screenshot, or drop a URL — messages, emails, job offers and payment requests.', gradient: 'from-orange-500/10 to-transparent' },
];

function CounterBlock({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const v = useCountUp(value, 2200);
  return (
    <div className="text-center">
      <p className="font-display text-3xl font-bold text-white sm:text-4xl">
        {v.toLocaleString()}
        {suffix && <span className="text-accent">{suffix}</span>}
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.25em] text-slate-500">{label}</p>
    </div>
  );
}

function HeroDemo() {
  const navigate = useNavigate();
  const toast = useToast();
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ score: number; label: string } | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const runScan = () => {
    if (scanning) return;
    clearTimers();
    setScanning(true);
    setStage(0);
    setDone(false);
    setResult(null);
    setStage(1);
    for (let i = 2; i <= 6; i++) {
      timers.current.push(window.setTimeout(() => setStage(i), 520 * (i - 1)));
    }
    apiAnalyze(DEMO_MESSAGE, 'text')
      .then(({ analysis }) => {
        const score = analysis.riskScore;
        try {
          localStorage.setItem('scamshield:hero-report', JSON.stringify(analysis));
        } catch {
          // storage unavailable
        }
        timers.current.push(
          window.setTimeout(() => {
            setResult({ score, label: `Threat detected — ${score} / 100 · ${analysis.riskLabel}` });
            setDone(true);
            setScanning(false);
          }, 520 * 5 + 600),
        );
      })
      .catch(() => {
        timers.current.push(
          window.setTimeout(() => {
            toast.push('Demo analysis could not reach the analyzer service. Is the backend running?', 'error');
            setScanning(false);
          }, 520 * 4),
        );
      });
  };

  return (
    <div className="mx-auto mt-20 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge tone="red" className="mb-5">Live demo simulation</Badge>
          <h3 className="font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
            Watch ScamShield dissect a message <span className="text-accent">in seconds</span>.
          </h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
            This simulated conversation runs through the same pipeline as the full workspace — signals, indicators and
            reasoning are generated live by the analysis engine.
          </p>
          <Button size="lg" onClick={runScan} className="mt-7" disabled={scanning}>
            {scanning ? <Activity className="size-4 animate-spin" aria-hidden="true" /> : <ScanSearch className="size-4" aria-hidden="true" />}
            {scanning ? 'Scanning…' : 'Scan message'}
          </Button>
          <AnimatePresence>
            {done && result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-5 flex flex-wrap items-center gap-3"
              >
                <span className="rounded-full border border-risk-red/30 bg-risk-red/10 px-4 py-2 font-display font-bold text-risk-red">
                  {result.score}/100
                </span>
                <Badge tone="red">High-risk indicators detected</Badge>
                <button
                  onClick={() => {
                    const stored = localStorage.getItem('scamshield:hero-report');
                    const report = stored ? JSON.parse(stored) : null;
                    navigate(`/results/${report?.id ?? 'hero'}`, { state: { analysis: report } });
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-soft"
                >
                  Open full report <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto"
        >
          <PhoneMockup message={DEMO_MESSAGE} pending={!done} />
        </motion.div>
      </div>

      <ScanOverlay visible={scanning || done} stage={stage} done={done} resultLine={result?.label ?? null} />
    </div>
  );
}

export function Landing() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.92]);
  const { user } = useAuth();

  return (
    <div ref={ref}>
      <section className="relative min-h-[92vh] overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <ShieldScene className="absolute right-[-10%] top-1/2 hidden h-[560px] w-[560px] -translate-y-1/2 lg:block xl:right-0" interactive={!reduced} />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col items-center justify-center px-4 pb-16 pt-28 text-center sm:px-6 lg:px-8"
        >
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.3em] text-slate-300 backdrop-blur"
          >
            <Sparkles className="size-3.5 text-accent" aria-hidden="true" />
            AI-powered scam intelligence for everyone
          </motion.div>

          <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            See the scam
            <span className="block bg-gradient-to-r from-cyan-300 via-accent to-violet-soft bg-clip-text text-transparent">
              before it sees you.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-slate-400 sm:text-lg">
            Paste a suspicious message, upload a screenshot, or drop a link. ScamShield turns it into an understandable
            threat report — with evidence, not accusations.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Magnetic>
              <Link
                to={user ? '/dashboard' : '/signup'}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent-deep via-cyan-500 to-accent px-8 py-4 font-mono text-sm font-bold uppercase tracking-[0.18em] text-ink-950 shadow-glow transition-all duration-300 hover:brightness-110 hover:shadow-glow active:scale-[0.98] sm:w-auto"
              >
                {user ? <LayoutDashboard className="size-4" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                {user ? 'Go to dashboard' : 'Get started — free'}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                to={user ? '/analyze' : '/login'}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-4 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-white backdrop-blur transition-all duration-300 hover:bg-white/10 hover:border-white/25 active:scale-[0.98] sm:w-auto"
              >
                {user ? <ScanSearch className="size-4 text-accent" aria-hidden="true" /> : <LogIn className="size-4 text-accent" aria-hidden="true" />}
                {user ? 'Analyze a threat' : 'Sign in'}
              </Link>
            </Magnetic>
            {!user && (
              <Magnetic>
                <button
                  onClick={() => {
                    document.getElementById('hero-demo')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full font-mono text-sm font-semibold uppercase tracking-[0.18em] text-accent transition hover:text-accent-soft sm:w-auto"
                >
                  <Eye className="size-4" aria-hidden="true" />
                  Try live demo
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </Magnetic>
            )}
          </div>

          <div className="mt-12 grid w-full max-w-2xl grid-cols-2 gap-8 border-t border-white/5 pt-8 sm:grid-cols-4">
            <CounterBlock label="Messages analyzed*" value={12840} />
            <CounterBlock label="Threats detected*" value={4317} />
            <CounterBlock label="Detection patterns" value={56} />
            <CounterBlock label="Protection actions*" value={92} />
          </div>
          <p className="mt-3 text-[10px] uppercase tracking-widest text-slate-600">
            * Demo simulation — illustrative numbers, not real-world claims.
          </p>
        </motion.div>
      </section>

      <HeroDemo />

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8" aria-labelledby="features-heading">
        <div className="mb-12 flex flex-col gap-2 text-center">
          <p className="font-mono text-[11px] tracking-[0.35em] text-accent uppercase">What it does</p>
          <h2 id="features-heading" className="font-display text-3xl font-bold text-white sm:text-4xl">
            Intelligence you can reason with
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i, duration: 0.5 }}
              className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
              <div className="relative">
                <f.icon className="size-6 text-accent" strokeWidth={1.6} aria-hidden="true" />
                <h3 className="mt-4 font-display text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-28 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-accent/10 via-transparent to-violet/10 p-10 text-center sm:p-16">
          <Shield className="pointer-events-none absolute -right-8 -top-8 size-40 text-accent/10" aria-hidden="true" />
          <h2 className="text-balance font-display text-2xl font-bold text-white sm:text-4xl">
            Don't just detect the scam. Understand it.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            ScamShield doesn't replace your judgement. It gives you the context you need to make safer decisions —
            before it's too late.
          </p>
          <Link
            to={user ? '/analyze' : '/signup'}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-mono text-sm font-bold uppercase tracking-widest text-ink-950 transition-all duration-300 hover:bg-cyan-100 hover:scale-[1.02] active:scale-[0.98]"
          >
            {user ? 'Start analyzing' : 'Sign up to start'} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}