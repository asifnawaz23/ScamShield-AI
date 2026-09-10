import { ShieldCheck, ShieldAlert, ShieldQuestion, ShieldOff, WifiOff, Settings2, AlertTriangle } from 'lucide-react';
import type { ReputationResult, ReputationStatus } from '../../types';
import { cx } from '../../lib/utils';

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: typeof ShieldCheck;
}

const STATUS_CONFIG: Record<ReputationStatus, StatusConfig> = {
  verified_malicious: {
    label: 'Confirmed Malicious',
    color: 'text-risk-red',
    bg: 'bg-risk-red/10',
    border: 'border-risk-red/30',
    icon: ShieldAlert,
  },
  suspicious: {
    label: 'Suspicious',
    color: 'text-risk-yellow',
    bg: 'bg-risk-yellow/10',
    border: 'border-risk-yellow/30',
    icon: AlertTriangle,
  },
  verified_safe: {
    label: 'Verified Safe',
    color: 'text-risk-green',
    bg: 'bg-risk-green/10',
    border: 'border-risk-green/30',
    icon: ShieldCheck,
  },
  unknown: {
    label: 'Unknown',
    color: 'text-slate-400',
    bg: 'bg-white/5',
    border: 'border-white/10',
    icon: ShieldQuestion,
  },
  verification_unavailable: {
    label: 'Verification Unavailable',
    color: 'text-slate-500',
    bg: 'bg-white/5',
    border: 'border-white/10',
    icon: WifiOff,
  },
  not_configured: {
    label: 'Not Configured',
    color: 'text-slate-600',
    bg: 'bg-white/[0.02]',
    border: 'border-white/8',
    icon: Settings2,
  },
};

const PROVIDER_LABELS: Record<string, string> = {
  virustotal: 'VirusTotal',
  google_safe_browsing: 'Google Safe Browsing',
  abuseipdb: 'AbuseIPDB',
};

function StatusBadge({ status }: { status: ReputationStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown;
  const Icon = cfg.icon;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest',
        cfg.color,
        cfg.bg,
        cfg.border,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

function ProviderRow({
  providerKey,
  reputation,
}: {
  providerKey: string;
  reputation: { provider: string; status: ReputationStatus; detail?: string; positives?: number; total?: number; abuseConfidenceScore?: number; threatType?: string };
}) {
  const label = PROVIDER_LABELS[reputation.provider] ?? reputation.provider;
  return (
    <li className="flex flex-col gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-slate-400">{label}</span>
        <StatusBadge status={reputation.status} />
      </div>
      {reputation.detail && (
        <p className="text-[11px] leading-relaxed text-slate-500">{reputation.detail}</p>
      )}
      {reputation.status === 'not_configured' && (
        <p className="text-[11px] text-slate-600">
          Set <code className="rounded bg-white/5 px-1 py-0.5 font-mono">{providerKey}</code> in the server environment to enable this check.
        </p>
      )}
      {reputation.status === 'verification_unavailable' && (
        <p className="text-[11px] text-slate-600">
          The provider was unreachable or timed out. This is not a verdict.
        </p>
      )}
    </li>
  );
}

interface ReputationPanelProps {
  result: ReputationResult;
}

export function ReputationPanel({ result }: ReputationPanelProps) {
  const allNotConfigured =
    result.virusTotal.status === 'not_configured' &&
    result.safeBrowsing.status === 'not_configured' &&
    result.abuseIpdb.status === 'not_configured';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Overall reputation
        </span>
        <StatusBadge status={result.overallStatus} />
        {result.isIpAddress && (
          <span className="rounded-full border border-risk-orange/30 bg-risk-orange/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-risk-orange">
            IP Address URL
          </span>
        )}
      </div>

      {allNotConfigured ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <div className="flex items-start gap-3">
            <Settings2 className="mt-0.5 size-4 shrink-0 text-slate-600" aria-hidden="true" />
            <div className="text-xs leading-relaxed text-slate-500">
              <p className="font-semibold text-slate-400">No reputation providers configured</p>
              <p className="mt-1">
                Add <code className="rounded bg-white/5 px-1 font-mono">VIRUSTOTAL_API_KEY</code>,{' '}
                <code className="rounded bg-white/5 px-1 font-mono">GOOGLE_SAFE_BROWSING_API_KEY</code>,
                and/or <code className="rounded bg-white/5 px-1 font-mono">ABUSEIPDB_API_KEY</code> to the
                server environment to enable live reputation checks. The structural URL analysis above is
                still fully functional without these keys.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          <ProviderRow providerKey="VIRUSTOTAL_API_KEY" reputation={result.virusTotal} />
          <ProviderRow providerKey="GOOGLE_SAFE_BROWSING_API_KEY" reputation={result.safeBrowsing} />
          {result.isIpAddress && (
            <ProviderRow providerKey="ABUSEIPDB_API_KEY" reputation={result.abuseIpdb} />
          )}
        </ul>
      )}

      <p className="text-[11px] leading-relaxed text-slate-600">
        Checked at {new Date(result.checkedAt).toLocaleTimeString()} ·{' '}
        <span className="text-slate-500">HTTPS does not guarantee safety</span> · Reputation data
        reflects each provider's knowledge at the time of this analysis.
      </p>
    </div>
  );
}

export function LimitationsPanel({ limitations }: { limitations: string[] }) {
  if (!limitations || limitations.length === 0) return null;
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2">
        <ShieldOff className="size-4 text-slate-500" aria-hidden="true" />
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Analysis limitations
        </p>
      </div>
      <ul className="mt-3 space-y-2">
        {limitations.map((l, i) => (
          <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-slate-600" aria-hidden="true" />
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}
