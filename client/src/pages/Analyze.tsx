import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ImagePlus, Link2, LayoutGrid, Sparkles, Upload, ShieldAlert, Info, X } from 'lucide-react';
import { ScanOverlay } from '../components/scan/ScanOverlay';
import { Button, Badge, GlassCard, SectionLabel } from '../components/ui/primitives';
import { ErrorState } from '../components/ui/Feedback';
import { useToast } from '../components/ui/Feedback';
import { apiAnalyze, apiAnalyzeImage, apiScenarios } from '../lib/api';
import { saveAnalysisLocal } from '../lib/analysisStore';
import { cx } from '../lib/utils';
import type { Scenario } from '../types';

type TabId = 'text' | 'image' | 'url' | 'demo';

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: 'text', label: 'Paste text', icon: FileText },
  { id: 'image', label: 'Upload screenshot', icon: ImagePlus },
  { id: 'url', label: 'Analyze URL', icon: Link2 },
  { id: 'demo', label: 'Demo scenarios', icon: LayoutGrid },
];

const FALLBACK_SCENARIOS: Scenario[] = [
  { id: 'hbl-impersonation',   title: 'HBL Bank Impersonation',     type: 'impersonation',    icon: 'landmark',  message: 'Aapka HBL account 24 ghanton mein band ho jayega. Account block se bachne ke liye abhi apni CNIC aur ATM PIN verify karein. Link: http://hbl-secure-verify.xyz/confirm — Kisi ko mat batayein.' },
  { id: 'bisp-welfare-scam',   title: 'BISP / Ehsaas Scam',         type: 'welfarescam',      icon: 'gift',      message: 'Pakistan Government ki taraf se khush khabri! Aapka Ehsaas Program mein Rs. 25,000 ki raqam tayar hai. Abhi apna CNIC number aur registered mobile number 8171 par bhejein. Jaldi karein, offer aaj raat tak valid hai.' },
  { id: 'jazzcash-otp-scam',   title: 'JazzCash OTP Theft',         type: 'account_takeover', icon: 'key',       message: "Aapka JazzCash account suspicious activity ki wajah se band ho raha hai. Account unlock karne ke liye abhi apna 6-digit OTP code share karein jo aapke number par aaya hai. WhatsApp: +92 300 1234567." },
  { id: 'fake-job-pakistan',   title: 'Fake Online Job Offer',      type: 'job_scam',         icon: 'briefcase', message: 'URGENT VACANCY! Ghar baithe kaam karein aur rozana Rs. 3,000 kamayen. Koi experience zaroori nahi. Sirf YouTube videos like aur subscribe karein. Pehle Rs. 500 registration fee JazzCash 0300-1234567 par bhejen.' },
  { id: 'nadra-cnic-scam',     title: 'NADRA CNIC Verification Scam', type: 'account_takeover', icon: 'key',    message: 'NADRA ki taraf se notice: Aapka CNIC expire ho chuka hai aur aapki SIM 48 ghanton mein PTA ki taraf se block ho jayegi. Apna CNIC renew karne ke liye: http://nadra-cnic-update.online/verify' },
  { id: 'forex-investment-scam', title: 'Forex / Crypto Investment Scam', type: 'investment_scam', icon: 'trending', message: 'Pakistan ka #1 Forex Trading Group! Expert signals se guaranteed 150% weekly return. Sirf Rs. 10,000 se shuru karein aur ek hafte mein double karein. WhatsApp: +92 321 9876543. Bitcoin, USDT, JazzCash sab accept.' },
];

function isValidUrlInput(value: string): boolean {
  const v = value.trim();
  if (!/^https?:\/\//i.test(v) && !v.startsWith('www.')) return false;
  try {
    new URL(v.includes('://') ? v : `http://${v}`);
    return true;
  } catch {
    return false;
  }
}

function readableFileType(file: File): boolean {
  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  return allowed.includes(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);
}

export function Analyze() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<TabId>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [visibleText, setVisibleText] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageName, setImageName] = useState('');
  const [scenarios, setScenarios] = useState<Scenario[]>(FALLBACK_SCENARIOS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [resultLine, setResultLine] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiScenarios()
      .then((r) => r.scenarios.length && setScenarios(r.scenarios))
      .catch(() => {
        // fallback scenarios remain
      });
  }, []);

  const runAnalysis = useCallback(
    (type: 'text' | 'url' | 'image', payload: string) => {
      setLoading(true);
      setError(null);
      setStage(0);
      setDone(false);
      setResultLine(null);
      setStage(1);
      const timer = (i: number) => window.setTimeout(() => setStage(i), 480 * (i - 1));
      const timers: number[] = [];
      for (let i = 2; i <= 6; i++) timers.push(timer(i));

      const finish = (analysis: Awaited<ReturnType<typeof apiAnalyze>>['analysis']) => {
        saveAnalysisLocal(analysis);
        timers.push(
          window.setTimeout(() => {
            setDone(true);
            setLoading(false);
            setResultLine(`Threat assessment — ${analysis.riskScore} / 100 · ${analysis.riskLabel}`);
            setTimeout(() => {
              navigate(`/results/${analysis.id}`, { state: { analysis } });
            }, 1100);
          }, 480 * 5 + 500),
        );
      };

      const handleError = (message: string) => {
        timers.push(
          window.setTimeout(() => {
            setLoading(false);
            setError(message);
            toast.push(message, 'error');
          }, 480 * 4),
        );
      };

      if (type === 'url') {
        if (!isValidUrlInput(payload)) {
          setLoading(false);
          setError('That does not look like a valid web address. Please include the full URL (e.g. https://example.com).');
          return;
        }
        apiAnalyze(payload, 'url').then((r) => finish(r.analysis)).catch(() => handleError('Could not analyze that URL. Please check your connection and try again.'));
      } else if (type === 'image') {
        if (!payload) {
          setLoading(false);
          setError('Please attach a screenshot in PNG, JPG or WEBP format.');
          return;
        }
        apiAnalyzeImage(payload, visibleText).then((r) => finish(r.analysis)).catch(() => handleError('Could not analyze that image. Please try a smaller file or provide the visible text manually.'));
      } else {
        if (!payload.trim()) {
          setLoading(false);
          setError('Please paste a message first — the input was empty.');
          return;
        }
        apiAnalyze(payload, 'text').then((r) => finish(r.analysis)).catch(() => handleError('Analysis service is unreachable right now. Please try again in a moment.'));
      }
    },
    [navigate, toast, visibleText],
  );

  const onFile = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;
      if (!readableFileType(file)) {
        setError('Unsupported file type. Please upload a PNG, JPG or WEBP screenshot.');
        toast.push('Unsupported file type.', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('That file is too large. Please upload a screenshot under 5 MB.');
        toast.push('File too large (max 5 MB).', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImageData(String(reader.result));
        setImageName(file.name);
        setError(null);
      };
      reader.onerror = () => {
        setError('The file could not be read. Please try a different screenshot.');
      };
      reader.readAsDataURL(file);
    },
    [toast],
  );

  const canAnalyze = useMemo(() => {
    if (tab === 'text') return text.trim().length >= 1;
    if (tab === 'image') return !!imageData;
    if (tab === 'url') return url.trim().length >= 1;
    return false;
  }, [tab, text, imageData, url]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <SectionLabel>Threat analysis workspace</SectionLabel>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Analyze a message, screenshot or link</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Choose an input below. ScamShield extracts signals, scores them, and explains its reasoning — evidence, inference and uncertainty are always kept distinct.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Input type">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setTab(t.id);
                    setError(null);
                  }}
                  className={cx(
                    'flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-all',
                    active
                      ? 'border-accent/40 bg-accent/10 text-white shadow-glow'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-3xl border border-white/10 bg-ink-900/50 p-5 backdrop-blur">
            {tab === 'text' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <label htmlFor="message-input" className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Suspicious message, email, offer, or SMS
                </label>
                <textarea
                  id="message-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste a suspicious message, email, job offer, payment request, or SMS…"
                  rows={9}
                  className="w-full resize-y rounded-xl border border-white/10 bg-ink-950/80 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-slate-600 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-500">{text.length} characters</p>
                  <Button variant="primary" size="sm" onClick={() => runAnalysis('text', text)} disabled={!canAnalyze || loading}>
                    <Sparkles className="size-4" aria-hidden="true" />
                    Analyze text
                  </Button>
                </div>
              </motion.div>
            )}

            {tab === 'image' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => onFile(e.target.files?.[0])}
                  aria-label="Upload screenshot"
                />
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload a screenshot"
                  onClick={() => fileRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    onFile(e.dataTransfer.files?.[0]);
                  }}
                  className={cx(
                    'grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors',
                    dragging ? 'border-accent/60 bg-accent/10' : 'border-white/15 bg-white/[0.02] hover:border-white/30',
                  )}
                >
                  {imageData ? (
                    <div className="relative w-full">
                      <img src={imageData} alt="Uploaded screenshot preview" className="mx-auto max-h-72 rounded-xl border border-white/10 object-contain" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageData(null);
                          setImageName('');
                        }}
                        aria-label="Remove uploaded image"
                        className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-ink-950/80 text-white hover:bg-ink-950"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <span className="grid size-14 place-items-center rounded-full bg-accent/10 text-accent">
                        <Upload className="size-6" aria-hidden="true" />
                      </span>
                      <p className="text-sm text-slate-300">
                        <span className="font-semibold text-white">Drop a screenshot here</span> or tap to browse
                      </p>
                      <p className="text-[11px] text-slate-500">PNG, JPG or WEBP · up to 5 MB</p>
                    </div>
                  )}
                </div>
                {imageName && (
                  <p className="text-[11px] text-slate-500">Loaded: {imageName}. Provide the visible text to improve the demo assessment.</p>
                )}
                <label htmlFor="visible-text" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Visible text in the screenshot <span className="text-slate-600 normal-case">(optional)</span>
                </label>
                <textarea
                  id="visible-text"
                  value={visibleText}
                  onChange={(e) => setVisibleText(e.target.value)}
                  placeholder="The message text as it appears in the screenshot…"
                  rows={4}
                  className="w-full resize-y rounded-xl border border-white/10 bg-ink-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Info className="size-3.5" aria-hidden="true" />
                    Your image is analyzed without being stored as raw content.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => runAnalysis('image', imageData ?? '')} disabled={!canAnalyze || loading}>
                    <ImagePlus className="size-4" aria-hidden="true" />
                    Analyze screenshot
                  </Button>
                </div>
              </motion.div>
            )}

            {tab === 'url' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
                <label htmlFor="url-input" className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Suspicious URL
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="url-input"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && canAnalyze && runAnalysis('url', url)}
                    placeholder="https://…"
                    className="flex-1 rounded-xl border border-white/10 bg-ink-950/80 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-600 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <Button variant="primary" size="sm" onClick={() => runAnalysis('url', url)} disabled={!canAnalyze || loading}>
                    <Link2 className="size-4" aria-hidden="true" />
                    Analyze URL
                  </Button>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Structure and known indicators are checked. This demo never opens or crawls the target URL automatically.
                </p>
              </motion.div>
            )}

            {tab === 'demo' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  One-click demo scenarios
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {scenarios.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setTab('text');
                        setText(s.message);
                        setError(null);
                        window.scrollTo({ top: 0, behavior: 'auto' });
                        runAnalysis('text', s.message);
                      }}
                      className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-accent/30 hover:bg-white/[0.06]"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-risk-red/10 text-risk-red transition group-hover:scale-110">
                        <LayoutGrid className="size-5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block font-medium text-white">{s.title}</span>
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-500">{s.message}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  Scenarios run the same analysis pipeline as pasted text — great for a quick, safe demonstration.
                </p>
              </motion.div>
            )}

            {error && (
              <div className="mt-4">
                <ErrorState title="Could not run the analysis" message={error} />
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
            <div className="text-xs leading-relaxed text-slate-400">
              <span className="font-semibold text-slate-300">Confidential by design.</span>{' '}
              Your uploaded content is processed for analysis and is not intentionally retained. This demo does not store the raw
              message text — only a short summary and the generated report.
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-white/10 bg-ink-900/50 p-6 backdrop-blur" aria-live="polite">
            <div className="flex items-center justify-between">
              <Badge tone="violet">Preview</Badge>
              {loading && <Badge tone="yellow">Analyzing live…</Badge>}
            </div>
            {tab === 'text' && (
              <pre className="mt-4 max-h-[320px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/8 bg-ink-950/60 p-4 font-mono text-xs leading-relaxed text-slate-300">
                {text || 'Awaiting input…'}
              </pre>
            )}
            {tab === 'url' && (
              <pre className="mt-4 max-h-[320px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/8 bg-ink-950/60 p-4 font-mono text-xs leading-relaxed text-cyan-200">
                {url || 'Awaiting URL…'}
              </pre>
            )}
            {tab === 'image' && imageData && (
              <img src={imageData} alt="Preview of the screenshot to analyze" className="mt-4 max-h-[320px] w-full rounded-xl border border-white/10 object-contain" />
            )}
            {tab === 'demo' && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-400">Select a scenario to pre-fill the analyzer:</p>
                <div className="grid gap-2">
                  {scenarios.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setTab('text');
                        setText(s.message);
                        setError(null);
                      }}
                      className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-left text-xs text-slate-300 transition hover:bg-white/[0.06]"
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ScanOverlay visible={loading || done} stage={stage} done={done} resultLine={resultLine} />
    </div>
  );
}