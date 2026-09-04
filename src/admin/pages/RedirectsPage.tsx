// =============================================================================
// BRANIFY ADMIN — REDIRECTS (/admin/seo/redirects)
// -----------------------------------------------------------------------------
// Real redirect manager with live validation: duplicate sources, loops,
// redirect-chain detection, and malformed destinations — checked against the
// rows actually loaded from the redirects collection.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, ArrowRight, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';
import type { AdminPageProps } from '../lib/auth';
import { createRow, deleteRow, listRows, updateRow } from '../lib/backend';
import type { RedirectRow } from '../lib/types';
import {
  Badge, Btn, Card, ConfirmDialog, EmptyState, ErrorBlock, Field, Input, LoadingBlock,
  Modal, Select, Toggle, cx, useToast,
} from '../ui';
import { DataTable } from '../ui/DataTable';
import type { Column } from '../ui/DataTable';
import { fmtDate, truncate } from '../lib/format';

const PAGE_SIZE = 25;

interface Draft {
  source: string;
  destination: string;
  status: 301 | 302;
  active: boolean;
}

interface Validation {
  errors: string[];
  warnings: string[];
  chain: string | null;
}

export const RedirectsPage: React.FC<AdminPageProps> = ({ query, navigate }) => {
  const { push } = useToast();
  const [rows, setRows] = useState<RedirectRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RedirectRow | null>(null);
  const [draft, setDraft] = useState<Draft>({ source: '', destination: '/', status: 301, active: true });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<RedirectRow | null>(null);

  const fetchRows = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listRows<RedirectRow>('redirects', { page: p, pageSize: PAGE_SIZE, sort: 'created_at', dir: 'desc' });
      setRows(res.rows);
      setTotal(res.total);
      setPage(res.page);
    } catch (e) {
      setError({ title: 'Could not load redirects', message: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRows(1); }, [fetchRows]);

  // ?new=1 opens the create modal · ?source=<path> pre-fills the source field
  useEffect(() => {
    if (query.get('new') === '1') {
      setEditing(null);
      setDraft({ source: query.get('source') || '', destination: '/', status: 301, active: true });
      setEditorOpen(true);
      navigate('/seo/redirects'); // strip deep-link params from the URL bar
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const openCreate = () => {
    setEditing(null);
    setDraft({ source: '', destination: '/', status: 301, active: true });
    setEditorOpen(true);
  };

  const openEdit = (r: RedirectRow) => {
    setEditing(r);
    setDraft({ source: r.source, destination: r.destination, status: (r.status === 302 ? 302 : 301), active: Boolean(r.active) });
    setEditorOpen(true);
  };

  // ------------------------------------------------------------- validation
  const validation: Validation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let chain: string | null = null;
    const source = draft.source.trim();
    const destination = draft.destination.trim();

    if (!source) errors.push('Source path is required.');
    else if (!source.startsWith('/')) errors.push('Source must start with "/" (e.g. /old-page).');
    else if (/\s/.test(source)) errors.push('Source must not contain spaces.');
    else if (source.length > 1 && source.endsWith('/')) warnings.push('Source ends with "/" — redirects match exact paths.');

    const clash = rows.find((r) => r.source.toLowerCase() === source.toLowerCase() && r.id !== editing?.id);
    if (source && clash) errors.push(`Duplicate source — "${source}" is already redirected to ${clash.destination}.`);

    if (!destination) errors.push('Destination is required.');
    else if (/^https?:\/\//i.test(destination)) {
      warnings.push('Absolute external URL — fine for off-site targets.');
    } else if (!destination.startsWith('/')) {
      errors.push('Destination must start with "/" or be a full http(s):// URL.');
    }

    if (source && source === destination) errors.push('Loop detected — source and destination are identical.');

    // chain detection: destination is itself the source of another redirect
    if (destination && !errors.includes('Loop detected — source and destination are identical.')) {
      const hop = rows.find((r) => r.source.toLowerCase() === destination.toLowerCase() && r.id !== editing?.id);
      if (hop) {
        const parts = [source || '(this)', destination];
        let current = hop;
        const seen = new Set<string>([source.toLowerCase()]);
        while (current && parts.length < 5 && !seen.has(current.destination.toLowerCase())) {
          parts.push(current.destination);
          seen.add(current.destination.toLowerCase());
          current = rows.find((r) => r.source.toLowerCase() === current.destination.toLowerCase() && r.id !== editing?.id) as RedirectRow | undefined;
        }
        chain = parts.join('  →  ');
        warnings.push(`Redirect chain ${parts.join(' → ')} — chains add latency; consider pointing this redirect at the final destination.`);
      }
    }

    return { errors, warnings, chain };
  }, [draft, rows, editing]);

  const save = async () => {
    if (validation.errors.length) return;
    setSaving(true);
    try {
      const payload = { source: draft.source.trim(), destination: draft.destination.trim(), status: draft.status, active: draft.active };
      if (editing) {
        await updateRow<RedirectRow>('redirects', editing.id, payload);
        push('success', `Redirect ${payload.source} updated`);
      } else {
        await createRow<RedirectRow>('redirects', payload);
        push('success', `Redirect ${payload.source} → ${payload.destination} created`);
      }
      setEditorOpen(false);
      await fetchRows(editing ? page : 1);
    } catch (e) {
      push('error', `Save failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    try {
      await deleteRow('redirects', confirmDelete.id);
      push('success', `Redirect ${confirmDelete.source} deleted`);
      setConfirmDelete(null);
      await fetchRows(page);
    } catch (e) {
      push('error', `Delete failed: ${(e as Error).message}`);
      setConfirmDelete(null);
    }
  };

  const toggleActive = async (r: RedirectRow, next: boolean) => {
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: next } : x)));
    try {
      await updateRow<RedirectRow>('redirects', r.id, { active: next });
      push('success', `${r.source} ${next ? 'activated' : 'deactivated'}`);
    } catch (e) {
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: !next } : x)));
      push('error', `Toggle failed: ${(e as Error).message}`);
    }
  };

  const columns: Column<RedirectRow>[] = [
    { key: 'source', label: 'Source', render: (r) => <span className="font-mono text-xs text-[#E8C97C]" title={r.source}>{truncate(r.source, 38)}</span> },
    {
      key: 'destination',
      label: 'Destination',
      render: (r) => (
        <span className="flex items-center gap-1.5 font-mono text-xs text-[#C9CED6]">
          <ArrowRight size={11} className="shrink-0 text-[#566072]" />
          <span title={r.destination}>{truncate(r.destination, 38)}</span>
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 301 ? 'green' : 'amber'}>{r.status === 301 ? '301 permanent' : '302 temporary'}</Badge> },
    { key: 'active', label: 'Active', render: (r) => <Toggle checked={Boolean(r.active)} onChange={(v) => void toggleActive(r, v)} label={`Toggle redirect ${r.source}`} /> },
    { key: 'created_at', label: 'Created', hideOnMobile: true, render: (r) => <span className="text-xs text-[#A7AFBA]">{fmtDate(r.created_at)}</span> },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <span className="flex items-center justify-end gap-1">
          <Btn size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(r)} aria-label={`Edit redirect ${r.source}`}>Edit</Btn>
          <Btn size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirmDelete(r)} aria-label={`Delete redirect ${r.source}`} className="text-red-300/80 hover:text-red-200" />
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[#F5F6F2]">Redirects</h1>
          <p className="text-xs text-[#A7AFBA]">301/302 URL redirects with duplicate, loop and chain validation</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="gold">{total} redirect{total === 1 ? '' : 's'}</Badge>
          <Btn variant="gold" size="sm" icon={Plus} onClick={openCreate}>New redirect</Btn>
        </div>
      </div>

      <Card bodyClass="pt-0 px-0 sm:px-0 pb-0">
        {error ? (
          <div className="p-5"><ErrorBlock title={error.title} message={error.message} onRetry={() => void fetchRows(page)} /></div>
        ) : (
          <div className="px-4 py-4 sm:px-5">
            <DataTable<RedirectRow>
              columns={columns}
              rows={rows}
              loading={loading}
              total={total}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => void fetchRows(p)}
              emptyTitle="No redirects yet"
              emptyHint="Redirects send old URLs to new destinations so visitors and search engines never hit dead ends. Create your first one (e.g. /old-page → /)."
              emptyAction={<Btn variant="gold" size="sm" icon={Plus} onClick={openCreate}>Create redirect</Btn>}
            />
            {!loading && rows.length === 0 && (
              <div className="pb-4">
                <EmptyState
                  icon={ArrowLeftRight}
                  title="How redirects work"
                  hint="Each rule maps an exact source path to a destination. 301 tells search engines the move is permanent; 302 is temporary. Inactive rules are kept but not enforced."
                />
              </div>
            )}
            <div className="rounded-xl border border-[#C9A45C]/25 bg-[#C9A45C]/[0.06] px-4 py-3 text-xs leading-relaxed text-[#C9CED6]">
              <span className="font-bold uppercase tracking-[0.12em] text-[#E8C97C]">Enforcement · </span>
              Active rules are applied live by the website itself — visitors hitting a
              redirected path land on the destination instantly (no extra history entry,
              301-style). For crawler-visible 301 status codes at the CDN edge, mirror the
              rule in <code className="rounded bg-black/40 px-1 py-px font-mono text-[10px] text-[#E8C97C]">vercel.json</code> too —
              the site's rules above always work for people regardless.
            </div>
          </div>
        )}
      </Card>

      {/* Create / edit modal */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? 'Edit redirect' : 'New redirect'}
        subtitle="Validation runs live against the redirects already in the database."
        footer={
          <>
            <Btn variant="ghost" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Btn>
            <Btn variant="gold" onClick={() => void save()} loading={saving} disabled={validation.errors.length > 0}>
              {editing ? 'Save changes' : 'Create redirect'}
            </Btn>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Source path" required hint="Exact path to redirect FROM. Must start with '/'.">
            <Input
              value={draft.source}
              onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))}
              placeholder="/old-page"
              className="font-mono text-xs"
              autoFocus
            />
          </Field>
          <Field label="Destination" required hint="Local path ('/pricing') or absolute http(s):// URL.">
            <Input
              value={draft.destination}
              onChange={(e) => setDraft((d) => ({ ...d, destination: e.target.value }))}
              placeholder="/"
              className="font-mono text-xs"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Redirect type" required>
              <Select value={String(draft.status)} onChange={(e) => setDraft((d) => ({ ...d, status: Number(e.target.value) as 301 | 302 }))} aria-label="Redirect type">
                <option value="301">301 — permanent (SEO)</option>
                <option value="302">302 — temporary</option>
              </Select>
            </Field>
            <div className="flex items-end gap-3 pb-1">
              <Toggle checked={draft.active} onChange={(v) => setDraft((d) => ({ ...d, active: v }))} label="Redirect active" />
              <span className="text-xs text-[#A7AFBA]">{draft.active ? 'Active — rule is enforced' : 'Inactive — rule stored but off'}</span>
            </div>
          </div>

          {/* Live validation panel */}
          <div aria-live="polite" className={cx('rounded-xl border p-3.5', validation.errors.length || validation.warnings.length ? 'border-white/[0.08] bg-white/[0.02]' : 'border-emerald-500/25 bg-emerald-500/[0.05]')}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#A7AFBA]">
              {validation.errors.length || validation.warnings.length ? 'Validation' : 'All checks passed'}
            </p>
            {validation.errors.length === 0 && validation.warnings.length === 0 && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">No duplicates, no loops, valid destination.</p>
            )}
            <ul className="flex flex-col gap-1.5">
              {validation.errors.map((m) => (
                <li key={m} className="flex items-start gap-1.5 text-xs font-semibold text-red-300"><TriangleAlert size={12} className="mt-0.5 shrink-0" /> {m}</li>
              ))}
              {validation.warnings.map((m) => (
                <li key={m} className="flex items-start gap-1.5 text-xs text-amber-300"><TriangleAlert size={12} className="mt-0.5 shrink-0" /> {m}</li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => void remove()}
        title="Delete redirect?"
        message={confirmDelete ? <>Delete <span className="font-mono text-[#E8C97C]">{confirmDelete.source}</span> → <span className="font-mono">{confirmDelete.destination}</span>? Visitors using the old URL will get a 404 again.</> : ''}
        confirmLabel="Delete redirect"
        danger
      />
    </div>
  );
};
