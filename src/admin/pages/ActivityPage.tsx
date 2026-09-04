// =============================================================================
// BRANIFY ADMIN — ACTIVITY LOG (/admin/activity)
// -----------------------------------------------------------------------------
// Real activity trail from activity_log: humanized actions, category badges,
// target info, meta summaries, client-side group filter + search + pagination.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity as ActivityIcon, RefreshCw, Search } from 'lucide-react';
import type { AdminPageProps } from '../lib/auth';
import { listActivity } from '../lib/backend';
import type { ActivityRow } from '../lib/types';
import { Badge, Btn, Card, ErrorBlock, LoadingBlock, Select, cx, useToast } from '../ui';
import type { BadgeTone } from '../ui';
import { DataTable } from '../ui/DataTable';
import type { Column } from '../ui/DataTable';
import { fmtDateTime, timeAgo, truncate } from '../lib/format';

const PAGE_SIZE = 20;

const CONTENT_PREFIXES = ['services', 'portfolio_projects', 'tools', 'ai_tools', 'products', 'blog_posts'];

function categoryOf(action: string): { tone: BadgeTone; label: string } {
  const prefix = (action || '').split(/[._]/)[0].toLowerCase();
  if (CONTENT_PREFIXES.includes(prefix)) return { tone: 'gold', label: 'Content' };
  if (prefix === 'admin') return { tone: 'steel', label: 'Auth' };
  if (prefix === 'seo') return { tone: 'violet', label: 'SEO' };
  if (prefix === 'settings') return { tone: 'zinc', label: 'Settings' };
  if (prefix === 'media') return { tone: 'amber', label: 'Media' };
  if (prefix === 'system') return { tone: 'red', label: 'System' };
  if (prefix === 'redirects') return { tone: 'green', label: 'Redirects' };
  if (prefix === 'notfound') return { tone: 'amber', label: '404' };
  return { tone: 'zinc', label: prefix ? prefix.replace(/^\w/, (c) => c.toUpperCase()) : 'Other' };
}

function humanizeAction(action: string): string {
  return (action || '')
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function metaSummary(meta: Record<string, unknown> | null | undefined): string {
  if (!meta || typeof meta !== 'object') return '—';
  const keys = Object.keys(meta);
  if (!keys.length) return '—';
  try {
    return truncate(JSON.stringify(meta), 60);
  } catch {
    return truncate(keys.join(', '), 60);
  }
}

export const ActivityPage: React.FC<AdminPageProps> = () => {
  const { push } = useToast();
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [group, setGroup] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listActivity(200));
    } catch (e) {
      setError({ title: 'Could not load the activity log', message: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const groups = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(categoryOf(r.action).label);
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (group !== 'all' && categoryOf(r.action).label !== group) return false;
      if (!q) return true;
      return (
        r.action.toLowerCase().includes(q) ||
        r.user_email.toLowerCase().includes(q) ||
        r.target_type.toLowerCase().includes(q) ||
        r.target_id.toLowerCase().includes(q)
      );
    });
  }, [rows, group, search]);

  useEffect(() => { setPage(1); }, [group, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const columns: Column<ActivityRow>[] = [
    {
      key: 'action',
      label: 'Action',
      render: (r) => {
        const cat = categoryOf(r.action);
        return (
          <span className="flex min-w-0 flex-wrap items-center gap-1.5">
            <Badge tone={cat.tone}>{cat.label}</Badge>
            <span className="truncate text-[13px] font-semibold text-[#F5F6F2]" title={r.action}>{humanizeAction(r.action)}</span>
          </span>
        );
      },
    },
    {
      key: 'target',
      label: 'Target',
      render: (r) => (
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-[#A7AFBA]">{r.target_type || '—'}</span>
          <span className="truncate font-mono text-[11px] text-[#6B7280]" title={r.target_id}>{r.target_id ? truncate(r.target_id, 22) : ''}</span>
        </span>
      ),
    },
    { key: 'user_email', label: 'User', hideOnMobile: true, render: (r) => <span className="truncate text-xs text-[#A7AFBA]" title={r.user_email}>{r.user_email || '—'}</span> },
    { key: 'meta', label: 'Meta', hideOnMobile: true, render: (r) => <span className="font-mono text-[11px] text-[#566072]" title={metaSummary(r.meta)}>{metaSummary(r.meta)}</span> },
    {
      key: 'created_at',
      label: 'When',
      render: (r) => (
        <span className={cx('text-xs text-[#A7AFBA]')} title={fmtDateTime(r.created_at)}>
          {timeAgo(r.created_at)}
        </span>
      ),
    },
  ];

  const mobileCard = (r: ActivityRow) => {
    const cat = categoryOf(r.action);
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-semibold text-[#F5F6F2]">{humanizeAction(r.action)}</span>
          <Badge tone={cat.tone}>{cat.label}</Badge>
        </div>
        <p className="truncate text-[11px] text-[#A7AFBA]">{r.target_type}{r.target_id ? ` · ${truncate(r.target_id, 18)}` : ''}</p>
        <p className="text-[11px] text-[#566072]" title={fmtDateTime(r.created_at)}>{timeAgo(r.created_at)} · {r.user_email || 'system'}</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[#F5F6F2]">Activity Log</h1>
          <p className="text-xs text-[#A7AFBA]">Every admin write and auth event, newest first — proof of who changed what</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="gold">{filtered.length} entr{filtered.length === 1 ? 'y' : 'ies'}</Badge>
          <Btn variant="outline" size="sm" icon={RefreshCw} onClick={() => void load()} loading={loading}>Refresh</Btn>
        </div>
      </div>

      <Card
        title="Recent activity"
        subtitle="Last 200 events"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="relative">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#566072]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search action, user, target…"
                aria-label="Search activity"
                className="h-8 w-44 rounded-lg border border-white/10 bg-[#04070C]/80 pl-7 pr-2 text-xs text-[#F5F6F2] placeholder-[#5A6472] outline-none focus:border-[#C9A45C]/60"
              />
            </div>
            <Select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Filter by category" className="h-8 w-36 text-xs">
              <option value="all">All categories</option>
              {groups.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </div>
        }
        bodyClass="px-0 pb-4 sm:px-0"
      >
        {error ? (
          <div className="px-5"><ErrorBlock title={error.title} message={error.message} onRetry={() => void load()} /></div>
        ) : (
          <div className="px-4 sm:px-5">
            <DataTable<ActivityRow>
              columns={columns}
              rows={paged}
              loading={loading}
              total={filtered.length}
              page={pageSafe}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              mobileCard={mobileCard}
              dense
              emptyTitle="No activity recorded"
              emptyHint="Admin sign-ins, content edits, settings changes and uploads appear here as they happen."
              emptyAction={<Btn variant="outline" size="sm" icon={ActivityIcon} onClick={() => void load()}>Reload</Btn>}
            />
          </div>
        )}
      </Card>
    </div>
  );
};
