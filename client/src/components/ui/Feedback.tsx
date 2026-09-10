import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { cx } from '../../lib/utils';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

const ToastContext = createContext<{ push: (message: string, kind?: ToastKind) => void }>({
  push: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className={cx(
                'pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-panel backdrop-blur-xl',
                t.kind === 'success' && 'border-risk-green/30 bg-ink-900/90 text-emerald-100',
                t.kind === 'error' && 'border-risk-red/30 bg-ink-900/90 text-red-100',
                t.kind === 'info' && 'border-accent/30 bg-ink-900/90 text-cyan-100',
              )}
              role="status"
            >
              {t.kind === 'error' ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-risk-red" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-risk-green" />
              )}
              <span className="text-sm leading-snug">{t.message}</span>
              <button
                aria-label="Dismiss notification"
                onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
                className="ml-1 text-white/40 transition hover:text-white"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function ErrorState({ title, message, retry }: { title: string; message: string; retry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-risk-red/20 bg-risk-red/5 px-8 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-risk-red/15 text-risk-red">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <div>
        <p className="font-display text-lg font-semibold text-white">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">{message}</p>
      </div>
      {retry && (
        <button
          onClick={retry}
          className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-widest text-white transition hover:bg-white/10"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-8 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-white/5 text-slate-500">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </div>
      <p className="font-display font-semibold text-white">{title}</p>
      <p className="max-w-sm text-sm text-slate-400">{message}</p>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={cx(
        'animate-pulse rounded-lg bg-white/5',
        className,
      )}
    />
  );
}