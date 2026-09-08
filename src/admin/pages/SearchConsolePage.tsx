// =============================================================================
// BRANIFY ADMIN — Google Search Console (/admin/seo/search-console)
// -----------------------------------------------------------------------------
// REAL Google Search performance inside BRANIFY Admin, powered by the
// serverless integration (api/gsc.ts — server-side OAuth, encrypted token
// vault, admin-gated). Shows only data returned by Google: clicks,
// impressions, CTR, average position, top queries, top pages, trend and
// URL indexing status (where the API supports it).
//
// If Search Console is not connected, this page shows the connect CTA —
// never sample data. OAuth client credentials + tokens live server-side
// (AES-256-GCM encrypted in the settings vault); the browser only ever
// receives aggregated metrics.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2, Copy, ExternalLink, Eye, Globe, KeyRound, Link2Off, MousePointerClick,
  RefreshCw, Search, ShieldCheck, TrendingUp,
} from 'lucide-react';
import type { AdminPageProps } from '../lib/auth';
import { listRows } from '../lib/backend';
import type { AiToolRow, BlogRow, PortfolioRow, ServiceRow, ToolRow } from '../lib/types';
import {
  Badge, Btn, Card, ConfirmDialog, EmptyState, ErrorBlock, Field, Input, LoadingBlock,
  Select, cx, useToast,
} from '../ui';
import { LineArea, StatTile } from '../ui/charts';
import { DataTable } from '../ui/DataTable';
import type { Column } from '../ui/DataTable';
import { buildPageInventory, PAGE_KIND_LABEL } from './seoShared';
import type { ContentRowLike, PageMeta } from './seoShared';
import { IndexCheck } from './GscMiniPanel';
import {
  fmtInt, fmtPct, fmtPos, gscCall, GSC_ERROR_HINT, GSC_RANGES, propertyLabel, GscClientError,
  type GscMetric, type GscRangeId, type GscStatus,
  type OverviewData, type PageData,
} from '../lib/gsc';

/** DataTable rows need a stable id — key it by the query/page string. */
type MetricRow = GscMetric & { id: string };
const withIds = (rows: GscMetric[]): MetricRow[] => rows.map((r, i) => ({ ...r, id: r.key || `#${i}` }));

const compact = (v: number): string => (v >= 10000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)));

// =====================================================================
// SETUP CARD — one-time Google OAuth client configuration (server-side)
// =====================================================================
const SetupCard: React.FC<{ status: GscStatus; onSaved: () => void; compactMode?: boolean }> = ({ status, onSaved, compactMode }) => {
  const { push } = useToast();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await gscCall('config.set', { clientId, clientSecret });
      push('success', 'Google OAuth client stored (encrypted, server-side).');
      setClientId('');
      setClientSecret('');
      onSaved();
    } catch (e) {
      push('error', e instanceof GscClientError ? e.message : 'Saving the OAuth client failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title={compactMode ? 'Update Google OAuth client' : 'One-time setup — Google OAuth client'}
      subtitle="Google requires an OAuth client owned by the BRANIFY owner to read Search Console. Credentials are stored encrypted server-side and are never returned to the browser."
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-xs leading-relaxed text-[#475569]">
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#111827]">
            <KeyRound size={12} className="text-[#8F6B2D]" /> Steps
          </p>
          <ol className="ml-4 list-decimal space-y-1">
            <li>
              Open <a className="font-semibold text-[#5B5FEF] hover:underline" href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Console → APIs & Services → Credentials</a> and create an <strong>OAuth client ID</strong> (type: Web application). Enable the <strong>Search Console API</strong> in the same project.
            </li>
            <li>
              Add this <strong>Authorized redirect URI</strong> exactly:
              <span className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md border border-[#E2E8F0] bg-white px-2 py-1 font-mono text-[11px] text-[#111827]">{status.redirectUri}</code>
                <Btn
                  size="sm"
                  variant="ghost"
                  aria-label="Copy redirect URI"
                  onClick={() => {
                    navigator.clipboard?.writeText(status.redirectUri).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
                  }}
                >
                  {copied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </Btn>
              </span>
            </li>
            <li>Paste the Client ID and Client Secret below — they are saved encrypted on the server, never in the browser.</li>
          </ol>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="OAuth Client ID">
            <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="1234567890-abc.apps.googleusercontent.com" className="font-mono text-xs" autoComplete="off" />
          </Field>
          <Field label="OAuth Client Secret" hint="Write-only: stored encrypted, never displayed again.">
            <Input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="GOCSPX-…" className="font-mono text-xs" autoComplete="new-password" />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="gold" onClick={save} loading={saving} disabled={!clientId.trim() || !clientSecret.trim()}>
            Save OAuth client securely
          </Btn>
          {status.configured && <Badge tone="green">Client configured ({status.clientId})</Badge>}
        </div>
      </div>
    </Card>
  );
};

// =====================================================================
// PAGE
// =====================================================================
export const SearchConsolePage: React.FC<AdminPageProps> = ({ query }) => {
  const { push } = useToast();
  const [status, setStatus] = useState<GscStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<GscClientError | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [updatingClient, setUpdatingClient] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const [range, setRange] = useState<GscRangeId>('28d');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [queries, setQueries] = useState<MetricRow[]>([]);
  const [pages, setPages] = useState<MetricRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<GscClientError | null>(null);
  const [trendMetric, setTrendMetric] = useState<'clicks' | 'impressions'>('clicks');

  const [pageUrl, setPageUrl] = useState('');
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<GscClientError | null>(null);
  const [inventory, setInventory] = useState<PageMeta[]>([]);

  const completingRef = useRef(false);
  const deepLinkRef = useRef<string | null>(null);

  // ------------------------------------------------------------- status load
  const loadStatus = useCallback(() => {
    setStatusLoading(true);
    setStatusError(null);
    gscCall<GscStatus>('status')
      .then(setStatus)
      .catch((e: unknown) => setStatusError(e instanceof GscClientError ? e : new GscClientError('upstream', 500, (e as Error).message)))
      .finally(() => setStatusLoading(false));
  }, []);
  useEffect(() => { loadStatus(); }, [loadStatus]);

  // ------------------------------------------------- OAuth redirect return (?gsc_code=…)
  const cleanUrl = useCallback(() => {
    window.history.replaceState({}, '', '/admin/seo/search-console');
    window.dispatchEvent(new Event('branify:admin-nav'));
  }, []);

  useEffect(() => {
    const code = query.get('gsc_code');
    const state = query.get('gsc_state');
    const gscError = query.get('gsc_error');
    if (gscError && !completingRef.current) {
      completingRef.current = true;
      push('error', gscError === 'access_denied'
        ? 'Google authorization was cancelled or denied — no changes were made.'
        : `Google authorization failed: ${gscError}`);
      cleanUrl();
      return;
    }
    if (code && state && !completingRef.current) {
      completingRef.current = true;
      (async () => {
        try {
          await gscCall('connect.complete', { code, state });
          push('success', 'Google Search Console connected.');
          loadStatus();
        } catch (e) {
          push('error', e instanceof GscClientError ? e.message : 'Completing the connection failed.');
          loadStatus();
        } finally {
          cleanUrl();
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // ------------------------------------------------------------- site inventory (URL picker)
  useEffect(() => {
    if (!status?.connected || inventory.length > 0) return;
    let alive = true;
    (async () => {
      try {
        const [blog, tools, aiTools, services, portfolio] = await Promise.all([
          listRows<BlogRow>('blog_posts', { page: 1, pageSize: 200 }),
          listRows<ToolRow>('tools', { page: 1, pageSize: 200 }),
          listRows<AiToolRow>('ai_tools', { page: 1, pageSize: 200 }),
          listRows<ServiceRow>('services', { page: 1, pageSize: 200 }),
          listRows<PortfolioRow>('portfolio_projects', { page: 1, pageSize: 200 }),
        ]);
        if (!alive) return;
        const meta = buildPageInventory({
          blog: blog.rows as unknown as ContentRowLike[],
          tools: tools.rows as unknown as ContentRowLike[],
          aiTools: aiTools.rows as unknown as ContentRowLike[],
          services: services.rows as unknown as ContentRowLike[],
          portfolio: portfolio.rows as unknown as ContentRowLike[],
        });
        setInventory(meta);
      } catch { /* picker stays free-text only */ }
    })();
    return () => { alive = false; };
  }, [status?.connected, inventory.length]);

  // ------------------------------------------------------------- data loaders
  const rangeDays = useMemo(() => GSC_RANGES.find((r) => r.id === range)?.days || 28, [range]);

  const loadOverview = useCallback(async (days: number) => {
    const [ov, qs, ps] = await Promise.all([
      gscCall<OverviewData>('overview', { days }),
      gscCall<{ rows: GscMetric[] }>('queries', { days, limit: 20 }),
      gscCall<{ rows: GscMetric[] }>('pages', { days, limit: 20 }),
    ]);
    setOverview(ov);
    setQueries(withIds(qs.rows));
    setPages(withIds(ps.rows));
  }, []);

  useEffect(() => {
    if (!status?.connected) return;
    let alive = true;
    setDataLoading(true);
    setDataError(null);
    loadOverview(rangeDays)
      .catch((e: unknown) => {
        if (!alive) return;
        const ge = e instanceof GscClientError ? e : new GscClientError('upstream', 500, (e as Error).message);
        setDataError(ge);
        setOverview(null);
      })
      .finally(() => { if (alive) setDataLoading(false); });
    return () => { alive = false; };
  }, [status?.connected, rangeDays, loadOverview]);

  const runPageAnalysis = useCallback(async (rawUrl: string, days: number) => {
    setPageLoading(true);
    setPageError(null);
    try {
      const d = await gscCall<PageData>('page', { url: rawUrl, days });
      setPageData(d);
      setPageUrl(d.url.replace(/^https:\/\/branify\.store/, ''));
    } catch (e) {
      const ge = e instanceof GscClientError ? e : new GscClientError('upstream', 500, (e as Error).message);
      setPageError(ge);
      setPageData(null);
    } finally {
      setPageLoading(false);
    }
  }, []);

  // deep link ?page=/blog/x → analyze that page once connected
  useEffect(() => {
    const target = query.get('page');
    if (target) deepLinkRef.current = target;
  }, [query]);
  useEffect(() => {
    if (status?.connected && deepLinkRef.current) {
      const t = deepLinkRef.current;
      deepLinkRef.current = null;
      void runPageAnalysis(t, rangeDays);
    }
  }, [status?.connected, rangeDays, runPageAnalysis]);

  // ------------------------------------------------------------- actions
  const connect = async () => {
    setConnecting(true);
    try {
      const { authUrl } = await gscCall<{ authUrl: string }>('connect.start', { back: window.location.origin });
      window.location.href = authUrl; // → Google consent screen
    } catch (e) {
      push('error', e instanceof GscClientError ? e.message : 'Starting the Google connection failed.');
      setConnecting(false);
    }
  };

  const changeProperty = async (property: string) => {
    try {
      await gscCall('property.set', { property });
      push('success', `Property switched to ${propertyLabel(property)}`);
      loadStatus();
    } catch (e) {
      push('error', e instanceof GscClientError ? e.message : 'Switching property failed.');
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      await gscCall('disconnect', {});
      push('success', 'Search Console disconnected. Tokens were removed from the vault.');
      setOverview(null);
      setQueries([]);
      setPages([]);
      setPageData(null);
      loadStatus();
    } catch (e) {
      push('error', e instanceof GscClientError ? e.message : 'Disconnecting failed.');
    } finally {
      setDisconnecting(false);
      setConfirmDisconnect(false);
    }
  };

  // ------------------------------------------------------------- table columns
  const metricColumns = (keyLabel: string, keyIcon?: boolean): Column<MetricRow>[] => [
    {
      key: 'key',
      label: keyLabel,
      render: (r) => (
        <span className="flex min-w-0 items-center gap-1.5">
          {keyIcon && <ExternalLink size={11} className="shrink-0 text-[#64748B]" />}
          <span className="truncate font-mono text-[11.5px] text-[#111827]" title={r.key}>{r.key || '(root)'}</span>
        </span>
      ),
    },
    { key: 'clicks', label: 'Clicks', sortable: true, render: (r) => <span className="tabular-nums font-bold text-[#111827]">{fmtInt(r.clicks)}</span> },
    { key: 'impressions', label: 'Impressions', hideOnMobile: true, render: (r) => <span className="tabular-nums text-[#475569]">{fmtInt(r.impressions)}</span> },
    { key: 'ctr', label: 'CTR', render: (r) => <span className="tabular-nums text-[#475569]">{fmtPct(r.ctr)}</span> },
    { key: 'position', label: 'Position', render: (r) => <span className="tabular-nums text-[#475569]">{fmtPos(r.position)}</span> },
  ];

  const pageCard = (r: GscMetric) => (
    <div className="flex flex-col gap-1">
      <span className="truncate font-mono text-[11px] text-[#111827]">{r.key}</span>
      <span className="text-[10.5px] text-[#475569]">{fmtInt(r.clicks)} clicks · {fmtInt(r.impressions)} impr · {fmtPct(r.ctr)} · pos {fmtPos(r.position)}</span>
    </div>
  );

  // ------------------------------------------------------------- derived
  const trendData = useMemo(() => {
    if (!overview) return [];
    return overview.trend.map((t) => ({ label: t.date, value: trendMetric === 'clicks' ? t.clicks : t.impressions }));
  }, [overview, trendMetric]);

  const quickPicks = useMemo(() => {
    const kinds = ['blog', 'ai', 'service', 'tool'];
    const picks: PageMeta[] = [];
    for (const k of kinds) {
      const found = inventory.find((p) => (p.kind as string).startsWith(k));
      if (found) picks.push(found);
    }
    return picks;
  }, [inventory]);

  const connectionLabel = status?.googleEmail || 'Google account';

  // ================================================================ render
  if (statusLoading) return <LoadingBlock label="Checking Search Console connection…" />;

  if (statusError) {
    return (
      <ErrorBlock
        title="Search Console service unavailable"
        message={statusError.message || GSC_ERROR_HINT[statusError.code]}
        onRetry={loadStatus}
      />
    );
  }
  if (!status) return null;

  // ---------- header (shared across states)
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-xl font-extrabold text-[#111827]">
          Search Console <span className="text-[#8F6B2D]">— real Google search data</span>
        </h1>
        <p className="text-xs text-[#475569]">
          {status.connected && status.property
            ? <>Property <span className="font-mono">{propertyLabel(status.property)}</span> · {connectionLabel} · clicks, impressions, CTR, position, queries, pages & indexing status</>
            : 'Clicks, impressions, CTR, average position, top queries and indexing status — straight from Google.'}
        </p>
      </div>
      {status.connected && (
        <div className="flex items-center gap-2">
          <Btn variant="outline" size="sm" icon={RefreshCw} onClick={loadStatus} loading={statusLoading}>Refresh status</Btn>
          <Btn variant="ghost" size="sm" icon={Link2Off} onClick={() => setConfirmDisconnect(true)}>Disconnect</Btn>
        </div>
      )}
    </div>
  );

  // ---------- not configured → setup
  if (!status.configured) {
    return (
      <div className="flex flex-col gap-5">
        {header}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3.5">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-700">
            <span className="font-bold uppercase tracking-wider">Security model.</span> The OAuth client secret and all
            Google tokens are stored encrypted (AES-256-GCM) on the server and never sent to the browser. Every data
            request requires an authenticated BRANIFY admin session. No sample or simulated numbers are ever displayed.
          </p>
        </div>
        <SetupCard status={status} onSaved={loadStatus} />
      </div>
    );
  }

  // ---------- configured but not connected (or needs reconnect)
  if (!status.connected) {
    return (
      <div className="flex flex-col gap-5">
        {header}
        {status.needsReconnect && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3.5">
            <p className="text-xs font-bold text-amber-700">The stored Google token was revoked or expired. Reconnect to restore data.</p>
            <Btn size="sm" variant="gold" onClick={connect} loading={connecting}>Reconnect Google Search Console</Btn>
          </div>
        )}
        <Card>
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <Globe size={30} className="text-[#8F6B2D]/70" />
            <p className="font-display text-lg font-bold text-[#111827]">Google Search Console is not connected.</p>
            <p className="max-w-xl text-xs leading-relaxed text-[#475569]">
              Connect the verified property for <span className="font-mono">https://branify.store/</span> to show real clicks,
              impressions, CTR, average position, top queries, top pages and indexing status. Nothing is simulated — until the
              connection is live, these numbers cannot exist.
            </p>
            <Btn variant="gold" size="md" onClick={connect} loading={connecting}>Connect Google Search Console</Btn>
            <p className="text-[10.5px] text-[#64748B]">
              You will sign in with the Google account that owns the Search Console property. Read-only access.
            </p>
          </div>
        </Card>
        {updatingClient ? (
          <SetupCard status={status} onSaved={loadStatus} compactMode />
        ) : (
          <button className="self-start text-xs font-bold text-[#5B5FEF] hover:underline" onClick={() => setUpdatingClient(true)}>
            Update the stored OAuth client →
          </button>
        )}
      </div>
    );
  }

  // ---------- connected → full dashboard
  const t = overview?.totals;
  return (
    <div className="flex flex-col gap-5">
      {header}

      {/* reconnect-required banner over the dashboard */}
      {dataError?.code === 'reconnect_required' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3.5">
          <p className="text-xs font-bold text-amber-700">{dataError.message}</p>
          <Btn size="sm" variant="gold" onClick={connect} loading={connecting}>Reconnect</Btn>
        </div>
      )}

      {/* property selector */}
      {status.sites.length > 1 && (
        <Card title="Search Console property" subtitle="Properties the connected Google account can access">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={status.property || ''}
              onChange={(e) => void changeProperty(e.target.value)}
              aria-label="Search Console property"
              className="max-w-md font-mono text-xs"
            >
              {status.sites.map((s) => (
                <option key={s.siteUrl} value={s.siteUrl}>{propertyLabel(s.siteUrl)} ({s.permissionLevel})</option>
              ))}
            </Select>
            {status.property && !status.property.includes('branify.store') && (
              <Badge tone="amber">Heads-up: selected property is not branify.store</Badge>
            )}
          </div>
        </Card>
      )}

      {/* date ranges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {GSC_RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              aria-pressed={range === r.id}
              className={cx(
                'rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors',
                range === r.id
                  ? 'border-[#8F6B2D] bg-[#8F6B2D] text-white'
                  : 'border-[#E2E8F0] bg-white text-[#475569] hover:border-[#C9A45C]/60 hover:text-[#8F6B2D]',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Btn variant="outline" size="sm" icon={RefreshCw} loading={dataLoading} onClick={() => void loadOverview(rangeDays)}>
          Refresh data
        </Btn>
      </div>

      {/* KPI tiles */}
      {dataLoading && !overview ? (
        <LoadingBlock label="Querying Google Search Analytics…" />
      ) : dataError && !overview ? (
        <ErrorBlock
          title="Could not load Search Console data"
          message={dataError.message || GSC_ERROR_HINT[dataError.code] || 'Retry in a moment.'}
          onRetry={() => void loadOverview(rangeDays)}
        />
      ) : t ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Clicks" value={fmtInt(t.clicks)} sub={`${overview?.startDate} → ${overview?.endDate}`} icon={<MousePointerClick size={15} className="text-[#8F6B2D]" />} />
            <StatTile label="Impressions" value={fmtInt(t.impressions)} sub="search results served" icon={<Eye size={15} className="text-[#8F6B2D]" />} />
            <StatTile label="CTR" value={fmtPct(t.ctr)} sub="clicks ÷ impressions" icon={<TrendingUp size={15} className="text-[#8F6B2D]" />} />
            <StatTile label="Avg position" value={fmtPos(t.position)} sub="lower is better" icon={<Search size={15} className="text-[#8F6B2D]" />} />
          </div>
          {t.clicks === 0 && t.impressions === 0 && (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white/[0.4] px-4 py-3 text-xs text-[#475569]">
              Real totals from Google for this window are zero — the property has no recorded search activity yet. Data appears once Google serves the site in search results (final data lags ~2 days).
            </div>
          )}

          {/* trend */}
          <Card
            title="Search performance trend"
            subtitle={`Daily ${trendMetric} · ${overview?.startDate} → ${overview?.endDate}`}
            bodyClass="pt-1"
            actions={
              <div className="flex items-center gap-1.5">
                {(['clicks', 'impressions'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTrendMetric(m)}
                    aria-pressed={trendMetric === m}
                    className={cx(
                      'rounded-full border px-3 py-1 text-[11px] font-bold capitalize transition-colors',
                      trendMetric === m ? 'border-[#8F6B2D] bg-[#8F6B2D] text-white' : 'border-[#E2E8F0] bg-white text-[#475569]',
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            }
          >
            <LineArea
              data={trendData}
              height={220}
              formatValue={compact}
              emptyLabel={`No ${trendMetric} recorded in this window yet`}
            />
          </Card>
        </>
      ) : null}

      {/* top queries + top pages */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Top search queries" subtitle={`What people searched · ${GSC_RANGES.find((r) => r.id === range)?.label}`} bodyClass="pt-1">
          {dataError && queries.length === 0 ? (
            <p className="text-xs text-red-600">{GSC_ERROR_HINT[dataError.code]}</p>
          ) : (
            <DataTable<MetricRow>
              columns={metricColumns('Query')}
              rows={queries}
              total={queries.length}
              page={1}
              pageSize={20}
              onPageChange={() => {}}
              loading={dataLoading}
              dense
              emptyTitle="No queries recorded"
              emptyHint="Google lists queries once the site earns impressions in this window."
              mobileCard={(r) => (
                <div className="flex flex-col gap-0.5">
                  <span className="truncate font-mono text-[11px] text-[#111827]">{r.key}</span>
                  <span className="text-[10.5px] text-[#475569]">{fmtInt(r.clicks)} clicks · {fmtInt(r.impressions)} impr · {fmtPct(r.ctr)} · pos {fmtPos(r.position)}</span>
                </div>
              )}
            />
          )}
        </Card>
        <Card title="Top pages" subtitle="Click a page to analyze it below" bodyClass="pt-1">
          {dataError && pages.length === 0 ? (
            <p className="text-xs text-red-600">{GSC_ERROR_HINT[dataError.code]}</p>
          ) : (
            <DataTable<MetricRow>
              columns={metricColumns('Page', true)}
              rows={pages}
              total={pages.length}
              page={1}
              pageSize={20}
              onPageChange={() => {}}
              onRowClick={(r) => { setPageUrl(r.key.replace(/^https:\/\/branify\.store/, '')); void runPageAnalysis(r.key, rangeDays); }}
              loading={dataLoading}
              dense
              emptyTitle="No pages recorded"
              emptyHint="Pages appear once Google serves them in search results."
              mobileCard={pageCard}
            />
          )}
        </Card>
      </div>

      {/* page inspector */}
      <Card
        title="Page-level SEO performance"
        subtitle="Pick any BRANIFY URL and see its real Search Console data + indexing status"
        bodyClass="pt-1"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
            <Field label="Site URL" className="flex-1">
              <Input
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                placeholder="/blog/business-website-cost-2026"
                className="font-mono text-xs"
                onKeyDown={(e) => { if (e.key === 'Enter' && pageUrl.trim()) void runPageAnalysis(pageUrl, rangeDays); }}
              />
            </Field>
            <Btn variant="gold" onClick={() => void runPageAnalysis(pageUrl, rangeDays)} loading={pageLoading} disabled={!pageUrl.trim()}>
              Analyze
            </Btn>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row">
            {inventory.length > 0 && (
              <Select
                value=""
                aria-label="Pick a site URL from the inventory"
                className="max-w-md text-xs"
                onChange={(e) => { if (e.target.value) { setPageUrl(e.target.value); void runPageAnalysis(e.target.value, rangeDays); } }}
              >
                <option value="">Pick from live site inventory ({inventory.length} URLs)…</option>
                {inventory.map((p) => (
                  <option key={p.path} value={p.path}>{p.path} — {PAGE_KIND_LABEL[p.kind]}</option>
                ))}
              </Select>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {quickPicks.map((p) => (
                <button
                  key={p.path}
                  className="rounded-full border border-[#E2E8F0] bg-white px-2.5 py-0.5 font-mono text-[10.5px] text-[#475569] transition-colors hover:border-[#C9A45C]/60 hover:text-[#8F6B2D]"
                  onClick={() => { setPageUrl(p.path); void runPageAnalysis(p.path, rangeDays); }}
                >
                  {p.path}
                </button>
              ))}
            </div>
          </div>

          {pageLoading && <LoadingBlock label="Querying Google for this URL…" />}
          {pageError && (
            <p className="text-xs text-red-600">{pageError.message || GSC_ERROR_HINT[pageError.code]}</p>
          )}
          {pageData && !pageLoading && (
            <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs font-bold text-[#111827]">{pageData.url}</p>
                <a
                  href={pageData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5B5FEF] hover:underline"
                >
                  Open page <ExternalLink size={11} />
                </a>
              </div>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <StatTile label="Clicks" value={fmtInt(pageData.totals.clicks)} />
                <StatTile label="Impressions" value={fmtInt(pageData.totals.impressions)} />
                <StatTile label="CTR" value={fmtPct(pageData.totals.ctr)} />
                <StatTile label="Avg position" value={fmtPos(pageData.totals.position)} />
              </div>
              <p className="text-[10.5px] text-[#64748B]">
                Real Google data window: {pageData.startDate} → {pageData.endDate} (final data lags ~2 days).
              </p>
              {pageData.totals.clicks === 0 && pageData.totals.impressions === 0 ? (
                <EmptyState icon={Globe} title="No search data for this URL yet" hint="Google records data once the page is crawled and served in search." />
              ) : (
                pageData.queries.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#475569]">Top queries for this page</p>
                    <ul className="flex flex-col gap-1">
                      {pageData.queries.map((q) => (
                        <li key={q.key} className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="min-w-0 flex-1 truncate text-[#111827]" title={q.key}>{q.key}</span>
                          <span className="shrink-0 tabular-nums text-[#475569]">
                            <strong className="text-[#111827]">{fmtInt(q.clicks)}</strong> · {fmtInt(q.impressions)} impr · {fmtPct(q.ctr)} · pos {fmtPos(q.position)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
              <div className="border-t border-[#E2E8F0] pt-3">
                <IndexCheck url={pageData.url} />
              </div>
            </div>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        onConfirm={disconnect}
        title="Disconnect Google Search Console?"
        message="The stored Google tokens are deleted from the server vault. Admin data on BRANIFY is untouched — you can reconnect at any time."
        confirmLabel="Disconnect"
        danger
        loading={disconnecting}
      />
    </div>
  );
};
