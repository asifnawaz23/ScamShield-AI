import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';
import { cx } from '../../lib/utils';
import type { AnalysisType, RiskLevel } from '../../types';

export function GlassCard({
  className = '',
  glow = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { glow?: boolean }) {
  return (
    <div
      className={cx(
        'relative rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl shadow-panel',
        glow && 'shadow-glow',
        className,
      )}
      {...props}
    />
  );
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type BtnSize = 'sm' | 'md' | 'lg';

const btnVariants: Record<BtnVariant, string> = {
  primary:
    'bg-gradient-to-r from-accent-deep via-cyan-500 to-accent text-ink-950 font-semibold shadow-glow hover:shadow-glow hover:brightness-110',
  secondary:
    'border border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/25',
  ghost: 'text-slate-300 hover:text-white hover:bg-white/5',
  danger: 'bg-risk-red/15 text-risk-red border border-risk-red/30 hover:bg-risk-red/25',
  success: 'bg-risk-green/15 text-risk-green border border-risk-green/30 hover:bg-risk-green/25',
};

const btnSizes: Record<BtnSize, string> = {
  sm: 'px-3.5 py-2 text-xs tracking-widest',
  md: 'px-5 py-3 text-sm tracking-[0.14em]',
  lg: 'px-7 py-4 text-sm tracking-[0.18em]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full uppercase font-mono select-none cursor-pointer',
        'transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0',
        btnVariants[variant],
        btnSizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export function Magnetic({ children, strength = 0.22, className = '' }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    };
    const onLeave = () => {
      el.style.transform = 'translate(0, 0)';
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [strength]);
  return <div ref={ref} className={cx('inline-block will-change-transform', className)}>{children}</div>;
}

export function Badge({
  children,
  tone = 'default',
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: 'default' | 'green' | 'yellow' | 'orange' | 'red' | 'violet' }) {
  const tones: Record<string, string> = {
    default: 'bg-white/5 text-slate-300 border-white/10',
    green: 'bg-risk-green/10 text-risk-green border-risk-green/25',
    yellow: 'bg-risk-yellow/10 text-risk-yellow border-risk-yellow/25',
    orange: 'bg-risk-orange/10 text-risk-orange border-risk-orange/25',
    red: 'bg-risk-red/10 text-risk-red border-risk-red/25',
    violet: 'bg-violet/10 text-violet-soft border-violet/25',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wider uppercase',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx('flex items-center gap-3 font-mono text-[11px] tracking-[0.35em] text-accent/80 uppercase', className)}>
      <span className="h-px w-8 bg-gradient-to-r from-transparent to-accent/60" />
      {children}
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10 bg-white/5" />
    </div>
  );
}

export function TypeTag({ type }: { type: AnalysisType }) {
  const map: Record<AnalysisType, string> = {
    text: 'Text',
    image: 'Screenshot',
    url: 'URL',
    demo: 'Demo',
  };
  return <Badge tone="violet">{map[type]}</Badge>;
}

export function modeBadge(mode: 'demo' | 'ai') {
  return mode === 'ai' ? 'Live AI' : 'Demo Mode';
}

export const riskBadge = (level: RiskLevel) => {
  const map: Record<RiskLevel, { t: string; label: string }> = {
    safe: { t: 'green', label: 'Likely Safe' },
    low: { t: 'green', label: 'Low Risk' },
    suspicious: { t: 'yellow', label: 'Suspicious' },
    high: { t: 'orange', label: 'High Risk' },
    critical: { t: 'red', label: 'Critical' },
  };
  return map[level];
};

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-block size-4 animate-spin rounded-full border-2 border-white/20 border-t-accent',
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function DotSep() {
  return <span className="mx-1.5 text-slate-600" aria-hidden="true">•</span>;
}