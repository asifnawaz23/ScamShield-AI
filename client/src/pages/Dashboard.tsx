import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ChartPie, Activity, Trophy, Crosshair, LogOut, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts';
import { GlassCard, Badge, SectionLabel } from '../components/ui/primitives';
import { useAuth } from '../context/AuthContext';
import { apiHistory } from '../lib/api';
import { riskToneForScore } from '../lib/utils';
import type { HistoryItem } from '../types';

const TIER_COLORS: Record<string, string> = {
  safe: '#22c55e',
  low: '#84cc16',
  suspicious: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

function StatCard({ icon: Icon, label, value, sub, tone = 'text-accent' }: { icon: typeof Activity; label: string; value: string | number; sub?: string; tone?: string }) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-white">{String(value)}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 ${tone}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </GlassCard>
  );
}

function tooltipStyle() {
  return { background: '#0b0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' };
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<HistoryItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    apiHistory()
      .then((r) => alive && setItems(r.items))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, []);

  const safeItems: HistoryItem[] = items ?? [];

  const stats = useMemo(() => {
    const total = safeItems.length;
    const high = safeItems.filter((x) => x.riskScore >= 60 || x.riskLevel === 'high' || x.riskLevel === 'critical').length;
    const avg = total ? Math.round(safeItems.reduce((s, x) => s + x.riskScore, 0) / total) : 0;
    const buckets: Record<string, number> = {};
    for (const x of safeItems) buckets[x.category] = (buckets[x.category] || 0) + 1;
    const top = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
    return { total, high, avg, top: top ? top[0] : null, topCount: top ? top[1] : 0 };
  }, [safeItems]);

  const categoryData = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const x of safeItems) buckets[x.category] = (buckets[x.category] || 0) + 1;
    return Object.entries(buckets)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [safeItems]);

  const tierData = useMemo(() => {
    const buckets: Record<string, number> = { safe: 0, low: 0, suspicious: 0, high: 0, critical: 0 };
    for (const x of safeItems) {
      const tier = x.riskLevel && TIER_COLORS[x.riskLevel] ? x.riskLevel : riskToneForScore(x.riskScore);
      buckets[tier] = (buckets[tier] || 0) + 1;
    }
    const labels: Record<string, string> = { safe: 'Safe', low: 'Low', suspicious: 'Suspicious', high: 'High', critical: 'Critical' };
    return Object.entries(buckets)
      .filter(([, v]) => v > 0)
      .map(([k, value]) => ({ name: labels[k], value, color: TIER_COLORS[k] }));
  }, [safeItems]);

  const timelineData = useMemo(() => {
    const days: { key: string; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      days.push({ key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, label: d.toLocaleDateString('en-US', { weekday: 'short' }) });
    }
    const counts: Record<string, number> = {};
    for (const x of safeItems) {
      const d = new Date(x.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    return days.map((d) => ({ day: d.label, count: counts[d.key] || 0 }));
  }, [safeItems]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Security overview</SectionLabel>
          <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-bold text-white sm:text-4xl">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            {safeItems.length > 0
              ? `Your dashboard is built live from ${safeItems.length} analysis${safeItems.length === 1 ? '' : 'ies'} tied to your account.`
              : 'This dashboard is built live from your analyses. Run your first scan and every result snaps into place.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="green">Signed in</Badge>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white/10"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Activity} label="Threats analyzed" value={stats.total} sub="Your account scans" />
        <StatCard icon={ShieldAlert} label="High-risk detections" value={stats.high} sub="Score 60+ results" tone="text-risk-orange" />
        <StatCard icon={Crosshair} label="Average risk score" value={stats.total ? stats.avg : '—'} sub="Across your analyses" />
        <StatCard icon={Trophy} label="Most common type" value={stats.top ?? '—'} sub={stats.top ? `${stats.topCount} detection${stats.topCount === 1 ? '' : 's'}` : 'Run a scan to find out'} />
      </div>

      {safeItems.length === 0 ? (
        <GlassCard className="mt-8 p-10 text-center">
          <p className="font-display text-xl font-bold text-white">Nothing to show yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Paste a suspicious message, upload a screenshot, or run a demo scenario. Results are saved to your account automatically.
          </p>
          <Link
            to="/analyze"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-deep via-cyan-500 to-accent px-6 py-3 font-mono text-sm font-semibold uppercase tracking-widest text-ink-950 shadow-glow transition hover:brightness-110"
          >
            Analyze a threat
          </Link>
        </GlassCard>
      ) : (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <GlassCard className="p-6">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">Your threat categories</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle()} />
                    <Bar dataKey="count" fill="#22d3ee" radius={[6, 6, 0, 0]} animationDuration={1200} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">Your risk distribution</p>
              {tierData.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No risk data yet.</p>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tierData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        animationDuration={1200}
                      >
                        {tierData.map((t) => (
                          <Cell key={t.name} fill={t.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle()} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-6 lg:col-span-2">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">Your detection timeline (last 7 days)</p>
              <div className="mt-4 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashboardAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle()} />
                    <Area type="monotone" dataKey="count" stroke="#22d3ee" fill="url(#dashboardAreaFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          <div className="mt-8">
            <GlassCard className="p-6">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">Your recent analyses ({safeItems.length})</p>
              <ul className="mt-4 divide-y divide-white/5">
                {safeItems.slice(0, 7).map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <span className={`size-2 rounded-full ${riskDot(item)}`} aria-hidden="true" />
                    <Link to={`/results/${item.id}`} className="min-w-0 flex-1 truncate text-sm text-slate-300 transition hover:text-white">
                      {item.inputSummary}
                    </Link>
                    <span className="font-mono text-xs text-white/70">{item.riskScore}</span>
                    <span className="hidden text-xs text-slate-500 sm:block">{item.category}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </>
      )}

      <section className="mt-12" aria-labelledby="demo-analytics-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionLabel>Platform demo analytics</SectionLabel>
          <Badge tone="yellow">Demo simulation</Badge>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-slate-500">
          Illustrative sample data used for the product demo only — not real usage metrics. Your own scans appear above.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Activity} label="Threats analyzed*" value="12,840" sub="All-time demo count" />
          <StatCard icon={AlertTriangle} label="High-risk detections*" value="4,317" sub="Score 60+ results" tone="text-risk-orange" />
          <StatCard icon={Trophy} label="Most common type*" value="14" sub="Fake prize scenarios" />
          <StatCard icon={ChartPie} label="Average risk score*" value="87" sub="Across all analyses" />
        </div>
      </section>
    </div>
  );

  function riskDot(item: HistoryItem): string {
    const s = item.riskScore;
    if (s >= 80) return 'bg-risk-red';
    if (s >= 60) return 'bg-risk-orange';
    if (s >= 40) return 'bg-risk-yellow';
    return 'bg-risk-green';
  }
}