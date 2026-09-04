// =============================================================================
// BRANIFY ADMIN — 404 MONITOR (/admin/seo/404)
// -----------------------------------------------------------------------------
// Reads the real not_found_log (populated live by the public app whenever a
// visitor hits an unknown SPA route) and turns hits into redirect actions.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Eraser, FileQuestion, Info, Trash2 } from 'lucide-react';
import type { AdminPageProps } from '../lib/auth';
import { clearNotFound, listNotFound } from '../lib/backend';
import type { NotFoundRow } from '../lib/types';
import { Btn, Card, ConfirmDialog, EmptyState, ErrorBlock, LoadingBlock, cx, useToast } from '../ui';
import { StatTile } from '../ui/charts';
import { DataTable } from '../ui/DataTable';
import type { Column } from '../ui/DataTable';
import { fmtDateTime, timeAgo, truncate } from '../lib/format';

export const NotFoundMonitor: React.FC<AdminPageProps> = ({ navigate, refreshBadges }) => {
  const { push } = useToast();
  const [rows, setRows] = useState<NotFoundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [confirmOne, setConfirmOne] = useState<NotFoundRow | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listNotFound());
    } catch (e) {
      setError({ title: 'Could not load the 404 log', message: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRows(); }, [fetchRows]);

  const totalHits = useMemo(() => rows.reduce((s, r) => s + (r.hits || 0), 0), [rows]);
  const mostHit = useMemo(() => rows.slice().sort((a, b) => (b.hits || 0) - (a.hits || 0))[0], [rows]);

  const clearOne = async () => {
    if (!confirmOne) return;
    setBusy(true);
    try {
      await clearNotFound(confirmOne.path);
      push('success', `Cleared ${confirmOne.path} from the 404 log`);
      setConfirmOne(null);
      refreshBadges();
      await fetchRows();
    } catch (e) {
      push('error', `Clear failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const clearEverything = async () => {
    setBusy(true);
    try {
      await clearNotFound();
      push('success', '404 log cleared');
      setConfirmAll(false);
      refreshBadges();
      await fetchRows();
    } catch (e) {
      push('error', `Clear failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<NotFoundRow & { id: string }>[] = [
    { key: 'path', label: 'Path', render: (r) => <span className="font-mono text-xs text-[#E8C97C]" title={r.path}>{truncate(r.path, 44)}</span> },
    { key: 'hits', label: 'Hits', render: (r) => <span className="font-extrabold tabular-nums text-[#F5F6F2]">{r.hits}</span> },
    { key: 'first_seen', label: 'First seen', hideOnMobile: true, render: (r) => <span className="text-xs text-[#A7AFBA]">{fmtDateTime(r.first_seen)}</span> },
    {
      key: 'last_seen',
      label: 'Last seen',
      render: (r) => (
        <span className="text-xs text-[#A7AFBA]" title={fmtDateTime(r.last_seen)}>
          {timeAgo(r.last_seen)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <span className="flex flex-wrap items-center justify-end gap-1.5">
          <Btn
            size="sm"
            variant="outline"
            icon={ArrowLeftRight}
            onClick={() => navigate(`/seo/redirects?new=1&source=${encodeURIComponent(r.path)}`)}
          >
            Create redirect
          </Btn>
          <Btn size="sm" variant="ghost" icon={Eraser} onClick={() => setConfirmOne(r)} aria-label={`Clear ${r.path} from log`}>
            Clear
          </Btn>
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[#F5F6F2]">404 Monitor</h1>
          <p className="text-xs text-[#A7AFBA]">Unknown routes visitors actually hit — turn them into redirects</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="outline" size="sm" onClick={() => void fetchRows()} loading={loading}>Refresh</Btn>
          {rows.length > 0 && (
            <Btn variant="danger" size="sm" icon={Trash2} onClick={() => setConfirmAll(true)}>Clear all</Btn>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Tracked paths" value={rows.length} sub="distinct 404 URLs" icon={<FileQuestion size={15} className="text-[#C9A45C]" />} />
        <StatTile label="Total hits" value={totalHits} sub="all recorded visits" />
        <StatTile
          label="Most-hit path"
          value={<span className="font-mono text-sm">{mostHit ? truncate(mostHit.path, 22) : '—'}</span>}
          sub={mostHit ? `${mostHit.hits} hits` : 'no data yet'}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <Card bodyClass="px-0 pb-0 sm:px-0">
        {error ? (
          <div className="p-5"><ErrorBlock title={error.title} message={error.message} onRetry={() => void fetchRows()} /></div>
        ) : (
          <div className="px-4 py-4 sm:px-5">
            <DataTable<NotFoundRow & { id: string }>
              columns={columns}
              rows={rows.map((r) => ({ ...r, id: r.path }))}
              loading={loading}
              total={rows.length}
              page={1}
              pageSize={Math.max(20, rows.length)}
              onPageChange={() => {}}
              emptyTitle="No 404s logged — healthy site."
              emptyHint="When a visitor opens a URL the app does not know, it is recorded here in real time with hit counts."
            />
            {!loading && rows.length === 0 && (
              <div className="pb-4">
                <EmptyState
                  icon={FileQuestion}
                  title="Nothing to fix right now"
                  hint="Try opening an unknown URL on the public site (e.g. /this-page-does-not-exist) — it will appear here within seconds."
                />
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="flex items-start gap-2 rounded-xl border border-[#C9A45C]/25 bg-[#C9A45C]/[0.06] px-3.5 py-3 text-[11px] leading-relaxed text-[#E8C97C]">
        <Info size={13} className="mt-0.5 shrink-0" />
        <p>
          <span className="font-bold uppercase tracking-wider">How tracking works. </span>
          The public BRANIFY app records every unknown SPA route in real time (with a per-path hit counter) through the
          same admin data layer that powers this dashboard. Clearing a path removes it from the log only — it will be
          re-recorded if visitors hit it again, so create a redirect for recurring paths.
        </p>
      </div>

      {rows.length > 0 && (
        <p className={cx('text-[11px] text-[#566072]')}>
          Tip: paths with many hits should become 301 redirects to the closest matching page — you keep the visitors and the SEO value.
        </p>
      )}
      {rows.length === 0 && !loading && (
        <p className="text-[11px] text-[#566072]">Zero tracked paths — the log is empty and no action is needed.</p>
      )}

      <ConfirmDialog
        open={Boolean(confirmOne)}
        onClose={() => setConfirmOne(null)}
        onConfirm={() => void clearOne()}
        title="Clear this path?"
        message={confirmOne ? <>Remove <span className="font-mono text-[#E8C97C]">{confirmOne.path}</span> ({confirmOne.hits} hits) from the 404 log? If visitors hit it again it will be tracked again.</> : ''}
        confirmLabel="Clear path"
        loading={busy}
      />
      <ConfirmDialog
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        onConfirm={() => void clearEverything()}
        title="Clear the entire 404 log?"
        message="This removes all tracked 404 paths and hit counters. Consider creating redirects for the most-hit paths first."
        confirmLabel="Clear all"
        danger
        loading={busy}
      />
    </div>
  );
};
