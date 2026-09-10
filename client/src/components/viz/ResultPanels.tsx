import type { AnalysisPayload, CategoryInfo } from '../../types';
import { cx, riskToneForScore } from '../../lib/utils';
import { Badge } from '../ui/primitives';
import { RiskBar } from '../ui/ScoreRing';
import {
  Gift,
  Briefcase,
  Landmark,
  Package,
  TrendingUp,
  KeyRound,
  ShieldAlert,
  Users,
  HeartHandshake,
  Wrench,
  ShieldQuestion,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  phishing: ShieldAlert,
  fake_prize: Gift,
  job_scam: Briefcase,
  investment_scam: TrendingUp,
  payment_scam: Landmark,
  impersonation: Users,
  account_takeover: KeyRound,
  delivery_scam: Package,
  romance: HeartHandshake,
  tech_support: Wrench,
  unknown: ShieldQuestion,
};

export function CategoryBadge({ category, size = 'lg' }: { category: CategoryInfo; size?: 'sm' | 'lg' }) {
  const Icon = CATEGORY_ICONS[category.icon] ?? ShieldQuestion;
  const tones: Record<string, string> = {
    green: 'from-risk-green/20 to-risk-green/5 border-risk-green/30 text-risk-green',
    yellow: 'from-risk-yellow/20 to-risk-yellow/5 border-risk-yellow/30 text-risk-yellow',
    orange: 'from-risk-orange/20 to-risk-orange/5 border-risk-orange/30 text-risk-orange',
    red: 'from-risk-red/20 to-risk-red/5 border-risk-red/30 text-risk-red',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 rounded-xl border bg-gradient-to-br px-3 py-1.5 font-medium tracking-wide backdrop-blur',
        tones[category.tone] ?? tones.red,
        size === 'lg' ? 'text-sm' : 'text-xs',
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {category.label}
    </span>
  );
}

export function RiskDimensions({ analysis }: { analysis: AnalysisPayload }) {
  return (
    <div className="space-y-4">
      {analysis.dimensions.map((d, i) => (
        <RiskBar key={d.key} label={d.label} score={d.score} color={d.color} delay={i * 0.12} />
      ))}
    </div>
  );
}

export function ReasonList({ analysis }: { analysis: AnalysisPayload }) {
  return (
    <ol className="space-y-4">
      {analysis.reasons.map((reason) => (
        <li key={reason.n} className="relative flex gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-4">
          <span className="font-mono text-[11px] font-bold tracking-widest text-slate-500">
            {String(reason.n).padStart(2, '0')}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-sm font-semibold text-white">{reason.title}</p>
              <Badge tone={reason.tone as never}>Contribution: {reason.contribution}</Badge>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{reason.explanation}</p>
            {reason.evidence && (
              <p className="mt-1.5 font-mono text-xs text-slate-500">“{reason.evidence}”</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function UrlIndicators({ analysis }: { analysis: AnalysisPayload }) {
  if (!analysis.urlIndicators.length) {
    return (
      <p className="text-sm text-slate-400">
        No URL was present in the analyzed content, so no link risk indicators were produced.
      </p>
    );
  }
  const statusTone = (s: string) => (s === 'danger' ? 'red' : s === 'warning' ? 'yellow' : 'green');
  return (
    <ul className="space-y-3">
      {analysis.urlIndicators.map((ind, i) => (
        <li key={i} className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
          <div className="flex items-start gap-3">
            <span
              className={cx(
                'mt-0.5 size-2 shrink-0 rounded-full',
                ind.status === 'danger' ? 'bg-risk-red' : ind.status === 'warning' ? 'bg-risk-yellow' : 'bg-risk-green',
              )}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-white">{ind.label}</p>
                <Badge tone={statusTone(ind.status) as never}>
                  {ind.status === 'danger' ? 'High risk' : ind.status === 'warning' ? 'Review' : 'Clear'}
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {ind.detail}
                {ind.url && (
                  <span className="mt-1 block break-all font-mono text-accent">{ind.url}</span>
                )}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TacticsGrid({ analysis }: { analysis: AnalysisPayload }) {
  if (!analysis.manipulationTactics.length) {
    return (
      <p className="text-sm text-slate-400">
        No specific manipulation tactics were matched in the supplied content.
      </p>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {analysis.manipulationTactics.map((t, i) => (
        <div key={t.name} className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-risk-orange" aria-hidden="true" />
            <p className="text-sm font-semibold text-white">{t.name}</p>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{t.blurb}</p>
        </div>
      ))}
    </div>
  );
}

export function RequestedInfo({ analysis }: { analysis: AnalysisPayload }) {
  if (!analysis.requestedInformation.length) {
    return (
      <p className="text-sm text-slate-400">
        The message does not explicitly request sensitive information.
      </p>
    );
  }
  return (
    <ul className="space-y-2.5">
      {analysis.requestedInformation.map((info, i) => (
        <li key={i} className="flex items-start gap-3 rounded-lg border border-white/8 bg-white/[0.03] p-3">
          <span
            className={cx(
              'mt-0.5 size-2 rounded-full',
              info.sensitivity === 'CRITICAL' ? 'bg-risk-red' : info.sensitivity === 'HIGH' ? 'bg-risk-orange' : 'bg-risk-yellow',
            )}
            aria-hidden="true"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{info.kind}</p>
          </div>
          <Badge tone={info.sensitivity === 'CRITICAL' ? 'red' : info.sensitivity === 'HIGH' ? 'orange' : 'yellow'}>
            {info.sensitivity}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export function OutcomeBanner({ analysis }: { analysis: AnalysisPayload }) {
  const tone = riskToneForScore(analysis.riskScore);
  const toneColor = {
    safe: 'border-risk-green/30 bg-risk-green/10 text-risk-green',
    low: 'border-risk-green/30 bg-risk-green/10 text-risk-green',
    suspicious: 'border-risk-yellow/30 bg-risk-yellow/10 text-risk-yellow',
    high: 'border-risk-orange/30 bg-risk-orange/10 text-risk-orange',
    critical: 'border-risk-red/30 bg-risk-red/10 text-risk-red',
  }[tone];

  return (
    <div className={cx('rounded-2xl border px-5 py-4 backdrop-blur', toneColor)}>
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em]">{analysis.outcomeText}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{analysis.summary}</p>
    </div>
  );
}