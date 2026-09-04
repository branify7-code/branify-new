// =============================================================================
// BRANIFY ADMIN — Payments (spec §15)
// -----------------------------------------------------------------------------
// CONTROL SECTION for future payment integration. No gateway is connected
// today, so the page shows an honest "Payment Gateway Not Connected" state.
// The payments table + provider registry below make future integration a
// configuration task — the dashboard will not need to be redesigned.
//
// NEVER stored anywhere in this system: card numbers, CVV, gateway secrets.
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, RefreshCw, Wallet } from 'lucide-react';
import type { AdminPageProps } from '../lib/auth';
import { AdminError, listRows } from '../lib/backend';
import type { PaymentRow } from '../lib/types';
import { fmtDateTime } from '../lib/format';
import { DataTable } from '../ui/DataTable';
import type { Column } from '../ui/DataTable';
import { Badge, Btn, Card, ErrorBlock, LoadingBlock, cx } from '../ui';

const STATUS_TONE: Record<string, 'gold' | 'green' | 'red' | 'zinc' | 'amber'> = {
  paid: 'green', pending: 'gold', failed: 'red', refunded: 'amber', cancelled: 'zinc',
};

const PROVIDERS: Array<{ id: string; label: string; status: string }> = [
  { id: 'stripe', label: 'Stripe', status: 'not_connected' },
  { id: 'paypal', label: 'PayPal', status: 'not_connected' },
  { id: 'payfast', label: 'PayFast / JazzCash / Easypaisa', status: 'not_connected' },
  { id: 'manual', label: 'Manual / bank transfer', status: 'not_connected' },
];

export const PaymentsPage: React.FC<AdminPageProps> = () => {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    setError('');
    try {
      const res = await listRows<PaymentRow>('payments', { page: 1, pageSize: 50, sort: 'created_at', dir: 'desc' });
      setRows(res.rows);
      setTotal(res.total);
    } catch (e) {
      // A missing payments table simply means the schema/seed has not been
      // applied yet — surface it honestly instead of pretending.
      setError(e instanceof AdminError ? e.message : ((e as Error).message || 'Failed to load payments.'));
      setRows([]); setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const columns: Column<PaymentRow>[] = [
    { key: 'provider', label: 'Provider', render: (r) => <span className="text-xs font-semibold text-[#F5F6F2]">{r.provider || '—'}</span> },
    { key: 'transaction_id', label: 'Transaction', hideOnMobile: true, render: (r) => <span className="font-mono text-[11px] text-[#A7AFBA]">{r.transaction_id || '—'}</span> },
    {
      key: 'customer_email', label: 'Customer',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-xs text-[#F5F6F2]">{r.customer_name || '—'}</p>
          <p className="truncate font-mono text-[11px] text-[#A7AFBA]">{r.customer_email || ''}</p>
        </div>
      ),
    },
    {
      key: 'amount', label: 'Amount',
      render: (r) => <span className="font-mono text-xs text-[#E8C97C]">{(r.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {r.currency || ''}</span>,
    },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={STATUS_TONE[r.status] || 'zinc'}>{r.status || 'pending'}</Badge> },
    { key: 'payment_date', label: 'Date', hideOnMobile: true, render: (r) => <span className="text-xs text-[#A7AFBA]">{r.payment_date ? fmtDateTime(r.payment_date) : '—'}</span> },
    { key: 'refund_status', label: 'Refund', hideOnMobile: true, render: (r) => <span className="text-xs text-[#A7AFBA]">{r.refund_status || '—'}</span> },
    { key: 'webhook_status', label: 'Webhook', hideOnMobile: true, render: (r) => <span className="text-xs text-[#A7AFBA]">{r.webhook_status || '—'}</span> },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9A45C]/30 bg-[#C9A45C]/[0.08]">
              <CreditCard size={15} className="text-[#E8C97C]" />
            </span>
            <h2 className="font-display text-lg font-bold text-[#F5F6F2]">Payments</h2>
          </div>
          <p className="mt-0.5 text-xs text-[#A7AFBA]">Control section for payment providers — future-ready structure.</p>
        </div>
        <Btn variant="outline" size="sm" icon={RefreshCw} onClick={() => void load(true)} loading={refreshing}>Refresh</Btn>
      </div>

      {/* gateway status — honest state */}
      <div
        className={cx(
          'flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between',
          'border-amber-500/25 bg-amber-500/[0.05]',
        )}
        role="status"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
            <Wallet size={17} className="text-amber-300" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-amber-200">Payment Gateway Not Connected</p>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-amber-200/70">
              No payment provider is wired up yet. When one is connected (Stripe, PayPal, PayFast, or manual
              transfers), transactions will appear below automatically. Card numbers, CVV and gateway secrets
              are never stored in this system — only payment references and statuses.
            </p>
          </div>
        </div>
      </div>

      {/* provider slots — ready for future integration */}
      <Card title="Payment providers" subtitle="Supported slots — connect a provider by adding its credentials in Settings → General (never in this dashboard).">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {PROVIDERS.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#F5F6F2]">{p.label}</p>
                <p className="text-[11px] text-[#6B7280]">Provider slot ready</p>
              </div>
              <Badge tone="zinc">Not Connected</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* transactions */}
      <Card title="Transactions" subtitle={`Statuses: Pending · Paid · Failed · Refunded · Cancelled${total ? ` · ${total.toLocaleString()} recorded` : ''}`}>
        {error ? (
          <ErrorBlock title="Payments unavailable" message={error} onRetry={() => void load()} />
        ) : loading ? (
          <LoadingBlock label="Loading payments…" />
        ) : (
          <DataTable<PaymentRow>
            columns={columns}
            rows={rows}
            loading={false}
            total={total}
            page={1}
            pageSize={Math.max(rows.length, 1)}
            onPageChange={() => { /* small list */ }}
            mobileCard={(r) => (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#F5F6F2]">{r.provider || '—'} · {(r.amount ?? 0).toLocaleString()} {r.currency || ''}</p>
                  <p className="truncate font-mono text-[11px] text-[#A7AFBA]">{r.customer_email || r.transaction_id || ''}</p>
                </div>
                <Badge tone={STATUS_TONE[r.status] || 'zinc'}>{r.status || 'pending'}</Badge>
              </div>
            )}
            emptyTitle="No transactions"
            emptyHint="Transactions will appear here once a payment gateway is connected and orders start flowing. Nothing is faked in the meantime."
            dense
          />
        )}
      </Card>
    </div>
  );
};
