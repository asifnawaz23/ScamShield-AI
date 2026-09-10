import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useCountUp } from '../../hooks/useCountUp';
import { RISK_TONE } from '../../types';

const FONT_SIZE = 56;

export function ScoreRing({
  score,
  label,
  duration = 1800,
  size = 220,
}: {
  score: number;
  label: string;
  duration?: number;
  size?: number;
}) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const current = useCountUp(score, duration);
  const tone = RISK_TONE[score <= 19 ? 'safe' : score <= 39 ? 'low' : score <= 59 ? 'suspicious' : score <= 79 ? 'high' : 'critical'];
  const [pathLength, setPathLength] = useState(0);

  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18 });
  const dashOffset = useTransform(spring, (v) => circumference * (1 - v / 100));

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      mv.set(score);
      setPathLength(score / 100);
      return;
    }
    const t = setTimeout(() => {
      mv.set(score);
      setPathLength(score / 100);
    }, 100);
    return () => clearTimeout(t);
  }, [score, mv]);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`Risk score ${score} out of 100, ${label}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset, filter: `drop-shadow(0 0 12px ${tone.ring}55)` }}
          initial={false}
        />
      </svg>

      <span className="absolute inset-0 grid place-items-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center"
        >
          <span
            className="block font-display font-bold leading-none tracking-tight text-white"
            style={{ fontSize: FONT_SIZE }}
          >
            {current}
          </span>
          <span className="mt-1 block text-[10px] font-mono tracking-[0.3em] text-slate-500 uppercase">/ 100</span>
        </motion.span>
      </span>
    </div>
  );
}

export function RiskBar({
  label,
  score,
  color,
  delay = 0,
}: {
  label: string;
  score: number;
  color: string;
  delay?: number;
}) {
  const current = useCountUp(score, 1400, 0);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium tracking-wide text-slate-300">{label}</span>
        <span className="font-mono text-xs text-white/80">{current}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}66` }}
          initial={{ width: '0%' }}
          whileInView={{ width: `${score}%` }}
          viewport={{ once: true }}
          transition={{ delay, duration: 1.1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}