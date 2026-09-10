import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Scale, EyeOff, Database, UserCheck, ShieldAlert } from 'lucide-react';
import { GlassCard, SectionLabel } from '../components/ui/primitives';

const VERDICT_LINES = [
  { icon: Database, title: 'What is analyzed', body: 'The text, URL, or screenshot you supply is processed to extract suspicious signals. A short summary of the input plus the generated report may be kept so you can revisit it in history.' },
  { icon: EyeOff, title: 'What is never stored', body: 'Raw message content is not intentionally stored. Uploaded images are not saved by this demo. We do not collect passwords, OTPs, PINs, or banking credentials — and you should never enter those anywhere.' },
  { icon: Lock, title: 'Data handling', body: 'In demo mode, analysis runs locally on the server with deterministic rules and nothing is sent to a third party. If a live AI provider is configured, the supplied content may be sent to that provider exactly as configured — check your environment variables and Provider settings to see which one is active.' },
  { icon: UserCheck, title: 'Your responsibility', body: 'ScamShield is a decision-support tool, not a verdict. Always verify important claims through official channels. Do not paste passwords, OTPs, access tokens, or other secrets into any chat — including this tool.' },
  { icon: Scale, title: 'Your rights', body: 'You can delete any analysis from history at any time. Clear history removes all stored summaries. Nothing here is sold, shared, or used for advertising.' },
  { icon: ShieldAlert, title: 'Honest disclosure', body: 'This is a hackathon demo. No compliance certifications are claimed. Numbers shown across dashboards are labeled illustrations. Read the project README and /docs/hackathon for full disclosure.' },
];

export function Privacy() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionLabel>Trust</SectionLabel>
      <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Privacy & Responsible AI</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
        ScamShield was built with privacy and honesty as core constraints. Here is exactly what happens to your input,
        and — just as important — what this AI does not claim.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {VERDICT_LINES.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 * i }}
          >
            <GlassCard className="h-full p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-white/5 text-accent">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="font-display text-base font-semibold text-white">{item.title}</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.body}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div id="responsible" className="mt-14 scroll-mt-24">
        <GlassCard className="border-accent/20 p-6 sm:p-10">
          <SectionLabel>Responsible AI — AI is not a verdict</SectionLabel>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">Why ScamShield never says “this is a scam”</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            A machine cannot read a sender's intent. ScamShield measures the <em>presence of suspicious patterns</em> and
            expresses that as a likelihood. That is why results use language like “likely suspicious” or
            “high-risk indicators detected” — never personal accusations.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">Evidence</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                “The message requests an urgent payment to release a claimed reward.”
              </p>
            </div>
            <div className="rounded-2xl border border-violet/20 bg-violet/5 p-5">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-violet-soft">AI inference</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                “This matches a potential reward-bait / fee-scam pattern.”
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-slate-300">Uncertainty</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                “The sender's actual intent cannot be established from the content alone.”
              </p>
            </div>
          </div>

          <ul className="mt-8 grid gap-3 text-sm leading-relaxed text-slate-400 sm:grid-cols-2">
            <li className="flex gap-2"><span className="text-accent">→</span> AI can make mistakes. Risk scores are estimates, not guarantees.</li>
            <li className="flex gap-2"><span className="text-accent">→</span> ScamShield does not determine criminal intent about any person.</li>
            <li className="flex gap-2"><span className="text-accent">→</span> Never enter passwords, OTPs, or banking credentials anywhere — including here.</li>
            <li className="flex gap-2"><span className="text-accent">→</span> Independently verify important claims through official channels.</li>
            <li className="flex gap-2"><span className="text-accent">→</span> This tool provides educational defensive guidance only.</li>
            <li className="flex gap-2"><span className="text-accent">→</span> When unsure, talk to a trusted person or your bank directly.</li>
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/learn" className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white/10">
              Visit the education center
            </Link>
            <Link to="/about" className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white/10">
              About this build
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}