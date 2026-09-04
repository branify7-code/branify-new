// =============================================================================
// BRANIFY ADMIN — System Health & data collections overview
// Health comes from getSystemHealth() (REAL probes: database, auth, public site,
// robots/sitemap/manifest, service worker). Row counts are real totals from the
// data layer. When no database is connected we show the honest setup path.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Database, FileText, Globe, HeartPulse, RefreshCw, Server, ShieldCheck, Smartphone,
} from 'lucide-react';
import type { AdminPageProps } from '../lib/auth';
import { AdminError, getDashboard, getSystemHealth, listEvents, listRows } from '../lib/backend';
import type { DashboardData, HealthItem, SystemHealthReport } from '../lib/types';
import {
  Badge, Btn, Card, ErrorBlock, LoadingBlock, cx,
} from '../ui';
import { DataTable, type Column } from '../ui/DataTable';
import { HealthRing } from '../ui/charts';
import { fmtNumber, timeAgo } from '../lib/format';

type IconCmp = React.ComponentType<{ size?: number | string; className?: string }>;

const ITEM_ICONS: Record<string, IconCmp> = {
  database: Database,
  auth: ShieldCheck,
  website: Globe,
  robots: FileText,
  sitemap: FileText,
  pwa: Smartphone,
  sw: Smartphone,
};

const STATUS_BADGE: Record<HealthItem['status'], { tone: 'green' | 'amber' | 'red' | 'zinc'; word: string }> = {
  operational: { tone: 'green', word: 'Operational' },
  warning: { tone: 'amber', word: 'Warning' },
  error: { tone: 'red', word: 'Error' },
  unknown: { tone: 'zinc', word: 'Unknown' },
};

const SCORE_BY_STATUS: Record<HealthItem['status'], number> = {
  operational: 100,
  warning: 50,
  error: 0,
  unknown: 50, // unverifiable counts half-credit, same as warning
};

interface CollectionStat {
  id: string;
  label: string;
  key: string;
  count: number | null;
  source: string;
}

export const SystemPage: React.FC<AdminPageProps> = () => {
  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [extra, setExtra] = useState<{ seo_overrides?: number; analytics_events?: number; activity_log?: number }>({});
  const [countsError, setCountsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async (silent = false) => {
    if (silent) setChecking(true);
    else setLoading(true);
    try {
      const h = await getSystemHealth();
      setHealth(h);
      setError(null);
      return h;
    } catch (e) {
      setError(e instanceof AdminError ? e.message : (e as Error).message || 'Health check failed.');
      return null;
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, []);

  const loadCounts = useCallback(async () => {
    setCountsError(null);
    try {
      const [dash, seo, evts, act] = await Promise.all([
        getDashboard(),
        listRows<{ id: string }>('seo_overrides', { pageSize: 1 }),
        listEvents({ pageSize: 1 }),
        listRows<{ id: string }>('activity_log', { pageSize: 1 }),
      ]);
      setDashboard(dash);
      setExtra({
        seo_overrides: seo.total,
        analytics_events: evts.total,
        activity_log: act.total,
      });
    } catch (e) {
      setDashboard(null);
      setCountsError(e instanceof AdminError ? e.message : (e as Error).message || 'Row counts unavailable.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      const h = await loadHealth();
      if (h && h.mode !== 'none') await loadCounts();
      else setLoading(false);
    })();
  }, [loadHealth, loadCounts]);

  const runFullCheck = useCallback(async () => {
    const h = await loadHealth(true);
    if (h && h.mode !== 'none') await loadCounts();
  }, [loadHealth, loadCounts]);

  const score = useMemo(() => {
    if (!health || health.items.length === 0) return 0;
    const sum = health.items.reduce((s, it) => s + SCORE_BY_STATUS[it.status], 0);
    return Math.round(sum / health.items.length);
  }, [health]);

  const collections: CollectionStat[] = useMemo(() => {
    if (!dashboard) return [];
    const c = dashboard.counts;
    return [
      { id: 'services', label: 'Services', key: 'services', count: c.services, source: 'dashboard summary' },
      { id: 'portfolio_projects', label: 'Portfolio Projects', key: 'portfolio_projects', count: c.portfolio, source: 'dashboard summary' },
      { id: 'tools', label: 'Free Tools', key: 'tools', count: c.tools, source: 'dashboard summary' },
      { id: 'ai_tools', label: 'AI Tools', key: 'ai_tools', count: c.ai_tools, source: 'dashboard summary' },
      { id: 'products', label: 'Products', key: 'products', count: c.products, source: 'dashboard summary' },
      { id: 'blog_posts', label: 'Blog Posts', key: 'blog_posts', count: c.blog_published + c.blog_drafts, source: 'published + drafts' },
      { id: 'inquiries', label: 'Leads / Inquiries', key: 'inquiries', count: c.leads_total, source: 'dashboard summary' },
      { id: 'newsletter_subscribers', label: 'Newsletter Subscribers', key: 'newsletter_subscribers', count: c.subscribers, source: 'dashboard summary' },
      { id: 'seo_overrides', label: 'SEO Overrides', key: 'seo_overrides', count: extra.seo_overrides ?? null, source: 'count query' },
      { id: 'redirects', label: 'Redirects (active)', key: 'redirects', count: c.redirects, source: 'dashboard summary' },
      { id: 'media_assets', label: 'Media Assets', key: 'media_assets', count: c.media, source: 'dashboard summary' },
      { id: 'analytics_events', label: 'Analytics Events', key: 'analytics_events', count: extra.analytics_events ?? null, source: 'count query' },
      { id: 'activity_log', label: 'Activity Log', key: 'activity_log', count: extra.activity_log ?? null, source: 'count query' },
      { id: 'not_found_log', label: '404 Log Entries', key: 'not_found_log', count: c.not_found, source: 'dashboard summary' },
    ];
  }, [dashboard, extra]);

  const columns: Column<CollectionStat>[] = [
    {
      key: 'label', label: 'Collection',
      render: (r) => (
        <span className="flex flex-col">
          <span className="text-[13px] font-semibold text-[#F5F6F2]">{r.label}</span>
          <span className="font-mono text-[10.5px] text-[#566072]">{r.key}</span>
        </span>
      ),
    },
    {
      key: 'count', label: 'Rows',
      className: 'text-right',
      render: (r) => (
        <span className="font-display text-sm font-bold tabular-nums text-[#E8C97C]">
          {r.count === null ? '—' : fmtNumber(r.count)}
        </span>
      ),
    },
    { key: 'source', label: 'Source', hideOnMobile: true, render: (r) => <span className="text-[11px] text-[#6B7280]">{r.source}</span> },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-44 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
        <LoadingBlock label="Running health probes…" />
      </div>
    );
  }

  if (error && !health) {
    return <ErrorBlock title="System health unavailable" message={error} onRetry={() => loadHealth()} />;
  }

  const mode = health?.mode;

  return (
    <div className="flex flex-col gap-4">
      {/* ---------------------------------------------------------- header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[#F5F6F2] sm:text-2xl">
            System Health <span className="text-[#E8C97C]">— live probes</span>
          </h1>
          <p className="mt-1 text-xs text-[#A7AFBA] sm:text-sm">
            Database, auth, public site, SEO files and PWA — checked for real on every run.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {health?.checkedAt && <span className="text-[11px] tabular-nums text-[#6B7280]">last checked {timeAgo(health.checkedAt)}</span>}
          <Btn size="sm" variant="outline" icon={RefreshCw} loading={checking} onClick={runFullCheck}>
            Run full check
          </Btn>
        </div>
      </div>

      {/* -------------------------------------------------- 'none' setup card */}
      {mode === 'none' && (
        <div className="rounded-2xl border border-amber-500/35 bg-amber-500/[0.07] px-4 py-4 sm:px-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
            <Database size={14} /> Admin database not connected
          </p>
          <p className="mt-2 text-xs leading-relaxed text-amber-200">
            The production admin runs on Supabase. To enable it, open the Supabase SQL editor and run, in order:
          </p>
          <ol className="mt-2 flex flex-col gap-1.5 text-xs text-amber-100">
            <li className="rounded-lg bg-black/25 px-3 py-2 font-mono">supabase/admin-schema.sql <span className="font-sans text-amber-300/70">— schema, RLS policies, storage bucket</span></li>
            <li className="rounded-lg bg-black/25 px-3 py-2 font-mono">supabase/admin-seed.sql <span className="font-sans text-amber-300/70">— seeds real content + default settings</span></li>
          </ol>
          <p className="mt-2 text-[11px] leading-relaxed text-amber-200/80">
            Then reload /admin and sign up with an allowlisted email. Until then the local preview API (dev sandbox) keeps the dashboard usable.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------ health ring + items */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Overall Health" subtitle={mode === 'supabase' ? 'Supabase · production' : mode === 'local' ? 'Local preview API (sandbox)' : 'Not connected'} bodyClass="pt-1">
          <div className="flex flex-col items-center gap-3 py-4">
            <HealthRing value={score} label={score >= 90 ? 'Healthy' : score >= 70 ? 'Degraded' : score >= 40 ? 'Impaired' : 'Critical'} sub={`${health?.items.length ?? 0} probes averaged`} />
            {health?.checkedAt && (
              <p className="text-[10.5px] tabular-nums text-[#6B7280]">checked {timeAgo(health.checkedAt)}</p>
            )}
          </div>
        </Card>

        <Card className="xl:col-span-2" title="Probes" subtitle="Each check runs against the real system" bodyClass="pt-1">
          <ul className="flex flex-col gap-1.5">
            {(health?.items || []).map((it) => {
              const Icon = ITEM_ICONS[it.key] || HeartPulse;
              const sb = STATUS_BADGE[it.status];
              return (
                <li key={it.key} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#C9A45C]/25 bg-[#C9A45C]/[0.08]">
                    <Icon size={15} className="text-[#E8C97C]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[#F5F6F2]">{it.label}</span>
                    <span className="block truncate text-[11px] text-[#6B7280]" title={it.detail}>{it.detail}</span>
                  </span>
                  <Badge tone={sb.tone} className="shrink-0">{sb.word}</Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* ------------------------------------------------- collections overview */}
      <Card
        title="Data Collections"
        subtitle="Real row counts across the 14 admin collections"
        bodyClass="pt-1"
      >
        {countsError && !dashboard ? (
          <ErrorBlock title="Row counts unavailable" message={countsError} onRetry={loadCounts} />
        ) : collections.length === 0 ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3.5">
            <Server size={16} className="mt-0.5 shrink-0 text-amber-300" />
            <p className="text-xs leading-relaxed text-amber-200">
              Not connected — no row counts available. Apply <span className="font-mono">supabase/admin-schema.sql</span> (paths above) to bring the collections online.
            </p>
          </div>
        ) : (
          <DataTable<CollectionStat>
            columns={columns}
            rows={collections}
            total={collections.length}
            page={1}
            pageSize={collections.length}
            onPageChange={() => { /* static overview — all 14 rows on one page */ }}
            emptyTitle="No collections"
            mobileCard={(r) => (
              <div className="flex items-center justify-between gap-3">
                <span className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[#F5F6F2]">{r.label}</span>
                  <span className="font-mono text-[10px] text-[#566072]">{r.key}</span>
                </span>
                <span className="font-display text-sm font-bold tabular-nums text-[#E8C97C]">
                  {r.count === null ? '—' : fmtNumber(r.count)}
                </span>
              </div>
            )}
          />
        )}
        {dashboard && (
          <p className={cx('mt-3 text-[10.5px] text-[#6B7280]')}>
            Counts reflect live data ({timeAgo(health?.checkedAt || null)}). Redirects row counts active redirects only; blog posts include drafts.
          </p>
        )}
      </Card>
    </div>
  );
};
