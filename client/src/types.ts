export type RiskLevel = 'safe' | 'low' | 'suspicious' | 'high' | 'critical';

export type AnalysisType = 'text' | 'image' | 'url' | 'demo';

export type ReputationStatus =
  | 'not_configured'
  | 'verification_unavailable'
  | 'unknown'
  | 'suspicious'
  | 'verified_safe'
  | 'verified_malicious';

export interface ProviderReputation {
  provider: string;
  status: ReputationStatus;
  positives?: number;
  total?: number;
  threatType?: string;
  abuseConfidenceScore?: number;
  detail?: string;
}

export interface ReputationResult {
  url: string;
  virusTotal: ProviderReputation;
  safeBrowsing: ProviderReputation;
  abuseIpdb: ProviderReputation;
  overallStatus: ReputationStatus;
  isIpAddress: boolean;
  checkedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  provider: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface CategoryInfo {
  id: string;
  label: string;
  icon: string;
  tone: 'green' | 'yellow' | 'orange' | 'red';
}

export interface Dimension {
  key: string;
  label: string;
  color: string;
  score: number;
}

export interface ReasonItem {
  n: number;
  title: string;
  tone: 'red' | 'orange' | 'yellow' | 'green';
  contribution: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  explanation: string;
  evidence?: string;
}

export interface Tactic {
  name: string;
  blurb: string;
  detected?: boolean;
}

export interface RequestedInfo {
  kind: string;
  sensitivity: string;
}

export interface UrlIndicator {
  url?: string;
  label: string;
  status: 'safe' | 'warning' | 'danger';
  detail: string;
}

export interface ChainNode {
  label: string;
  description: string;
}

export interface EvidenceBasis {
  evidence: string[];
  inference: string[];
  uncertainty: string[];
}

export interface VisualScan {
  label: string;
  note: string;
  extracted?: {
    sender?: string;
    message?: string;
    urls?: string[];
    phoneNumbers?: string[];
    ctas?: string[];
    requested?: string[];
  };
}

export interface AnalysisPayload {
  id: string;
  type: AnalysisType;
  inputSummary: string;
  mode: 'demo' | 'ai';
  aiUsed: boolean;
  sampleLabel?: string;
  visualSource?: string;
  createdAt: string;
  riskScore: number;
  riskLevel: RiskLevel;
  riskLabel: string;
  riskTone: string;
  category: CategoryInfo;
  outcomeText: string;
  summary: string;
  dimensions: Dimension[];
  reasons: ReasonItem[];
  manipulationTactics: Tactic[];
  requestedInformation: RequestedInfo[];
  urlIndicators: UrlIndicator[];
  recommendedActions: string[];
  safeReply: string;
  attackChain: ChainNode[];
  confidence: number;
  confidenceLabel: string;
  evidenceBasis: EvidenceBasis;
  disclaimers: string[];
  limitations?: string[];
  reputationResult?: ReputationResult | null;
  visualScan?: VisualScan;
}

export interface HistoryItem {
  id: string;
  type: AnalysisType;
  inputSummary: string;
  riskScore: number;
  riskLevel: RiskLevel;
  category: string;
  createdAt: string;
}

export interface Scenario {
  id: string;
  title: string;
  type: string;
  icon: string;
  message: string;
}

export type ScanStage =
  | 'idle'
  | 'initializing'
  | 'extracting'
  | 'language'
  | 'links'
  | 'manipulation'
  | 'explanation'
  | 'complete';

export const RISK_TONE: Record<RiskLevel, { ring: string; text: string; bg: string; border: string; glow: string }> = {
  safe: {
    ring: '#22c55e',
    text: 'text-risk-green',
    bg: 'bg-risk-green/10',
    border: 'border-risk-green/30',
    glow: 'shadow-glow',
  },
  low: {
    ring: '#22c55e',
    text: 'text-risk-green',
    bg: 'bg-risk-green/10',
    border: 'border-risk-green/30',
    glow: 'shadow-glow',
  },
  suspicious: {
    ring: '#eab308',
    text: 'text-risk-yellow',
    bg: 'bg-risk-yellow/10',
    border: 'border-risk-yellow/30',
    glow: '',
  },
  high: {
    ring: '#f97316',
    text: 'text-risk-orange',
    bg: 'bg-risk-orange/10',
    border: 'border-risk-orange/30',
    glow: 'shadow-glow',
  },
  critical: {
    ring: '#ef4444',
    text: 'text-risk-red',
    bg: 'bg-risk-red/10',
    border: 'border-risk-red/30',
    glow: 'shadow-glow-red',
  },
};

export const SCAN_STAGES: { key: ScanStage; label: string }[] = [
  { key: 'initializing', label: 'INITIALIZING THREAT SCAN' },
  { key: 'extracting', label: 'EXTRACTING SIGNALS' },
  { key: 'language', label: 'ANALYZING LANGUAGE' },
  { key: 'links', label: 'CHECKING LINK INDICATORS' },
  { key: 'manipulation', label: 'ASSESSING MANIPULATION PATTERNS' },
  { key: 'explanation', label: 'GENERATING EXPLANATION' },
];