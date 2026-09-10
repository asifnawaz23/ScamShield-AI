import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldAlert, Clock, Share2, ChevronDown, Zap } from 'lucide-react';
import { ScoreRing } from '../components/ui/ScoreRing';
import { ThreatRadar } from '../components/viz/ThreatRadar';
import { AttackChain } from '../components/viz/AttackChain';
import {
  CategoryBadge,
  RiskDimensions,
  ReasonList,
  UrlIndicators,
  TacticsGrid,
  RequestedInfo,
  OutcomeBanner,
} from '../components/viz/ResultPanels';
import { EvidencePanel, SafeReplyPanel, ActionPanel, VisualScanPanel } from '../components/viz/EvidencePanel';
import { ReputationPanel, LimitationsPanel } from '../components/viz/ReputationPanel';
import { Badge, SectionLabel, Spinner } from '../components/ui/primitives';
import { ErrorState, EmptyState } from '../components/ui/Feedback';
import { apiGetAnalysis } from '../lib/api';
import { getAnalysisLocal, saveAnalysisLocal } from '../lib/analysisStore';
import { formatDate, cx } from '../lib/utils';
import type { AnalysisPayload } from '../types';

const HERO_REPORT_KEY = 'scamshield:hero-report';

function readHeroReport(): AnalysisPayload | null {
  try {
    const raw = localStorage.getItem(HERO_REPORT_KEY);
    return raw ? (JSON.parse(raw) as AnalysisPayload) : null;
  } catch {
    return null;
  }
}

function buildHeroReport(): AnalysisPayload | null {
  return readHeroReport();
}

export function Results() {
  const { id = '' } = useParams();
  const location = useLocation();
  const [analysis, setAnalysis] = useState<AnalysisPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const stateAnalysis = (location.state as { analysis?: AnalysisPayload } | null)?.analysis;
    if (stateAnalysis && stateAnalysis.id === id) {
      setAnalysis(stateAnalysis);
      saveAnalysisLocal(stateAnalysis);
      setLoading(false);
      return;
    }

    const local = getAnalysisLocal(id);
    if (local) {
      setAnalysis(local);
      setLoading(false);
      return;
    }

    apiGetAnalysis(id)
      .then(({ analysis: a }) => {
        if (cancelled) return;
        setAnalysis(a);
        saveAnalysisLocal(a);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        const hero = buildHeroReport();
        if (hero && hero.id === id) {
          setAnalysis(hero);
          setLoading(false);
          return;
        }
        setError('This report is no longer available. Please run a new analysis.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, location.state]);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-6" />
          <p className="text-sm text-slate-400">Loading threat report…</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState title="Report unavailable" message={error ?? 'No analysis found for this ID.'} retry={() => window.location.assign('/analyze')} />
      </div>
    );
  }

  const isRisky = analysis.riskScore >= 40;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/history" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to history
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Threat report</h1>
            <Badge tone={analysis.mode === 'ai' ? 'green' : 'yellow'}>
              {analysis.mode === 'ai' ? 'Live AI' : 'Demo Mode'}
            </Badge>
            <Badge tone="violet">{analysis.category.label}</Badge>
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Clock className="size-3.5" aria-hidden="true" />
            {formatDate(analysis.createdAt)} · {analysis.inputSummary}
          </p>
        </div>

        <button
          onClick={() => {
            try {
              navigator.clipboard.writeText(window.location.href);
            } catch {
              // ignore
            }
          }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-200 transition hover:bg-white/10"
          aria-label="Copy link to this report"
        >
          <Share2 className="size-3.5" aria-hidden="true" />
          Share
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-white/10 bg-ink-900/50 p-6 text-center backdrop-blur"
          >
            <div className="mx-auto grid w-fit place-items-center">
              <ScoreRing score={analysis.riskScore} label={analysis.riskLabel} duration={1600} />
            </div>
            <div className="mt-4 flex justify-center">
              <CategoryBadge category={analysis.category} />
            </div>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
              Confidence {analysis.confidenceLabel} · {analysis.confidence}/100
            </p>
            <div className="mt-4">
              <OutcomeBanner analysis={analysis} />
            </div>
            <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <RiskDimensions analysis={analysis} />
            </div>
          </motion.div>

          <div className="rounded-3xl border border-white/10 bg-ink-900/50 p-6 backdrop-blur">
            <SectionLabel>Signal radar</SectionLabel>
            <p className="mt-2 text-xs text-slate-500">Hover or tap a node to read its meaning.</p>
            <div className="mt-4">
              <ThreatRadar analysis={analysis} />
            </div>
          </div>

          {analysis.visualScan && (
            <div className="rounded-3xl border border-white/10 bg-ink-900/50 p-6 backdrop-blur">
              <SectionLabel className="text-violet-soft">Image analysis</SectionLabel>
              <div className="mt-3">
                <VisualScanPanel analysis={analysis} />
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-ink-900/50 p-6 backdrop-blur">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-accent" aria-hidden="true" />
              <SectionLabel className="flex-1">Why this was flagged</SectionLabel>
            </div>
            <div className="mt-4">
              <ReasonList analysis={analysis} />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-ink-900/50 p-6 backdrop-blur">
            <SectionLabel>What could happen next?</SectionLabel>
            <p className="mt-2 text-xs text-slate-500">A defensive escalation simulation, step by step.</p>
            <div className="mt-4">
              <AttackChain analysis={analysis} />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-ink-900/50 p-6 backdrop-blur">
              <SectionLabel>URL risk indicators</SectionLabel>
              <div className="mt-4">
                <UrlIndicators analysis={analysis} />
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-ink-900/50 p-6 backdrop-blur">
              <SectionLabel>Manipulation tactics</SectionLabel>
              <div className="mt-4">
                <TacticsGrid analysis={analysis} />
              </div>
            </div>
          </div>

          {analysis.reputationResult && (
            <div className="rounded-3xl border border-white/10 bg-ink-900/50 p-6 backdrop-blur">
              <SectionLabel>External reputation intelligence</SectionLabel>
              <p className="mt-1 text-xs text-slate-500">
                Results from configured security intelligence providers. Status reflects the provider's
                knowledge at analysis time.
              </p>
              <div className="mt-4">
                <ReputationPanel result={analysis.reputationResult} />
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-ink-900/50 p-6 backdrop-blur">
            <SectionLabel>Requested information</SectionLabel>
            <div className="mt-4">
              <RequestedInfo analysis={analysis} />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-ink-900/50 p-6 backdrop-blur">
            <SectionLabel>Evidence · Inference · Uncertainty</SectionLabel>
            <div className="mt-4">
              <EvidencePanel analysis={analysis} />
            </div>
          </div>

          <SafeReplyPanel analysis={analysis} />

          <ActionPanel analysis={analysis} />

          <div className="rounded-3xl border border-white/10 bg-ink-900/50 p-6 backdrop-blur">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
              <div className="text-xs leading-relaxed text-slate-400">
                <span className="font-semibold text-slate-200">AI is not a verdict.</span>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {analysis.disclaimers.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                  <li>Your own judgment and verification through official channels always come first.</li>
                </ul>
              </div>
            </div>
          </div>

          {analysis.limitations && analysis.limitations.length > 0 && (
            <LimitationsPanel limitations={analysis.limitations} />
          )}
        </div>
      </div>

      <div className="mt-10">
        <Link to="/analyze" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-soft">
          <ChevronDown className="size-4 -rotate-90" aria-hidden="true" />
          Analyze another message
        </Link>
      </div>
    </div>
  );
}