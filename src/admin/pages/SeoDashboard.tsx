// =============================================================================
// BRANIFY ADMIN — SEO CENTER (/admin/seo)
// -----------------------------------------------------------------------------
// Real SEO audit over the site's REAL public route inventory (built from the
// live content collections), per-page SEO overrides with upsert semantics,
// live Google/OG previews and technical quick-checks (robots.txt, sitemap.xml).
// Pure audit logic lives in ./seoShared.ts.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, ChevronRight, ExternalLink, FileSearch, Globe,
  RefreshCw, Search, Trash2, XCircle,
} from 'lucide-react';
import type { AdminPageProps } from '../lib/auth';
import { createRow, deleteRow, getSettings, listRows, resolveAssetUrl } from '../lib/backend';
import type {
  AiToolRow, BlogRow, CollectionKey, PortfolioRow, ProductRow, SeoOverrideRow,
  ServiceRow, SiteSettings, ToolRow,
} from '../lib/types';
import {
  Badge, Btn, Card, ConfirmDialog, ErrorBlock, Field, Input, LoadingBlock,
  Modal, Select, Textarea, cx, useToast,
} from '../ui';
import { HealthRing, HBars, StatTile } from '../ui/charts';
import { DataTable } from '../ui/DataTable';
import type { Column } from '../ui/DataTable';
import { truncate } from '../lib/format';
import {
  auditPages, buildPageInventory, isNoindex, PAGE_KIND_LABEL, parseSitemapXml, resolveSeo,
} from './seoShared';
import type { AuditReport, ContentRowLike, PageMeta, ResolvedSeo, SeoSource } from './seoShared';

// ------------------------------------------------------------------ helpers
/** Fetch every row of a collection (pageSize 200 per call — real server paging). */
async function listAll<T>(key: CollectionKey): Promise<T[]> {
  const pageSize = 200;
  let page = 1;
  const all: T[] = [];
  for (;;) {
    const res = await listRows<T>(key, { page, pageSize });
    all.push(...res.rows);
    if (res.rows.length === 0 || all.length >= res.total) break;
    page += 1;
    if (page > 6) break; // safety valve
  }
  return all;
}

const SOURCE_BADGE: Record<SeoSource, { tone: 'gold' | 'steel' | 'zinc' | 'violet'; label: string }> = {
  override: { tone: 'gold', label: 'Custom override' },
  content: { tone: 'steel', label: 'Content SEO' },
  auto: { tone: 'zinc', label: 'Auto' },
  global: { tone: 'violet', label: 'Global' },
};

const lenTone = (len: number, min: number, max: number): string =>
  len >= min && len <= max ? 'text-emerald-400' : 'text-amber-400';

interface ContentRows {
  services: ContentRowLike[];
  tools: ContentRowLike[];
  aiTools: ContentRowLike[];
  products: ContentRowLike[];
  blog: ContentRowLike[];
  portfolio: ContentRowLike[];
}

interface AuditRow extends ResolvedSeo {
  id: string;
  status: 'pass' | 'warning' | 'error';
  issueCount: { w: number; e: number };
  issueHint: string;
}

interface TechChecks {
  robotsOk: boolean | null;
  robotsHasSitemap: boolean | null;
  sitemapOk: boolean | null;
  sitemapUrls: number;
  sitemapLastmod: string | null;
}

function toAuditRows(inventory: PageMeta[], overrides: SeoOverrideRow[], settings: SiteSettings | null, report: AuditReport): AuditRow[] {
  const byPath = new Map<string, SeoOverrideRow>();
  for (const o of overrides) if (o?.page_path) byPath.set(o.page_path, o);
  const auditByPath = new Map(report.pages.map((p) => [p.path, p]));
  return inventory.map((page) => {
    const resolved = resolveSeo(page, byPath.get(page.path), settings);
    const audit = auditByPath.get(page.path);
    const issues = audit?.issues || [];
    return {
      ...resolved,
      id: page.path,
      status: audit?.status || 'pass',
      issueCount: {
        w: issues.filter((i) => i.level === 'warning').length,
        e: issues.filter((i) => i.level === 'error').length,
      },
      issueHint: issues.map((i) => `${i.level === 'error' ? 'E' : 'W'}: ${i.message}`).join('\n'),
    };
  });
}

// =====================================================================
// SEO EDITOR MODAL
// =====================================================================
interface EditorDraft {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twTitle: string;
  twDescription: string;
  twImage: string;
  schema: string;
}

const ROBOTS_OPTIONS = ['index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow'];

const SeoEditorModal: React.FC<{
  path: string | null;
  overrides: SeoOverrideRow[];
  resolvedByPath: Map<string, ResolvedSeo>;
  onClose: () => void;
  onMutated: () => void;
}> = ({ path, overrides, resolvedByPath, onClose, onMutated }) => {
  const { push } = useToast();
  const [draft, setDraft] = useState<EditorDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [ogBroken, setOgBroken] = useState(false);
  const dirtyRef = useRef(false);

  const override = useMemo(() => overrides.find((o) => o.page_path === path) || null, [overrides, path]);
  const resolved = path ? resolvedByPath.get(path) : undefined;

  useEffect(() => {
    if (!path) { setDraft(null); dirtyRef.current = false; return; }
    const r = resolvedByPath.get(path);
    const o = overrides.find((x) => x.page_path === path) || null;
    setDraft({
      title: o?.title || r?.title || '',
      description: o?.description || r?.description || '',
      canonical: o?.canonical || '',
      robots: o?.robots || 'index,follow',
      ogTitle: o?.og?.title || '',
      ogDescription: o?.og?.description || '',
      ogImage: o?.og?.image || '',
      twTitle: o?.twitter?.title || '',
      twDescription: o?.twitter?.description || '',
      twImage: o?.twitter?.image || '',
      schema: o?.schema_json ? JSON.stringify(o.schema_json, null, 2) : '',
    });
    dirtyRef.current = false;
    setOgBroken(false);
  }, [path, overrides, resolvedByPath]);

  const set = (patch: Partial<EditorDraft>) => {
    dirtyRef.current = true;
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const schemaError = useMemo(() => {
    if (!draft || !draft.schema.trim()) return null;
    try { JSON.parse(draft.schema); return null; } catch (e) { return `Invalid JSON: ${(e as Error).message}`; }
  }, [draft]);

  const requestClose = () => {
    if (dirtyRef.current) setConfirmDiscard(true);
    else onClose();
  };

  const save = async () => {
    if (!path || !draft) return;
    setSaving(true);
    try {
      let schema: unknown = null;
      if (draft.schema.trim()) {
        try { schema = JSON.parse(draft.schema); } catch { push('error', 'schema_json is not valid JSON.'); setSaving(false); return; }
      }
      await createRow('seo_overrides', {
        page_path: path,
        title: draft.title.trim(),
        description: draft.description.trim(),
        canonical: draft.canonical.trim(),
        robots: draft.robots,
        og: { title: draft.ogTitle.trim(), description: draft.ogDescription.trim(), image: draft.ogImage.trim() },
        twitter: { title: draft.twTitle.trim(), description: draft.twDescription.trim(), image: draft.twImage.trim() },
        schema_json: schema,
      });
      push('success', 'SEO override saved');
      dirtyRef.current = false;
      onMutated();
    } catch (e) {
      push('error', `Save failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const removeOverride = async () => {
    if (!override) return;
    setSaving(true);
    try {
      await deleteRow('seo_overrides', override.id);
      push('success', 'Override removed — page restored to automatic SEO');
      dirtyRef.current = false;
      setConfirmRemove(false);
      onMutated();
    } catch (e) {
      push('error', `Remove failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const previewTitle = draft?.title || (resolved?.title ?? '');
  const previewDesc = draft?.description || (resolved?.description ?? '');
  const previewImage = draft?.ogImage || resolved?.ogImage || '';

  return (
    <>
      <Modal
        open={Boolean(path)}
        onClose={requestClose}
        width="lg"
        title={path ? <>SEO Editor · <span className="font-mono text-sm text-[#E8C97C]">{path}</span></> : 'SEO Editor'}
        subtitle={
          override
            ? 'This page has a CUSTOM OVERRIDE stored in seo_overrides.'
            : 'No override yet — fields are pre-filled with the currently resolved automatic SEO.'
        }
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {override ? (
                <Btn variant="danger" size="sm" icon={Trash2} onClick={() => setConfirmRemove(true)} disabled={saving}>
                  Remove override (restore automatic)
                </Btn>
              ) : (
                <Badge tone="zinc">Auto generated</Badge>
              )}
              {override && <Badge tone="gold">Custom override</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Btn variant="ghost" onClick={requestClose} disabled={saving}>Cancel</Btn>
              <Btn variant="gold" onClick={save} loading={saving} disabled={Boolean(schemaError)}>Save override</Btn>
            </div>
          </div>
        }
      >
        {!draft || !path ? null : (
          <div className="flex flex-col gap-5">
            <Field label="Page path">
              <Input value={path} readOnly className="font-mono text-xs" aria-label="Page path (read-only)" />
            </Field>

            <Field label="Meta title" counter={`${draft.title.length}/60`} hint="Aim for 30–60 characters.">
              <Input value={draft.title} onChange={(e) => set({ title: e.target.value })} maxLength={180} placeholder="Page title" />
            </Field>
            <div className={cx('-mt-3 h-1 rounded-full bg-white/[0.06]')}>
              <div
                className={cx('h-1 rounded-full transition-all', draft.title.length > 60 || draft.title.length < 30 ? 'bg-amber-400/70' : 'bg-emerald-400/70')}
                style={{ width: `${Math.min(100, (draft.title.length / 60) * 100)}%` }}
              />
            </div>

            <Field label="Meta description" counter={`${draft.description.length}/160`} hint="Aim for 50–160 characters.">
              <Textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} maxLength={400} rows={3} placeholder="Page description shown in search results" />
            </Field>
            <div className="-mt-3 h-1 rounded-full bg-white/[0.06]">
              <div
                className={cx('h-1 rounded-full transition-all', draft.description.length > 160 || draft.description.length < 50 ? 'bg-amber-400/70' : 'bg-emerald-400/70')}
                style={{ width: `${Math.min(100, (draft.description.length / 160) * 100)}%` }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Canonical URL" hint="Leave empty to auto-use site URL + path.">
                <Input value={draft.canonical} onChange={(e) => set({ canonical: e.target.value })} placeholder={`${origin}${path}`} className="font-mono text-xs" />
              </Field>
              <Field label="Robots directive">
                <Select value={draft.robots} onChange={(e) => set({ robots: e.target.value })} aria-label="Robots directive">
                  {(ROBOTS_OPTIONS.includes(draft.robots) ? ROBOTS_OPTIONS : [draft.robots, ...ROBOTS_OPTIONS]).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="og:title"><Input value={draft.ogTitle} onChange={(e) => set({ ogTitle: e.target.value })} placeholder="Defaults to meta title" /></Field>
              <Field label="og:image" hint="Used by link previews.">
                <Input value={draft.ogImage} onChange={(e) => { set({ ogImage: e.target.value }); setOgBroken(false); }} placeholder="/og/home.jpg" className="font-mono text-xs" />
              </Field>
              <Field label="og:description" className="sm:col-span-2">
                <Textarea value={draft.ogDescription} onChange={(e) => set({ ogDescription: e.target.value })} rows={2} placeholder="Defaults to meta description" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="twitter:title"><Input value={draft.twTitle} onChange={(e) => set({ twTitle: e.target.value })} /></Field>
              <Field label="twitter:description"><Input value={draft.twDescription} onChange={(e) => set({ twDescription: e.target.value })} /></Field>
              <Field label="twitter:image"><Input value={draft.twImage} onChange={(e) => set({ twImage: e.target.value })} className="font-mono text-xs" /></Field>
            </div>

            <Field
              label="schema_json (JSON-LD)"
              error={schemaError || undefined}
              hint="Optional structured data object. Validated as JSON before saving."
            >
              <Textarea
                value={draft.schema}
                onChange={(e) => set({ schema: e.target.value })}
                rows={4}
                className="font-mono text-xs"
                placeholder={'{ "@context": "https://schema.org", "@type": "WebPage" }'}
                spellCheck={false}
              />
            </Field>

            {/* Live previews */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#04070C] p-4">
                <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                  <Search size={11} /> Google result preview
                </p>
                <p className="truncate text-xs text-[#8AB4C8]">{origin}{path}</p>
                <p className="mt-1 line-clamp-2 text-[19px] font-medium leading-snug text-[#F5F6F2]">{previewTitle || '(no title)'}</p>
                <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-[#A7AFBA]">{previewDesc || '(no description)'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#04070C] p-4">
                <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                  <Globe size={11} /> Social share (OG) preview
                </p>
                <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
                  {previewImage && !ogBroken ? (
                    <img
                      src={resolveAssetUrl(previewImage)}
                      alt="Open Graph preview"
                      className="h-full w-full object-cover"
                      onError={() => setOgBroken(true)}
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#566072]">
                      <Globe size={18} /> {previewImage ? 'Image failed to load' : 'No og:image set'}
                    </span>
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-[#F5F6F2]">{draft.ogTitle || previewTitle || '(og title)'}</p>
                <p className="line-clamp-2 text-xs text-[#A7AFBA]">{draft.ogDescription || previewDesc || '(og description)'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); dirtyRef.current = false; onClose(); }}
        title="Discard unsaved changes?"
        message="You edited SEO fields for this page but have not saved the override. Closing now will lose your edits."
        confirmLabel="Discard"
        danger
      />
      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={removeOverride}
        title="Remove SEO override?"
        message={`This deletes the stored override for ${path || 'this page'} and the page falls back to its content SEO / automatic generation. The public page keeps working.`}
        confirmLabel="Remove override"
        danger
        loading={saving}
      />
    </>
  );
};

// =====================================================================
// PAGE
// =====================================================================
export const SeoDashboard: React.FC<AdminPageProps> = ({ query }) => {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [content, setContent] = useState<ContentRows | null>(null);
  const [overrides, setOverrides] = useState<SeoOverrideRow[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [tech, setTech] = useState<TechChecks | null>(null);
  const [editorPath, setEditorPath] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pass' | 'warning' | 'error'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // ---- deep link ?page=/about → auto-open the editor for that path
  const deepLinkHandled = useRef<string | null>(null);
  useEffect(() => {
    const target = query.get('page');
    if (target && target !== deepLinkHandled.current) deepLinkHandled.current = target;
  }, [query]);
  useEffect(() => {
    if (deepLinkHandled.current && report && !editorPath) {
      const wanted = deepLinkHandled.current;
      if (report.pages.some((p) => p.path === wanted)) setEditorPath(wanted);
    }
  }, [report, editorPath]);

  const compute = useCallback((rows: ContentRows, ovr: SeoOverrideRow[], st: SiteSettings | null) => {
    const inventory = buildPageInventory(rows);
    const byPath = new Map<string, SeoOverrideRow>();
    for (const o of ovr) if (o?.page_path) byPath.set(o.page_path, o);
    const resolved = inventory.map((p) => resolveSeo(p, byPath.get(p.path), st));
    return { inventory, report: auditPages(resolved) };
  }, []);

  const runAudit = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); }
    setError(null);
    try {
      const [services, tools, aiTools, products, blog, portfolio, ovr, st] = await Promise.all([
        listAll<ServiceRow>('services'),
        listAll<ToolRow>('tools'),
        listAll<AiToolRow>('ai_tools'),
        listAll<ProductRow>('products'),
        listAll<BlogRow>('blog_posts'),
        listAll<PortfolioRow>('portfolio_projects'),
        listAll<SeoOverrideRow>('seo_overrides'),
        getSettings(),
      ]);
      const rows: ContentRows = { services, tools, aiTools, products, blog, portfolio };
      setContent(rows);
      setOverrides(ovr);
      setSettings(st);
      const { report: rep } = compute(rows, ovr, st);
      setReport(rep);
    } catch (e) {
      setError({ title: 'SEO audit failed', message: (e as Error).message || 'Could not load content collections.' });
    } finally {
      setLoading(false);
    }
  }, [compute]);

  useEffect(() => { void runAudit(); }, [runAudit]);

  // ---- real technical quick-checks (robots.txt / sitemap.xml)
  const refreshTech = useCallback(async () => {
    const out: TechChecks = { robotsOk: null, robotsHasSitemap: null, sitemapOk: null, sitemapUrls: 0, sitemapLastmod: null };
    try {
      const res = await fetch('/robots.txt');
      out.robotsOk = res.ok;
      const txt = res.ok ? await res.text() : '';
      out.robotsHasSitemap = /sitemap:/i.test(txt);
    } catch { out.robotsOk = false; out.robotsHasSitemap = false; }
    try {
      const res = await fetch('/sitemap.xml');
      out.sitemapOk = res.ok;
      const xml = res.ok ? await res.text() : '';
      const parsed = parseSitemapXml(xml);
      out.sitemapUrls = parsed.locs.length;
      out.sitemapLastmod = parsed.lastmods[0] || null;
    } catch { out.sitemapOk = false; out.sitemapUrls = 0; }
    setTech(out);
  }, []);
  useEffect(() => { void refreshTech(); }, [refreshTech]);

  const model = useMemo(() => {
    if (!content || !settings || !report) return null;
    return compute(content, overrides, settings);
  }, [content, settings, overrides, report, compute]);

  const rows: AuditRow[] = useMemo(() => {
    if (!model) return [];
    return toAuditRows(model.inventory, overrides, settings, model.report);
  }, [model, overrides, settings]);

  const resolvedByPath = useMemo(() => {
    const m = new Map<string, ResolvedSeo>();
    for (const r of rows) m.set(r.path, r);
    return m;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!q) return true;
      return r.path.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || PAGE_KIND_LABEL[r.kind].toLowerCase().includes(q);
    });
  }, [rows, filter, search]);

  useEffect(() => { setPage(1); }, [filter, search]);

  const pageSize = 15;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const indexableCount = rows.filter((r) => !isNoindex(r.robots)).length;
  const overrideCount = overrides.length;

  const columns: Column<AuditRow>[] = [
    {
      key: 'path',
      label: 'Path',
      sortable: false,
      render: (r) => (
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-mono text-xs text-[#E8C97C]" title={r.path}>{r.path}</span>
          <a
            href={r.path}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${r.path} on the public site`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-[#566072] transition-colors hover:text-[#E8C97C]"
          >
            <ExternalLink size={12} />
          </a>
        </span>
      ),
    },
    { key: 'kind', label: 'Kind', hideOnMobile: true, render: (r) => <Badge tone="zinc">{PAGE_KIND_LABEL[r.kind]}</Badge> },
    { key: 'source', label: 'Source', render: (r) => <Badge tone={SOURCE_BADGE[r.source].tone}>{SOURCE_BADGE[r.source].label}</Badge> },
    {
      key: 'title',
      label: 'Title',
      hideOnMobile: true,
      render: (r) => (
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-[#C9CED6]" title={r.title}>{truncate(r.title, 44) || '—'}</span>
          <span className={cx('shrink-0 text-[10px] font-bold tabular-nums', lenTone(r.title.length, 30, 60))}>{r.title.length}</span>
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Desc',
      hideOnMobile: true,
      render: (r) => (
        <span className={cx('text-xs font-bold tabular-nums', lenTone(r.description.length, 50, 160))} title={r.description}>
          {r.description.length}
        </span>
      ),
    },
    {
      key: 'issues',
      label: 'Issues',
      render: (r) => {
        if (!r.issueCount.w && !r.issueCount.e) return <span className="text-xs text-[#566072]">—</span>;
        return (
          <span className="flex items-center gap-1" title={r.issueHint}>
            {r.issueCount.e > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-md border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
                <XCircle size={10} /> {r.issueCount.e}
              </span>
            )}
            {r.issueCount.w > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                <AlertTriangle size={10} /> {r.issueCount.w}
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: 'robots',
      label: 'Robots',
      hideOnMobile: true,
      render: (r) => (
        <span className={cx('font-mono text-[11px]', isNoindex(r.robots) ? 'text-amber-300' : 'text-[#6B7280]')}>{r.robots}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <Badge tone={r.status === 'pass' ? 'green' : r.status === 'warning' ? 'amber' : 'red'}>
          {r.status === 'pass' ? 'PASS' : r.status === 'warning' ? 'WARNING' : 'ERROR'}
        </Badge>
      ),
    },
    { key: 'go', label: '', render: () => <ChevronRight size={14} className="text-[#566072]" /> },
  ];

  const mobileCard = (r: AuditRow) => (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-xs text-[#E8C97C]">{r.path}</span>
        <Badge tone={r.status === 'pass' ? 'green' : r.status === 'warning' ? 'amber' : 'red'}>{r.status.toUpperCase()}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={SOURCE_BADGE[r.source].tone}>{SOURCE_BADGE[r.source].label}</Badge>
        <Badge tone="zinc">{PAGE_KIND_LABEL[r.kind]}</Badge>
        {(r.issueCount.w > 0 || r.issueCount.e > 0) && (
          <span className="text-[10px] font-bold text-amber-300">{r.issueCount.w} W · {r.issueCount.e} E</span>
        )}
      </div>
      <p className="truncate text-xs text-[#A7AFBA]">{r.title} <span className="text-[#566072]">({r.title.length})</span></p>
    </div>
  );

  // ---------------------------------------------------------------- render
  if (loading && !report) return <LoadingBlock label="Crawling site inventory and running SEO audit…" />;

  if (error) {
    return <ErrorBlock title={error.title} message={error.message} onRetry={() => void runAudit()} />;
  }

  const s = report?.summary;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[#F5F6F2]">SEO Center</h1>
          <p className="text-xs text-[#A7AFBA]">Real audit across the live site inventory · page-level overrides · technical checks</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="outline" size="sm" icon={RefreshCw} onClick={() => void runAudit()} loading={loading}>Re-run audit</Btn>
          <Btn variant="subtle" size="sm" icon={FileSearch} onClick={() => window.location.assign('/admin/seo/sitemap')}>Sitemap center</Btn>
        </div>
      </div>

      {/* Health + stat tiles */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <Card className="flex items-center justify-center gap-5 lg:w-auto" bodyClass="flex items-center justify-center gap-6 py-4">
          <HealthRing value={s?.score ?? 0} label="SEO score" sub={s ? `${s.total} pages` : ''} />
          <div className="w-44">
            <HBars
              items={[
                { label: 'Pass', value: s?.pass ?? 0, color: 'linear-gradient(90deg,#065f46,#34d399)' },
                { label: 'Warning', value: s?.warning ?? 0, color: 'linear-gradient(90deg,#92400e,#fbbf24)' },
                { label: 'Error', value: s?.error ?? 0, color: 'linear-gradient(90deg,#7f1d1d,#f87171)' },
              ]}
              emptyLabel="No pages"
            />
          </div>
        </Card>
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <StatTile label="Pages audited" value={s?.total ?? 0} sub="live public routes" />
          <StatTile label="Pass" value={s?.pass ?? 0} sub="no issues" icon={<CheckCircle2 size={15} className="text-emerald-400" />} />
          <StatTile label="Warning" value={s?.warning ?? 0} sub={`${s?.warnings ?? 0} warnings`} icon={<AlertTriangle size={15} className="text-amber-400" />} />
          <StatTile label="Error" value={s?.error ?? 0} sub={`${s?.errors ?? 0} errors`} icon={<XCircle size={15} className="text-red-400" />} />
          <StatTile label="Overrides" value={overrideCount} sub="seo_overrides rows" />
        </div>
      </div>

      {/* Technical quick-checks */}
      <Card title="Technical quick-checks" subtitle="Live probes of robots.txt and sitemap.xml served by this origin">
        {!tech ? (
          <LoadingBlock label="Probing…" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]">robots.txt</span>
                <Badge tone={tech.robotsOk && tech.robotsHasSitemap ? 'green' : 'amber'}>
                  {tech.robotsOk ? (tech.robotsHasSitemap ? 'Sitemap declared' : 'Missing Sitemap:') : 'Unreachable'}
                </Badge>
              </div>
              <p className="mt-1.5 text-[11px] text-[#6B7280]">HTTP {tech.robotsOk ? '200' : 'error'} · fetch('/robots.txt')</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]">sitemap.xml</span>
                <Badge tone={tech.sitemapOk && tech.sitemapUrls > 0 ? 'green' : 'amber'}>
                  {tech.sitemapOk ? `${tech.sitemapUrls} URLs` : 'Unreachable'}
                </Badge>
              </div>
              <p className="mt-1.5 text-[11px] text-[#6B7280]">
                lastmod sample: <span className="font-mono">{tech.sitemapLastmod || '—'}</span>
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]">Coverage</span>
                <Badge tone={tech.sitemapUrls === indexableCount ? 'green' : 'amber'}>
                  {tech.sitemapUrls === indexableCount ? 'Match' : 'Mismatch'}
                </Badge>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#6B7280]">
                sitemap {tech.sitemapUrls} vs {indexableCount} indexable audited pages.
                {tech.sitemapUrls !== indexableCount && (
                  <> The shipped file is static — <a className="text-[#E8C97C] underline-offset-2 hover:underline" href="/admin/seo/sitemap">regenerate in Sitemap center</a>.</>
                )}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Duplicates report */}
      {s && (s.duplicateTitles.length > 0 || s.duplicateDescriptions.length > 0) && (
        <Card title="Duplicate content report" subtitle="Pages sharing identical titles or descriptions (real audit finding)">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-300">Duplicate titles ({s.duplicateTitles.length} groups)</p>
              {s.duplicateTitles.length === 0 ? <p className="text-xs text-[#566072]">None — every page has a unique title.</p> : (
                <ul className="flex flex-col gap-2">
                  {s.duplicateTitles.slice(0, 6).map((g) => (
                    <li key={g.paths.join('|')} className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-xs text-[#C9CED6]">
                      <span className="font-semibold text-amber-200">“{truncate(g.value, 60)}”</span>
                      <span className="ml-1 text-[#A7AFBA]">on {g.paths.length} pages:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {g.paths.slice(0, 5).map((p) => (
                          <button key={p} className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-[#E8C97C] hover:bg-black/50" onClick={() => setEditorPath(p)}>{p}</button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-300">Duplicate descriptions ({s.duplicateDescriptions.length} groups)</p>
              {s.duplicateDescriptions.length === 0 ? <p className="text-xs text-[#566072]">None — every page has a unique description.</p> : (
                <ul className="flex flex-col gap-2">
                  {s.duplicateDescriptions.slice(0, 6).map((g) => (
                    <li key={g.paths.join('|')} className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-xs text-[#C9CED6]">
                      <span className="font-semibold text-amber-200">“{truncate(g.value, 60)}”</span>
                      <span className="ml-1 text-[#A7AFBA]">on {g.paths.length} pages</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {g.paths.slice(0, 5).map((p) => (
                          <button key={p} className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-[#E8C97C] hover:bg-black/50" onClick={() => setEditorPath(p)}>{p}</button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Results table */}
      <Card
        title="Page SEO audit results"
        subtitle="Click any row to open the SEO editor for that page"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="relative">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#566072]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter paths…"
                aria-label="Filter audit results"
                className="h-8 w-40 rounded-lg border border-white/10 bg-[#04070C]/80 pl-7 pr-2 text-xs text-[#F5F6F2] placeholder-[#5A6472] outline-none focus:border-[#C9A45C]/60"
              />
            </div>
            <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filter by status" className="h-8 w-32 text-xs">
              <option value="all">All statuses</option>
              <option value="pass">Pass</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </Select>
          </div>
        }
      >
        <DataTable<AuditRow>
          columns={columns}
          rows={paged}
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onRowClick={(r) => setEditorPath(r.path)}
          mobileCard={mobileCard}
          loading={loading}
          dense
          emptyTitle="No pages match"
          emptyHint="Adjust the status filter or search query."
        />
      </Card>

      <SeoEditorModal
        path={editorPath}
        overrides={overrides}
        resolvedByPath={resolvedByPath}
        onClose={() => setEditorPath(null)}
        onMutated={() => {
          // Refresh just the override layer, then recompute audit locally.
          void (async () => {
            try {
              const ovr = await listAll<SeoOverrideRow>('seo_overrides');
              setOverrides(ovr);
              if (content && settings) {
                const { report: rep } = compute(content, ovr, settings);
                setReport(rep);
              }
            } catch (e) {
              push('error', `Refresh failed: ${(e as Error).message}`);
            }
          })();
        }}
      />
    </div>
  );
};
