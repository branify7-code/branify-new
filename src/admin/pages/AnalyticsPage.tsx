// =============================================================================
// BRANIFY ADMIN — Analytics (first-party event store)
// BRANIFY ships a privacy-friendly first-party event pipeline; this page reads
// ONLY real recorded events from the analytics_events collection. Numbers are
// aggregated client-side from the latest 200 events (page 1, newest first) and
// labelled as such. No third-party analytics is connected — stated honestly.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Database, Info, MousePointerClick, RefreshCw } from 'lucide-react';
import type { AdminPageProps } from '../lib/auth';
import { AdminError, getSettings, listEvents } from '../lib/backend';
import type { EventRow, SiteSettings } from '../lib/types';
import {
  Btn, Card, EmptyState, ErrorBlock, LoadingBlock, Tabs,
} from '../ui';
import { DataTable, type Column } from '../ui/DataTable';
import { HBars, LineArea, StatTile } from '../ui/charts';
import { timeAgo, truncate } from '../lib/format';

const TABLE_PAGE_SIZE = 25;

// Human labels — plural form for the top-events chart, singular for rows.
const EVENT_PLURAL: Record<string, string> = {
  whatsapp_click: 'WhatsApp Clicks', lead_submit: 'Quote Requests', contact_submit: 'Contact Form',
  newsletter_signup: 'Newsletter Signups', tool_launch: 'Tool Launches', tool_page_view: 'Tool Page Views',
  ai_tool_click: 'AI Tool Clicks', product_click: 'Product Clicks', pwa_install: 'PWA Installs',
  not_found: '404 Hits', start_project: 'Start Project', book_consultation: 'Book Consultation',
};
const EVENT_SINGULAR: Record<string, string> = {
  whatsapp_click: 'WhatsApp Click', lead_submit: 'Quote Request', contact_submit: 'Contact Form Submit',
  newsletter_signup: 'Newsletter Signup', tool_launch: 'Tool Launch', tool_page_view: 'Tool Page View',
  ai_tool_click: 'AI Tool Click', product_click: 'Product Click', pwa_install: 'PWA Install',
  not_found: '404 Hit', start_project: 'Start Project', book_consultation: 'Book Consultation',
};

const labelPlural = (name: string): string =>
  EVENT_PLURAL[name] || (name || 'event').replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
const labelSingular = (name: string): string =>
  EVENT_SINGULAR[name] || (name || 'event').replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());

const compact = (v: number): string => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)));

const DAY_MS = 86_400_000;

/** Zero-filled daily buckets for the last `days` days from raw event rows. */
function bucketDaily(events: EventRow[], days: number): Array<{ label: string; value: number }> {
  const map = new Map<string, number>();
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    map.set(new Date(now - i * DAY_MS).toISOString().slice(0, 10), 0);
  }
  for (const e of events) {
    const day = (e.created_at || '').slice(0, 10);
    if (map.has(day)) map.set(day, (map.get(day) || 0) + 1);
  }
  return Array.from(map.entries()).map(([day, value]) => ({ label: day, value }));
}

export const AnalyticsPage: React.FC<AdminPageProps> = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [chartEvents, setChartEvents] = useState<EventRow[]>([]); // latest 200 (page 1)
  const [rows, setRows] = useState<EventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'created_at' | 'name'>('created_at');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [range, setRange] = useState<'7' | '30'>('30');
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const days = range === '7' ? 7 : 30;

  const fetchTable = useCallback(async (p: number, s: 'created_at' | 'name', d: 'asc' | 'desc') => {
    setTableLoading(true);
    try {
      const res = await listEvents({ page: p, pageSize: TABLE_PAGE_SIZE, sort: s, dir: d });
      setRows(res.rows);
      setTotal(res.total);
      setPage(res.page);
    } catch (e) {
      setError(e instanceof AdminError ? e.message : (e as Error).message || 'Failed to load events.');
    } finally {
      setTableLoading(false);
    }
  }, []);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else { setLoading(true); setError(null); }
    try {
      const [s, chart] = await Promise.all([
        getSettings().catch(() => null),
        listEvents({ page: 1, pageSize: 200, sort: 'created_at', dir: 'desc' }),
      ]);
      setSettings(s);
      setChartEvents(chart.rows);
      setError(null);
      await fetchTable(1, sort, dir);
    } catch (e) {
      setError(e instanceof AdminError ? e.message : (e as Error).message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTable, sort, dir]);

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  // ------------------------------------------------ client-side aggregation
  const inRange = useMemo(() => {
    const cutoff = Date.now() - days * DAY_MS;
    return chartEvents.filter((e) => new Date(e.created_at || 0).getTime() >= cutoff);
  }, [chartEvents, days]);

  const daily = useMemo(() => bucketDaily(inRange, days), [inRange, days]);

  const topEvents = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of inRange) counts.set(e.name, (counts.get(e.name) || 0) + 1);
    return Array.from(counts.entries())
      .map(([name, value]) => ({ label: labelPlural(name), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [inRange]);

  const funnel = useMemo(() => {
    const byName = (n: string) => inRange.filter((e) => e.name === n).length;
    return [
      { label: 'Leads submitted', value: byName('lead_submit') },
      { label: 'Newsletter signups', value: byName('newsletter_signup') },
      { label: 'WhatsApp clicks', value: byName('whatsapp_click') },
      { label: 'Tool launches', value: byName('tool_launch') },
    ];
  }, [inRange]);

  const provider = settings?.performance?.analytics_provider || 'first_party';

  // ------------------------------------------------------------- table cols
  const columns: Column<EventRow>[] = [
    {
      key: 'name', label: 'Event', sortable: true,
      render: (r) => (
        <span className="inline-flex items-center gap-2 font-semibold text-[#EDEFF2]">
          <Activity size={13} className="text-[#C9A45C]" /> {labelSingular(r.name)}
        </span>
      ),
    },
    {
      key: 'path', label: 'Path',
      render: (r) => <span className="font-mono text-[11.5px] text-[#A7AFBA]">{truncate(r.path || '/', 42)}</span>,
    },
    { key: 'created_at', label: 'When', sortable: true, render: (r) => <span className="tabular-nums text-[#A7AFBA]">{timeAgo(r.created_at)}</span> },
    {
      key: 'meta', label: 'Meta', hideOnMobile: true,
      render: (r) => {
        const json = r.meta && Object.keys(r.meta).length ? JSON.stringify(r.meta) : '—';
        return <span className="font-mono text-[10.5px] text-[#566072]" title={json}>{truncate(json, 46)}</span>;
      },
    },
  ];

  const onSort = (key: string) => {
    if (key !== 'created_at' && key !== 'name') return;
    if (key === sort) {
      const nd = dir === 'desc' ? 'asc' : 'desc';
      setDir(nd);
      fetchTable(1, key, nd);
    } else {
      setSort(key);
      setDir('desc');
      fetchTable(1, key, 'desc');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
          ))}
        </div>
        <LoadingBlock label="Loading event store…" />
      </div>
    );
  }

  if (error && rows.length === 0 && chartEvents.length === 0) {
    return <ErrorBlock title="Analytics unavailable" message={error} onRetry={() => load()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ---------------------------------------------------------- header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[#F5F6F2] sm:text-2xl">
            Analytics <span className="text-[#E8C97C]">— first-party events</span>
          </h1>
          <p className="mt-1 text-xs text-[#A7AFBA] sm:text-sm">
            Real interactions recorded by the live BRANIFY site. No cookies, no cross-site tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            tabs={[{ id: '7', label: '7 days' }, { id: '30', label: '30 days' }]}
            active={range}
            onChange={(id) => setRange(id as '7' | '30')}
          />
          <Btn size="sm" variant="ghost" aria-label="Refresh analytics" loading={refreshing} onClick={() => load(true)}>
            {!refreshing && <RefreshCw size={14} />}
            Refresh
          </Btn>
        </div>
      </div>

      {/* ------------------------------------------------------ info card */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3.5">
        <Info size={16} className="mt-0.5 shrink-0 text-amber-300" />
        <p className="text-xs leading-relaxed text-amber-200">
          {provider === 'google_analytics' ? (
            <>
              <span className="font-bold uppercase tracking-wider">Google Analytics is configured in Settings.</span>{' '}
              The events below are BRANIFY's independent, privacy-friendly first-party event store — recorded directly by the live site.
            </>
          ) : (
            <>
              <span className="font-bold uppercase tracking-wider">Third-party analytics (Google Analytics, etc.): Not connected.</span>{' '}
              BRANIFY uses a privacy-friendly first-party event store — real events recorded by the live site.
            </>
          )}
        </p>
      </div>

      {/* ------------------------------------------------------ range stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={`Events · ${days}d`}
          value={inRange.length.toLocaleString()}
          sub={<span className="text-[10.5px] text-[#6B7280]">of {total.toLocaleString()} recorded total</span>}
          icon={<BarChart3 size={14} className="text-[#C9A45C]" />}
        />
        {funnel.map((f) => (
          <StatTile
            key={f.label}
            label={f.label}
            value={f.value.toLocaleString()}
            sub={<span className="text-[10.5px] text-[#6B7280]">last {days} days</span>}
            icon={<MousePointerClick size={14} className="text-[#C9A45C]" />}
          />
        ))}
      </div>

      {/* ------------------------------------------------------ charts row */}
      <div className="grid gap-4 xl:grid-cols-5">
        <Card
          className="xl:col-span-3"
          title={`Events over time`}
          subtitle={`Daily totals · last ${days} days`}
          bodyClass="pt-1"
        >
          <LineArea
            data={daily}
            height={210}
            formatValue={compact}
            emptyLabel="No events in this range yet — events appear as visitors use the site"
          />
        </Card>
        <Card
          className="xl:col-span-2"
          title="Top Events"
          subtitle={`Ranked by volume · last ${days} days`}
          bodyClass="pt-1"
        >
          <HBars
            items={topEvents}
            formatValue={compact}
            emptyLabel="No events in this range yet"
          />
        </Card>
      </div>

      {/* ------------------------------------------------------ events table */}
      <Card
        title="Recent Events"
        subtitle={total > 0 ? `Latest ${Math.min(TABLE_PAGE_SIZE, total)} of ${total.toLocaleString()} recorded events` : 'Nothing recorded yet'}
        bodyClass="pt-1"
      >
        <p className="mb-3 flex items-center gap-1.5 text-[10.5px] text-[#6B7280]">
          <Database size={11} />
          Charts aggregate the latest 200 events; the table pages through the full store server-side.
        </p>
        {error && rows.length === 0 ? (
          <ErrorBlock title="Could not load events" message={error} onRetry={() => fetchTable(page, sort, dir)} />
        ) : (
          <DataTable<EventRow>
            columns={columns}
            rows={rows}
            loading={tableLoading}
            total={total}
            page={page}
            pageSize={TABLE_PAGE_SIZE}
            onPageChange={(p) => fetchTable(p, sort, dir)}
            sort={sort}
            dir={dir}
            onSort={onSort}
            emptyTitle="No events recorded yet"
            emptyHint="Events start appearing once visitors interact with the live site — WhatsApp clicks, quote requests, tool launches, newsletter signups and more."
            mobileCard={(r) => (
              <div className="flex flex-col gap-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#F5F6F2]">
                    <Activity size={12} className="text-[#C9A45C]" /> {labelSingular(r.name)}
                  </span>
                  <span className="text-[10.5px] tabular-nums text-[#6B7280]">{timeAgo(r.created_at)}</span>
                </span>
                <span className="truncate font-mono text-[10.5px] text-[#A7AFBA]">{truncate(r.path || '/', 36)}</span>
              </div>
            )}
          />
        )}
      </Card>
    </div>
  );
};
