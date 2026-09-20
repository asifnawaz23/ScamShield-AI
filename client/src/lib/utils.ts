import type { RiskLevel } from '../types';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export function riskToneForScore(score: number): RiskLevel {
  if (score <= 19) return 'safe';
  if (score <= 39) return 'low';
  if (score <= 59) return 'suspicious';
  if (score <= 79) return 'high';
  return 'critical';
}

export function truncateMiddle(s: string, max = 60): string {
  if (s.length <= max) return s;
  const half = Math.floor(max / 2);
  return s.slice(0, half) + '…' + s.slice(-half);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function shortUrlDomain(url: string): string {
  try {
    return new URL(url.includes('://') ? url : `http://${url}`).host;
  } catch {
    return url;
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Canonical category-ID → human label mapping.
 *
 * Server history stores `category` as an internal id (e.g. "account_takeover").
 * The UI must never show these raw ids. Use categoryLabel() everywhere a
 * category is rendered (dashboard, history, charts, badges) so labels stay
 * consistent regardless of whether data came from the API or local fallback.
 */
const CATEGORY_LABELS: Record<string, string> = {
  phishing: 'Phishing',
  fake_prize: 'Fake Prize',
  job_scam: 'Job Scam',
  investment_scam: 'Investment Scam',
  payment_scam: 'Payment Scam',
  impersonation: 'Impersonation',
  account_takeover: 'Account Takeover',
  delivery_scam: 'Delivery Scam',
  romance: 'Romance / Social Engineering',
  tech_support: 'Tech Support Scam',
  unknown: 'Unknown Suspicious Pattern',
};

export function categoryLabel(idOrLabel: string | null | undefined): string {
  if (!idOrLabel) return 'Unknown';
  // If it's already a known id, map it. Otherwise assume it's already a label
  // (the local-storage fallback stores the human label) and return as-is.
  if (CATEGORY_LABELS[idOrLabel]) return CATEGORY_LABELS[idOrLabel];
  return idOrLabel;
}
