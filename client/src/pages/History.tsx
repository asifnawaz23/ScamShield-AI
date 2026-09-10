import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { History as HistoryIcon, Trash2, Eye, Clock, ShieldCheck } from 'lucide-react';
import { GlassCard, Badge, Button, SectionLabel, Spinner } from '../components/ui/primitives';
import { EmptyState } from '../components/ui/Feedback';
import { useToast } from '../components/ui/Feedback';
import { apiHistory, apiDeleteAnalysis, apiClearHistory } from '../lib/api';
import { listAnalysisLocal, removeAnalysisLocal, clearAnalysisStore } from '../lib/analysisStore';
import { timeAgo } from '../lib/utils';
import type { HistoryItem, RiskLevel } from '../types';

export function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(() => {
    setBusy(true);
    apiHistory()
      .then((r) => setItems(r.items))
      .catch(() => {
        const local = listAnalysisLocal().map((a) => ({
          id: a.id,
          type: a.type,
          inputSummary: a.inputSummary,
          riskScore: a.riskScore,
          riskLevel: a.riskLevel,
          category: a.category.label,
          createdAt: a.createdAt,
        }));
        setItems(local);
        if (local.length === 0) toast.push('History is stored locally when the backend is offline.', 'info');
      })
      .finally(() => setBusy(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const removeItem = async (id: string) => {
    removeAnalysisLocal(id);
    setItems((prev) => prev ? prev.filter((x) => x.id !== id) : prev);
    try {
      await apiDeleteAnalysis(id);
    } catch {
      // already removed locally
    }
    toast.push('Analysis removed from history.', 'info');
  };

  const clearAll = async () => {
    clearAnalysisStore();
    setItems([]);
    try {
      await apiClearHistory();
    } catch {
      // already cleared locally
    }
    toast.push('History cleared.', 'info');
  };

  const risk = (level: RiskLevel) => {
    const map: Record<RiskLevel, { label: string; tone: 'green' | 'yellow' | 'orange' | 'red' }> = {
      safe: { label: 'Likely Safe', tone: 'green' },
      low: { label: 'Low Risk', tone: 'green' },
      suspicious: { label: 'Suspicious', tone: 'yellow' },
      high: { label: 'High Risk', tone: 'orange' },
      critical: { label: 'Critical', tone: 'red' },
    };
    return map[level] ?? { label: level, tone: 'yellow' as const };
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Analysis history</SectionLabel>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">History</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Past analyses are stored briefly. Only short summaries and reports are kept — never the raw messages.
          </p>
        </div>
        {items && items.length > 0 && (
          <Button variant="danger" size="sm" onClick={clearAll}>
            <Trash2 className="size-4" aria-hidden="true" />
            Clear history
          </Button>
        )}
      </div>

      <div className="mt-8">
        {busy && !items ? (
          <div className="flex items-center gap-3 py-10 text-slate-400">
            <Spinner className="size-5" /> Loading history…
          </div>
        ) : items && items.length === 0 ? (
          <EmptyState title="No analyses yet" message="Run your first analysis from the Analyze workspace — results will appear here for quick access." />
        ) : (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {items?.map((item) => {
                const r = risk(item.riskLevel as RiskLevel);
                return (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 backdrop-blur transition-colors hover:border-white/20"
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5">
                      <HistoryIcon className="size-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">{item.riskScore}</span>
                        <Badge tone={r.tone}>{r.label}</Badge>
                        <Badge tone="violet">{item.category}</Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">{item.inputSummary}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {timeAgo(item.createdAt)}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Link
                        to={`/results/${item.id}`}
                        aria-label={`View report for ${item.inputSummary}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-200 transition hover:bg-white/10"
                      >
                        <Eye className="size-3.5" aria-hidden="true" /> View
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label="Delete this analysis"
                        className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-risk-red/10 hover:text-risk-red"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-slate-400">
          <span className="font-semibold text-slate-300">Privacy-first history.</span> Raw message content is not stored.
          Only a short summary, the generated report, and metadata are kept. You can delete anything at any time.
          History is stored locally in your browser when the backend is offline.
        </p>
      </div>
    </div>
  );
}