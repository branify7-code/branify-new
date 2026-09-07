// =============================================================================
// BRANIFY ADMIN — generic DataTable
// sorting · server pagination · responsive card fallback on mobile
// =============================================================================
import React from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { Btn, EmptyState, LoadingBlock, cx } from './index';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => React.ReactNode;
  hideOnMobile?: boolean;
}

export function DataTable<T extends { id?: string }>({
  columns, rows, loading, total, page, pageSize, onPageChange,
  sort, dir, onSort, onRowClick, mobileCard, emptyTitle, emptyHint, emptyAction, toolbar, dense,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  sort?: string;
  dir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  mobileCard?: (row: T) => React.ReactNode;
  emptyTitle?: string;
  emptyHint?: string;
  emptyAction?: React.ReactNode;
  toolbar?: React.ReactNode;
  dense?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (pageSafe - 1) * pageSize + 1;
  const end = Math.min(total, pageSafe * pageSize);

  return (
    <div className="flex flex-col gap-3">
      {toolbar}
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-[#0F172A]/[0.10] md:block">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#0F172A]/[0.10] bg-[#0F172A]/[0.03]">
              {columns.map((c) => (
                <th key={c.key} className={cx('px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#475569]', c.hideOnMobile && 'hidden lg:table-cell', c.className)}>
                  {c.sortable && onSort ? (
                    <button
                      onClick={() => onSort(c.key)}
                      className={cx('inline-flex items-center gap-1 uppercase tracking-[0.14em] hover:text-[#8F6B2D]', sort === c.key && 'text-[#8F6B2D]')}
                    >
                      {c.label}
                      {sort === c.key ? (dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ChevronsUpDown size={11} className="opacity-40" />}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && (
              <tr><td colSpan={columns.length}><LoadingBlock /></td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={columns.length}><EmptyState title={emptyTitle || 'No records'} hint={emptyHint} action={emptyAction} /></td></tr>
            )}
            {rows.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cx(
                  'border-b border-[#0F172A]/[0.07] transition-colors last:border-0 hover:bg-[#0F172A]/[0.03]',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cx('px-4 align-middle text-[13px] text-[#3B4A61]', dense ? 'py-2' : 'py-3', c.hideOnMobile && 'hidden lg:table-cell', c.className)}>
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
            {loading && rows.length > 0 && (
              <tr><td colSpan={columns.length} className="px-4 py-1"><div className="h-0.5 w-full overflow-hidden rounded bg-[#F8FAFC]"><div className="h-full w-1/3 animate-pulse rounded bg-[#C9A45C]/60" /></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {loading && rows.length === 0 && <LoadingBlock />}
        {!loading && rows.length === 0 && <EmptyState title={emptyTitle || 'No records'} hint={emptyHint} action={emptyAction} />}
        {rows.map((row, i) => (
          <div
            key={row.id || i}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cx(
              'rounded-xl border border-[#0F172A]/[0.10] bg-white/[0.5] p-3',
              onRowClick && 'cursor-pointer active:bg-[#0F172A]/[0.05]',
            )}
          >
            {mobileCard ? mobileCard(row) : (
              <div className="flex flex-col gap-1">
                {columns.filter((c) => !c.hideOnMobile).map((c) => (
                  <div key={c.key} className="flex items-start justify-between gap-3 text-xs">
                    <span className="text-[#64748B]">{c.label}</span>
                    <span className="text-right text-[#3B4A61]">{c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#475569]">
        <span className="tabular-nums">
          {total === 0 ? '0 records' : `${start}–${end} of ${total.toLocaleString()}`}
        </span>
        <div className="flex items-center gap-1.5">
          <Btn size="sm" variant="ghost" disabled={pageSafe <= 1 || loading} onClick={() => onPageChange(pageSafe - 1)} aria-label="Previous page">
            <ChevronLeft size={14} />
          </Btn>
          <span className="min-w-[64px] text-center tabular-nums">Page {pageSafe} / {totalPages}</span>
          <Btn size="sm" variant="ghost" disabled={pageSafe >= totalPages || loading} onClick={() => onPageChange(pageSafe + 1)} aria-label="Next page">
            <ChevronRight size={14} />
          </Btn>
        </div>
      </div>
    </div>
  );
}
