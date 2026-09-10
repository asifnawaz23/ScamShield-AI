import { motion } from 'framer-motion';
import { Scale, Lightbulb, HelpCircle, CheckCircle2, Copy, Sparkles } from 'lucide-react';
import type { AnalysisPayload } from '../../types';
import { useState } from 'react';
import { useToast } from '../ui/Feedback';
import { Button } from '../ui/primitives';

export function EvidencePanel({ analysis }: { analysis: AnalysisPayload }) {
  const basis = analysis.evidenceBasis;
  const columns = [
    {
      key: 'evidence',
      title: 'Evidence',
      color: 'border-accent/30 text-accent',
      dot: 'bg-accent',
      icon: CheckCircle2,
      items: basis.evidence,
    },
    {
      key: 'inference',
      title: 'AI inference',
      color: 'border-violet/30 text-violet-soft',
      dot: 'bg-violet',
      icon: Lightbulb,
      items: basis.inference,
    },
    {
      key: 'uncertainty',
      title: 'Uncertainty',
      color: 'border-slate-500/30 text-slate-300',
      dot: 'bg-slate-400',
      icon: HelpCircle,
      items: basis.uncertainty,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {columns.map((col, ci) => {
        const Icon = col.icon;
        return (
          <div key={col.key} className={`rounded-2xl border border-white/8 bg-white/[0.03] p-4`}>
            <div className={`flex items-center gap-2 border-b pb-2 ${col.color}`}>
              <Icon className="size-4" aria-hidden="true" />
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest">{col.title}</p>
            </div>
            <ul className="mt-3 space-y-2">
              {col.items.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: ci * 0.1 + i * 0.05 }}
                  className="flex items-start gap-2 text-xs leading-relaxed text-slate-400"
                >
                  <span className={`mt-1.5 size-1 shrink-0 rounded-full ${col.dot}`} aria-hidden="true" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function SafeReplyPanel({ analysis }: { analysis: AnalysisPayload }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(analysis.safeReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      toast.push('Safe response copied to clipboard', 'success');
    } catch {
      toast.push('Could not copy — select the text manually and copy.', 'error');
    }
  };

  return (
    <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 to-violet/10 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-accent" aria-hidden="true" />
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-accent">
          Suggested safe response
        </p>
      </div>
      <blockquote className="mt-3 border-l-2 border-accent pl-4 text-sm leading-relaxed text-slate-100">
        “{analysis.safeReply}”
      </blockquote>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="primary" size="sm" onClick={copy} aria-label="Copy safe response">
          {copied ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy response'}
        </Button>
        <p className="text-xs text-slate-500">
          Shares no passwords, OTPs, or financial details.
        </p>
      </div>
    </div>
  );
}

export function ActionPanel({ analysis }: { analysis: AnalysisPayload }) {
  const steps = analysis.recommendedActions.map((action, i) => ({ n: i + 1, action }));
  return (
    <div className="rounded-2xl border border-risk-orange/20 bg-gradient-to-br from-risk-orange/10 to-transparent p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-full bg-risk-orange/20 text-risk-orange">
          <Scale className="size-4" aria-hidden="true" />
        </span>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-risk-orange">
          What should I do?
        </p>
      </div>
      <ol className="mt-4 space-y-3">
        {steps.map((s) => (
          <li key={s.n} className="flex items-start gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 font-mono text-xs font-bold text-white">
              {s.n}
            </span>
            <p className="text-sm leading-relaxed text-slate-200">{s.action}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function VisualScanPanel({ analysis }: { analysis: AnalysisPayload }) {
  const scan = analysis.visualScan;
  if (!scan) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-violet-soft">
        {scan.label}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{scan.note}</p>
      {scan.extracted && (
        <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
          {scan.extracted.sender && (
            <div>
              <p className="font-semibold uppercase tracking-widest text-slate-500 text-[10px]">Sender</p>
              <p className="text-white">{scan.extracted.sender}</p>
            </div>
          )}
          {scan.extracted.urls && scan.extracted.urls.length > 0 && (
            <div>
              <p className="font-semibold uppercase tracking-widest text-slate-500 text-[10px]">URLs</p>
              {scan.extracted.urls.map((u, i) => (
                <p key={i} className="break-all font-mono text-accent">{u}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}