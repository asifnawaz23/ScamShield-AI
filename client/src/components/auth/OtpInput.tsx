import { useRef } from 'react';
import { cx } from '../../lib/utils';

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  autoFocus = true,
  ariaLabel = 'One-time verification code',
}: {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  ariaLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, length);
    onChange(digits);
    if (digits.length === length) inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && value.length > 0) onChange(value.slice(0, -1));
  };

  const cells = Array.from({ length }, (_, i) => value[i] ?? '');

  return (
    <div className="relative w-full select-none">
      <input
        ref={inputRef}
        className="sr-only"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        aria-label={ariaLabel}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoFocus={autoFocus}
      />
      <div className="flex items-center justify-between gap-2" aria-hidden="true">
        {cells.map((d, i) => {
          const active = !disabled && value.length === i && i < length;
          return (
            <div
              key={i}
              className={cx(
                'grid h-12 w-11 place-items-center rounded-xl border font-mono text-2xl font-bold transition-all duration-150 sm:h-14 sm:w-12',
                d
                  ? 'border-accent/40 bg-accent/10 text-white'
                  : active
                    ? 'border-accent/60 bg-white/5 text-white shadow-glow'
                    : 'border-white/10 bg-ink-900/60 text-white/30',
                disabled && 'opacity-50',
              )}
            >
              {d || ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}