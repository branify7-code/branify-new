// =============================================================================
// BRANIFY ADMIN — Customers (spec §12–13)
// -----------------------------------------------------------------------------
// · "Accounts" tab lists REAL Supabase Auth users via the admin-only SECURITY
//   DEFINER RPC `branify_list_customers()`. Passwords / tokens are NEVER
//   stored, returned, or displayed — authentication stays inside Supabase
//   Auth. Name / phone appear only when the customer provided them.
// · "Newsletter" tab embeds the existing ContactsPage (newsletter_subscribers).
// · Empty state is honest: no registered customers yet → "No customers yet".
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, Mail, RefreshCw, Search, ShieldCheck, UserCircle, Users } from 'lucide-react';
import type { AdminPageProps } from '../lib/auth';
import { AdminError, listCustomers, updateCustomerStatus } from '../lib/backend';
import type { CustomerRow } from '../lib/types';
import { fmtDateTime, timeAgo } from '../lib/format';
import { DataTable } from '../ui/DataTable';
import type { Column } from '../ui/DataTable';
import { StatTile } from '../ui/charts';
import { Badge, Btn, Card, ErrorBlock, Input, LoadingBlock, Select, useToast, cx } from '../ui';
import { ContactsPage } from './managers/ContactsPage';

type TabKey = 'accounts' | 'newsletter';

const TABS: Array<{ id: TabKey; label: string; icon: typeof Users }> = [
  { id: 'accounts', label: 'Customer accounts', icon: Users },
  { id: 'newsletter', label: 'Newsletter subscribers', icon: Mail },
];

const statusTone = (s: string): 'green' | 'red' | 'zinc' =>
  s === 'active' ? 'green' : s === 'blocked' ? 'red' : 'zinc';

const AccountsPanel: React.FC = () => {
  const { push } = useToast();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [filtered, setFiltered] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [savingId, setSavingId] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    setError('');
    try {
      const res = await listCustomers();
      setRows(res);
    } catch (e) {
      setError(e instanceof AdminError ? e.message : ((e as Error).message || 'Failed to load customers.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let out = rows;
    if (search) {
      out = out.filter((r) =>
        r.email.toLowerCase().includes(search)
        || (r.name || '').toLowerCase().includes(search)
        || (r.phone || '').toLowerCase().includes(search));
    }
    if (statusFilter) out = out.filter((r) => (r.status || 'active') === statusFilter);
    setFiltered(out);
  }, [rows, search, statusFilter]);

  const changeStatus = useCallback(async (row: CustomerRow, status: string) => {
    setSavingId(row.id);
    try {
      await updateCustomerStatus(row.id, status, row.notes);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
      push('success', `${row.email} marked ${status}.`);
    } catch (e) {
      push('error', e instanceof AdminError ? e.message : ((e as Error).message || 'Status update failed.'));
    } finally {
      setSavingId('');
    }
  }, [push]);

  const columns: Column<CustomerRow>[] = [
    {
      key: 'email',
      label: 'Customer',
      render: (r) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C9A45C]/25 bg-[#C9A45C]/[0.07] text-[10px] font-bold uppercase text-[#E8C97C]">
            {(r.name || r.email).slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[#F5F6F2]">{r.name || '—'}</p>
            <p className="truncate font-mono text-[11px] text-[#A7AFBA]">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      hideOnMobile: true,
      render: (r) => <span className="font-mono text-[11px] text-[#A7AFBA]">{r.phone || '—'}</span>,
    },
    {
      key: 'created_at',
      label: 'Registered',
      hideOnMobile: true,
      render: (r) => <span className="text-xs text-[#A7AFBA]">{fmtDateTime(r.created_at)}</span>,
    },
    {
      key: 'last_login_at',
      label: 'Last login',
      hideOnMobile: true,
      render: (r) => r.last_login_at
        ? <span className="text-xs text-[#A7AFBA]" title={fmtDateTime(r.last_login_at)}>{timeAgo(r.last_login_at)}</span>
        : <span className="text-xs text-[#6B7280]">N/A</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Badge tone={statusTone(r.status || 'active')}>{r.status || 'active'}</Badge>
          <Select
            value={r.status || 'active'}
            onChange={(e) => void changeStatus(r, e.target.value)}
            disabled={savingId === r.id}
            aria-label={`Change status for ${r.email}`}
            className="h-7 w-[7.4rem] px-1.5 py-0 text-[11px]"
          >
            <option value="active">active</option>
            <option value="blocked">blocked</option>
          </Select>
        </div>
      ),
    },
  ];

  const activeCount = rows.filter((r) => (r.status || 'active') === 'active').length;
  const withPhone = rows.filter((r) => r.phone).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#566072]" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email or phone…"
            aria-label="Search customers"
            className="h-9 w-56 pl-9 sm:w-72"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="h-9 w-36"
        >
          <option value="">All statuses</option>
          <option value="active">active</option>
          <option value="blocked">blocked</option>
        </Select>
        <Btn variant="outline" size="sm" icon={RefreshCw} onClick={() => void load(true)} loading={refreshing}>
          Refresh
        </Btn>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:max-w-lg">
        <StatTile label="Customers" value={rows.length.toLocaleString()} icon={<Users size={15} className="text-[#C9A45C]/70" />} />
        <StatTile label="Active" value={activeCount.toLocaleString()} icon={<ShieldCheck size={15} className="text-[#C9A45C]/70" />} />
        <StatTile label="With phone" value={withPhone.toLocaleString()} icon={<Mail size={15} className="text-[#C9A45C]/70" />} />
      </div>

      {error ? (
        <ErrorBlock title="Failed to load customers" message={error} onRetry={() => void load()} />
      ) : loading ? (
        <LoadingBlock label="Loading customers…" />
      ) : (
        <Card bodyClass="pt-1">
          <DataTable<CustomerRow>
            columns={columns}
            rows={filtered}
            loading={false}
            total={filtered.length}
            page={1}
            pageSize={Math.max(filtered.length, 1)}
            onPageChange={() => { /* client-side list */ }}
            mobileCard={(r) => (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#F5F6F2]">{r.name || '—'}</p>
                  <p className="truncate font-mono text-[11px] text-[#A7AFBA]">{r.email}</p>
                  <p className="text-[10.5px] text-[#6B7280]">
                    Registered {fmtDateTime(r.created_at)}{r.last_login_at ? ` · last login ${timeAgo(r.last_login_at)}` : ''}
                  </p>
                </div>
                <Badge tone={statusTone(r.status || 'active')}>{r.status || 'active'}</Badge>
              </div>
            )}
            emptyTitle={search || statusFilter ? 'No matching customers' : 'No customers yet'}
            emptyHint={(search || statusFilter)
              ? 'Try a different search or clear the status filter.'
              : 'When customers register or sign in on the public website, their account profile (email, name/phone if provided, registration date, last login) appears here. Passwords are never stored — they remain inside Supabase Auth.'}
            dense
          />
        </Card>
      )}

      <p className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-[11px] leading-relaxed text-[#6B7280]">
        <KeyRound size={13} className="mt-0.5 shrink-0 text-[#C9A45C]/60" />
        Privacy: only profile data required by the website is shown (email, name/phone when provided, registration and last-login timestamps).
        Authentication passwords and tokens are managed exclusively by Supabase Auth and are never visible to this dashboard.
      </p>
    </div>
  );
};

export const CustomersPage: React.FC<AdminPageProps> = () => {
  const [tab, setTab] = useState<TabKey>('accounts');

  return (
    <div className="flex flex-col gap-4">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9A45C]/30 bg-[#C9A45C]/[0.08]">
              <UserCircle size={15} className="text-[#E8C97C]" />
            </span>
            <h2 className="font-display text-lg font-bold text-[#F5F6F2]">Customers</h2>
          </div>
          <p className="mt-0.5 text-xs text-[#A7AFBA]">Customer database — registered accounts and newsletter contacts.</p>
        </div>
      </div>

      {/* tabs */}
      <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-black/30 p-1" role="tablist" aria-label="Customer sections">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all sm:flex-none sm:px-4',
                tab === t.id
                  ? 'bg-gradient-to-b from-[#E8C97C] to-[#C9A45C] text-[#1A1206]'
                  : 'text-[#A7AFBA] hover:text-white',
              )}
            >
              <Icon size={13} /> <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.id === 'accounts' ? 'Accounts' : 'Newsletter'}</span>
            </button>
          );
        })}
      </div>

      {tab === 'accounts' ? <AccountsPanel /> : <ContactsPage query={new URLSearchParams()} navigate={() => {}} refreshBadges={() => {}} />}
    </div>
  );
};
