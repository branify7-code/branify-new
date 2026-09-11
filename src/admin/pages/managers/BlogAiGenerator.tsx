// =============================================================================
// BRANIFY ADMIN — AI Generate Blog (modal, Phase 1)
// -----------------------------------------------------------------------------
// Brief → generate → review → "Use This Draft" opens the EXISTING full-page
// Blog Editor (/blog?post=new) with everything prefilled. Status stays
// 'draft' — the AI never saves or publishes anything itself.
// Reuses: shared admin UI kit, the existing registry-backed link checker
// (LinkCheckPanel), the shared BlogArticleBody renderer for a pixel-true
// preview, the existing activity log, and the real site route registries.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { useAdminAuth } from '../../lib/auth';
import { listRows, logActivity } from '../../lib/backend';
import type { BlogRow } from '../../lib/types';
import {
  Badge, Btn, ChipsInput, Field, Input, Modal, Select, Tabs, Textarea, Toggle, cx, useToast,
} from '../../ui';
import { AiBlogError, findSimilarPosts, generateBlogDraft } from '../../lib/aiBlog';
import type { GenerateBlogForm, GenerateBlogResult, GeneratedBlogDraft } from '../../lib/aiBlog';
import { buildInternalLinkCandidates, stripInvalidInternalLinksHtml } from '../../lib/internalLinks';
import { BlogArticleBody } from '../../../components/BlogArticleBody';
import { LinkCheckPanel } from './BlogEditorSeo';
import { aiDraftBridge } from './blogAiHandoff';

// ------------------------------------------------------------------ constants
const GOALS: Array<{ value: GenerateBlogForm['goal']; label: string }> = [
  { value: 'informational', label: 'Informational' },
  { value: 'lead_generation', label: 'Lead generation' },
  { value: 'service_promotion', label: 'Service promotion' },
  { value: 'educational', label: 'Educational' },
];

const TONES: Array<{ value: GenerateBlogForm['tone']; label: string }> = [
  { value: 'professional', label: 'Professional' },
  { value: 'expert', label: 'Expert' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'educational', label: 'Educational' },
];

const LENGTHS: Array<{ value: number; label: string }> = [
  { value: 1200, label: '~1200 words' },
  { value: 1500, label: '~1500 words' },
  { value: 2000, label: '~2000 words' },
  { value: 2500, label: '~2500 words' },
];

const DEFAULT_FORM: GenerateBlogForm = {
  topic: '',
  keyword: '',
  secondaryKeywords: [],
  audience: '',
  goal: 'informational',
  category: '',
  length: 1500,
  tone: 'professional',
  includeFaq: true,
  includeInternalLinks: true,
  generateImagePrompt: true,
  generateSeo: true,
};

interface Props {
  /** Navigate within the admin area (provided by the shared CRUD header API). */
  navigate: (pathUnderAdmin: string) => void;
}

export const BlogAiGenerator: React.FC<Props> = ({ navigate }) => {
  const { push } = useToast();
  const { user } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'form' | 'result'>('form');
  const [form, setForm] = useState<GenerateBlogForm>(DEFAULT_FORM);
  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GenerateBlogResult | null>(null);
  const [draft, setDraft] = useState<GeneratedBlogDraft | null>(null);
  const [previewTab, setPreviewTab] = useState('preview');
  const [existing, setExisting] = useState<BlogRow[]>([]);
  const [existingLoaded, setExistingLoaded] = useState(false);
  const [existingError, setExistingError] = useState('');
  const timerRef = useRef<number | null>(null);
  const genSeqRef = useRef(0);

  const candidates = useMemo(() => buildInternalLinkCandidates(), []);
  const setField = useCallback(<K extends keyof GenerateBlogForm>(key: K, value: GenerateBlogForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  // load recent posts for duplicate protection when the modal opens
  useEffect(() => {
    if (!open || existingLoaded) return;
    let alive = true;
    listRows<BlogRow>('blog_posts', { page: 1, pageSize: 200, sort: 'created_at', dir: 'desc' })
      .then((res) => { if (alive) { setExisting(res.rows); setExistingError(''); } })
      .catch(() => { if (alive) setExistingError('Existing posts could not be loaded — duplicate protection is reduced for this run.'); })
      .finally(() => { if (alive) setExistingLoaded(true); });
    return () => { alive = false; };
  }, [open, existingLoaded]);

  const dupHits = useMemo(
    () => (form.topic.trim().length >= 8
      ? findSimilarPosts(form.topic, existing.map((r) => ({ title: r.title, slug: r.slug, category: r.category })))
      : []),
    [form.topic, existing],
  );

  const existingCategories = useMemo(
    () => Array.from(new Set(existing.map((r) => r.category).filter(Boolean))).slice(0, 8),
    [existing],
  );

  const startTimer = useCallback(() => {
    setElapsed(0);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const runGenerate = useCallback(async () => {
    if (generating) return;
    if (form.topic.trim().length < 8) { push('error', 'Describe the blog topic first (at least 8 characters).'); return; }
    if (form.keyword.trim().length < 2) { push('error', 'Add the primary target keyword.'); return; }

    const seq = ++genSeqRef.current;
    setGenerating(true);
    setError('');
    startTimer();
    try {
      const res = await generateBlogDraft(
        form,
        existing.map((r) => ({ title: r.title, slug: r.slug, category: r.category })),
        form.includeInternalLinks ? candidates.map((c) => c.path) : [],
      );
      if (seq !== genSeqRef.current) return; // superseded / modal closed
      setResult(res);
      setDraft(res.draft);
      setPreviewTab('preview');
      setPhase('result');
      logActivity('supabase', user, 'blog.ai_generate', 'blog_post', res.draft.slug || 'unassigned', {
        topic: form.topic.slice(0, 200),
        focus_keyword: form.keyword,
        model: res.model,
        generated_at: new Date().toISOString(),
        duration_ms: res.durationMs,
        word_count: res.wordCount,
      }).catch(() => {});
      push('success', 'AI draft is ready — review it below.');
    } catch (e) {
      if (seq !== genSeqRef.current) return;
      const msg = e instanceof AiBlogError ? e.message : ((e as Error).message || 'AI generation failed.');
      setError(msg);
      push('error', msg);
    } finally {
      if (seq === genSeqRef.current) { setGenerating(false); stopTimer(); }
    }
  }, [candidates, existing, form, generating, push, startTimer, stopTimer, user]);

  const openModal = useCallback(() => {
    setForm(DEFAULT_FORM);
    setPhase('form');
    setError('');
    setResult(null);
    setDraft(null);
    setExistingLoaded(false);
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    genSeqRef.current++; // invalidate any in-flight generation
    stopTimer();
    setOpen(false);
  }, [stopTimer]);

  const useDraft = useCallback(() => {
    if (!draft) return;
    const cleaned = { ...draft, contentHtml: stripInvalidInternalLinksHtml(draft.contentHtml) };
    aiDraftBridge.current = cleaned;
    navigate('/blog?post=new');
    push('success', 'AI draft loaded into the blog editor — review, then save it as a draft.');
    closeModal();
  }, [closeModal, draft, navigate, push]);

  // ------------------------------------------------------------------ render
  if (!open) {
    return (
      <Btn variant="outline" icon={Sparkles} onClick={openModal}>AI Generate Blog</Btn>
    );
  }

  const patchDraft = (patch: Partial<GeneratedBlogDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const patchSeo = (patch: Partial<GeneratedBlogDraft['seo']>) => setDraft((d) => (d ? { ...d, seo: { ...d.seo, ...patch } } : d));

  const toggleRow = (key: 'includeFaq' | 'includeInternalLinks' | 'generateImagePrompt' | 'generateSeo', label: string) => (
    <div>
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">{label}</span>
      <div className="flex items-center gap-2.5">
        <Toggle checked={form[key]} onChange={(v) => setField(key, v)} label={label} disabled={generating} />
        <span className={cx('text-xs font-semibold', form[key] ? 'text-[#8F6B2D]' : 'text-[#64748B]')}>
          {form[key] ? 'Yes' : 'No'}
        </span>
      </div>
    </div>
  );

  const statDisplay = (value: string, mono = false) => (
    <p className={cx('rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#111827]', mono && 'font-mono text-xs break-all')}>
      {value || <span className="text-[#94A3B8]">—</span>}
    </p>
  );

  return (
    <Modal
      open
      onClose={generating ? () => {} : closeModal}
      width="lg"
      title={phase === 'form' ? 'AI Generate Blog' : 'AI Draft — Review'}
      subtitle={phase === 'form'
        ? 'Brief the AI — it writes a complete draft into the existing blog editor.'
        : (result ? `${result.model} · ${result.wordCount.toLocaleString()} words · ${Math.round(result.durationMs / 1000)}s` : '')}
      footer={phase === 'form' ? (
        <>
          <Btn variant="ghost" onClick={closeModal} disabled={generating}>Cancel</Btn>
          <Btn variant="gold" icon={Sparkles} onClick={() => void runGenerate()} loading={generating}>
            {generating ? 'Generating…' : 'Generate with AI'}
          </Btn>
        </>
      ) : (
        <>
          <Btn variant="ghost" onClick={closeModal}>Close</Btn>
          <Btn variant="outline" icon={Sparkles} onClick={() => void runGenerate()} loading={generating}>Regenerate</Btn>
          <Btn variant="gold" onClick={useDraft} disabled={generating || !draft}>Use This Draft</Btn>
        </>
      )}
    >
      {phase === 'form' && (
        <div className="flex flex-col gap-5">
          {generating && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-[#C9A45C]/30 bg-[#C9A45C]/[0.08] px-6 py-10 text-center">
              <Sparkles size={26} className="animate-pulse text-[#8F6B2D]" />
              <p className="text-sm font-bold text-[#111827]">Writing your draft…</p>
              <p className="text-xs text-[#475569]">
                Structuring sections, applying the SEO rules and writing the article.
                This usually takes 40–90 seconds ({elapsed}s elapsed).
              </p>
            </div>
          )}

          {!generating && (
            <>
              {existingError && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2 text-xs text-amber-700">{existingError}</div>
              )}
              {dupHits.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2.5 text-xs text-amber-700">
                  <p className="flex items-center gap-1.5 font-bold"><AlertTriangle size={13} /> Similar to an existing post</p>
                  <p className="mt-1 leading-relaxed">
                    “{dupHits[0].title}” already covers this area (match {Math.round(dupHits[0].score * 100)}%).
                    Consider a differentiated angle — the AI is also instructed to avoid duplicates.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Blog topic" required className="sm:col-span-2" counter={`${form.topic.length}/300`}>
                  <Input
                    value={form.topic}
                    onChange={(e) => setField('topic', e.target.value)}
                    placeholder="e.g. How much does a business website cost in 2026"
                    maxLength={300}
                  />
                </Field>
                <Field label="Primary target keyword" required hint="The one search phrase this article should match.">
                  <Input
                    value={form.keyword}
                    onChange={(e) => setField('keyword', e.target.value)}
                    placeholder="e.g. website cost"
                  />
                </Field>
                <ChipsInput
                  label="Secondary keywords (optional)"
                  value={form.secondaryKeywords}
                  onChange={(v) => setField('secondaryKeywords', v)}
                  hint="Press Enter to add. Keep it to a handful."
                  placeholder="e.g. web design pricing"
                />
                <Field label="Target audience" hint="Who is reading? Sharpens examples and vocabulary.">
                  <Input
                    value={form.audience}
                    onChange={(e) => setField('audience', e.target.value)}
                    placeholder="e.g. founders planning their first custom website"
                  />
                </Field>
                <Field label="Content goal">
                  <Select value={form.goal} onChange={(e) => setField('goal', e.target.value as GenerateBlogForm['goal'])}>
                    {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </Select>
                </Field>
                <Field
                  label="Category"
                  hint={existingCategories.length ? `Existing: ${existingCategories.join(', ')}` : 'Short label, e.g. Web Development'}
                >
                  <Input
                    value={form.category}
                    onChange={(e) => setField('category', e.target.value)}
                    placeholder="e.g. Web Development"
                  />
                </Field>
                <Field label="Article length">
                  <Select value={String(form.length)} onChange={(e) => setField('length', Number(e.target.value))}>
                    {LENGTHS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </Select>
                </Field>
                <Field label="Tone">
                  <Select value={form.tone} onChange={(e) => setField('tone', e.target.value as GenerateBlogForm['tone'])}>
                    {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Select>
                </Field>
                {toggleRow('includeFaq', 'Include FAQ')}
                {toggleRow('includeInternalLinks', 'Include internal links')}
                {toggleRow('generateImagePrompt', 'Featured image prompt')}
                {toggleRow('generateSeo', 'SEO metadata')}
              </div>

              {error && (
                <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/[0.07] px-3 py-2 text-xs text-red-600">
                  <span>{error}</span>
                  <Btn size="sm" variant="outline" onClick={() => void runGenerate()}>Retry</Btn>
                </div>
              )}

              <p className="text-[11px] leading-relaxed text-[#64748B]">
                The AI writes a complete draft — nothing is saved or published automatically.
                “Use This Draft” opens the regular blog editor with everything filled in for your review.
              </p>
            </>
          )}
        </div>
      )}

      {phase === 'result' && draft && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">Draft ready</Badge>
            {draft.tags.slice(0, 4).map((t) => <Badge key={t} tone="zinc">{t}</Badge>)}
          </div>

          {draft.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2.5 text-xs text-amber-700">
              <p className="flex items-center gap-1.5 font-bold"><AlertTriangle size={13} /> Review notes</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 leading-relaxed">
                {draft.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2" counter={`${draft.title.length} chars`}>
              <Input value={draft.title} onChange={(e) => patchDraft({ title: e.target.value })} />
            </Field>
            <Field label="Slug">
              <Input
                value={draft.slug}
                onChange={(e) => patchDraft({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                className="font-mono"
              />
            </Field>
            <Field label="Category">
              <Input value={draft.category} onChange={(e) => patchDraft({ category: e.target.value })} />
            </Field>
            <Field label="Excerpt" className="sm:col-span-2" counter={`${draft.excerpt.length} chars`}>
              <Textarea value={draft.excerpt} onChange={(e) => patchDraft({ excerpt: e.target.value })} rows={2} />
            </Field>
            <div className="sm:col-span-2">
              <ChipsInput label="Tags" value={draft.tags} onChange={(v) => patchDraft({ tags: v })} />
            </div>
            <Field label="SEO title" counter={`${draft.seo.title.length}/60`}>
              <Input value={draft.seo.title} onChange={(e) => patchSeo({ title: e.target.value })} maxLength={120} />
            </Field>
            <Field label="Focus keyword">
              <Input value={draft.seo.focus_keyword} onChange={(e) => patchSeo({ focus_keyword: e.target.value })} />
            </Field>
            <Field label="SEO description" className="sm:col-span-2" counter={`${draft.seo.description.length}/160`}>
              <Textarea value={draft.seo.description} onChange={(e) => patchSeo({ description: e.target.value })} rows={2} />
            </Field>
            <div className="sm:col-span-2">
              <ChipsInput label="SEO keywords" value={draft.seo.keywords} onChange={(v) => patchSeo({ keywords: v })} />
            </div>
          </div>

          {(draft.coverImagePrompt || draft.coverAlt) && (
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8F6B2D]">Featured image (art-direction prompt for the media workflow)</p>
              {draft.coverImagePrompt && (
                <p className="mt-2 text-xs leading-relaxed text-[#334155]">{draft.coverImagePrompt}</p>
              )}
              {draft.coverAlt && (
                <p className="mt-2 text-[11px] text-[#64748B]">Alt text: <span className="text-[#475569]">{draft.coverAlt}</span></p>
              )}
            </div>
          )}

          <div>
            <Tabs
              tabs={[
                { id: 'preview', label: 'Preview' },
                { id: 'html', label: 'HTML source' },
                { id: 'links', label: 'Link check' },
              ]}
              active={previewTab}
              onChange={setPreviewTab}
              className="border-[#E2E8F0] bg-[#0F172A]/[0.04]"
            />
            <div className="mt-3">
              {previewTab === 'preview' && (
                <div className="max-h-[420px] overflow-y-auto rounded-xl border border-[#E2E8F0] bg-white px-5 py-4">
                  <h1 className="mb-4 font-display text-xl font-bold text-[#111827]">{draft.title}</h1>
                  <BlogArticleBody contentHtml={draft.contentHtml} toc={false} />
                </div>
              )}
              {previewTab === 'html' && (
                <Textarea
                  value={draft.contentHtml}
                  onChange={(e) => patchDraft({ contentHtml: e.target.value })}
                  rows={14}
                  className="min-h-72 font-mono text-[11px] leading-relaxed"
                />
              )}
              {previewTab === 'links' && (
                <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3">
                  <LinkCheckPanel contentHtml={draft.contentHtml} />
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-[#64748B]">
            “Use This Draft” opens the existing Blog Editor with this content — the regular
            Visual/HTML editor, SEO panel and Audit stay fully editable. Links that do not match
            real site routes are stripped automatically.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default BlogAiGenerator;
