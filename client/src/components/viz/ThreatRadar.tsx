import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X } from 'lucide-react';
import type { AnalysisPayload } from '../../types';
import { cx } from '../../lib/utils';

interface RadarNode {
  key: string;
  label: string;
  detected: boolean;
  detail: string;
  angle: number;
}

function buildRadar(a: AnalysisPayload): RadarNode[] {
  const reasons = new Set(a.reasons.map((r) => r.title.toLowerCase()));
  const tactics = new Set(a.manipulationTactics.map((t) => t.name.toLowerCase()));
  const has = (needle: string) =>
    [...reasons].some((r) => r.includes(needle)) || [...tactics].some((t) => t.includes(needle));

  const items = [
    { key: 'urgency', label: 'Urgency', detail: 'Pressure to act before verifying. Creates a narrow decision window.', detected: has('urgent') || has('urgent language') },
    { key: 'reward', label: 'Reward', detail: 'A big prize or benefit is dangled to lower the reader\'s guard.', detected: has('reward bait') || has('too-good') || has('reward') },
    { key: 'link', label: 'Link', detail: 'A link is present with structural risk indicators.', detected: a.urlIndicators.length > 0 },
    { key: 'identity', label: 'Identity', detail: 'The sender claims an authority or trusted brand identity.', detected: has('authority') || has('impersonation') },
    { key: 'payment', label: 'Payment', detail: 'The flow steers toward a payment or financial detail.', detected: has('payment') || has('financial request') },
    { key: 'credential', label: 'Credential', detail: 'Login details, passwords or verification codes are requested.', detected: has('credential') || has('otp') },
    { key: 'manipulation', label: 'Manipulation', detail: 'Multiple social-engineering tactics stack up in one message.', detected: a.manipulationTactics.length >= 2 },
    { key: 'impersonation', label: 'Impersonation', detail: 'The message borrows a known organisation or person\'s identity.', detected: a.category.id === 'impersonation' },
  ];

  const n = items.length;
  return items.map((item, i) => ({
    ...item,
    angle: -90 + (360 / n) * i,
  }));
}

const RADIUS_PCT = 36;

export function ThreatRadar({ analysis }: { analysis: AnalysisPayload }) {
  const nodes = buildRadar(analysis);
  const [active, setActive] = useState<RadarNode | null>(null);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px] select-none">
      {/* rings */}
      <div className="absolute inset-[8%] rounded-full border border-white/8" />
      <div className="absolute inset-[22%] rounded-full border border-white/6" />
      <div className="absolute inset-[36%] rounded-full border border-dashed border-white/8" />

      {/* spokes */}
      {nodes.map((node) => {
        const rad = (node.angle * Math.PI) / 180;
        const x1 = 50 + Math.cos(rad) * 8;
        const y1 = 50 + Math.sin(rad) * 8;
        const x2 = 50 + Math.cos(rad) * (RADIUS_PCT + 6);
        const y2 = 50 + Math.sin(rad) * (RADIUS_PCT + 6);
        return (
          <svg key={node.key} className="absolute inset-0 h-full w-full">
            <line
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke={node.detected ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.06)'}
              strokeWidth="1"
            />
          </svg>
        );
      })}

      {/* center */}
      <motion.div
        className="absolute inset-0 grid place-items-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="grid size-24 place-items-center rounded-full border border-accent/30 bg-ink-900/80 shadow-glow backdrop-blur">
          <Shield className="size-9 text-accent" strokeWidth={1.5} aria-hidden="true" />
        </div>
      </motion.div>

      {/* nodes */}
      {nodes.map((node, i) => {
        const rad = (node.angle * Math.PI) / 180;
        const x = 50 + Math.cos(rad) * RADIUS_PCT;
        const y = 50 + Math.sin(rad) * RADIUS_PCT;
        const isActive = active?.key === node.key;
        return (
          <button
            key={node.key}
            aria-label={`${node.label} signal${node.detected ? ' (detected)' : ''}`}
            onMouseEnter={() => setActive(node)}
            onFocus={() => setActive(node)}
            onMouseLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
            onClick={() => setActive(isActive ? null : node)}
            className="absolute -translate-x-1/2 -translate-y-1/2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.06, type: 'spring', stiffness: 260, damping: 18 }}
              className="relative grid place-items-center"
            >
              {node.detected && (
                <span
                  className="absolute inline-flex size-5 animate-ping rounded-full opacity-60"
                  style={{ backgroundColor: '#ef4444' }}
                />
              )}
              <span
                className={cx(
                  'block h-2.5 w-2.5 rounded-full transition-colors',
                  node.detected ? 'bg-risk-red shadow-glow-red' : 'bg-white/15',
                )}
              />
              <span
                className={cx(
                  'absolute top-4 whitespace-nowrap font-mono text-[10px] tracking-widest uppercase transition-colors',
                  node.detected ? 'text-risk-red' : 'text-slate-500',
                )}
              >
                {node.label}
              </span>
            </motion.span>
          </button>
        );
      })}

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute -bottom-2 left-1/2 w-[88%] -translate-x-1/2 rounded-xl border border-white/10 bg-ink-900/95 p-3 text-center shadow-panel backdrop-blur"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 size-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <p className="text-xs leading-snug text-slate-300">
                <span className="font-semibold uppercase tracking-widest text-white">{active.label}.</span>{' '}
                {active.detail}
              </p>
              <button
                aria-label="Close signal detail"
                onClick={() => setActive(null)}
                className="ml-auto text-slate-500 transition hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}