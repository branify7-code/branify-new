// =============================================================================
// BRANIFY ADMIN — Leads mini-CRM (collection: inquiries)
// -----------------------------------------------------------------------------
// Real quote requests & contact-form submissions. Never exposed publicly.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive, ChevronLeft, ChevronRight, Inbox, Mail, MessageCircle, Phone, Search,
} from 'lucide-react';
import type { AdminPageProps } from '../../lib/auth';
import { AdminError, listRows, updateRow } from '../../lib/backend';
import { LEAD_STATUSES } from '../../lib/types';
import type { LeadRow, ListParams } from '../../lib/types';
import { fmtDateTime, timeAgo } from '../../lib/format';
import { DataTable } from '../../ui/DataTable';
import type { Column } from '../../ui/DataTable';
import { StatTile } from '../../ui/charts';
import {
  Badge, Btn, Card, ConfirmDialog, ErrorBlock, Field, Input, LEAD_STATUS_TONE,
  Modal, Select, Textarea, Toggle, cx, useToast,
} from '../../ui';

const PAGE_SIZE = 25;

const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ==============================================================================
// PAGE
// ==============================================================================
export const LeadsPage: React.FC<AdminPageProps> = ({ refreshBadges }) => {
  // ---- stats (6 statuses + total + archived via parallel pageSize=1 counts)
  const [stats, setStats] = useState<{ statuses: Record<string, number>; total: number; archived: number } | null>(null);
  const [statsError, setStatsError] = useState('');

  // ---- list state
  const [tab, setTab] = useState<string>('all');
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadStats = useCallback(async () => {
    setStatsError('');
    try {
      const [all, arch, ...byStatus] = await Promise.all([
        listRows<LeadRow>('inquiries', { page: 1, pageSize: 1, archived: '' }),
        listRows<LeadRow>('inquiries', { page: 1, pageSize: 1, archived: true }),
        ...LEAD_STATUSES.map((s) => listRows<LeadRow>('inquiries', { page: 1, pageSize: 1, status: s, archived: '' })),
      ]);
      setStats({
        total: all.total,
        archived: arch.total,
        statuses: Object.fromEntries(LEAD_STATUSES.map((s, i) => [s, byStatus[i].total])),
      });
    } catch (e) {
      setStatsError(e instanceof AdminError ? e.message : ((e as Error).message || 'Failed to load lead stats.'));
    }
  }, []);

  const loadList = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true);
    setError('');
    try {
      const params: ListParams = { page, pageSize: PAGE_SIZE, sort: 'created_at', dir: 'desc' };
      if (tab === 'archived') params.archived = true;
      else {
        params.archived = '';
        if (tab !== 'all') params.status = tab;
      }
      if (search) params.search = search;
      const res = await listRows<LeadRow>('inquiries', params);
      setRows(res.rows);
      setTotal(res.total);
      if (res.rows.length === 0 && res.total > 0 && page > 1) {
        setPage(Math.max(1, Math.ceil(res.total / PAGE_SIZE)));
      }
    } catch (e) {
      setError(e instanceof AdminError ? e.message : ((e as Error).message || 'Failed to load leads.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, tab]);

  useEffect(() => { void loadStats(); }, [loadStats]);
  useEffect(() => { void loadList(); }, [loadList]);

  const refreshAll = useCallback(() => {
    void loadStats();
    void loadList({ quiet: true });
    refreshBadges();
  }, [loadList, loadStats, refreshBadges]);

  const activeIndex = useMemo(() => rows.findIndex((r) => r.id === activeId), [rows, activeId]);
  const activeLead = activeIndex >= 0 ? rows[activeIndex] : null;

  const tabs = useMemo(() => {
    const s = stats?.statuses || {};
    return [
      { id: 'all', label: 'All', badge: stats ? stats.total : undefined },
      ...LEAD_STATUSES.map((st) => ({ id: st as string, label: statusLabel(st), badge: s[st] })),
      { id: 'archived', label: 'Archived', badge: stats ? stats.archived : undefined },
    ];
  }, [stats]);

  const isArchivedTab = tab === 'archived';

  const columns: Column<LeadRow>[] = [
    {
      key: 'name',
      label: 'Lead',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#F5F6F2]">{r.name || '(no name)'}</p>
          <p className="truncate text-[11px] text-[#6B7280]">{r.company || '—'}</p>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      hideOnMobile: true,
      render: (r) => <span className="block max-w-[220px] truncate text-[#C9CED6]">{r.email || '—'}</span>,
    },
    {
      key: 'services',
      label: 'Services',
      hideOnMobile: true,
      render: (r) => {
        const list = Array.isArray(r.services) ? r.services : [];
        if (!list.length) return <span className="text-[#6B7280]">—</span>;
        return (
          <div className="flex flex-wrap items-center gap-1">
            {list.slice(0, 2).map((s) => <Badge key={s} tone="zinc">{s}</Badge>)}
            {list.length > 2 && <span className="text-[10.5px] font-bold text-[#A7AFBA]">+{list.length - 2}</span>}
          </div>
        );
      },
    },
    { key: 'budget', label: 'Budget', hideOnMobile: true, render: (r) => r.budget || '—' },
    { key: 'timeline', label: 'Timeline', hideOnMobile: true, render: (r) => r.timeline || '—' },
    { key: 'source', label: 'Source', hideOnMobile: true, render: (r) => <span className="text-[#A7AFBA]">{r.source || '—'}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <Badge tone={LEAD_STATUS_TONE[r.status] || 'zinc'}>{statusLabel(String(r.status))}</Badge>,
    },
    {
      key: 'created_at',
      label: 'Received',
      sortable: true,
      render: (r) => <span className="text-[#A7AFBA]">{timeAgo(r.created_at)}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9A45C]/30 bg-[#C9A45C]/[0.08]"><Inbox size={15} className="text-[#E8C97C]" /></span>
            <h2 className="font-display text-lg font-bold text-[#F5F6F2]">Leads CRM</h2>
            <Badge tone="gold">{(stats?.total ?? 0).toLocaleString()}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-[#A7AFBA]">Private pipeline of every inquiry from the public site — triage, qualify, win.</p>
        </div>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#566072]" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email, company, details…"
            aria-label="Search leads"
            className="h-9 w-60 pl-9 sm:w-72"
          />
        </div>
      </div>

      {/* stat tiles */}
      {statsError ? (
        <ErrorBlock title="Failed to load lead stats" message={statsError} onRetry={() => void loadStats()} />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <button type="button" className="text-left" onClick={() => { setTab('all'); setPage(1); }}>
            <StatTile
              label="Total leads"
              value={stats ? stats.total.toLocaleString() : '…'}
              className={cx(tab === 'all' && 'ring-1 ring-[#C9A45C]/50')}
            />
          </button>
          {LEAD_STATUSES.map((s) => (
            <button key={s} type="button" className="text-left" onClick={() => { setTab(s); setPage(1); }}>
              <StatTile
                label={statusLabel(s)}
                value={stats ? (stats.statuses[s] ?? 0).toLocaleString() : '…'}
                sub={<Badge tone={LEAD_STATUS_TONE[s]}>{statusLabel(s)}</Badge>}
                className={cx(tab === s && 'ring-1 ring-[#C9A45C]/50')}
              />
            </button>
          ))}
          <button type="button" className="text-left" onClick={() => { setTab('archived'); setPage(1); }}>
            <StatTile
              label="Archived"
              value={stats ? stats.archived.toLocaleString() : '…'}
              className={cx(isArchivedTab && 'ring-1 ring-[#C9A45C]/50')}
            />
          </button>
        </div>
      )}

      {/* tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/[0.07] bg-black/25 p-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => { setTab(t.id); setPage(1); }}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
              tab === t.id ? 'bg-gradient-to-b from-[#E8C97C] to-[#C9A45C] text-[#1A1206] shadow' : 'text-[#A7AFBA] hover:bg-white/[0.05] hover:text-[#F5F6F2]',
            )}
          >
            {t.label}
            {typeof t.badge === 'number' && (
              <span className={cx('rounded-full px-1.5 text-[9.5px] font-black tabular-nums', tab === t.id ? 'bg-black/20 text-[#1A1206]' : 'bg-white/[0.08] text-[#A7AFBA]')}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* list */}
      {error ? (
        <ErrorBlock title="Failed to load leads" message={error} onRetry={() => void loadList()} />
      ) : (
        <Card bodyClass="pt-1">
          <DataTable<LeadRow>
            columns={columns}
            rows={rows}
            loading={loading}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            sort="created_at"
            dir="desc"
            onRowClick={(r) => setActiveId(r.id)}
            mobileCard={(r) => (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-[#F5F6F2]">{r.name || '(no name)'}</p>
                  <Badge tone={LEAD_STATUS_TONE[r.status] || 'zinc'}>{statusLabel(String(r.status))}</Badge>
                </div>
                <p className="truncate text-xs text-[#A7AFBA]">{r.email || '—'}</p>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#6B7280]">
                  {r.company && <span>{r.company}</span>}
                  {r.budget && <span>· {r.budget}</span>}
                  <span>· {timeAgo(r.created_at)}</span>
                </div>
              </div>
            )}
            emptyTitle={search ? 'No matching leads' : 'No leads yet'}
            emptyHint={search ? 'Try a different search term.' : "Leads arrive from the site's contact form and quote requests."}
            dense
          />
        </Card>
      )}

      {/* detail modal */}
      {activeLead && (
        <LeadDetailModal
          key={activeLead.id}
          lead={activeLead}
          index={activeIndex}
          count={rows.length}
          archivedTab={isArchivedTab}
          refreshBadges={refreshBadges}
          onClose={() => setActiveId(null)}
          onPrev={() => { if (activeIndex > 0) setActiveId(rows[activeIndex - 1].id); }}
          onNext={() => { if (activeIndex >= 0 && activeIndex < rows.length - 1) setActiveId(rows[activeIndex + 1].id); }}
          onUpdated={(updated) => {
            setRows((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
            void loadStats();
          }}
          onArchived={() => {
            setActiveId(null);
            refreshAll();
          }}
        />
      )}
    </div>
  );
};

// ==============================================================================
// LEAD DETAIL MODAL
// ==============================================================================
const LeadDetailModal: React.FC<{
  lead: LeadRow;
  index: number;
  count: number;
  archivedTab: boolean;
  refreshBadges: () => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onUpdated: (row: LeadRow) => void;
  onArchived: () => void;
}> = ({ lead, index, count, archivedTab, refreshBadges, onClose, onPrev, onNext, onUpdated, onArchived }) => {
  const { push } = useToast();
  const [status, setStatus] = useState<string>(String(lead.status || 'new'));
  const [statusSaving, setStatusSaving] = useState(false);
  const [notes, setNotes] = useState(lead.notes || '');
  const [notesSaving, setNotesSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const services = Array.isArray(lead.services) ? lead.services : [];

  const saveStatus = useCallback(async (next: string) => {
    setStatus(next);
    setStatusSaving(true);
    try {
      const updated = await updateRow<LeadRow>('inquiries', lead.id, { status: next });
      onUpdated(updated);
      refreshBadges();
      push('success', `Lead marked ${statusLabel(next)}.`);
    } catch (e) {
      setStatus(String(lead.status || 'new'));
      push('error', e instanceof AdminError ? e.message : ((e as Error).message || 'Could not update status.'));
    } finally {
      setStatusSaving(false);
    }
  }, [lead.id, lead.status, onUpdated, push, refreshBadges]);

  const saveNotes = useCallback(async () => {
    if (notes === (lead.notes || '')) return;
    setNotesSaving(true);
    try {
      const updated = await updateRow<LeadRow>('inquiries', lead.id, { notes });
      onUpdated(updated);
      push('success', 'Notes saved.');
    } catch (e) {
      push('error', e instanceof AdminError ? e.message : ((e as Error).message || 'Could not save notes.'));
    } finally {
      setNotesSaving(false);
    }
  }, [lead.id, lead.notes, notes, onUpdated, push]);

  const archive = useCallback(async () => {
    setArchiving(true);
    try {
      await updateRow<LeadRow>('inquiries', lead.id, { archived: true });
      push('success', 'Lead archived.');
      refreshBadges();
      onArchived();
    } catch (e) {
      push('error', e instanceof AdminError ? e.message : ((e as Error).message || 'Could not archive lead.'));
      setArchiving(false);
    }
  }, [lead.id, onArchived, push, refreshBadges]);

  const waDigits = (lead.phone || '').replace(/[^0-9]/g, '');
  const waText = encodeURIComponent(`Hi ${lead.name || 'there'}, this is BRANIFY regarding your inquiry...`);

  return (
    <>
      <Modal
        open
        onClose={onClose}
        width="lg"
        title={lead.name || '(no name)'}
        subtitle={(
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={LEAD_STATUS_TONE[lead.status] || 'zinc'}>{statusLabel(String(lead.status))}</Badge>
            <span>Received {fmtDateTime(lead.created_at)}</span>
            {lead.updated_at && lead.updated_at !== lead.created_at && <span>· updated {timeAgo(lead.updated_at)}</span>}
          </span>
        )}
        footer={(
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Btn variant="subtle" size="sm" icon={ChevronLeft} onClick={onPrev} disabled={index <= 0}>Prev</Btn>
              <span className="text-[11px] tabular-nums text-[#6B7280]">{index + 1} / {count}</span>
              <Btn variant="subtle" size="sm" onClick={onNext} disabled={index < 0 || index >= count - 1}>Next <ChevronRight size={13} /></Btn>
            </div>
            <div className="flex items-center gap-2">
              <Btn variant="ghost" size="sm" onClick={onClose}>Close</Btn>
              {!archivedTab && (
                <Btn variant="outline" size="sm" icon={Archive} loading={archiving} onClick={() => setConfirmArchive(true)}>
                  Archive
                </Btn>
              )}
              <Btn variant="gold" size="sm" onClick={() => void saveNotes()} loading={notesSaving}>Save notes</Btn>
            </div>
          </div>
        )}
      >
        <div className="flex flex-col gap-5">
          {/* contact actions */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={lead.email ? `mailto:${lead.email}` : undefined}
              className={cx('inline-flex h-8 items-center gap-1.5 rounded-lg border border-[rgba(201,164,92,0.25)] px-3 text-xs font-semibold text-[#D8DCE2] transition-colors hover:border-[rgba(201,164,92,0.55)] hover:text-[#E9CF79]', !lead.email && 'pointer-events-none opacity-40')}
            >
              <Mail size={13} /> Email lead
            </a>
            {waDigits ? (
              <a
                href={`https://wa.me/${waDigits}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-3 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/[0.12]"
              >
                <MessageCircle size={13} /> WhatsApp
              </a>
            ) : null}
            {lead.phone ? (
              <a
                href={`tel:${lead.phone.replace(/\s+/g, '')}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-semibold text-[#D8DCE2] transition-colors hover:border-white/25"
              >
                <Phone size={13} /> {lead.phone}
              </a>
            ) : null}
          </div>

          {/* fields grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label="Email" value={lead.email} mono />
            <InfoRow label="Phone" value={lead.phone} mono />
            <InfoRow label="Company" value={lead.company} />
            <InfoRow label="Source" value={lead.source} />
            <InfoRow label="Budget" value={lead.budget} />
            <InfoRow label="Timeline" value={lead.timeline} />
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]">Services of interest</p>
              {services.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {services.map((s) => <Badge key={s} tone="gold">{s}</Badge>)}
                </div>
              ) : (
                <p className="text-xs text-[#6B7280]">—</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]">Inquiry details</p>
              <div className="whitespace-pre-wrap rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-[13px] leading-relaxed text-[#C9CED6]">
                {lead.details || '—'}
              </div>
            </div>
          </div>

          {/* pipeline controls */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#C9A45C]/20 bg-[#C9A45C]/[0.04] p-4 sm:grid-cols-2">
            <Field label="Pipeline status" hint="Saved instantly — updates sidebar badges.">
              <div className="flex items-center gap-2">
                <Select value={status} onChange={(e) => void saveStatus(e.target.value)} disabled={statusSaving} aria-label="Lead status">
                  {LEAD_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </Select>
                {statusSaving && <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A45C]">saving…</span>}
              </div>
            </Field>
            <div>
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]">Archived</span>
              {archivedTab ? (
                <p className="text-xs text-[#6B7280]">This lead is archived (viewing the archived tab).</p>
              ) : (
                <div className="flex items-center gap-2.5">
                  <Toggle checked={Boolean(lead.archived)} onChange={() => setConfirmArchive(true)} label="Archived" />
                  <span className="text-xs text-[#6B7280]">Hide from the active pipeline</span>
                </div>
              )}
            </div>
          </div>

          {/* notes */}
          <Field label="Private notes" hint="Internal only — autosaves when you click away.">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => void saveNotes()}
              rows={4}
              placeholder="Call notes, next steps, quotes sent…"
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        onConfirm={() => { setConfirmArchive(false); void archive(); }}
        title="Archive this lead?"
        message={`“${lead.name || 'This lead'}” will be hidden from the active pipeline. You can find it again under the Archived tab.`}
        confirmLabel="Archive lead"
        loading={archiving}
      />
    </>
  );
};

const InfoRow: React.FC<{ label: string; value?: string | null; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]">{label}</p>
    <p className={cx('break-words text-[13px] text-[#C9CED6]', mono && 'font-mono text-xs')}>{value || '—'}</p>
  </div>
);
