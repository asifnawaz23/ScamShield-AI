import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, Play, ChevronDown, Info } from 'lucide-react';
import type { AnalysisPayload } from '../../types';

export function AttackChain({ analysis }: { analysis: AnalysisPayload }) {
  const [exploring, setExploring] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const nodes = analysis.attackChain ?? [];

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] tracking-[0.3em] text-slate-500 uppercase">
          Typical escalation — not a prediction that it will happen
        </p>
        <button
          onClick={() => setExploring((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-widest text-white transition hover:bg-white/10"
          aria-expanded={exploring}
        >
          <Play className="size-3" aria-hidden="true" />
          {exploring ? 'Hide details' : 'Explore scenario'}
        </button>
      </div>

      <div className="relative mt-6 pl-2">
        {/* timeline line */}
        <div className="absolute bottom-4 left-[15px] top-2 w-px bg-gradient-to-b from-risk-red/40 via-white/20 to-transparent" />

        {nodes.map((node, i) => {
          const active = exploring || hovered === i;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.3, duration: 0.5, ease: 'easeOut' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="relative flex gap-4 pb-8 last:pb-2"
            >
              <div className="relative z-10 mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-white/15 bg-ink-800">
                <motion.span
                  className="block size-2 rounded-full bg-risk-red"
                  animate={{ boxShadow: active ? '0 0 14px 2px rgba(239,68,68,0.8)' : '0 0 0px 0px rgba(239,68,68,0)' }}
                  transition={{ duration: 0.4 }}
                >
                </motion.span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold text-white">
                  <span className="mr-2 font-mono text-xs text-slate-500">0{i + 1}</span>
                  {node.label}
                </p>
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-1.5 overflow-hidden text-xs leading-relaxed text-slate-400"
                    >
                      {node.description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              {i < nodes.length - 1 && (
                <span className="absolute -bottom-1 left-[11px] text-slate-600" aria-hidden="true">
                  <ArrowDown className="size-3.5" />
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {hovered !== null && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="mt-2 flex items-start gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5 text-xs text-slate-400"
          >
            <Info className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
            <span>
              This is an educational simulation of how similar chains typically escalate. ScamShield never
              provides instructions for performing these actions.
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}