// =============================================================================
// BRANIFY ADMIN — compact per-page Search Console panel
// -----------------------------------------------------------------------------
// Used inside the Blog editor (Performance tab, per post) and the AI Tool
// editor (Search performance card). Shows REAL Google Search Console metrics
// for one site URL — or the honest "not connected" state with a connect CTA.
// Never renders simulated data.
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Globe, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  Badge, Btn, cx, EmptyState, LoadingBlock, Tabs, useToast,
} from '../ui';
import { StatTile } from '../ui/charts';
import {
  fmtInt, fmtPct, fmtPos, gscCall, GSC_ERROR_HINT, GscClientError,
  type GscRangeId, type GscStatus, type PageData, type InspectData,
} from '../lib/gsc';

const RANGES: Array<{ id: GscRangeId; label: string; days: number }> = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '28d', label: '28 days', days: 28 },
];

const NotConnected: React.FC<{ onOpen: () => void }> = ({ onOpen }) => (
  <div className="rounded-xl border border-[#E2E8F0] bg-white/[0.5] p-4">
    <p className="mb-2 flex items-center gap-2 text-[12px] font-bold text-[#111827]">
      <Globe size={14} className="text-[#8F6B2D]" /> Google Search Console
    </p>
    <p className="text-[11.5px] font-bold text-amber-700">Google Search Console is not connected.</p>
    <p className="mt-1.5 text-[11px] leading-relaxed text-[#475569]">
      Real clicks, impressions, CTR, average position and queries come only from a live GSC connection —
      none is configured yet, so those numbers cannot be shown (and will never be simulated here).
    </p>
    <Btn size="sm" variant="gold" className="mt-2.5" onClick={onOpen}>Connect Google Search Console</Btn>
  </div>
);

export const IndexCheck: React.FC<{ url: string }> = ({ url }) => {
  const { push } = useToast();
  const [result, setResult] = useState<InspectData | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      setResult(await gscCall<InspectData>('inspect', { url }));
    } catch (e) {
      push('error', e instanceof GscClientError ? e.message : 'Indexing check failed.');
    } finally {
      setLoading(false);
    }
  }, [url, push]);

  const tone = result?.verdict === 'indexed' ? 'green' : result?.verdict === 'not_indexed' ? 'red' : 'amber';
  const label = result?.verdict === 'indexed' ? 'Indexed' : result?.verdict === 'not_indexed' ? 'Not indexed' : 'Unknown';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Btn size="sm" variant="outline" icon={ShieldCheck} loading={loading} onClick={run}>
        {result ? 'Re-check indexing' : 'Check indexing'}
      </Btn>
      {result && (
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge tone={tone as 'green' | 'red' | 'amber'}>{label}</Badge>
          {result.coverageState && <span className="text-[10.5px] text-[#64748B]">{result.coverageState}</span>}
          {result.lastCrawlTime && (
            <span className="text-[10.5px] text-[#64748B]">· crawled {new Date(result.lastCrawlTime).toISOString().slice(0, 10)}</span>
          )}
        </span>
      )}
    </div>
  );
};

export const GscMiniPanel: React.FC<{ path: string; published: boolean; onOpenCenter: (deepLinkPath: string) => void }> = ({
  path, published, onOpenCenter,
}) => {
  const { push } = useToast();
  const [status, setStatus] = useState<GscStatus | null>(null);
  const [statusError, setStatusError] = useState<GscClientError | null>(null);
  const [range, setRange] = useState<GscRangeId>('28d');
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GscClientError | null>(null);

  useEffect(() => {
    let alive = true;
    gscCall<GscStatus>('status')
      .then((s) => { if (alive) setStatus(s); })
      .catch((e: unknown) => { if (alive) setStatusError(e instanceof GscClientError ? e : null); });
    return () => { alive = false; };
  }, []);

  const load = useCallback(async (days: number) => {
    setLoading(true);
    setError(null);
    try {
      setData(await gscCall<PageData>('page', { url: path, days }));
    } catch (e) {
      const ge = e instanceof GscClientError ? e : new GscClientError('upstream', 500, (e as Error).message);
      setError(ge);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    if (status?.connected) void load(RANGES.find((r) => r.id === range)?.days || 28);
  }, [status?.connected, range, load]);

  if (statusError) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white/[0.5] p-4">
        <p className="text-[11.5px] font-bold text-amber-700">Search Console status unavailable.</p>
        <p className="mt-1 text-[11px] text-[#475569]">{statusError.message || GSC_ERROR_HINT[statusError.code]}</p>
      </div>
    );
  }
  if (!status) return <LoadingBlock label="Checking Search Console connection…" />;
  if (!status.connected) return <NotConnected onOpen={() => onOpenCenter(path)} />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[12px] font-bold text-[#111827]">
          <Globe size={14} className="text-[#8F6B2D]" /> Google Search performance
          <span className="font-mono text-[10.5px] font-semibold text-[#64748B]">{path}</span>
        </p>
        <div className="flex items-center gap-2">
          <Tabs tabs={RANGES.map((r) => ({ id: r.id, label: r.label }))} active={range} onChange={(id) => setRange(id as GscRangeId)} />
          <Btn size="sm" variant="ghost" aria-label="Refresh Search Console data" onClick={() => void load(RANGES.find((r) => r.id === range)?.days || 28)}>
            <RefreshCw size={13} />
          </Btn>
        </div>
      </div>

      {!published ? (
        <p className="text-[11px] text-[#475569]">Publish this page to collect search impressions once Google crawls it.</p>
      ) : loading && !data ? (
        <LoadingBlock label="Loading Google Search data…" />
      ) : error ? (
        <p className="text-[11px] text-red-600">{error.message || GSC_ERROR_HINT[error.code]}</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatTile label="Clicks" value={fmtInt(data.totals.clicks)} />
            <StatTile label="Impressions" value={fmtInt(data.totals.impressions)} />
            <StatTile label="CTR" value={fmtPct(data.totals.ctr)} />
            <StatTile label="Avg position" value={fmtPos(data.totals.position)} />
          </div>
          <p className="text-[10.5px] text-[#64748B]">
            Real Google data window: {data.startDate} → {data.endDate} (final data lags ~2 days).
          </p>
          {data.totals.clicks === 0 && data.totals.impressions === 0 && (
            <EmptyState icon={Globe} title="No search data for this page yet" hint="Google records impressions once the page is crawled and served in search." />
          )}
          {data.queries.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#475569]">Top queries</p>
              <ul className="flex flex-col gap-1">
                {data.queries.slice(0, 5).map((q) => (
                  <li key={q.key} className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="min-w-0 flex-1 truncate text-[#111827]" title={q.key}>{q.key}</span>
                    <span className="shrink-0 tabular-nums text-[#475569]">
                      <strong className="text-[#111827]">{fmtInt(q.clicks)}</strong> clicks · {fmtInt(q.impressions)} impr · {fmtPct(q.ctr)} · pos {fmtPos(q.position)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className={cx('flex flex-wrap items-center gap-2')}>
            <IndexCheck url={path} />
            <a
              href={`https://branify.store${path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5B5FEF] hover:underline"
            >
              Open page <ExternalLink size={11} />
            </a>
          </div>
        </>
      ) : null}
    </div>
  );
};
