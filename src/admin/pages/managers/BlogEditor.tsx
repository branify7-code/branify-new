// =============================================================================
// BRANIFY ADMIN — Blog Post Editor (full page, CMS-style)
// -----------------------------------------------------------------------------
// Opens under Admin → Blog → New post / Edit (route: /blog?post=<id|new>).
// LEFT:  writing surface — Visual editor or HTML/Source mode (single source of
//        truth, sanitized on every save + preview), live stats footer.
// RIGHT: tabbed panel — Post settings · SEO · Audit · Performance. On small
//        screens the panel stacks under the editor.
// TOP:   Save Draft · Preview · Publish/Update · Unpublish, autosave status.
// Honesty rules: the SEO score is on-page completeness only; Search Console
// shows real data only (panel itself states it is not connected).
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, CalendarClock, Check, ExternalLink, Eye, Loader2,
  RefreshCw, Save, TriangleAlert, Wand2, X,
} from 'lucide-react';
import type { AdminPageProps } from '../../lib/auth';
import type { BlogRow } from '../../lib/types';
import { AdminError, createRow, getRow, listRows, updateRow } from '../../lib/backend';
import {
  Badge, Btn, Card, ChipsInput, ConfirmDialog, ErrorBlock, Field, Input,
  LoadingBlock, Modal, Select, Tabs, Textarea, Toggle, cx, useToast,
} from '../../ui';
import { slugify } from '../../lib/format';
import { finalizeArticleHtml, sanitizeArticleHtml } from '../../../lib/sanitizeHtml';
import { analyzeArticle, suggestMetaDescription, type BlogAuditReport } from '../../lib/blogAudit';
import {
  AuditPanel, DEFAULT_ROBOTS, LinkCheckPanel, ReadabilityPanel, SearchPerformancePanel,
  SeoPanel, SeoScoreChip, type EditorSeo,
} from './BlogEditorSeo';
import { FeaturedImagePanel } from './BlogEditorMedia';
import { HtmlSourceEditor, VisualEditor } from './BlogEditorVisual';
import { BlogArticleBody } from '../../../components/BlogArticleBody';

const SITE_URL = 'https://branify.store';

// ------------------------------------------------------------------ form model
interface BlogForm {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  coverImage: string;
  coverAlt: string;
  authorName: string;
  authorRole: string;
  publishedAtLocal: string; // datetime-local input value
  category: string;
  tags: string[];
  status: string;
  featured: boolean;
  seo: EditorSeo;
}

const defaultSeo = (): EditorSeo => ({
  title: '', description: '', focus_keyword: '', keywords: [], canonical: '',
  og_title: '', og_description: '', og_image: '', twitter_image: '', robots: DEFAULT_ROBOTS,
});

const defaultForm = (): BlogForm => ({
  title: '', slug: '', excerpt: '', contentHtml: '', coverImage: '', coverAlt: '',
  authorName: 'BRANIFY Team', authorRole: '', publishedAtLocal: '',
  category: '', tags: [], status: 'draft', featured: false, seo: defaultSeo(),
});

function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function rowToForm(r: BlogRow): BlogForm {
  const s = (r.seo && typeof r.seo === 'object' ? r.seo : {}) as Record<string, unknown>;
  const str = (k: string) => (typeof s[k] === 'string' ? (s[k] as string) : '');
  return {
    title: r.title || '',
    slug: r.slug || '',
    excerpt: r.excerpt || '',
    contentHtml: r.content || '',
    coverImage: r.cover_image || '',
    coverAlt: str('cover_alt'),
    authorName: r.author_name || 'BRANIFY Team',
    authorRole: r.author_role || '',
    publishedAtLocal: isoToLocalInput(r.published_at),
    category: r.category || '',
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    status: r.status === 'published' ? 'published' : 'draft',
    featured: Boolean(r.featured),
    seo: {
      title: str('title'), description: str('description'),
      focus_keyword: str('focus_keyword'),
      keywords: Array.isArray(s.keywords) ? (s.keywords as unknown[]).map(String) : [],
      canonical: str('canonical'), og_title: str('og_title'),
      og_description: str('og_description'), og_image: str('og_image'),
      twitter_image: str('twitter_image'), robots: str('robots') || DEFAULT_ROBOTS,
    },
  };
}

function buildPayload(f: BlogForm, statusOverride?: string): { payload: Record<string, unknown>; altBackfilled: number } {
  // Task 2-d pipeline: raw editor HTML → sanitize → alt auto-populate → store
  const finalized = finalizeArticleHtml(f.contentHtml);
  const payload = {
    title: f.title.trim(),
    slug: f.slug.trim(),
    excerpt: f.excerpt.trim(),
    content: finalized.html,
    cover_image: f.coverImage.trim(),
    author_name: f.authorName.trim() || 'BRANIFY Team',
    author_role: f.authorRole.trim(),
    published_at: f.publishedAtLocal ? new Date(f.publishedAtLocal).toISOString() : null,
    category: f.category.trim(),
    tags: f.tags.map((t) => t.trim()).filter(Boolean),
    status: statusOverride || f.status || 'draft',
    featured: f.featured,
    seo: {
      title: f.seo.title.trim(),
      description: f.seo.description.trim(),
      keywords: f.seo.keywords.map((k) => k.trim()).filter(Boolean),
      focus_keyword: f.seo.focus_keyword.trim(),
      canonical: f.seo.canonical.trim(),
      og_title: f.seo.og_title.trim(),
      og_description: f.seo.og_description.trim(),
      og_image: f.seo.og_image.trim(),
      twitter_image: f.seo.twitter_image.trim(),
      robots: f.seo.robots.trim() || DEFAULT_ROBOTS,
      cover_alt: f.coverAlt.trim(),
    },
  };
  return { payload, altBackfilled: finalized.altBackfilled };
}

// ------------------------------------------------------------------ component
export const BlogEditor: React.FC<AdminPageProps & { postId: string | null }> = ({ postId, navigate }) => {
  const { push } = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formState, setFormState] = useState<BlogForm>(defaultForm());
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [tab, setTab] = useState('post');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmBack, setConfirmBack] = useState(false);
  const [publishAsk, setPublishAsk] = useState(false);
  const [otherPosts, setOtherPosts] = useState<BlogRow[]>([]);
  const [audit, setAudit] = useState<BlogAuditReport | null>(null);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'dirty' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [slugError, setSlugError] = useState('');

  const formRef = useRef<BlogForm>(formState);
  const snapshotRef = useRef<string>(JSON.stringify(defaultForm()));
  const savingRef = useRef(false);
  const pendingSave = useRef<{ silent?: boolean; statusOverride?: string; successMsg?: string } | null>(null);
  const slugTouched = useRef(Boolean(postId));

  const update = useCallback((patch: Partial<BlogForm> | ((f: BlogForm) => BlogForm)) => {
    const next = typeof patch === 'function' ? patch(formRef.current) : { ...formRef.current, ...patch };
    formRef.current = next;
    setFormState(next);
    setSaveState((s) => (s === 'saving' ? s : 'dirty'));
  }, []);

  const setSeo = useCallback((patch: Partial<EditorSeo>) => {
    update((f) => ({ ...f, seo: { ...f.seo, ...patch } }));
  }, [update]);

  // ---------------------------------------------------------------- load
  const loadOthers = useCallback(async (excludeId: string | null) => {
    try {
      const res = await listRows<BlogRow>('blog_posts', { page: 1, pageSize: 200, sort: 'created_at', dir: 'desc' });
      setOtherPosts(res.rows.filter((r) => r.id !== excludeId));
    } catch { /* suggestions/duplicates degrade gracefully */ }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      if (postId) {
        const row = await getRow<BlogRow>('blog_posts', postId);
        const f = rowToForm(row);
        formRef.current = f;
        setFormState(f);
        snapshotRef.current = JSON.stringify(f);
      } else {
        const f = defaultForm();
        formRef.current = f;
        setFormState(f);
        snapshotRef.current = JSON.stringify(f);
      }
      slugTouched.current = Boolean(postId);
      setSaveState('saved');
      setLastSaved(null);
      await loadOthers(postId);
    } catch (e) {
      setLoadError(e instanceof AdminError ? e.message : (e as Error).message || 'Could not load this post.');
    } finally {
      setLoading(false);
    }
  }, [postId, loadOthers]);

  useEffect(() => { void load(); }, [load]);

  // ---------------------------------------------------------------- audit (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const f = formRef.current;
      try {
        setAudit(analyzeArticle({
          title: f.title,
          slug: f.slug,
          excerpt: f.excerpt,
          contentHtml: sanitizeArticleHtml(f.contentHtml),
          seo: {
            title: f.seo.title, description: f.seo.description,
            focus_keyword: f.seo.focus_keyword, keywords: f.seo.keywords,
            canonical: f.seo.canonical, og_title: f.seo.og_title,
            og_description: f.seo.og_description, og_image: f.seo.og_image,
            twitter_image: f.seo.twitter_image, robots: f.seo.robots,
          },
          coverImage: f.coverImage,
          otherPosts: otherPosts.map((p) => ({
            slug: p.slug, title: p.title,
            description: (p.seo && typeof p.seo === 'object' && typeof (p.seo as { description?: unknown }).description === 'string')
              ? (p.seo as { description: string }).description
              : (p.excerpt || ''),
          })),
        }));
      } catch { /* audit is advisory */ }
    }, 600);
    return () => clearTimeout(t);
  }, [formState, otherPosts]);

  // ---------------------------------------------------------------- save
  const validate = useCallback((f: BlogForm): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!f.title.trim()) errs.title = 'Title is required.';
    const slug = f.slug.trim();
    if (!slug) errs.slug = 'Slug is required.';
    else if (!/^[a-z0-9-]+$/.test(slug)) errs.slug = 'Lowercase letters, numbers and dashes only.';
    else if (otherPosts.some((p) => p.slug === slug)) {
      errs.slug = `Another post already uses /blog/${slug}/ — slugs must be unique.`;
    }
    return errs;
  }, [otherPosts]);

  const save = useCallback(async (opts: { silent?: boolean; statusOverride?: string; successMsg?: string } = {}) => {
    if (savingRef.current) { pendingSave.current = opts; return; }
    const f = formRef.current;

    // first meaningful write gate for brand-new posts (autosave safety)
    if (!postId && !opts.statusOverride && !f.title.trim() && !f.contentHtml.trim()) return;

    if (!f.slug.trim() && f.title.trim()) {
      const auto = slugify(f.title);
      formRef.current = { ...f, slug: auto };
      setFormState(formRef.current);
    }
    const errs = validate(formRef.current);
    if (Object.keys(errs).length) {
      setSlugError(errs.slug || '');
      if (!opts.silent) push('error', errs.slug || errs.title || 'Fix the highlighted fields first.');
      setSaveState('error');
      return;
    }
    setSlugError('');

    savingRef.current = true;
    setSaveState('saving');
    const payloadSnapshot = JSON.stringify({ ...formRef.current, status: opts.statusOverride || formRef.current.status });
    try {
      const { payload, altBackfilled } = buildPayload(formRef.current, opts.statusOverride);
      const saved = postId
        ? await updateRow<BlogRow>('blog_posts', postId, payload)
        : await createRow<BlogRow>('blog_posts', payload);
      if (!postId) navigate(`/blog?post=${saved.id}`);
      snapshotRef.current = payloadSnapshot;
      setLastSaved(new Date());
      const stale = JSON.stringify(formRef.current) !== snapshotRef.current;
      setSaveState(stale ? 'dirty' : 'saved');
      if (altBackfilled > 0 && !opts.silent) {
        push('info', `Alt auto-populate: ${altBackfilled} image${altBackfilled === 1 ? '' : 's'} backfilled from the article's first sentence.`);
      }
      if (opts.successMsg) push('success', opts.successMsg);
      else if (!opts.silent) push('success', postId ? 'Post saved.' : 'Draft created.');
      void loadOthers(saved.id);
    } catch (e) {
      const msg = e instanceof AdminError ? e.message : (e as Error).message || 'Save failed.';
      setSaveState('error');
      push('error', msg);
    } finally {
      savingRef.current = false;
      if (pendingSave.current) {
        const p = pendingSave.current;
        pendingSave.current = null;
        void save(p);
      }
    }
  }, [postId, push, validate, navigate, loadOthers]);

  // autosave — 2.5s after the last change, only meaningful content
  useEffect(() => {
    if (saveState !== 'dirty') return;
    const f = formRef.current;
    if (!postId && !f.title.trim() && !f.contentHtml.trim() && !f.excerpt.trim()) return;
    const t = setTimeout(() => { void save({ silent: true }); }, 2500);
    return () => clearTimeout(t);
  }, [saveState, formState, save, postId]);

  // leave guard
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (saveState === 'dirty' || saveState === 'error') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [saveState]);

  // ---------------------------------------------------------------- derived
  const f = formState;
  const isPublished = f.status === 'published';
  const isScheduled = isPublished && Boolean(f.publishedAtLocal) && new Date(f.publishedAtLocal).getTime() > Date.now();
  const sanitizedContent = useMemo(() => sanitizeArticleHtml(f.contentHtml), [f.contentHtml]);
  const statusBadge = isScheduled
    ? { tone: 'violet' as const, label: `Scheduled · ${f.publishedAtLocal.replace('T', ' ')}` }
    : isPublished
      ? { tone: 'green' as const, label: 'Published' }
      : { tone: 'steel' as const, label: 'Draft' };

  const existingCategories = useMemo(
    () => [...new Set(otherPosts.map((p) => p.category).filter(Boolean))].sort(),
    [otherPosts]);
  const existingTags = useMemo(
    () => [...new Set(otherPosts.flatMap((p) => (Array.isArray(p.tags) ? p.tags.map(String) : [])))].sort(),
    [otherPosts]);
  const relatedPosts = useMemo(
    () => otherPosts.filter((p) => p.status === 'published').slice(0, 4),
    [otherPosts]);

  const suggestExcerpt = () => {
    const text = (audit?.words ? sanitizedContent : '') || '';
    const plain = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plain) { push('info', 'Write some article text first — the suggestion lifts the opening sentences.'); return; }
    const sentences = plain.match(/[^.!?]+[.!?]*/g) || [plain];
    let out = '';
    for (const s of sentences) {
      if ((out + s).length > 180) break;
      out += (out ? ' ' : '') + s.trim();
    }
    if (!out) out = plain.slice(0, 180);
    update({ excerpt: out });
  };

  const suggestMeta = () => {
    const plain = sanitizedContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const desc = suggestMetaDescription(f.excerpt, plain, f.seo.focus_keyword);
    if (!desc) { push('info', 'Add a little article text first.'); return; }
    setSeo({ description: desc });
  };

  // ---------------------------------------------------------------- actions
  const backToList = () => {
    if (saveState === 'dirty' || saveState === 'error') setConfirmBack(true);
    else navigate('/blog');
  };

  const doPublish = () => {
    const cf = formRef.current;
    const scheduled = Boolean(cf.publishedAtLocal) && new Date(cf.publishedAtLocal).getTime() > Date.now();
    const patch: Partial<BlogForm> = { status: 'published' };
    const publishAt = cf.publishedAtLocal || isoToLocalInput(new Date().toISOString());
    patch.publishedAtLocal = publishAt;
    update(patch);
    void save({
      statusOverride: 'published',
      successMsg: scheduled ? `Post scheduled for ${publishAt.replace('T', ' ')} — it appears on /blog automatically once the moment passes.` : 'Post published — it is live on /blog now.',
    });
    setPublishAsk(false);
  };

  const doUnpublish = () => {
    update({ status: 'draft' });
    void save({ statusOverride: 'draft', successMsg: 'Post moved back to draft — the public URL now returns "not found".' });
  };

  // ---------------------------------------------------------------- render
  if (loading) {
    return <Card><LoadingBlock label="Loading the post editor…" /></Card>;
  }
  if (loadError) {
    return (
      <ErrorBlock
        title="Could not open the editor"
        message={loadError}
        onRetry={() => void load()}
      />
    );
  }

  const statChips = audit ? [
    { label: 'Words', value: String(audit.words) },
    { label: 'Characters', value: String(audit.chars) },
    { label: 'Reading time', value: `${audit.readingTimeMin} min` },
  ] : [];

  return (
    <div className="flex flex-col gap-4">
      {/* ============ top bar ============ */}
      <Card bodyClass="py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <Btn variant="ghost" size="sm" icon={ArrowLeft} onClick={backToList} aria-label="Back to blog list">
            Blog
          </Btn>
          <div className="min-w-0 flex-1">
            <input
              value={f.title}
              onChange={(e) => {
                const title = e.target.value;
                const patch: Partial<BlogForm> = { title };
                if (!slugTouched.current) patch.slug = slugify(title);
                update(patch);
              }}
              placeholder="Post title — e.g. How to scale a brand in 2026"
              aria-label="Post title"
              className="w-full bg-transparent font-display text-lg font-bold text-[#111827] outline-none placeholder-[#94A3B8]"
            />
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#64748B]">
              <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
              <span className="font-mono">{SITE_URL.replace('https://', '')}/blog/{f.slug || 'your-slug'}</span>
              <SeoScoreChip report={audit} />
              <span className={cx('inline-flex items-center gap-1 font-semibold',
                saveState === 'saved' && 'text-emerald-600',
                saveState === 'saving' && 'text-[#5B5FEF]',
                saveState === 'dirty' && 'text-amber-600',
                saveState === 'error' && 'text-red-600')}
              >
                {saveState === 'saved' && <><Check size={11} /> Saved{lastSaved ? ` · ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</>}
                {saveState === 'saving' && <><Loader2 size={11} className="animate-spin" /> Saving…</>}
                {saveState === 'dirty' && <>Unsaved changes</>}
                {saveState === 'error' && <><TriangleAlert size={11} /> Save failed — retry</>}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isPublished && (
              <Btn variant="ghost" size="sm" icon={X} onClick={doUnpublish}>Unpublish</Btn>
            )}
            <Btn variant="outline" size="sm" icon={Eye} onClick={() => setPreviewOpen(true)}>Preview</Btn>
            <Btn
              variant="outline"
              size="sm"
              icon={Save}
              loading={saveState === 'saving'}
              onClick={() => void save(isPublished ? { successMsg: 'Changes saved.' } : { successMsg: 'Draft saved.' })}
            >
              {isPublished ? 'Save changes' : 'Save Draft'}
            </Btn>
            <Btn
              variant="gold"
              size="sm"
              icon={isPublished ? RefreshCw : CalendarClock}
              onClick={() => setPublishAsk(true)}
            >
              {isPublished ? 'Update' : 'Publish'}
            </Btn>
          </div>
        </div>
        {(slugError || (!isPublished && !f.title.trim())) && (
          <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-3 py-1.5 text-[11px] font-semibold text-amber-700">
            {slugError || 'Add a title before publishing.'}
          </p>
        )}
      </Card>

      {/* ============ body grid ============ */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_384px]">
        {/* LEFT — writing surface */}
        <Card bodyClass="p-0" className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] bg-white px-3 py-2">
            <Tabs
              tabs={[{ id: 'visual', label: 'Visual editor' }, { id: 'html', label: 'HTML / Code' }]}
              active={mode}
              onChange={(m) => {
                if (m === 'html') {
                  // hand the CURRENT visual buffer to the source view, sanitized
                  const clean = sanitizeArticleHtml(formRef.current.contentHtml);
                  update({ contentHtml: clean });
                } else {
                  // returning to visual: sanitize whatever was typed
                  const clean = sanitizeArticleHtml(formRef.current.contentHtml);
                  update({ contentHtml: clean });
                }
                setMode(m as 'visual' | 'html');
              }}
              className="border-[#E2E8F0] bg-black/[0.04]"
            />
            <p className="hidden text-[10.5px] text-[#64748B] sm:block">
              {mode === 'visual' ? 'Click any image in the article to edit alt, caption or alignment. Empty alt is auto-filled from the article\u2019s first sentence on save.' : 'Raw HTML — sanitized before save and preview.'}
            </p>
          </div>

          <div className="flex min-h-[540px] flex-col">
            {mode === 'visual' ? (
              <VisualEditor html={f.contentHtml} onChange={(html) => update({ contentHtml: html })} />
            ) : (
              <HtmlSourceEditor html={f.contentHtml} onChange={(html) => update({ contentHtml: html })} />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#E2E8F0] bg-[#F8FAFC]/70 px-4 py-2 text-[11px] font-semibold text-[#475569]">
            {statChips.map((s) => (
              <span key={s.label} className="tabular-nums">{s.label}: <strong className="text-[#111827]">{s.value}</strong></span>
            ))}
            {audit && audit.headings.length > 0 && (
              <span className="tabular-nums">Headings: <strong className="text-[#111827]">{audit.headings.length}</strong></span>
            )}
            {audit && audit.images.total > 0 && (
              <span className="tabular-nums">
                Images: <strong className="text-[#111827]">{audit.images.total}</strong>
                {audit.images.missingAlt > 0 && <span className="text-amber-700"> · {audit.images.missingAlt} missing alt</span>}
              </span>
            )}
          </div>
        </Card>

        {/* RIGHT — settings panel */}
        <div className="flex flex-col gap-4">
          <Tabs
            tabs={[
              { id: 'post', label: 'Post' },
              { id: 'seo', label: 'SEO' },
              { id: 'audit', label: 'Audit', badge: audit ? <Badge tone={audit.score >= 80 ? 'green' : audit.score >= 65 ? 'gold' : 'red'}>{audit.score}</Badge> : undefined },
              { id: 'performance', label: 'Performance' },
            ]}
            active={tab}
            onChange={setTab}
            className="border-[#E2E8F0] bg-black/[0.04]"
          />

          {tab === 'post' && (
            <>
              <Card title="Post settings" subtitle="Slug, taxonomy, author and scheduling">
                <div className="flex flex-col gap-3">
                  <Field label="Slug" required error={slugError || undefined} hint={`Public URL: ${SITE_URL}/blog/${f.slug || '…'}`}>
                    <div className="flex gap-2">
                      <Input
                        value={f.slug}
                        onChange={(e) => { slugTouched.current = true; setSlugError(''); update({ slug: slugify(e.target.value) }); }}
                        placeholder="website-development-trends-2026"
                        className="font-mono text-xs"
                      />
                      <Btn
                        variant="ghost"
                        size="sm"
                        icon={RefreshCw}
                        title="Regenerate from title"
                        aria-label="Regenerate slug from title"
                        onClick={() => { if (f.title.trim()) { slugTouched.current = false; update({ slug: slugify(f.title) }); } }}
                      />
                    </div>
                  </Field>

                  <Field label="Excerpt" hint="Card + search fallback summary. 1-2 sentences.">
                    <Textarea rows={3} value={f.excerpt} onChange={(e) => update({ excerpt: e.target.value })} placeholder="What will the reader learn or achieve?" />
                    <button
                      type="button"
                      onClick={suggestExcerpt}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#5B5FEF] hover:underline"
                    >
                      <Wand2 size={11} /> Suggest from the article opening
                    </button>
                  </Field>

                  <Field label="Category" hint="Start typing to reuse an existing category.">
                    <Input
                      value={f.category}
                      onChange={(e) => update({ category: e.target.value })}
                      placeholder="Web Development"
                      list="blog-categories-list"
                    />
                    <datalist id="blog-categories-list">
                      {existingCategories.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </Field>

                  <ChipsInput
                    label="Tags"
                    value={f.tags}
                    onChange={(v) => update({ tags: v })}
                    hint="Press Enter to add. Click a suggestion to reuse."
                    placeholder="Add a tag…"
                  />
                  {existingTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {existingTags.slice(0, 14).map((t) => (
                        <button
                          key={t}
                          type="button"
                          disabled={f.tags.includes(t)}
                          onClick={() => update({ tags: [...f.tags, t] })}
                          className="rounded-full border border-[#E2E8F0] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#475569] transition-colors hover:border-[#C9A45C]/50 hover:text-[#8F6B2D] disabled:opacity-40"
                        >
                          + {t}
                        </button>
                      ))}
                    </div>
                  )}

                  <Field label="Author name" hint="Used on cards, the article header and BlogPosting schema — real attribution only.">
                    <Input value={f.authorName} onChange={(e) => update({ authorName: e.target.value })} placeholder="BRANIFY Team" />
                  </Field>
                  <Field label="Author role">
                    <Input value={f.authorRole} onChange={(e) => update({ authorRole: e.target.value })} placeholder="Growth Strategist" />
                  </Field>

                  <Field
                    label="Publish date & time"
                    hint={isScheduled
                      ? 'Scheduled — hidden from /blog until this moment, then published automatically.'
                      : 'Leave empty to publish now. A future date schedules the post.'}
                  >
                    <Input
                      type="datetime-local"
                      value={f.publishedAtLocal}
                      onChange={(e) => update({ publishedAtLocal: e.target.value })}
                      style={{ colorScheme: 'light' }}
                    />
                  </Field>

                  <Field label="Status" hint="Use Publish / Unpublish in the top bar — this select mirrors the state.">
                    <Select value={f.status} onChange={(e) => update({ status: e.target.value })}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </Select>
                  </Field>

                  <div>
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">Featured post</span>
                    <div className="flex items-center gap-2.5">
                      <Toggle checked={f.featured} onChange={(v) => update({ featured: v })} label="Featured" />
                      <span className={cx('text-xs font-semibold', f.featured ? 'text-[#8F6B2D]' : 'text-[#64748B]')}>
                        {f.featured ? 'Highlights on /blog' : 'Standard listing'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <FeaturedImagePanel
                coverImage={f.coverImage}
                coverAlt={f.coverAlt}
                onChange={(patch) => update({ coverImage: patch.coverImage ?? f.coverImage, coverAlt: patch.coverAlt ?? f.coverAlt })}
              />
            </>
          )}

          {tab === 'seo' && (
            <Card title="SEO" subtitle="Search + social metadata with live previews">
              <SeoPanel
                seo={f.seo}
                title={f.title}
                excerpt={f.excerpt}
                slug={f.slug}
                coverImage={f.coverImage}
                onChange={setSeo}
                onSuggestDescription={suggestMeta}
              />
            </Card>
          )}

          {tab === 'audit' && (
            <>
              {audit ? (
                <>
                  <AuditPanel report={audit} />
                  <Card title="Readability" subtitle="Writing-quality aid — not a ranking factor">
                    <ReadabilityPanel report={audit} />
                  </Card>
                  <Card title="Link check" subtitle="Internal links verified against real BRANIFY registries">
                    <LinkCheckPanel contentHtml={sanitizedContent} />
                  </Card>
                </>
              ) : (
                <Card><LoadingBlock label="Running the on-page audit…" /></Card>
              )}
            </>
          )}

          {tab === 'performance' && (
            <>
              <SearchPerformancePanel slug={f.slug} published={isPublished && !isScheduled} />
              {isPublished && f.slug && (
                <Card title="Live post" subtitle="Opens the public article in a new tab">
                  <a
                    href={`${SITE_URL}/blog/${f.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B5FEF] hover:underline"
                  >
                    View /blog/{f.slug} <ExternalLink size={12} />
                  </a>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* ============ preview ============ */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Article preview"
        subtitle="Rendered with the exact public /blog styling — sanitized, images lazy-loaded"
        width="xl"
        footer={<Btn variant="gold" onClick={() => setPreviewOpen(false)}>Close preview</Btn>}
      >
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-8 sm:px-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-7 flex items-center gap-4">
              <img
                src="/brand/branify-logo.png"
                alt={f.authorName || 'BRANIFY Team'}
                className="h-11 w-11 rounded-full border border-[#E2E8F0] object-cover"
              />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#111827]">{f.authorName || 'BRANIFY Team'}</p>
                <p className="text-[11px] text-[#64748B]">
                  {f.authorRole ? `${f.authorRole} • ` : ''}
                  {f.publishedAtLocal
                    ? new Date(f.publishedAtLocal).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Unpublished'}{audit && audit.readingTimeMin > 0 ? ` • ${audit.readingTimeMin} min read` : ''}
                </p>
              </div>
            </div>

            <h1 className="mb-8 font-display text-3xl font-extrabold leading-[1.15] tracking-tight text-[#111827] sm:text-4xl">
              {f.title || 'Untitled post'}
            </h1>

            {f.coverImage && (
              <img
                src={f.coverImage}
                alt={f.coverAlt || f.title}
                className="mb-10 w-full rounded-2xl border border-[#E2E8F0] object-cover shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              />
            )}

            {sanitizedContent ? (
              <BlogArticleBody contentHtml={sanitizedContent} />
            ) : (
              <p className="text-sm text-[#64748B]">Start writing in the editor to see the article preview here.</p>
            )}

            {f.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2">
                {f.tags.map((t) => (
                  <span key={t} className="rounded-full border border-[#C9A45C]/25 bg-[#C9A45C]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#8F6B2D]">
                    # {t}
                  </span>
                ))}
              </div>
            )}

            {relatedPosts.length > 0 && (
              <div className="mt-14 border-t border-[#E2E8F0] pt-8">
                <p className="mb-4 font-display text-base font-extrabold tracking-wide text-[#111827]">More Insights</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {relatedPosts.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-[#E2E8F0] p-5">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8]">{p.category || 'Insights'}</p>
                      <p className="mt-1 text-sm font-extrabold text-[#111827]">{p.title}</p>
                      <p className="mt-1.5 line-clamp-2 text-xs text-[#64748B]">{p.excerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ============ dialogs ============ */}
      <ConfirmDialog
        open={publishAsk}
        onClose={() => setPublishAsk(false)}
        onConfirm={doPublish}
        title={isPublished ? 'Publish changes?' : isScheduled ? 'Update scheduled post?' : 'Publish this post?'}
        message={(
          <div className="text-[13px] leading-relaxed">
            {isScheduled ? (
              <>
                <p>The article goes live on <strong>{SITE_URL}/blog/{f.slug || '…'}</strong> automatically at the scheduled time and is excluded from the blog list and sitemap until then.</p>
                <p className="mt-2 text-xs text-[#475569]">Change the date under Post → Publish date &amp; time.</p>
              </>
            ) : (
              <>
                <p>The article will be live at <strong>{SITE_URL}/blog/{f.slug || '…'}</strong>, included in the blog list and available for the sitemap.</p>
                <p className="mt-2 text-xs text-[#475569]">Publishing does not push the sitemap file — regenerate it from SEO Center → Sitemap when ready.</p>
              </>
            )}
          </div>
        )}
        confirmLabel={isPublished ? 'Publish changes' : isScheduled ? 'Confirm schedule' : 'Publish now'}
        loading={saveState === 'saving'}
      />

      <ConfirmDialog
        open={confirmBack}
        onClose={() => setConfirmBack(false)}
        onConfirm={() => { setConfirmBack(false); navigate('/blog'); }}
        title="Leave with unsaved changes?"
        message="You have edits that have not been saved yet. Leaving now may lose the latest keystrokes."
        confirmLabel="Leave anyway"
        danger
      />
    </div>
  );
};

export default BlogEditor;
