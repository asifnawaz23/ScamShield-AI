import { forwardRef, type InputHTMLAttributes } from 'react';
import { cx } from '../../lib/utils';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string | null;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, hint, error, className = '', id, ...props }, ref) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        className={cx(
          'w-full rounded-lg border bg-ink-950/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-all',
          'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60 focus:bg-accent/[0.04] focus:shadow-[0_0_16px_-4px_rgba(34,211,238,0.5)]',
          error ? 'border-risk-red/60' : 'border-accent/25 hover:border-accent/45',
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-risk-red">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-600">{hint}</p>
      ) : null}
    </div>
  ),
);
Field.displayName = 'Field';