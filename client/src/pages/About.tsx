import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Target, HeartHandshake, Lock, ArrowRight } from 'lucide-react';
import { GlassCard } from '../components/ui/primitives';

const PILLARS = [
  { icon: Target, title: 'Clarity over alarm', desc: 'A red score means nothing without a reason. We explain what was seen and how much we can actually infer from it.' },
  { icon: HeartHandshake, title: 'For everyday people', desc: 'The person receiving a forwarded scam should understand it — not just security analysts.' },
  { icon: Lock, title: 'Privacy by default', desc: 'No raw messages stored, no scraping of your links, no harvesting of secrets. Analysis happens with respect for your data.' },
];

const PIPELINE = [
  { n: '01', title: 'Signal extraction', desc: 'The message is decomposed into urgency, fear, authority, reward bait, payment and credential patterns.' },
  { n: '02', title: 'Link & structure checks', desc: 'URLs are inspected structurally for shorteners, high-risk extensions, IP hosting and domain mismatch.' },
  { n: '03', title: 'Risk modelling', desc: 'Weighted indicators produce a 0–100 risk estimate across social engineering, financial, credential, link and urgency dimensions.' },
  { n: '04', title: 'Explainability layer', desc: 'Every number is translated into evidence, inference and uncertainty — plus what to do next.' },
];

export function About() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mx-auto grid max-w-3xl place-items-center text-center">
          <span className="grid size-16 place-items-center rounded-2xl border border-accent/30 bg-accent/10 text-accent shadow-glow">
            <Shield className="size-8" aria-hidden="true" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold text-white sm:text-5xl">Explainable threat intelligence for everyone</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            ScamShield AI turns a suspicious message into an understandable threat report. It exists because most people
            never get to know <em className="text-slate-200 not-italic">why</em> a message is dangerous — they only find out after the damage is done.
          </p>
        </div>
      </motion.div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {PILLARS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 * i }}
          >
            <GlassCard className="h-full p-6">
              <p.icon className="size-6 text-accent" aria-hidden="true" />
              <h2 className="mt-3 font-display text-lg font-semibold text-white">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.desc}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="mt-14">
        <h2 className="text-center font-display text-2xl font-bold text-white">How the analysis pipeline works</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06 * i }}
              className="relative rounded-2xl border border-white/8 bg-white/[0.03] p-5 backdrop-blur"
            >
              <span className="font-mono text-xs font-bold text-accent">{step.n}</span>
              <h3 className="mt-2 font-display text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-14 rounded-3xl border border-white/10 bg-gradient-to-r from-accent/10 to-violet/10 p-8 text-center sm:p-12">
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Built for the hackathon — designed like a product</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          This is a hackathon build. It demonstrates a working end-to-end pipeline: input capture, signal extraction,
          risk scoring, explainability, attack-chain visualization and a safe-reply generator — with an honest
          demo-mode fallback when no AI provider is configured.
        </p>
        <Link
          to="/analyze"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 font-mono text-sm font-bold uppercase tracking-widest text-ink-950 transition hover:bg-cyan-100"
        >
          Try it now <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}