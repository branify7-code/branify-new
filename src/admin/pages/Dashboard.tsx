// =============================================================================
// BRANIFY ADMIN — Dashboard (executive overview / control center)
// Every number on this page comes from the real data layer (getDashboard,
// getSystemHealth) or from live HTTP probes (robots/sitemap/manifest).
// No fabricated metrics: where no data exists we say so honestly.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Bot, Briefcase, CheckCircle2, Crown, FileText, FolderKanban,
  Image as ImageIcon, LayoutTemplate, LogIn, Mail, Package, Pencil, Plus, RefreshCw, Search,
  Server, Settings, Trash2, UserPlus, Users, Wrench,
} from 'lucide-react';
import type { AdminPageProps } from '../lib/auth';
import { AdminError, getDashboard, getSystemHealth, listCustomers } from '../lib/backend';
import type { ActivityRow, CustomerRow, DashboardData, HealthItem, LeadRow, SystemHealthReport } from '../lib/types';
import { LEAD_STATUSES } from '../lib/types';
import {
  Badge, Btn, Card, EmptyState, ErrorBlock, LEAD_STATUS_TONE, LoadingBlock, cx,
} from '../ui';
import { Donut, HBars, HealthRing, LineArea, Sparkline, StatTile } from '../ui/charts';
import { timeAgo, truncate } from '../lib/format';

type IconCmp = React.ComponentType<{ size?: number | string; className?: string }>;

// ------------------------------------------------------------- data helpers
interface DayCount { day: string; count: number }

/**
 * Zero-filled daily series for the last `days` days. The local preview API
 * returns `{day, c}` rows while the production path returns `{day, count}` —
 * accept both, and fill days without rows with 0 so charts never distort.
 */
function normalizeDaily(rows: Array<{ day?: string; count?: number; c?: number }> | undefined, days = 30): DayCount[] {
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows || []) {
    const day = (r.day || '').slice(0, 10);
    if (map.has(day)) map.set(day, (map.get(day) || 0) + Number(r.count ?? r.c ?? 0));
  }
  return Array.from(map.entries()).map(([day, count]) => ({ day, count }));
}

const sumLast = (series: DayCount[], days: number): number =>
  series.slice(-days).reduce((s, d) => s + d.count, 0);

const compact = (v: number): string => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)));

const EVENT_LABELS: Record<string, string> = {
  whatsapp_click: 'WhatsApp clicks', lead_submit: 'Quote requests', contact_submit: 'Contact form',
  newsletter_signup: 'Newsletter signups', tool_launch: 'Tool launches', tool_page_view: 'Tool page views',
  ai_tool_click: 'AI tool clicks', product_click: 'Product clicks', pwa_install: 'PWA installs',
  not_found: '404 hits', start_project: 'Start project', book_consultation: 'Book consultation',
};

const humanEvent = (name: string): string =>
  EVENT_LABELS[name] ||
  (name || 'event')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const LEAD_COLORS: Record<string, string> = {
  new: '#C9A45C', contacted: '#94A3B8', qualified: '#34D399',
  proposal: '#A78BFA', won: '#10B981', lost: '#EF4444',
};

const STATUS_WORDS: Record<HealthItem['status'], { word: string; cls: string }> = {
  operational: { word: 'Operational', cls: 'text-emerald-300' },
  warning: { word: 'Warning', cls: 'text-amber-300' },
  error: { word: 'Error', cls: 'text-red-300' },
  unknown: { word: 'Unknown', cls: 'text-[#A7AFBA]' },
};

const ACTIVITY_ICONS: Array<[RegExp, IconCmp]> = [
  [/login/i, LogIn], [/seo/i, Search], [/media/i, ImageIcon], [/settings/i, Settings],
  [/system/i, Server], [/create/i, Plus], [/delete|clear/i, Trash2], [/update/i, Pencil],
];

// --------------------------------------------------------------- SEO probes
interface SeoCheck { label: string; ok: boolean; detail: string; points: number }

/**
 * REAL probes only: robots.txt + sitemap.xml + manifest.json fetched live,
 * plus the outstanding-404 count from the dashboard summary. Score = earned
 * points out of 100 (each check carries explicit weight, all pass ⇒ 100).
 */
async function probeSeo(outstanding404: number): Promise<{ checks: SeoCheck[]; score: number }> {
  const checks: SeoCheck[] = [];
  let robotsTxt = '';
  let robotsOk = false;
  try {
    const res = await fetch('/robots.txt', { cache: 'no-store' });
    robotsOk = res.ok;
    if (res.ok) robotsTxt = await res.text();
    checks.push({ label: 'robots.txt reachable', ok: res.ok, detail: res.ok ? `HTTP ${res.status} · ${robotsTxt.length} bytes` : `HTTP ${res.status}`, points: 20 });
  } catch {
    checks.push({ label: 'robots.txt reachable', ok: false, detail: 'Unreachable', points: 20 });
  }
  const declaresSitemap = /sitemap:\s*\S+/i.test(robotsTxt);
  checks.push({ label: 'Sitemap declared in robots.txt', ok: declaresSitemap, detail: declaresSitemap ? 'Sitemap: directive found' : 'No Sitemap: directive', points: 10 });

  let urls = 0;
  try {
    const res = await fetch('/sitemap.xml', { cache: 'no-store' });
    const txt = res.ok ? await res.text() : '';
    urls = (txt.match(/<url>/g) || []).length;
    checks.push({ label: 'sitemap.xml URLs', ok: res.ok && urls > 0, detail: res.ok ? `${urls} URLs` : `HTTP ${res.status}`, points: 25 });
  } catch {
    checks.push({ label: 'sitemap.xml URLs', ok: false, detail: 'Unreachable', points: 25 });
  }

  let icons = 0;
  try {
    const res = await fetch('/manifest.json', { cache: 'no-store' });
    if (res.ok) {
      const m = (await res.json()) as { icons?: unknown[] };
      icons = (m.icons || []).length;
    }
    checks.push({ label: 'PWA manifest reachable', ok: res.ok, detail: res.ok ? `HTTP ${res.status} · ${icons} icon(s) declared` : `HTTP ${res.status}`, points: 15 });
    checks.push({ label: 'Manifest icons declared', ok: icons > 0, detail: `${icons} icon(s) in manifest`, points: 15 });
  } catch {
    checks.push({ label: 'PWA manifest reachable', ok: false, detail: 'Unreachable', points: 15 });
    checks.push({ label: 'Manifest icons declared', ok: false, detail: 'No manifest', points: 15 });
  }

  checks.push({
    label: 'No outstanding 404s',
    ok: outstanding404 === 0,
    detail: outstanding404 === 0 ? 'None logged' : `${outstanding404} unresolvable path(s) logged`,
    points: 15,
  });

  const score = checks.reduce((s, c) => s + (c.ok ? c.points : 0), 0);
  return { checks, score };
}

// =====================================================================
// PAGE
// =====================================================================
export const Dashboard: React.FC<AdminPageProps> = ({ navigate }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<CustomerRow[]>([]);
  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [seo, setSeo] = useState<{ checks: SeoCheck[]; score: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else { setLoading(true); setError(null); }
    try {
      const [d, h] = await Promise.all([getDashboard(), getSystemHealth()]);
      setData(d);
      setHealth(h);
      setSeo(await probeSeo(d.counts.not_found));
      listCustomers().then((rows) => setRecentCustomers(rows.slice(0, 5))).catch(() => setRecentCustomers([]));
      setError(null);
    } catch (e) {
      setError(e instanceof AdminError ? `${e.message}` : ((e as Error).message || 'Failed to load dashboard data.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    timer.current = window.setInterval(() => load(true), 60_000);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [load]);

  const leadsSeries = useMemo(() => normalizeDaily(data?.leadsOverTime, 30), [data]);
  const eventsSeries = useMemo(() => normalizeDaily(data?.eventsOverTime, 30), [data]);
  const leads7d = useMemo(() => sumLast(leadsSeries, 7), [leadsSeries]);
  const leadsTotal = data?.counts.leads_total ?? 0;

  const topEvents = useMemo(
    () => (data?.eventsByName || []).slice(0, 6).map((e) => ({ label: humanEvent(e.name), value: Number(e.count ?? (e as { c?: number }).c ?? 0) })),
    [data],
  );

  const donutSegments = useMemo(
    () => LEAD_STATUSES.map((s) => ({ label: s, value: data?.leadsByStatus?.[s] || 0, color: LEAD_COLORS[s] })),
    [data],
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[104px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
          ))}
        </div>
        <LoadingBlock label="Loading control center…" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorBlock title="Dashboard unavailable" message={error || 'No data.'} onRetry={() => load()} />;
  }

  const c = data.counts;
  const quickActions: Array<{ label: string; to: string }> = [
    { label: 'New Service', to: '/services?new=1' },
    { label: 'New Project', to: '/portfolio?new=1' },
    { label: 'New Blog Post', to: '/blog?new=1' },
    { label: 'New Product', to: '/products?new=1' },
  ];

  const metrics: Array<{ label: string; value: number; icon: IconCmp; sub: React.ReactNode; spark?: number[] }> = [
    {
      label: 'Customers', value: c.customers, icon: Users,
      sub: <span className="text-[#6B7280]">Registered accounts</span>,
    },
    {
      label: 'Total Leads', value: c.leads_total, icon: UserPlus,
      sub: (
        <span className="flex items-center gap-1.5">
          <Badge tone="gold">{c.leads_new} new</Badge>
          <span className="text-[#6B7280]">· {leads7d} in 7d</span>
        </span>
      ),
      spark: leadsSeries.map((d) => d.count),
    },
    { label: 'Active Projects', value: c.portfolio, icon: FolderKanban, sub: <span className="text-[#6B7280]">Portfolio case studies</span> },
    { label: 'Services', value: c.services, icon: Briefcase, sub: <span className="text-[#6B7280]">Live service pages</span> },
    { label: 'AI Tools', value: c.ai_tools, icon: Bot, sub: <span className="text-[#6B7280]">Curated AI directory</span> },
    { label: 'Free Tools', value: c.tools, icon: Wrench, sub: <span className="text-[#6B7280]">Utility tools live</span> },
    { label: 'Products', value: c.products, icon: Package, sub: <span className="text-[#6B7280]">Digital products</span> },
    { label: 'Templates', value: c.templates, icon: LayoutTemplate, sub: <span className="text-[#6B7280]">{c.template_categories} categories</span> },
    { label: 'Blog Posts', value: c.blog_published, icon: FileText, sub: <span className="text-[#6B7280]">{c.blog_drafts} draft{c.blog_drafts === 1 ? '' : 's'}</span> },
    { label: 'Subscribers', value: c.subscribers, icon: Mail, sub: <span className="text-[#6B7280]">Newsletter list</span> },
  ];

  const statusColor = (s: HealthItem['status']) => STATUS_WORDS[s].cls;

  return (
    <div className="flex flex-col gap-4">
      {/* ---------------------------------------------------- welcome row */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[#F5F6F2] sm:text-2xl">
            Welcome back <span className="text-[#E8C97C]">— your command center</span>
          </h1>
          <p className="mt-1 text-xs text-[#A7AFBA] sm:text-sm">Here's what's happening across BRANIFY today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {quickActions.map((a) => (
            <Btn key={a.to} size="sm" variant="outline" icon={Plus} onClick={() => navigate(a.to)}>
              {a.label}
            </Btn>
          ))}
          <Btn
            size="sm"
            variant="ghost"
            aria-label="Refresh dashboard data"
            loading={refreshing}
            onClick={() => load(true)}
          >
            {!refreshing && <RefreshCw size={14} />}
            Refresh
          </Btn>
        </div>
      </div>

      {/* ---------------------------------------------------- metric grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-2xl border border-[rgba(201,164,92,0.16)] bg-[#07101A]/85 px-3.5 py-3 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A7AFBA]">{m.label}</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#C9A45C]/25 bg-[#C9A45C]/[0.08]">
                  <Icon size={14} className="text-[#E8C97C]" />
                </span>
              </div>
              <div className="mt-1 font-display text-2xl font-extrabold tabular-nums text-[#F5F6F2]">
                {m.value.toLocaleString()}
              </div>
              <div className="mt-1.5 text-[11px]">{m.sub}</div>
              {m.spark && m.spark.length > 0 && (
                <div className="mt-2 -mb-1">
                  <Sparkline data={m.spark} height={26} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ---------------------------------------------------- leads row */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Leads Overview" subtitle="Pipeline distribution by status" bodyClass="pt-1">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <Donut
              segments={donutSegments}
              centerValue={leadsTotal.toLocaleString()}
              centerLabel="Total"
              emptyLabel="No leads yet"
            />
            <div className="w-full flex-1">
              {leadsTotal === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="No leads yet"
                  hint="Inquiries from the site's quote and contact forms will appear here the moment they arrive."
                />
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {LEAD_STATUSES.map((s) => {
                    const v = data.leadsByStatus?.[s] || 0;
                    const pct = leadsTotal ? Math.round((v / leadsTotal) * 100) : 0;
                    return (
                      <li key={s} className="flex items-center gap-2.5 text-xs">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: LEAD_COLORS[s] }} />
                        <span className="flex-1 capitalize text-[#C9CED6]">{s}</span>
                        <span className="tabular-nums text-[#A7AFBA]">{pct}%</span>
                        <span className="w-8 text-right font-bold tabular-nums text-[#F5F6F2]">{v}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-3 flex justify-end">
                <Btn size="sm" variant="ghost" onClick={() => navigate('/leads')}>View All Leads →</Btn>
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="First-party Events"
          subtitle="Last 30 days · recorded by the live site"
          actions={<Btn size="sm" variant="ghost" onClick={() => navigate('/analytics')}>Open Analytics →</Btn>}
          bodyClass="pt-1"
        >
          <LineArea
            data={eventsSeries.map((d) => ({ label: d.day, value: d.count }))}
            height={170}
            formatValue={compact}
            emptyLabel="No events recorded yet — events appear as visitors use the site"
          />
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#A7AFBA]">Top events</p>
            <HBars items={topEvents} formatValue={compact} emptyLabel="No events recorded yet — events appear as visitors use the site" />
          </div>
        </Card>
      </div>

      {/* ---------------------------------------------------- SEO snapshot */}
      <Card
        title="SEO Snapshot"
        subtitle="Live probes of robots.txt, sitemap.xml, manifest + real 404 count"
        actions={<Btn size="sm" variant="ghost" onClick={() => navigate('/seo')}>Open SEO Center →</Btn>}
        bodyClass="pt-1"
      >
        <div className="flex flex-col items-center gap-6 lg:flex-row">
          <div className="flex shrink-0 flex-col items-center gap-2">
            <HealthRing value={seo?.score ?? 0} label={seo && seo.score >= 90 ? 'Excellent' : seo && seo.score >= 70 ? 'Good' : seo && seo.score >= 40 ? 'Fair' : 'Needs work'} sub="real checks" />
            <span className="text-[10px] text-[#6B7280]">scored from live probes</span>
          </div>
          <ul className="grid w-full gap-1.5 sm:grid-cols-2">
            {(seo?.checks || []).map((chk) => (
              <li key={chk.label} className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                {chk.ok
                  ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                  : <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" />}
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-[#D8DCE2]">{chk.label}</span>
                  <span className="block truncate text-[11px] text-[#6B7280]" title={chk.detail}>{chk.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* ---------------------------------------------------- system status */}
      <Card
        title="System Status"
        subtitle="Live health probes — database, auth, site, SEO files, PWA"
        actions={<Btn size="sm" variant="ghost" onClick={() => navigate('/system')}>View All →</Btn>}
        bodyClass="pt-1"
      >
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {(health?.items || []).map((it) => (
            <StatTile
              key={it.key}
              label={it.label}
              value={<span className={cx('text-base', statusColor(it.status))}>{STATUS_WORDS[it.status].word}</span>}
              sub={<span className="line-clamp-2 text-[11px] leading-snug text-[#6B7280]" title={it.detail}>{it.detail}</span>}
            />
          ))}
        </div>
      </Card>

      {/* --------------------------------- recent customers + leads + activity */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card
          title="Recent Customers"
          subtitle="Newest registered accounts"
          actions={<Btn size="sm" variant="ghost" onClick={() => navigate('/customers')}>View All →</Btn>}
          bodyClass="pt-1"
        >
          {recentCustomers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No customers yet"
              hint="When customers register or sign in on the public site, their account profile appears here."
            />
          ) : (
            <ul className="flex flex-col">
              {recentCustomers.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => navigate('/customers')}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#C9A45C]/25 bg-[#C9A45C]/[0.07] text-[9px] font-bold uppercase text-[#E8C97C]">
                      {(c.name || c.email).slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-[#F5F6F2]">{c.name || c.email}</span>
                      <span className="block truncate font-mono text-[11px] text-[#6B7280]">{c.email}</span>
                    </span>
                    <Badge tone={c.status === 'active' ? 'green' : c.status === 'blocked' ? 'red' : 'zinc'}>{c.status || 'active'}</Badge>
                    <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-[#6B7280]">{c.created_at ? timeAgo(c.created_at) : '—'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Recent Leads"
          subtitle="Latest inquiries across all sources"
          actions={<Btn size="sm" variant="ghost" onClick={() => navigate('/leads')}>View All →</Btn>}
          bodyClass="pt-1"
        >
          {data.recentLeads.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No leads yet"
              hint="Quote requests and contact form submissions will show up here in real time."
            />
          ) : (
            <ul className="flex flex-col">
              {data.recentLeads.map((lead: LeadRow) => (
                <li key={lead.id}>
                  <button
                    type="button"
                    onClick={() => navigate('/leads')}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-[#F5F6F2]">{lead.name || lead.email || '(unnamed)'}</span>
                      <span className="block truncate text-[11px] text-[#6B7280]">
                        {lead.services && lead.services.length > 0 ? truncate(lead.services.join(', '), 44) : 'No service selected'}
                      </span>
                    </span>
                    <Badge tone={LEAD_STATUS_TONE[lead.status] || 'zinc'}>{lead.status}</Badge>
                    <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-[#6B7280]">{timeAgo(lead.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Activity Feed"
          subtitle="Admin actions, newest first"
          actions={<Btn size="sm" variant="ghost" onClick={() => navigate('/activity')}>View All →</Btn>}
          bodyClass="pt-1"
        >
          {data.recentActivity.length === 0 ? (
            <EmptyState
              icon={Server}
              title="No activity yet"
              hint="Every admin write action is logged — create, update, delete, settings and media uploads."
            />
          ) : (
            <ul className="flex flex-col">
              {data.recentActivity.map((a: ActivityRow) => {
                const hit = ACTIVITY_ICONS.find(([re]) => re.test(a.action));
                const Icon = hit ? hit[1] : Server;
                const humanized = (a.action || 'event').replace(/[._-]+/g, ' ');
                return (
                  <li key={a.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
                      <Icon size={13} className="text-[#C9A45C]" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-[#C9CED6]">
                      <span className="font-semibold text-[#F5F6F2]">{a.user_email || 'system'}</span>
                      <span className="text-[#6B7280]"> · {humanized}</span>
                      {a.target_type && a.target_type !== a.action ? <span className="text-[#6B7280]"> {a.target_type}</span> : null}
                    </span>
                    <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-[#6B7280]">{timeAgo(a.created_at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* ---------------------------------------------------- banner */}
      <section className="relative overflow-hidden rounded-2xl border border-[#C9A45C]/35 bg-gradient-to-r from-[#C9A45C]/[0.12] via-[#07101A]/90 to-[#07101A]/85 px-5 py-5 sm:px-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[#C9A45C]/[0.07] blur-2xl" aria-hidden="true" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#C9A45C]/40 bg-[#C9A45C]/10">
            <Crown size={20} className="text-[#E8C97C]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-extrabold tracking-wide text-[#F5F6F2] sm:text-base">BRANIFY Self-Hosted Control Center</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#A7AFBA]">
              You're managing your own platform — content, SEO, leads and analytics in one place.
            </p>
          </div>
          <Btn variant="gold" size="sm" onClick={() => navigate('/settings')}>Open Settings</Btn>
        </div>
      </section>
    </div>
  );
};
