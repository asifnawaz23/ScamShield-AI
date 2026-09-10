import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import type { ScanStage } from '../../types';
import { cx } from '../../lib/utils';

const STAGE_LOG: Record<Exclude<ScanStage, 'idle' | 'complete'>, string> = {
  initializing: 'Initializing threat-scan kernel... OK',
  extracting: 'Extracting linguistic signals from payload...',
  language: 'Evaluating phrases, tone and structure...',
  links: 'Resolving referenced destinations & structural checks...',
  manipulation: 'Cross-matching manipulation tactics...',
  explanation: 'Assembling explainable reasoning...',
};

export function ScanOverlay({
  visible,
  stage,
  done,
  resultLine,
}: {
  visible: boolean;
  stage: number;
  done: boolean;
  resultLine: string | null;
}) {
  const progress = done ? 100 : Math.min(92, Math.round((stage / 6) * 95));

  const stages = ['initializing', 'extracting', 'language', 'links', 'manipulation', 'explanation'] as const;
  const shown = stages.slice(0, Math.max(1, stage - 1));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Analyzing message"
          className="fixed inset-0 z-[70] grid place-items-center bg-ink-950/85 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-ink-900/90 p-6 shadow-panel md:p-10">
            {/* HUD corners */}
            <span className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-accent/60" />
            <span className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-accent/60" />
            <span className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-accent/60" />
            <span className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-accent/60" />

            {/* scan line */}
            {!done && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                <motion.div
                  className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent"
                  animate={{ y: ['-20%', '420%'] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            )}

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] tracking-[0.35em] text-accent uppercase">Secure channel — local analysis</p>
                <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
              </div>

              <div className="mt-8 font-mono text-sm leading-loose text-slate-300">
                {stage > 1 && (
                  <motion.p
                    className="text-amber-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    &gt; {STAGE_LOG.initializing}
                  </motion.p>
                )}
                {shown.slice(1).map((s, i) => (
                  <motion.p
                    key={s}
                    className={cx(s === 'links' ? 'text-amber-200' : 'text-slate-300')}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (i + 1) * 0.4, duration: 0.25 }}
                  >
                    &gt; {STAGE_LOG[s]}
                  </motion.p>
                ))}
                {done && (
                  <motion.p className="text-accent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    &gt; Scan complete. Reasoning assembled.
                  </motion.p>
                )}
              </div>

              <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent-deep to-accent"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{ boxShadow: '0 0 12px rgba(34,211,238,0.6)' }}
                />
              </div>

              <AnimatePresence>
                {done && resultLine && (
                  <motion.div
                    className="mt-6 rounded-2xl border border-risk-red/30 bg-risk-red/10 px-5 py-4"
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <p className="font-mono text-[11px] tracking-[0.3em] text-risk-red uppercase">Threat assessment complete</p>
                    <p className="mt-2 font-display text-2xl font-bold tracking-tight text-white">{resultLine}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}