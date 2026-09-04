// =============================================================================
// BRANIFY ADMIN — Performance (REAL browser metrics only)
// All numbers here are measured live in YOUR browser via the Performance /
// Navigation / Storage APIs, or fetched from the real data layer (route counts).
// We refuse to invent Lighthouse scores or build statuses — those are shown
// as honest N/A entries with guidance instead.
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  Boxes, Cpu, FileCode2, Gauge, HardDrive, Image as ImageIcon, Info, Layers,
  Package, RefreshCw, Route, Server, Wifi,
} from 'lucide-react';
import type { AdminPageProps } from '../lib/auth';
import { AdminError, getDashboard } from '../lib/backend';
import type { DashboardData } from '../lib/types';
import {
  Btn, Card, EmptyState, ErrorBlock, LoadingBlock, cx,
} from '../ui';
import { HBars, StatTile } from '../ui/charts';
import { fmtBytes, fmtNumber } from '../lib/format';

interface NavTiming {
  dns: number | null;
  tcp: number | null;
  ttfb: number | null;
  dcl: number | null;
  load: number | null;
}

interface ResGroup { count: number; bytes: number }

interface ResourceSummary {
  totalRequests: number;
  totalBytes: number;
  groups: Record<string, ResGroup>;
}

const GROUP_META: Array<{ id: string; label: string; exts: string[]; icon: React.ComponentType<{ size?: number | string; className?: string }> }> = [
  { id: 'js', label: 'JavaScript', exts: ['js', 'mjs'], icon: FileCode2 },
  { id: 'css', label: 'Stylesheets', exts: ['css'], icon: Layers },
  { id: 'img', label: 'Images', exts: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'ico'], icon: ImageIcon },
  { id: 'font', label: 'Fonts', exts: ['woff', 'woff2', 'ttf', 'otf', 'eot'], icon: Package },
  { id: 'other', label: 'Other', exts: [], icon: Boxes },
];

const round1 = (ms: number | null): number | null => (ms === null || !Number.isFinite(ms) ? null : Math.round(ms * 10) / 10);

const fmtMs = (v: number | null): string => (v === null ? '—' : `${Math.round(v * 10) / 10} ms`);

function measureNavigation(): NavTiming {
  const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  const nav = entries && entries[0];
  if (!nav) return { dns: null, tcp: null, ttfb: null, dcl: null, load: null };
  const safe = (v: number) => (Number.isFinite(v) && v >= 0 ? v : null);
  return {
    dns: round1(safe(nav.domainLookupEnd - nav.domainLookupStart)),
    tcp: round1(safe(nav.connectEnd - nav.connectStart)),
    ttfb: round1(safe(nav.responseStart - nav.startTime)),
    dcl: round1(safe(nav.domContentLoadedEventEnd - nav.startTime)),
    load: nav.loadEventEnd > 0 ? round1(safe(nav.loadEventEnd - nav.startTime)) : null,
  };
}

function measureResources(): ResourceSummary {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const groups: Record<string, ResGroup> = {};
  for (const g of GROUP_META) groups[g.id] = { count: 0, bytes: 0 };
  let totalRequests = 0;
  let totalBytes = 0;
  for (const r of entries || []) {
    let ext = '';
    try {
      const m = new URL(r.name, window.location.href).pathname.match(/\.([a-z0-9]+)$/i);
      ext = m ? m[1].toLowerCase() : '';
    } catch { ext = ''; }
    const meta = GROUP_META.find((g) => g.exts.includes(ext));
    const id = meta ? meta.id : 'other';
    const bytes = r.transferSize || 0;
    groups[id].count += 1;
    groups[id].bytes += bytes;
    totalRequests += 1;
    totalBytes += bytes;
  }
  return { totalRequests, totalBytes, groups };
}

export const PerformancePage: React.FC<AdminPageProps> = () => {
  const [nav, setNav] = useState<NavTiming | null>(null);
  const [res, setRes] = useState<ResourceSummary | null>(null);
  const [sw, setSw] = useState<{ registered: boolean; detail: string } | null>(null);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [content, setContent] = useState<DashboardData | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [measuring, setMeasuring] = useState(false);

  const measure = useCallback(async (silent = false) => {
    if (silent) setMeasuring(true);
    else setLoading(true);

    // Browser-side measures (synchronous)
    setNav(measureNavigation());
    setRes(measureResources());

    // Service worker + cache storage (async)
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        setSw(reg
          ? { registered: true, detail: `Registered · scope ${reg.scope}` }
          : { registered: false, detail: 'Not registered — the site currently ships a self-unregistering service worker (cache-offline disabled by design)' });
      } else {
        setSw({ registered: false, detail: 'Service Worker API unavailable in this browser' });
      }
    } catch {
      setSw({ registered: false, detail: 'Service worker state could not be read' });
    }
    try {
      if ('storage' in navigator && navigator.storage && 'estimate' in navigator.storage) {
        const est = await navigator.storage.estimate();
        setStorage({ usage: est.usage || 0, quota: est.quota || 0 });
      } else {
        setStorage(null);
      }
    } catch {
      setStorage(null);
    }

    // Real route counts from the data layer
    try {
      const d = await getDashboard();
      setContent(d);
      setContentError(null);
    } catch (e) {
      setContent(null);
      setContentError(e instanceof AdminError ? e.message : (e as Error).message || 'Data layer unreachable.');
    } finally {
      setLoading(false);
      setMeasuring(false);
    }
  }, []);

  useEffect(() => { measure(); }, [measure]);

  // ------------------------------------------------------ content weight
  const STATIC_ROUTES = 9; // home, about, contact, pricing + 5 legal pages
  const contentCounts = content ? [
    { label: 'Services', n: content.counts.services },
    { label: 'Free tools', n: content.counts.tools },
    { label: 'AI tools', n: content.counts.ai_tools },
    { label: 'Products', n: content.counts.products },
    { label: 'Blog posts (published)', n: content.counts.blog_published },
  ] : [];
  const contentRoutes = contentCounts.reduce((s, x) => s + x.n, 0);
  const totalRoutes = STATIC_ROUTES + contentRoutes;

  const hbarItems = res
    ? GROUP_META.filter((g) => res.groups[g.id]?.count > 0)
      .map((g) => ({ label: `${g.label} · ${res.groups[g.id].count} file${res.groups[g.id].count === 1 ? '' : 's'}`, value: res.groups[g.id].bytes }))
    : [];

  const navTiles: Array<{ label: string; value: string; icon: React.ReactNode }> = [
    { label: 'DNS lookup', value: fmtMs(nav?.dns ?? null), icon: <Wifi size={14} className="text-[#C9A45C]" /> },
    { label: 'TCP connect', value: fmtMs(nav?.tcp ?? null), icon: <Server size={14} className="text-[#C9A45C]" /> },
    { label: 'TTFB', value: fmtMs(nav?.ttfb ?? null), icon: <Gauge size={14} className="text-[#C9A45C]" /> },
    { label: 'DOM content loaded', value: fmtMs(nav?.dcl ?? null), icon: <Cpu size={14} className="text-[#C9A45C]" /> },
    { label: 'Load event', value: nav?.load != null ? fmtMs(nav.load) : 'pending…', icon: <Layers size={14} className="text-[#C9A45C]" /> },
  ];

  const storagePct = storage && storage.quota ? Math.min(100, Math.round((storage.usage / storage.quota) * 100)) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* ---------------------------------------------------------- header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[#F5F6F2] sm:text-2xl">
            Performance <span className="text-[#E8C97C]">— measured live</span>
          </h1>
          <p className="mt-1 text-xs text-[#A7AFBA] sm:text-sm">
            Real metrics from this browser session and the live data layer. Nothing estimated, nothing invented.
          </p>
        </div>
        <Btn variant="outline" size="sm" icon={RefreshCw} loading={measuring} onClick={() => measure(true)}>
          Re-measure
        </Btn>
      </div>

      {loading ? (
        <LoadingBlock label="Measuring this browser session…" />
      ) : (
        <>
          {/* ------------------------------------------------ navigation timing */}
          <Card
            title="Navigation Timing"
            subtitle="performance.getEntriesByType('navigation') · this page load"
            bodyClass="pt-1"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {navTiles.map((t) => (
                <StatTile key={t.label} label={t.label} value={<span className="tabular-nums">{t.value}</span>} icon={t.icon} />
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-[#6B7280]">
              <Info size={11} />
              Measured live in your browser session (dev preview). Production Vercel build sizes may differ.
            </p>
          </Card>

          {/* ------------------------------------------------------- resources */}
          <Card
            title="Resources"
            subtitle={`Grouped by type · ${fmtNumber(res?.totalRequests ?? 0)} requests in this session`}
            bodyClass="pt-1"
          >
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="grid grid-cols-2 gap-3 self-start">
                <StatTile
                  label="Total requests"
                  value={fmtNumber(res?.totalRequests ?? 0)}
                  icon={<Layers size={14} className="text-[#C9A45C]" />}
                />
                <StatTile
                  label="Transferred"
                  value={fmtBytes(res?.totalBytes ?? 0)}
                  sub={<span className="text-[10px] text-[#6B7280]">transferSize as reported by the browser</span>}
                  icon={<HardDrive size={14} className="text-[#C9A45C]" />}
                />
              </div>
              <HBars
                items={hbarItems}
                formatValue={fmtBytes}
                emptyLabel="No resource entries in this session"
              />
            </div>
            <p className="mt-3 text-[10.5px] text-[#6B7280]">
              Cross-origin resources without a Timing-Allow-Origin header report 0 transfer bytes — shown as measured.
            </p>
          </Card>

          {/* -------------------------------------------------- content weight */}
          <Card
            title="Content Weight (Indexable Routes)"
            subtitle="Real route counts from the live data layer"
            bodyClass="pt-1"
          >
            {contentError ? (
              <ErrorBlock
                title="Route counts unavailable"
                message={`${contentError} — the browser metrics above remain valid.`}
                onRetry={() => measure(true)}
              />
            ) : !content ? (
              <EmptyState title="No data" hint="Route counts come from the admin data layer, which is currently unreachable." />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <StatTile label="Static pages" value={STATIC_ROUTES} sub={<span className="text-[10px] text-[#6B7280]">home · about · contact · pricing · 5 legal</span>} icon={<Route size={14} className="text-[#C9A45C]" />} />
                  <StatTile label="Content routes" value={fmtNumber(contentRoutes)} sub={<span className="text-[10px] text-[#6B7280]">services + tools + AI + products + blog</span>} icon={<Layers size={14} className="text-[#C9A45C]" />} />
                  <StatTile label="Total indexable" value={fmtNumber(totalRoutes)} sub={<span className="text-[10px] text-[#6B7280]">approximate sitemap surface</span>} icon={<Gauge size={14} className="text-[#C9A45C]" />} />
                </div>
                <p className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 font-mono text-[11px] leading-relaxed text-[#A7AFBA]">
                  {STATIC_ROUTES} static
                  {contentCounts.map((x) => (
                    <span key={x.label}> + {fmtNumber(x.n)} {x.label.toLowerCase().replace(' (published)', '')}</span>
                  ))}
                  {' '}= {fmtNumber(totalRoutes)} total
                </p>
              </>
            )}
          </Card>

          {/* --------------------------------------------------- PWA & cache */}
          <Card title="PWA & Cache" subtitle="Service worker and browser storage — this device" bodyClass="pt-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile
                label="Service worker"
                value={
                  <span className={cx('text-base', sw?.registered ? 'text-emerald-300' : 'text-amber-300')}>
                    {sw?.registered ? 'Registered' : 'Not registered'}
                  </span>
                }
                sub={<span className="text-[10.5px] leading-snug text-[#6B7280]">{sw?.detail}</span>}
                icon={<Cpu size={14} className="text-[#C9A45C]" />}
              />
              <StatTile
                label="Origin storage used"
                value={storage ? fmtBytes(storage.usage) : 'N/A'}
                sub={
                  storage
                    ? <span className="text-[10.5px] text-[#6B7280]">{fmtBytes(storage.quota)} quota{storagePct !== null ? ` · ${storagePct}% used` : ''}</span>
                    : <span className="text-[10.5px] text-[#6B7280]">Storage estimate API unavailable</span>
                }
                icon={<HardDrive size={14} className="text-[#C9A45C]" />}
              />
            </div>
          </Card>

          {/* --------------------------------------------------- honest N/A list */}
          <Card title="Not measurable here" subtitle="Honest gaps — no fabricated numbers" bodyClass="pt-1">
            <ul className="flex flex-col gap-2">
              <li className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <Info size={15} className="mt-0.5 shrink-0 text-[#A7AFBA]" />
                <p className="text-xs leading-relaxed text-[#C9CED6]">
                  <span className="font-bold text-[#F5F6F2]">Lighthouse scores: N/A</span> — not measurable from inside the admin.
                  Run <span className="font-mono text-[#E8C97C]">PageSpeed Insights</span> externally against the production URL.
                </p>
              </li>
              <li className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <Info size={15} className="mt-0.5 shrink-0 text-[#A7AFBA]" />
                <p className="text-xs leading-relaxed text-[#C9CED6]">
                  <span className="font-bold text-[#F5F6F2]">Build status: N/A</span> — managed by Vercel; check the Vercel dashboard for deploy state.
                </p>
              </li>
            </ul>
          </Card>
        </>
      )}
    </div>
  );
};
