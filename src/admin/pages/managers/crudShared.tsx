// =============================================================================
// BRANIFY ADMIN — shared CRUD engine for the six content managers
// -----------------------------------------------------------------------------
// Server-driven list (search / filter / archived / sort / pagination) + create &
// edit modal with validation, SEO block, unsaved-changes guard + inline row
// actions (quick toggles, archive, reorder, delete). Each manager file is a
// thin typed CrudConfig.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive, ArchiveRestore, ChevronDown, ChevronUp, Pencil, Plus, Search, Trash2,
} from 'lucide-react';
import type { AdminPageProps } from '../../lib/auth';
import { AdminError, createRow, deleteRow, listRows, updateRow } from '../../lib/backend';
import type { CollectionKey, ListParams, SeoMeta } from '../../lib/types';
import { DataTable } from '../../ui/DataTable';
import type { Column } from '../../ui/DataTable';
import {
  Badge, Btn, Card, ChipsInput, ConfirmDialog, ErrorBlock, Field, Input,
  Modal, Select, Textarea, Toggle, cx, useToast,
} from '../../ui';
import { slugify } from '../../lib/format';

const PAGE_SIZE = 25;
const SLUG_RE = /^[a-z0-9-]+$/;
const TIME_KEYS = new Set(['created_at', 'updated_at', 'published_at']);

// ------------------------------------------------------------------ helpers
export const asStr = (v: unknown): string => (v === null || v === undefined ? '' : String(v));
const asBool = (v: unknown): boolean => Boolean(v);
const asArr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

export interface FieldOption {
  value: string;
  label: string;
}

export type FieldDef = {
  kind: 'text' | 'textarea' | 'number' | 'select' | 'toggle' | 'chips' | 'date' | 'code';
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** span both columns of the form grid */
  col?: 1 | 2;
  /** select options */
  options?: FieldOption[];
  /** textarea char counter maximum (renders x/max) */
  counter?: number;
  /** auto-generate this text field (slug) from another field while untouched */
  autoFrom?: string;
  rows?: number;
  minH?: string;
};

export interface InlineToggle<T> {
  title: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  activeWhen: (row: T) => boolean;
  payloadFor: (row: T) => Record<string, unknown>;
  success: (row: T) => string;
}

export interface CrudConfig<T extends { id: string; archived?: boolean }> {
  collection: CollectionKey;
  title: string;
  subtitle: string;
  /** singular entity label, e.g. "service" */
  entity: string;
  /** plural, e.g. "services" */
  plural: string;
  nameKey: string;
  slugKey?: string;
  modalWidth?: 'md' | 'lg' | 'xl';
  defaultSort: string;
  defaultDir?: 'asc' | 'desc';
  filter?: { param: string; label: string; options: FieldOption[] };
  columns: Column<T>[];
  fields: FieldDef[];
  /** renders the collapsible SEO block; keywords enables the keywords chips,
   *  ogImage enables the OG image input (stored as seo.og_image) */
  seo?: { keywords?: boolean; ogImage?: boolean };
  defaults: () => Record<string, unknown>;
  /** map the API row into form values (default: shallow copy + coercion) */
  rowToForm?: (row: T) => Record<string, unknown>;
  /** final tweak of the payload before it hits the API */
  payloadFrom?: (payload: Record<string, unknown>, mode: 'create' | 'edit') => Record<string, unknown>;
  /** collection has no `archived` column — hides archive UI and skips the filter */
  noArchive?: boolean;
  inlineToggles?: InlineToggle<T>[];
  emptyTitle?: string;
  emptyHint?: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
}

// ------------------------------------------------------------------ form value coercion
function normalizeFormValues(values: Record<string, unknown>, fields: FieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  const seo = (out.seo && typeof out.seo === 'object' ? out.seo : {}) as SeoMeta;
  out.seo = {
    title: asStr(seo.title),
    description: asStr(seo.description),
    keywords: asArr(seo.keywords),
  };
  // preserve the optional OG image slot across row→form normalization
  if (typeof (seo as { og_image?: unknown }).og_image === 'string') {
    (out.seo as Record<string, unknown>).og_image = (seo as { og_image: string }).og_image;
  }
  for (const f of fields) {
    if (f.kind === 'toggle') out[f.key] = asBool(out[f.key]);
    else if (f.kind === 'chips') out[f.key] = asArr(out[f.key]);
    else if (f.kind === 'date') out[f.key] = out[f.key] ? asStr(out[f.key]).slice(0, 10) : '';
    else out[f.key] = asStr(out[f.key]);
  }
  return out;
}

function defaultRowToForm<T extends { id: string; archived?: boolean }>(config: CrudConfig<T>, row: T): Record<string, unknown> {
  return normalizeFormValues(row as unknown as Record<string, unknown>, config.fields);
}

function buildPayload<T extends { id: string; archived?: boolean }>(
  config: CrudConfig<T>,
  form: Record<string, unknown>,
  mode: 'create' | 'edit',
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...form };
  for (const f of config.fields) {
    if (f.kind === 'number') payload[f.key] = Number(asStr(payload[f.key]).replace(',', '.')) || 0;
    else if (f.kind === 'toggle') payload[f.key] = asBool(payload[f.key]);
    else if (f.kind === 'chips') payload[f.key] = asArr(payload[f.key]);
    else if (f.kind === 'date') payload[f.key] = asStr(payload[f.key]) ? new Date(`${asStr(payload[f.key])}T00:00:00`).toISOString() : null;
    else payload[f.key] = asStr(payload[f.key]);
  }
  const seo = (form.seo && typeof form.seo === 'object' ? form.seo : {}) as SeoMeta;
  payload.seo = {
    title: asStr(seo.title).trim(),
    description: asStr(seo.description).trim(),
    keywords: asArr(seo.keywords).map((k) => k.trim()).filter(Boolean),
  };
  if (config.seo?.ogImage) {
    (payload.seo as Record<string, unknown>).og_image = asStr((seo as { og_image?: unknown }).og_image).trim();
  }
  return config.payloadFrom ? config.payloadFrom(payload, mode) : payload;
}

// ------------------------------------------------------------------ page factory
export function makeCrudPage<T extends { id: string; archived?: boolean }>(config: CrudConfig<T>): React.FC<AdminPageProps> {
  const plural = config.plural;

  const CrudPage: React.FC<AdminPageProps> = (props) => {
    const { push } = useToast();
    const [rows, setRows] = useState<T[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [filterVal, setFilterVal] = useState('');
    const [archivedMode, setArchivedMode] = useState<'active' | 'archived' | 'all'>('active');
    const [sort, setSort] = useState(config.defaultSort);
    const [dir, setDir] = useState<'asc' | 'desc'>(config.defaultDir || 'asc');
    const [busyId, setBusyId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<T | null>(null);
    const [deleting, setDeleting] = useState(false);
    // form modal
    const [formInitial, setFormInitial] = useState<Record<string, unknown> | null>(null);
    const [editing, setEditing] = useState<T | null>(null);

    // ?new=1 → auto-open the create form once the first load settles
    const [wantsNew] = useState(() => props.query.get('new') === '1');
    const openedNewRef = useRef(false);

    // debounced search (300ms)
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
        const params: ListParams = {
          page,
          pageSize: PAGE_SIZE,
          sort,
          dir,
          archived: config.noArchive || archivedMode === 'all' ? '' : archivedMode === 'archived',
        };
        if (search) params.search = search;
        if (config.filter && filterVal) params[config.filter.param] = filterVal;
        const res = await listRows<T>(config.collection, params);
        setRows(res.rows);
        setTotal(res.total);
        // clamp the page when the filtered result shrank
        if (res.rows.length === 0 && res.total > 0 && page > 1) {
          setPage(Math.max(1, Math.ceil(res.total / PAGE_SIZE)));
        }
      } catch (e) {
        setError(e instanceof AdminError ? e.message : (e as Error).message || 'Failed to load records.');
      } finally {
        setLoading(false);
      }
    }, [page, search, filterVal, archivedMode, sort, dir]);

    useEffect(() => {
      void load();
    }, [load]);

    const openCreate = useCallback(() => {
      setEditing(null);
      setFormInitial(normalizeFormValues(config.defaults(), config.fields));
    }, []);

    const openEdit = useCallback((row: T) => {
      setEditing(row);
      setFormInitial(config.rowToForm ? config.rowToForm(row) : defaultRowToForm(config, row));
    }, []);

    useEffect(() => {
      if (wantsNew && !openedNewRef.current && !loading && !error) {
        openedNewRef.current = true;
        openCreate();
      }
    }, [wantsNew, loading, error, openCreate]);

    const closeForm = useCallback(() => {
      setFormInitial(null);
      setEditing(null);
    }, []);

    const handleSaved = useCallback((_row: T, mode: 'create' | 'edit') => {
      closeForm();
      if (mode === 'create') setPage(1);
      void load({ quiet: true });
    }, [closeForm, load]);

    const toggleInline = useCallback(async (row: T, t: InlineToggle<T>) => {
      const payload = t.payloadFor(row);
      setBusyId(row.id);
      try {
        await updateRow<T>(config.collection, row.id, payload);
        setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...(payload as Partial<T>) } : r)));
        push('success', t.success(row));
      } catch (e) {
        push('error', e instanceof AdminError ? e.message : ((e as Error).message || 'Update failed.'));
      } finally {
        setBusyId(null);
      }
    }, [push]);

    const setArchived = useCallback(async (row: T, archived: boolean) => {
      setBusyId(row.id);
      try {
        await updateRow<T>(config.collection, row.id, { archived });
        push('success', `${config.entity} ${archived ? 'archived' : 'restored'}.`);
        await load({ quiet: true });
      } catch (e) {
        push('error', e instanceof AdminError ? e.message : ((e as Error).message || 'Update failed.'));
      } finally {
        setBusyId(null);
      }
    }, [config.collection, config.entity, load, push]);

    const doDelete = useCallback(async () => {
      if (!confirmDelete) return;
      setDeleting(true);
      try {
        await deleteRow(config.collection, confirmDelete.id);
        push('success', `${config.entity} permanently deleted.`);
        setConfirmDelete(null);
        await load({ quiet: true });
      } catch (e) {
        push('error', e instanceof AdminError ? e.message : ((e as Error).message || 'Delete failed.'));
      } finally {
        setDeleting(false);
      }
    }, [confirmDelete, config.collection, config.entity, load, push]);

    const handleSort = useCallback((key: string) => {
      if (sort === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      else {
        setSort(key);
        setDir(TIME_KEYS.has(key) ? 'desc' : 'asc');
      }
      setPage(1);
    }, [sort]);

    const move = useCallback(async (row: T, delta: -1 | 1) => {
      const i = rows.findIndex((r) => r.id === row.id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= rows.length) return;
      const a = rows[i] as unknown as { sort_order?: number };
      const b = rows[j] as unknown as { sort_order?: number };
      if (a.sort_order === b.sort_order) {
        push('info', 'Rows are already in the displayed order.');
        return;
      }
      setBusyId(row.id);
      try {
        await updateRow<T>(config.collection, rows[i].id, { sort_order: b.sort_order ?? j });
        await updateRow<T>(config.collection, rows[j].id, { sort_order: a.sort_order ?? i });
        push('success', 'Order updated.');
        await load({ quiet: true });
      } catch (e) {
        push('error', e instanceof AdminError ? e.message : ((e as Error).message || 'Reorder failed.'));
        await load({ quiet: true });
      } finally {
        setBusyId(null);
      }
    }, [rows, config.collection, load, push]);

    const canReorder = sort === 'sort_order' && dir === 'asc' && archivedMode !== 'archived';
    const hasFilters = Boolean(search) || Boolean(filterVal) || (!config.noArchive && archivedMode !== 'active');

    const actionsColumn: Column<T> = {
      key: '__actions',
      label: 'Actions',
      className: 'text-right whitespace-nowrap',
      render: (row) => {
        const idx = rows.findIndex((r) => r.id === row.id);
        const busy = busyId === row.id;
        return (
          <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
            {(config.inlineToggles || []).map((t) => {
              const Icon = t.icon;
              const on = t.activeWhen(row);
              return (
                <button
                  key={t.title}
                  type="button"
                  title={t.title}
                  aria-label={t.title}
                  aria-pressed={on}
                  disabled={busy}
                  onClick={() => void toggleInline(row, t)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-white/[0.07] disabled:opacity-40"
                >
                  <Icon size={14} className={on ? 'fill-[#E8C97C]/40 text-[#E8C97C]' : 'text-[#566072]'} />
                </button>
              );
            })}
            <button
              type="button"
              title={`Edit ${config.entity}`}
              aria-label={`Edit ${config.entity}`}
              disabled={busy}
              onClick={() => openEdit(row)}
              className="rounded-lg p-1.5 text-[#A7AFBA] transition-colors hover:bg-white/[0.07] hover:text-[#E9CF79] disabled:opacity-40"
            >
              <Pencil size={14} />
            </button>
            {!config.noArchive && (row.archived ? (
              <button
                type="button"
                title="Unarchive"
                aria-label="Unarchive"
                disabled={busy}
                onClick={() => void setArchived(row, false)}
                className="rounded-lg p-1.5 text-[#A7AFBA] transition-colors hover:bg-white/[0.07] hover:text-emerald-300 disabled:opacity-40"
              >
                <ArchiveRestore size={14} />
              </button>
            ) : (
              <button
                type="button"
                title="Archive"
                aria-label="Archive"
                disabled={busy}
                onClick={() => void setArchived(row, true)}
                className="rounded-lg p-1.5 text-[#A7AFBA] transition-colors hover:bg-white/[0.07] hover:text-amber-300 disabled:opacity-40"
              >
                <Archive size={14} />
              </button>
            ))}
            {canReorder && (
              <>
                <button
                  type="button"
                  title="Move up"
                  aria-label="Move up"
                  disabled={busy || idx <= 0}
                  onClick={() => void move(row, -1)}
                  className="rounded-lg p-1.5 text-[#A7AFBA] transition-colors hover:bg-white/[0.07] hover:text-[#E9CF79] disabled:opacity-25"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  title="Move down"
                  aria-label="Move down"
                  disabled={busy || idx < 0 || idx >= rows.length - 1}
                  onClick={() => void move(row, 1)}
                  className="rounded-lg p-1.5 text-[#A7AFBA] transition-colors hover:bg-white/[0.07] hover:text-[#E9CF79] disabled:opacity-25"
                >
                  <ChevronDown size={14} />
                </button>
              </>
            )}
            <button
              type="button"
              title="Delete permanently"
              aria-label="Delete permanently"
              disabled={busy}
              onClick={() => setConfirmDelete(row)}
              className="rounded-lg p-1.5 text-[#A7AFBA] transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      },
    };

    const columns = useMemo(() => [...config.columns, actionsColumn], [config.columns, actionsColumn, rows, busyId, canReorder]);

    const emptyTitle = hasFilters ? 'No matching records' : (config.emptyTitle || `No ${plural} yet`);
    const emptyHint = hasFilters
      ? 'Try a different search term or clear the filters.'
      : (config.emptyHint || `Create your first ${config.entity} to see it here.`);
    const emptyAction = (
      <Btn variant="gold" size="sm" icon={Plus} onClick={openCreate}>
        New {config.entity}
      </Btn>
    );

    return (
      <div className="flex flex-col gap-4">
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              {config.icon && <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9A45C]/30 bg-[#C9A45C]/[0.08]"><config.icon size={15} className="text-[#E8C97C]" /></span>}
              <h2 className="font-display text-lg font-bold text-[#F5F6F2]">{config.title}</h2>
              <Badge tone="gold">{total.toLocaleString()}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-[#A7AFBA]">{config.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#566072]" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={`Search ${plural}…`}
                aria-label={`Search ${plural}`}
                className="h-9 w-48 pl-9 sm:w-60"
              />
            </div>
            {config.filter && (
              <Select
                value={filterVal}
                onChange={(e) => { setFilterVal(e.target.value); setPage(1); }}
                aria-label={`Filter ${plural}`}
                className="h-9 w-44"
              >
                <option value="">{config.filter.label}: all</option>
                {config.filter.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            )}
            {!config.noArchive && (
              <Select
                value={archivedMode}
                onChange={(e) => { setArchivedMode(e.target.value as 'active' | 'archived' | 'all'); setPage(1); }}
                aria-label="Show archived"
                className="h-9 w-36"
              >
                <option value="active">Active only</option>
                <option value="archived">Archived</option>
                <option value="all">All records</option>
              </Select>
            )}
            <Btn variant="gold" icon={Plus} onClick={openCreate}>New {config.entity}</Btn>
          </div>
        </div>

        {/* list */}
        {error ? (
          <ErrorBlock
            title={`Failed to load ${plural}`}
            message={error}
            onRetry={() => void load()}
          />
        ) : (
          <Card bodyClass="pt-1">
            <DataTable<T>
              columns={columns}
              rows={rows}
              loading={loading}
              total={total}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              sort={sort}
              dir={dir}
              onSort={handleSort}
              emptyTitle={emptyTitle}
              emptyHint={emptyHint}
              emptyAction={emptyAction}
              dense
            />
          </Card>
        )}

        {/* create / edit form */}
        {formInitial !== null && (
          <CrudFormModal<T>
            key={editing?.id || '__new__'}
            config={config}
            initial={formInitial}
            editingId={editing?.id || null}
            editingSlug={editing ? asStr((editing as unknown as Record<string, unknown>)[config.slugKey || '']) : ''}
            onClose={closeForm}
            onSaved={handleSaved}
          />
        )}

        {/* delete confirmation */}
        <ConfirmDialog
          open={confirmDelete !== null}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => void doDelete()}
          title={`Delete ${config.entity}?`}
          message={(
            <>
              <p>
                This will <strong>permanently delete</strong> “{confirmDelete ? asStr((confirmDelete as unknown as Record<string, unknown>)[config.nameKey]) : ''}”.
              </p>
              <p className="mt-2 text-xs text-[#A7AFBA]">
                If this record may be referenced by the public site, prefer <strong>Archive</strong> instead — archived records are hidden but recoverable.
              </p>
            </>
          )}
          confirmLabel="Delete forever"
          danger
          loading={deleting}
        />
      </div>
    );
  };

  return CrudPage;
}

// ==============================================================================
// CREATE / EDIT FORM MODAL
// ==============================================================================
interface FormModalProps<T extends { id: string; archived?: boolean }> {
  config: CrudConfig<T>;
  initial: Record<string, unknown>;
  editingId: string | null;
  editingSlug: string;
  onClose: () => void;
  onSaved: (row: T, mode: 'create' | 'edit') => void;
}

function CrudFormModal<T extends { id: string; archived?: boolean }>({ config, initial, editingId, editingSlug, onClose, onSaved }: FormModalProps<T>) {
  const { push } = useToast();
  const [form, setForm] = useState<Record<string, unknown>>(initial);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const slugTouchedRef = useRef(Boolean(editingId && editingSlug));

  const initialJson = useMemo(() => JSON.stringify(initial), [initial]);
  const dirty = useMemo(() => JSON.stringify(form) !== initialJson, [form, initialJson]);

  const slugField = useMemo(() => config.fields.find((f) => f.autoFrom), [config.fields]);

  const setField = useCallback((key: string, value: unknown) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (slugField && slugField.autoFrom === key && !slugTouchedRef.current) {
        next[slugField.key] = slugify(String(value));
      }
      return next;
    });
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }, [slugField]);

  const setSeo = useCallback((patch: Partial<SeoMeta>) => {
    setForm((f) => ({ ...f, seo: { ...(f.seo as SeoMeta), ...patch } }));
  }, []);

  const validate = useCallback((): Record<string, string> => {
    const errs: Record<string, string> = {};
    for (const f of config.fields) {
      const v = form[f.key];
      if (f.required && asStr(v).trim() === '') errs[f.key] = `${f.label} is required.`;
    }
    if (config.slugKey) {
      const v = asStr(form[config.slugKey]).trim();
      if (!v) errs[config.slugKey] = 'Slug is required.';
      else if (!SLUG_RE.test(v)) errs[config.slugKey] = 'Lowercase letters, numbers and dashes only.';
    }
    return errs;
  }, [config.fields, config.slugKey, form]);

  const requestClose = useCallback(() => {
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }, [dirty, onClose]);

  const submit = useCallback(async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      setFormError('Please fix the highlighted fields.');
      push('error', 'Please fix the highlighted fields.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const payload = buildPayload(config, form, editingId ? 'edit' : 'create');
      const saved = editingId
        ? await updateRow<T>(config.collection, editingId, payload)
        : await createRow<T>(config.collection, payload);
      push('success', editingId ? `${config.entity} saved.` : `${config.entity} created.`);
      onSaved(saved, editingId ? 'edit' : 'create');
    } catch (e) {
      const msg = e instanceof AdminError ? e.message : ((e as Error).message || 'Save failed.');
      setFormError(msg);
      push('error', msg);
    } finally {
      setSaving(false);
    }
  }, [config, editingId, form, onSaved, push, validate]);

  const seo = (form.seo && typeof form.seo === 'object' ? form.seo : {}) as SeoMeta;
  const seoFilled = Boolean(asStr(seo.title) || asStr(seo.description) || asArr(seo.keywords).length);
  const nameValue = asStr(form[config.nameKey]);

  const spanCls = (f: FieldDef) => (f.col === 2 ? 'sm:col-span-2' : '');

  const renderField = (f: FieldDef) => {
    switch (f.kind) {
      case 'text':
        return (
          <Field key={f.key} label={f.label} required={f.required} hint={f.hint} error={errors[f.key]} className={spanCls(f)}>
            <Input
              value={asStr(form[f.key])}
              onChange={(e) => {
                if (f.autoFrom) slugTouchedRef.current = true;
                setField(f.key, e.target.value);
              }}
              placeholder={f.placeholder}
            />
          </Field>
        );
      case 'textarea':
        return (
          <Field
            key={f.key}
            label={f.label}
            required={f.required}
            hint={f.hint}
            error={errors[f.key]}
            counter={f.counter ? `${asStr(form[f.key]).length}/${f.counter}` : undefined}
            className={spanCls(f)}
          >
            <Textarea
              value={asStr(form[f.key])}
              onChange={(e) => setField(f.key, e.target.value)}
              placeholder={f.placeholder}
              rows={f.rows}
              className={f.minH}
            />
          </Field>
        );
      case 'code':
        return <CodeArea key={f.key} field={f} value={asStr(form[f.key])} error={errors[f.key]} onChange={(v) => setField(f.key, v)} />;
      case 'number':
        return (
          <Field key={f.key} label={f.label} hint={f.hint} error={errors[f.key]} className={spanCls(f)}>
            <Input
              type="number"
              step="any"
              value={asStr(form[f.key])}
              onChange={(e) => setField(f.key, e.target.value)}
              placeholder={f.placeholder}
              style={{ colorScheme: 'dark' }}
            />
          </Field>
        );
      case 'select':
        return (
          <Field key={f.key} label={f.label} required={f.required} hint={f.hint} error={errors[f.key]} className={spanCls(f)}>
            <Select value={asStr(form[f.key])} onChange={(e) => setField(f.key, e.target.value)}>
              {(f.options || []).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
        );
      case 'toggle':
        return (
          <div key={f.key} className={spanCls(f)}>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]">{f.label}</span>
            <div className="flex items-center gap-2.5">
              <Toggle checked={asBool(form[f.key])} onChange={(v) => setField(f.key, v)} label={f.label} />
              <span className={cx('text-xs font-semibold', asBool(form[f.key]) ? 'text-[#E8C97C]' : 'text-[#6B7280]')}>
                {asBool(form[f.key]) ? 'On' : 'Off'}
              </span>
            </div>
            {f.hint && <p className="mt-1 text-[11px] text-[#6B7280]">{f.hint}</p>}
          </div>
        );
      case 'chips':
        return (
          <div key={f.key} className={spanCls(f)}>
            <ChipsInput
              value={asArr(form[f.key])}
              onChange={(v) => setField(f.key, v)}
              label={f.label}
              hint={f.hint}
              placeholder={f.placeholder}
            />
          </div>
        );
      case 'date':
        return (
          <Field key={f.key} label={f.label} hint={f.hint} error={errors[f.key]} className={spanCls(f)}>
            <Input
              type="date"
              value={asStr(form[f.key])}
              onChange={(e) => setField(f.key, e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </Field>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        open
        onClose={requestClose}
        width={config.modalWidth || 'lg'}
        title={editingId ? `Edit ${config.entity}` : `New ${config.entity}`}
        subtitle={editingId ? (config.slugKey ? `/${editingSlug || asStr(form[config.slugKey])}` : nameValue) : `Add a new ${config.entity} — it goes live once saved.`}
        footer={(
          <>
            <Btn variant="ghost" onClick={requestClose} disabled={saving}>Cancel</Btn>
            <Btn variant="gold" onClick={() => void submit()} loading={saving}>
              {editingId ? 'Save changes' : `Create ${config.entity}`}
            </Btn>
          </>
        )}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); void submit(); }}
          className="flex flex-col gap-5"
        >
          {formError && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/[0.07] px-3 py-2 text-xs font-semibold text-red-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {config.fields.map(renderField)}
          </div>

          {config.seo && (
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => setSeoOpen((s) => !s)}
                aria-expanded={seoOpen}
                className="flex w-full items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 transition-colors hover:border-[#C9A45C]/35"
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#A7AFBA]">SEO</span>
                <span className="flex items-center gap-2">
                  {seoFilled && <Badge tone="gold">Custom</Badge>}
                  <ChevronDown size={14} className={cx('text-[#A7AFBA] transition-transform', seoOpen && 'rotate-180')} />
                </span>
              </button>
              {seoOpen && (
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="SEO title" counter={`${asStr(seo.title).length}/60`} hint="Meta title override (aim for ≤ 60 characters).">
                    <Input value={asStr(seo.title)} onChange={(e) => setSeo({ title: e.target.value })} maxLength={120} />
                  </Field>
                  <Field label="SEO description" counter={`${asStr(seo.description).length}/160`} hint="Meta description override (aim for ≤ 160 characters).">
                    <Textarea
                      value={asStr(seo.description)}
                      onChange={(e) => setSeo({ description: e.target.value })}
                      className="min-h-[70px]"
                      maxLength={320}
                    />
                  </Field>
                  {config.seo.keywords && (
                    <div className="sm:col-span-2">
                      <ChipsInput
                        label="SEO keywords"
                        value={asArr(seo.keywords)}
                        onChange={(v) => setSeo({ keywords: v })}
                        hint="Press Enter or comma to add each keyword."
                      />
                    </div>
                  )}
                  {config.seo.ogImage && (
                    <Field
                      label="OG image"
                      hint="Social share image (Open Graph) — stored with the SEO meta."
                      className="sm:col-span-2"
                    >
                      <Input
                        value={asStr((seo as { og_image?: unknown }).og_image)}
                        onChange={(e) => setSeo({ og_image: e.target.value })}
                        placeholder="https://… or /templates/…"
                      />
                    </Field>
                  )}
                </div>
              )}
            </div>
          )}

          {/* hidden submit so Enter saves */}
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); onClose(); }}
        title="Discard changes?"
        message="You have unsaved changes in this form. Closing now will discard them."
        confirmLabel="Discard changes"
        danger
      />
    </>
  );
}

// ------------------------------------------------------------------ markdown/mono textarea (blog content)
const CodeArea: React.FC<{
  field: FieldDef;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}> = ({ field, value, error, onChange }) => {
  const [mono, setMono] = useState(true);
  return (
    <Field
      label={field.label}
      required={field.required}
      hint={field.hint}
      error={error}
      counter={field.counter ? `${value.length}/${field.counter}` : undefined}
      className="sm:col-span-2"
    >
      <div className="mb-1.5 flex justify-end">
        <button
          type="button"
          onClick={() => setMono((m) => !m)}
          className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#A7AFBA] transition-colors hover:border-[#C9A45C]/40 hover:text-[#E8C97C]"
          aria-pressed={mono}
        >
          {mono ? 'Monospace' : 'Proportional'}
        </button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={field.rows}
        className={cx('min-h-64 leading-relaxed', mono && 'font-mono text-xs')}
      />
    </Field>
  );
};
