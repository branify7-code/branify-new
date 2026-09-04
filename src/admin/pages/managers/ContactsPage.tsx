// =============================================================================
// BRANIFY ADMIN — Contacts page (collection: newsletter_subscribers)
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Download, Mail, Search, Trash2, Users } from 'lucide-react';
import type { AdminPageProps } from '../../lib/auth';
import { AdminError, deleteRow, listRows } from '../../lib/backend';
import type { SubscriberRow, ListParams } from '../../lib/types';
import { fmtDateTime } from '../../lib/format';
import { DataTable } from '../../ui/DataTable';
import type { Column } from '../../ui/DataTable';
import { StatTile } from '../../ui/charts';
import {
  Badge, Btn, Card, ConfirmDialog, ErrorBlock, Input, useToast,
} from '../../ui';

const PAGE_SIZE = 25;

export const ContactsPage: React.FC<AdminPageProps> = () => {
  const { push } = useToast();
  const [rows, setRows] = useState<SubscriberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<SubscriberRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true);
    setError('');
    try {
      const params: ListParams = { page, pageSize: PAGE_SIZE, sort: 'created_at', dir: 'desc' };
      if (search) params.search = search;
      const res = await listRows<SubscriberRow>('newsletter_subscribers', params);
      setRows(res.rows);
      setTotal(res.total);
      if (res.rows.length === 0 && res.total > 0 && page > 1) {
        setPage(Math.max(1, Math.ceil(res.total / PAGE_SIZE)));
      }
    } catch (e) {
      setError(e instanceof AdminError ? e.message : ((e as Error).message || 'Failed to load subscribers.'));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { void load(); }, [load]);

  const copyEmail = useCallback(async (row: SubscriberRow) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(row.email);
      } else {
        const ta = document.createElement('textarea');
        ta.value = row.email;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      push('success', 'Email copied to clipboard.');
    } catch {
      push('error', 'Could not copy — clipboard unavailable.');
    }
  }, [push]);

  const doDelete = useCallback(async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteRow('newsletter_subscribers', confirmDelete.id);
      push('success', `${confirmDelete.email} unsubscribed & deleted.`);
      setConfirmDelete(null);
      await load({ quiet: true });
    } catch (e) {
      push('error', e instanceof AdminError ? e.message : ((e as Error).message || 'Delete failed.'));
    } finally {
      setDeleting(false);
    }
  }, [confirmDelete, load, push]);

  const exportCsv = useCallback(async () => {
    setExporting(true);
    try {
      const all: SubscriberRow[] = [];
      for (let p = 1; p <= 3; p++) {
        const res = await listRows<SubscriberRow>('newsletter_subscribers', { page: p, pageSize: 200, sort: 'created_at', dir: 'desc' });
        all.push(...res.rows);
        if (res.rows.length === 0 || all.length >= res.total) break;
      }
      if (all.length === 0) {
        push('info', 'Nothing to export yet — no subscribers have signed up.');
        return;
      }
      const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
      const csv = [
        'email,subscribed_at,id',
        ...all.map((r) => `${esc(r.email)},${r.created_at},${r.id}`),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'branify-subscribers.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      push('success', `Exported ${all.length} subscriber${all.length === 1 ? '' : 's'} to branify-subscribers.csv.`);
    } catch (e) {
      push('error', e instanceof AdminError ? e.message : ((e as Error).message || 'Export failed.'));
    } finally {
      setExporting(false);
    }
  }, [push]);

  const columns: Column<SubscriberRow>[] = [
    {
      key: 'email',
      label: 'Email',
      sortable: false,
      render: (r) => <span className="font-mono text-xs text-[#C9CED6]">{r.email}</span>,
    },
    {
      key: 'created_at',
      label: 'Subscribed',
      sortable: true,
      hideOnMobile: true,
      render: (r) => <span className="text-[#A7AFBA]">{fmtDateTime(r.created_at)}</span>,
    },
    {
      key: '__actions',
      label: 'Actions',
      className: 'text-right whitespace-nowrap',
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            title="Copy email"
            aria-label={`Copy ${r.email}`}
            onClick={() => void copyEmail(r)}
            className="rounded-lg p-1.5 text-[#A7AFBA] transition-colors hover:bg-white/[0.07] hover:text-[#F3D27A]"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            title="Delete subscriber"
            aria-label={`Delete ${r.email}`}
            onClick={() => setConfirmDelete(r)}
            className="rounded-lg p-1.5 text-[#A7AFBA] transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9A45C]/30 bg-[#C9A45C]/[0.08]"><Users size={15} className="text-[#E8C97C]" /></span>
            <h2 className="font-display text-lg font-bold text-[#F5F6F2]">Contacts</h2>
            <Badge tone="gold">{total.toLocaleString()}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-[#A7AFBA]">Newsletter subscribers collected from the public site footer.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#566072]" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by email…"
              aria-label="Search subscribers"
              className="h-9 w-48 pl-9 sm:w-60"
            />
          </div>
          <Btn variant="outline" icon={Download} onClick={() => void exportCsv()} loading={exporting}>
            Export CSV
          </Btn>
        </div>
      </div>

      {/* stat */}
      <div className="grid grid-cols-2 gap-2.5 sm:max-w-md">
        <StatTile label="Subscribers" value={total.toLocaleString()} icon={<Mail size={15} className="text-[#C9A45C]/70" />} />
        <StatTile label="Showing" value={`${rows.length} of ${total.toLocaleString()}`} sub={<span className="text-[10.5px] text-[#6B7280]">page {page} · 25 per page</span>} />
      </div>

      {/* list */}
      {error ? (
        <ErrorBlock title="Failed to load subscribers" message={error} onRetry={() => void load()} />
      ) : (
        <Card bodyClass="pt-1">
          <DataTable<SubscriberRow>
            columns={columns}
            rows={rows}
            loading={loading}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            sort="created_at"
            dir="desc"
            mobileCard={(r) => (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-[#F5F6F2]">{r.email}</p>
                  <p className="text-[11px] text-[#6B7280]">{fmtDateTime(r.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    title="Copy email"
                    aria-label={`Copy ${r.email}`}
                    onClick={() => void copyEmail(r)}
                    className="rounded-lg p-1.5 text-[#A7AFBA] transition-colors hover:bg-white/[0.07] hover:text-[#F3D27A]"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    title="Delete subscriber"
                    aria-label={`Delete ${r.email}`}
                    onClick={() => setConfirmDelete(r)}
                    className="rounded-lg p-1.5 text-[#A7AFBA] transition-colors hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
            emptyTitle={search ? 'No matching subscribers' : 'No subscribers yet'}
            emptyHint={search
              ? 'Try a different email search.'
              : 'Newsletter signups from the public site footer will appear here automatically.'}
            dense
          />
        </Card>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => void doDelete()}
        title="Delete subscriber?"
        message={confirmDelete
          ? <>This permanently removes <strong>{confirmDelete.email}</strong> from the newsletter list. They can subscribe again from the public site.</>
          : ''}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
};
