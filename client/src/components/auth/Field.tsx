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
          'w-full rounded-xl border bg-ink-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-600 transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          error ? 'border-risk-red/50' : 'border-white/10 hover:border-white/20',
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