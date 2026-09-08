// =============================================================================
// BRANIFY ADMIN — AI Tool Editor (full page, CMS-style)
// -----------------------------------------------------------------------------
// Opens under Admin → AI Tools → New / Edit (route: /ai-tools?tool=<id|new>).
// TABS: Content · Beginner Guide · Prompts · Outputs · FAQs · SEO · Audit.
// Data: ai_tools table — extended guide/prompts/outputs/faqs live in the seo
// jsonb document (no schema change needed). The public pages read the same
// document through contentOverrides, so saves publish without a redeploy.
// Honesty rules: the audit is an on-page quality check (not a Google ranking);
// Search Console is reported NOT CONNECTED; no fake analytics.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowDown, ArrowUp, Check, ExternalLink, ImagePlus, Loader2,
  Save, Star, Trash2, X,
} from 'lucide-react';
import type { AdminPageProps } from '../../lib/auth';
import type { AiToolRow } from '../../lib/types';
import { AdminError, createRow, getRow, listRows, updateRow } from '../../lib/backend';
import {
  Badge, Btn, Card, ChipsInput, ConfirmDialog, ErrorBlock, Field, Input,
  LoadingBlock, Select, Tabs, Textarea, Toggle, cx, useToast,
} from '../../ui';
import { slugify } from '../../lib/format';
import { GscMiniPanel } from '../GscMiniPanel';
import { auditAiTool, type AiToolAuditReport } from '../../lib/aiToolAudit';
import { MediaPickerModal } from './BlogEditorMedia';
import { ToolIcon } from '../../../components/ToolIcon';
import { aiToolGuides } from '../../../data/aiToolGuides';

const KNOWN_CATEGORIES = [
  'Chat Assistants', 'Writing & Content', 'Image Generation', 'Video Generation',
  'Voice & Audio', 'Coding', 'No-code Builders', 'Productivity & Research', 'Automation',
];
const PRICING = ['Free', 'Freemium', 'Paid'];
const PROMPT_CATEGORIES = [
  'Business', 'Email', 'Blog', 'Marketing', 'Social Media', 'Product Description',
  'Product Photography', 'Fashion', 'Food', 'Real Estate', 'Landing Page', 'React',
  'Debugging', 'API', 'Automation', 'Learning', 'Research', 'Coding', 'Testing', 'Game Art', 'Voice & Audio',
];

interface GuideStep { title: string; text: string; image: string; caption: string; alt: string; }
interface PromptRow { title: string; category: string; content: string; active: boolean; }
interface OutputRow { image: string; caption: string; alt: string; prompt: string; }
interface FaqRow { question: string; answer: string; active: boolean; }

interface ToolForm {
  name: string;
  slug: string;
  category: string;
  pricing: string;
  url: string;
  description: string;
  icon: string;
  sort_order: number;
  active: boolean;
  featured: boolean;
  /* seo jsonb document */
  seo_title: string;
  seo_description: string;
  keywords: string[];
  focus_keyword: string;
  secondary_keywords: string[];
  canonical: string;
  og_title: string;
  og_description: string;
  og_image: string;
  about: string;
  best_for: string[];
  use_cases: Array<{ title: string; text: string }>;
  beginner_friendly: boolean;
  guide_intro: string;
  guide_steps: GuideStep[];
  prompts: PromptRow[];
  outputs: OutputRow[];
  faqs: FaqRow[];
}

const emptyStep = (): GuideStep => ({ title: '', text: '', image: '', caption: '', alt: '' });
const emptyPrompt = (): PromptRow => ({ title: '', category: 'Business', content: '', active: true });
const emptyOutput = (): OutputRow => ({ image: '', caption: '', alt: '', prompt: '' });
const emptyFaq = (): FaqRow => ({ question: '', answer: '', active: true });

const defaultForm = (): ToolForm => ({
  name: '', slug: '', category: KNOWN_CATEGORIES[0], pricing: 'Freemium', url: '',
  description: '', icon: '', sort_order: 0, active: true, featured: false,
  seo_title: '', seo_description: '', keywords: [], focus_keyword: '', secondary_keywords: [],
  canonical: '', og_title: '', og_description: '', og_image: '',
  about: '', best_for: [], use_cases: [], beginner_friendly: true,
  guide_intro: '', guide_steps: [], prompts: [], outputs: [], faqs: [],
});

type SeoDoc = Record<string, unknown>;

function seoDocFromForm(f: ToolForm): SeoDoc {
  return {
    title: f.seo_title.trim(),
    description: f.seo_description.trim(),
    keywords: f.keywords.map((k) => k.trim()).filter(Boolean),
    focus_keyword: f.focus_keyword.trim(),
    secondary_keywords: f.secondary_keywords.map((k) => k.trim()).filter(Boolean),
    canonical: f.canonical.trim(),
    og_title: f.og_title.trim(),
    og_description: f.og_description.trim(),
    og_image: f.og_image.trim(),
    about: f.about.trim(),
    best_for: f.best_for.map((k) => k.trim()).filter(Boolean),
    use_cases: f.use_cases.filter((u) => u.title.trim() || u.text.trim()),
    beginner_friendly: f.beginner_friendly,
    guide_intro: f.guide_intro.trim(),
    guide_steps: f.guide_steps
      .filter((s) => s.title.trim() || s.text.trim())
      .map((s) => ({ title: s.title.trim(), text: s.text.trim(), image: s.image.trim(), caption: s.caption.trim(), alt: s.alt.trim() })),
    prompts: f.prompts
      .filter((p) => p.title.trim() || p.content.trim())
      .map((p, i) => ({ title: p.title.trim(), category: p.category, content: p.content.trim(), sort: i, active: p.active })),
    outputs: f.outputs
      .filter((o) => o.image.trim() || o.caption.trim())
      .map((o, i) => ({ image: o.image.trim(), caption: o.caption.trim(), alt: o.alt.trim(), prompt: o.prompt.trim(), sort: i })),
    faqs: f.faqs
      .filter((f2) => f2.question.trim() || f2.answer.trim())
      .map((f2, i) => ({ question: f2.question.trim(), answer: f2.answer.trim(), sort: i, active: f2.active })),
  };
}

function rowToForm(row: AiToolRow): ToolForm {
  const s = (row.seo && typeof row.seo === 'object' ? row.seo : {}) as SeoDoc;
  const str = (k: string): string => (typeof s[k] === 'string' ? (s[k] as string) : '');
  const arr = (k: string): string[] => (Array.isArray(s[k]) ? (s[k] as unknown[]).map(String) : []);
  const objArr = <T,>(k: string, map: (o: Record<string, unknown>) => T): T[] =>
    (Array.isArray(s[k]) ? (s[k] as Record<string, unknown>[]) : []).map(map);
  return {
    name: row.name || '',
    slug: row.slug || '',
    category: row.category || KNOWN_CATEGORIES[0],
    pricing: PRICING.includes(row.pricing) ? row.pricing : 'Freemium',
    url: row.url || '',
    description: row.description || '',
    icon: row.icon || '',
    sort_order: Number(row.sort_order) || 0,
    active: row.active !== false,
    featured: Boolean(row.featured),
    seo_title: str('title'),
    seo_description: str('description'),
    keywords: arr('keywords'),
    focus_keyword: str('focus_keyword'),
    secondary_keywords: arr('secondary_keywords'),
    canonical: str('canonical'),
    og_title: str('og_title'),
    og_description: str('og_description'),
    og_image: str('og_image'),
    about: str('about'),
    best_for: arr('best_for'),
    use_cases: objArr('use_cases', (o) => ({ title: String(o.title ?? ''), text: String(o.text ?? '') })),
    beginner_friendly: typeof s.beginner_friendly === 'boolean' ? (s.beginner_friendly as boolean) : true,
    guide_intro: str('guide_intro'),
    guide_steps: objArr('guide_steps', (o) => ({
      title: String(o.title ?? ''), text: String(o.text ?? ''),
      image: String(o.image ?? ''), caption: String(o.caption ?? ''), alt: String(o.alt ?? ''),
    })),
    prompts: objArr('prompts', (o) => ({
      title: String(o.title ?? ''), category: String(o.category ?? 'Business'),
      content: String(o.content ?? ''), active: o.active !== false,
    })),
    outputs: objArr('outputs', (o) => ({
      image: String(o.image ?? ''), caption: String(o.caption ?? ''),
      alt: String(o.alt ?? ''), prompt: String(o.prompt ?? ''),
    })),
    faqs: objArr('faqs', (o) => ({
      question: String(o.question ?? ''), answer: String(o.answer ?? ''), active: o.active !== false,
    })),
  };
}

// ------------------------------------------------------------------ image cell (shared by steps/outputs)
const ImageSlot: React.FC<{
  value: string;
  alt: string;
  label: string;
  onPick: (url: string, alt: string) => void;
  onClear: () => void;
}> = ({ value, alt, label, onPick, onClear }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative shrink-0">
            <img src={value} alt={alt || label} className="w-16 h-16 rounded-xl object-cover border border-[#E2E8F0]" />
            <button
              type="button"
              onClick={onClear}
              aria-label="Remove image"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow cursor-pointer"
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-[#CBD5E1] text-[#94A3B8] hover:border-[#5B5FEF]/50 hover:text-[#5B5FEF] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <ImagePlus size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Media</span>
          </button>
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          {value ? (
            <>
              <Input value={value} onChange={(e) => onPick(e.target.value, alt)} placeholder="/ai-icons/… or media URL" aria-label={`${label} image URL`} />
              <button type="button" onClick={() => setPickerOpen(true)} className="text-[10.5px] font-bold text-[#5B5FEF] hover:underline cursor-pointer">
                Replace from Media Library
              </button>
            </>
          ) : (
            <p className="text-[11px] text-[#94A3B8] leading-snug">Optional image from the Media Library (screenshot, photo or diagram).</p>
          )}
        </div>
      </div>
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(img) => { onPick(img.url, alt); setPickerOpen(false); }}
        title={label}
      />
    </div>
  );
};

// ------------------------------------------------------------------ editor
export const AIToolEditor: React.FC<AdminPageProps & { toolId: string | null }> = ({ toolId, navigate }) => {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState<ToolForm>(defaultForm());
  const [otherTools, setOtherTools] = useState<Array<{ slug: string; name: string; seo: { title?: string; description?: string } }>>([]);
  const [tab, setTab] = useState('content');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'dirty' | 'error'>('saved');
  const [confirmBack, setConfirmBack] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ kind: 'icon' } | null>(null);

  const formRef = useRef(form);
  formRef.current = form;
  const snapshotRef = useRef<string>('');

  const update = useCallback((patch: Partial<ToolForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSaveState('dirty');
  }, []);

  /* ---------- load ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const res = await listRows<AiToolRow>('ai_tools', { pageSize: 100, sort: 'sort_order', dir: 'asc' });
        if (!alive) return;
        setOtherTools(res.rows.map((r) => ({ slug: r.slug, name: r.name, seo: (r.seo || {}) as { title?: string; description?: string } })));
        if (toolId) {
          const row = await getRow<AiToolRow>('ai_tools', toolId);
          if (!alive) return;
          const f = rowToForm(row);
          // Prefill from the compiled seed guide so the editor shows exactly what
          // the public page renders; the first save persists it as the DB source.
          const s = (row.seo && typeof row.seo === 'object' ? row.seo : {}) as Record<string, unknown>;
          const docHasGuide = ['about', 'guide_steps', 'prompts', 'faqs', 'best_for', 'use_cases'].some((k) =>
            Array.isArray(s[k]) ? (s[k] as unknown[]).length > 0 : typeof s[k] === 'string' && Boolean(s[k]),
          );
          if (!docHasGuide) {
            const seed = aiToolGuides[row.slug];
            if (seed) {
              f.about = seed.about;
              f.best_for = [...seed.bestFor];
              f.use_cases = seed.useCases.map((u) => ({ title: u.title, text: u.text }));
              f.beginner_friendly = seed.beginnerFriendly;
              f.guide_steps = seed.steps.map((st) => ({ title: st.title, text: st.text, image: st.image || '', caption: st.caption || '', alt: st.alt || '' }));
              f.prompts = seed.prompts.map((pr) => ({ title: pr.title, category: pr.category, content: pr.content, active: true }));
              f.faqs = seed.faqs.map((fq) => ({ question: fq.question, answer: fq.answer, active: true }));
            }
          }
          setForm(f);
          snapshotRef.current = JSON.stringify(f);
        } else {
          const maxSort = res.rows.reduce((m, r) => Math.max(m, Number(r.sort_order) || 0), 0);
          const fresh = { ...defaultForm(), sort_order: maxSort + 1 };
          setForm(fresh);
          snapshotRef.current = JSON.stringify(fresh);
        }

      } catch (e) {
        if (alive) setLoadError((e as Error).message || 'Failed to load the AI tool.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [toolId]);

  /* ---------- dirty guard ---------- */
  useEffect(() => {
    if (loading) return;
    const dirty = JSON.stringify(form) !== snapshotRef.current;
    if (dirty && saveState === 'saved') setSaveState('dirty');
  }, [form, loading, saveState]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveState === 'dirty' || saveState === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveState]);

  /* ---------- audit ---------- */
  const audit: AiToolAuditReport | null = useMemo(() => {
    if (loading) return null;
    return auditAiTool({
      name: form.name, slug: form.slug, category: form.category, description: form.description, url: form.url,
      about: form.about, bestFor: form.best_for, useCases: form.use_cases.filter((u) => u.title || u.text),
      guideSteps: form.guide_steps, prompts: form.prompts, faqs: form.faqs,
      seo: {
        title: form.seo_title, description: form.seo_description, keywords: form.keywords,
        focus_keyword: form.focus_keyword, secondary_keywords: form.secondary_keywords,
        canonical: form.canonical, og_title: form.og_title, og_description: form.og_description, og_image: form.og_image,
      },
      otherTools,
    });
  }, [form, otherTools, loading]);

  /* ---------- save ---------- */
  const save = useCallback(async (): Promise<boolean> => {
    const f = formRef.current;
    if (!f.name.trim()) { push({ type: 'error', title: 'Name is required.' }); setTab('content'); return false; }
    if (!f.url.trim()) { push({ type: 'error', title: 'Official URL is required.' }); setTab('content'); return false; }
    setSaveState('saving');
    try {
      const payload: Record<string, unknown> = {
        name: f.name.trim(),
        slug: (f.slug || slugify(f.name)).trim(),
        category: f.category,
        pricing: f.pricing,
        url: f.url.trim(),
        description: f.description.trim(),
        icon: f.icon.trim(),
        sort_order: Number(f.sort_order) || 0,
        active: f.active,
        featured: f.featured,
        seo: seoDocFromForm(f),
      };
      if (toolId) await updateRow('ai_tools', toolId, payload);
      else await createRow('ai_tools', payload);
      snapshotRef.current = JSON.stringify(f);
      setSaveState('saved');
      push({ type: 'success', title: toolId ? 'AI tool updated.' : 'AI tool created.', message: 'The public directory and tool page update automatically.' });
      return true;
    } catch (e) {
      setSaveState('error');
      const msg = e instanceof AdminError ? e.message : (e as Error).message;
      push({ type: 'error', title: 'Save failed', message: msg });
      return false;
    }
  }, [toolId, push]);

  const saveAndClose = async () => {
    if (await save()) navigate('/ai-tools');
  };

  const listMove = <T,>(list: T[], i: number, dir: -1 | 1): T[] => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const copy = [...list];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingBlock label="Loading AI tool…" />
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="p-8 space-y-4">
        <ErrorBlock title="Could not open this AI tool" message={loadError} />
        <Btn variant="subtle" onClick={() => navigate('/ai-tools')}>Back to AI Tools</Btn>
      </div>
    );
  }

  const slugPreview = (form.slug || slugify(form.name) || 'tool-slug').toLowerCase();
  const scoreTone = audit ? (audit.scorePct >= 80 ? 'text-emerald-600' : audit.scorePct >= 60 ? 'text-[#8F6B2D]' : 'text-red-600') : '';

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* top bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => (saveState === 'dirty' ? setConfirmBack(true) : navigate('/ai-tools'))}
            className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] cursor-pointer"
            aria-label="Back to AI tools"
          >
            <ArrowLeft size={16} />
          </button>
          <ToolIcon icon={form.icon} name={form.name || '?'} className="w-9 h-9" rounded="rounded-lg" />
          <div className="min-w-0">
            <p className="font-bold text-sm text-[#111827] truncate">{form.name || 'New AI tool'}</p>
            <p className="text-[10.5px] font-mono text-[#64748B] truncate">/ai-tools/{slugPreview}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {audit && (
            <span className={cx('text-xs font-black tabular-nums', scoreTone)} title="On-page SEO quality check — not a Google ranking">
              SEO {audit.scorePct}/100
            </span>
          )}
          <span className={cx(
            'text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full',
            saveState === 'saved' && 'bg-emerald-500/10 text-emerald-700',
            saveState === 'saving' && 'bg-[#C9A45C]/15 text-[#8F6B2D]',
            saveState === 'dirty' && 'bg-amber-500/10 text-amber-700',
            saveState === 'error' && 'bg-red-500/10 text-red-700',
          )}>
            {saveState === 'saved' ? 'Saved' : saveState === 'saving' ? 'Saving…' : saveState === 'dirty' ? 'Unsaved changes' : 'Save failed'}
          </span>
          <Btn variant="gold" onClick={saveAndClose} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </Btn>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Tabs
          tabs={[
            { id: 'content', label: 'Content' },
            { id: 'guide', label: 'Beginner Guide' },
            { id: 'prompts', label: `Prompts${form.prompts.length ? ` (${form.prompts.length})` : ''}` },
            { id: 'outputs', label: `Outputs${form.outputs.length ? ` (${form.outputs.length})` : ''}` },
            { id: 'faqs', label: `FAQs${form.faqs.length ? ` (${form.faqs.length})` : ''}` },
            { id: 'seo', label: 'SEO' },
            { id: 'audit', label: 'Audit' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* ==================== CONTENT ==================== */}
        {tab === 'content' && (
          <div className="mt-5 space-y-5">
            <Card className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Tool name" required>
                  <Input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="ChatGPT" />
                </Field>
                <Field label="Slug" hint="Public URL: /ai-tools/{slug}">
                  <Input value={form.slug} onChange={(e) => update({ slug: slugify(e.target.value) })} placeholder="chatgpt" />
                </Field>
                <Field label="Category">
                  <Select value={form.category} onChange={(e) => update({ category: e.target.value })}>{KNOWN_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select>
                </Field>
                <Field label="Pricing status" hint="Stored value shown on cards — never invented.">
                  <Select value={form.pricing} onChange={(e) => update({ pricing: e.target.value })}>{PRICING.map((p) => <option key={p} value={p}>{p}</option>)}</Select>
                </Field>
                <Field label="Official URL" required>
                  <Input value={form.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://…" />
                </Field>
                <Field label="Sort order">
                  <Input type="number" value={String(form.sort_order)} onChange={(e) => update({ sort_order: Number(e.target.value) || 0 })} />
                </Field>
              </div>
              <Field label="Short description" hint="Card + directory description.">
                <Textarea value={form.description} onChange={(e) => update({ description: e.target.value })} rows={2} placeholder="General-purpose AI assistant for writing, coding, research, and images." />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4 items-end">
                <Field label="Official icon" hint="Path from /ai-icons (managed assets). Leave empty for a neutral tile.">
                  <div className="flex items-center gap-3">
                    <ToolIcon icon={form.icon} name={form.name || '?'} className="w-10 h-10" />
                    <Input value={form.icon} onChange={(e) => update({ icon: e.target.value })} placeholder="/ai-icons/chatgpt.svg" />
                  </div>
                </Field>
                <div className="flex flex-wrap items-center gap-5 pb-1">
                  <label className="inline-flex items-center gap-2.5 cursor-pointer"><Toggle checked={form.active} onChange={(v) => update({ active: v })} label="Active" /><span className="text-xs font-bold text-[#334155]">Active (visible on /ai-tools)</span></label>
                  <label className="inline-flex items-center gap-2.5 cursor-pointer"><Toggle checked={form.featured} onChange={(v) => update({ featured: v })} label="Featured" /><span className="text-xs font-bold text-[#334155] inline-flex items-center gap-1.5"><Star size={12} className={form.featured ? 'fill-[#E8C97C] text-[#8F6B2D]' : 'text-[#94A3B8]'} /> Featured</span></label>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#64748B]">Page content</h3>
              <Field label="About this tool" hint="What it is + who it is for. The detail page intro (H2 section).">
                <Textarea value={form.about} onChange={(e) => update({ about: e.target.value })} rows={5} placeholder="What the tool does, what makes it useful, how beginners should think about it…" />
              </Field>
              <ChipsInput label="Best for" value={form.best_for} onChange={(v) => update({ best_for: v })} placeholder="Concept art, Marketing visuals…" hint="Chips shown in the Best-for panel and cards." />
              <label className="inline-flex items-center gap-2.5 cursor-pointer"><Toggle checked={form.beginner_friendly} onChange={(v) => update({ beginner_friendly: v })} label="Beginner friendly" /><span className="text-xs font-bold text-[#334155]">Beginner friendly (badge + beginner filter)</span></label>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#64748B]">Use cases — what can you do with it</p>
                  <button
                    type="button"
                    className="text-[11px] font-extrabold text-[#5B5FEF] hover:underline cursor-pointer"
                    onClick={() => update({ use_cases: [...form.use_cases, { title: '', text: '' }] })}
                  >
                    + Add use case
                  </button>
                </div>
                <div className="space-y-3">
                  {form.use_cases.map((u, i) => (
                    <div key={i} className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] text-[11px] font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
                        <Input value={u.title} onChange={(e) => update({ use_cases: form.use_cases.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} placeholder="Use case title" />
                        <button type="button" aria-label="Remove use case" onClick={() => update({ use_cases: form.use_cases.filter((_, j) => j !== i) })} className="p-2 text-[#94A3B8] hover:text-red-600 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <Textarea value={u.text} onChange={(e) => update({ use_cases: form.use_cases.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} rows={2} placeholder="One or two sentences describing this use case." />
                    </div>
                  ))}
                  {!form.use_cases.length && <p className="text-[11px] text-[#94A3B8]">No use cases yet — 3–4 is a good target.</p>}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ==================== GUIDE ==================== */}
        {tab === 'guide' && (
          <div className="mt-5 space-y-5">
            <Card className="p-5 space-y-4">
              <Field label="Guide introduction (optional)" hint="Shown above the steps when present; otherwise the About text opens the guide.">
                <Textarea value={form.guide_intro} onChange={(e) => update({ guide_intro: e.target.value })} rows={2} />
              </Field>
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#64748B]">Step-by-step beginner guide</h3>
                <button
                  type="button"
                  className="text-[11px] font-extrabold text-[#5B5FEF] hover:underline cursor-pointer"
                  onClick={() => update({ guide_steps: [...form.guide_steps, emptyStep()] })}
                >
                  + Add step
                </button>
              </div>
              <ol className="space-y-4">
                {form.guide_steps.map((s, i) => (
                  <li key={i} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-[#5B5FEF] text-white text-xs font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
                      <Input value={s.title} onChange={(e) => update({ guide_steps: form.guide_steps.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} placeholder={`Step ${i + 1} title`} />
                      <div className="flex items-center shrink-0">
                        <button type="button" aria-label="Move step up" disabled={i === 0} onClick={() => update({ guide_steps: listMove(form.guide_steps, i, -1) })} className="p-1.5 text-[#94A3B8] hover:text-[#111827] disabled:opacity-30 cursor-pointer"><ArrowUp size={14} /></button>
                        <button type="button" aria-label="Move step down" disabled={i === form.guide_steps.length - 1} onClick={() => update({ guide_steps: listMove(form.guide_steps, i, 1) })} className="p-1.5 text-[#94A3B8] hover:text-[#111827] disabled:opacity-30 cursor-pointer"><ArrowDown size={14} /></button>
                        <button type="button" aria-label="Remove step" onClick={() => update({ guide_steps: form.guide_steps.filter((_, j) => j !== i) })} className="p-1.5 text-[#94A3B8] hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <Textarea value={s.text} onChange={(e) => update({ guide_steps: form.guide_steps.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} rows={2} placeholder="What the user does in this step — keep it simple and concrete." />
                    <ImageSlot
                      label={`Step ${i + 1}`}
                      value={s.image}
                      alt={s.alt}
                      onPick={(url) => update({ guide_steps: form.guide_steps.map((x, j) => (j === i ? { ...x, image: url } : x)) })}
                      onClear={() => update({ guide_steps: form.guide_steps.map((x, j) => (j === i ? { ...x, image: '' } : x)) })}
                    />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Caption (optional)">
                        <Input value={s.caption} onChange={(e) => update({ guide_steps: form.guide_steps.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)) })} />
                      </Field>
                      <Field label="Alt text" hint={s.image && !s.alt.trim() ? 'Missing alt text — the SEO audit will warn.' : 'Natural description of the image.'}>
                        <Input value={s.alt} onChange={(e) => update({ guide_steps: form.guide_steps.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)) })} placeholder="Describe the screenshot for screen readers" />
                      </Field>
                    </div>
                  </li>
                ))}
              </ol>
              {!form.guide_steps.length && (
                <p className="text-[11.5px] text-[#94A3B8] bg-white/[0.5] border border-dashed border-[#CBD5E1] rounded-xl px-4 py-3.5">
                  No steps yet. Add 4–6 simple steps — open the site, sign in, do the main thing, refine, export. Each step can carry a screenshot from the Media Library.
                </p>
              )}
            </Card>
          </div>
        )}

        {/* ==================== PROMPTS ==================== */}
        {tab === 'prompts' && (
          <div className="mt-5 space-y-5">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-[#64748B]">Example prompts</h3>
                  <p className="text-[11px] text-[#94A3B8] mt-1">Each prompt gets a COPY PROMPT button on the public page.</p>
                </div>
                <button
                  type="button"
                  className="text-[11px] font-extrabold text-[#5B5FEF] hover:underline cursor-pointer"
                  onClick={() => update({ prompts: [...form.prompts, emptyPrompt()] })}
                >
                  + Add prompt
                </button>
              </div>
              <div className="space-y-4">
                {form.prompts.map((p, i) => (
                  <div key={i} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] text-[11px] font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
                      <Input value={p.title} onChange={(e) => update({ prompts: form.prompts.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} placeholder="Prompt title (e.g. Product photography prompt)" />
                      <div className="w-44 shrink-0">
                        <Select value={p.category} onChange={(e) => update({ prompts: form.prompts.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)) })}>{[...new Set([...PROMPT_CATEGORIES, p.category])].map((c) => <option key={c} value={c}>{c}</option>)}</Select>
                      </div>
                      <div className="flex items-center shrink-0">
                        <button type="button" aria-label="Move prompt up" disabled={i === 0} onClick={() => update({ prompts: listMove(form.prompts, i, -1) })} className="p-1.5 text-[#94A3B8] hover:text-[#111827] disabled:opacity-30 cursor-pointer"><ArrowUp size={14} /></button>
                        <button type="button" aria-label="Move prompt down" disabled={i === form.prompts.length - 1} onClick={() => update({ prompts: listMove(form.prompts, i, 1) })} className="p-1.5 text-[#94A3B8] hover:text-[#111827] disabled:opacity-30 cursor-pointer"><ArrowDown size={14} /></button>
                        <button type="button" aria-label="Remove prompt" onClick={() => update({ prompts: form.prompts.filter((_, j) => j !== i) })} className="p-1.5 text-[#94A3B8] hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <Textarea
                      value={p.content}
                      onChange={(e) => update({ prompts: form.prompts.map((x, j) => (j === i ? { ...x, content: e.target.value } : x)) })}
                      rows={3}
                      placeholder="The prompt text users will copy. Use [brackets] for placeholders."
                    />
                    <label className="inline-flex items-center gap-2.5 cursor-pointer"><Toggle checked={p.active} onChange={(v) => update({ prompts: form.prompts.map((x, j) => (j === i ? { ...x, active: v } : x)) })} label="Active" /><span className="text-xs font-bold text-[#334155]">Active (visible on the page)</span></label>
                  </div>
                ))}
                {!form.prompts.length && (
                  <p className="text-[11.5px] text-[#94A3B8] bg-white/[0.5] border border-dashed border-[#CBD5E1] rounded-xl px-4 py-3.5">
                    No example prompts yet — 3–4 prompts in 2–3 categories is a good target.
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ==================== OUTPUTS ==================== */}
        {tab === 'outputs' && (
          <div className="mt-5 space-y-5">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-[#64748B]">Example outputs</h3>
                  <p className="text-[11px] text-[#94A3B8] mt-1">Real images only (BRANIFY-owned or licensed). Without an image nothing renders — no fake visuals.</p>
                </div>
                <button
                  type="button"
                  className="text-[11px] font-extrabold text-[#5B5FEF] hover:underline cursor-pointer"
                  onClick={() => update({ outputs: [...form.outputs, emptyOutput()] })}
                >
                  + Add output
                </button>
              </div>
              <div className="space-y-4">
                {form.outputs.map((o, i) => (
                  <div key={i} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] text-[11px] font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
                      <div className="flex-1" />
                      <div className="flex items-center shrink-0">
                        <button type="button" aria-label="Move output up" disabled={i === 0} onClick={() => update({ outputs: listMove(form.outputs, i, -1) })} className="p-1.5 text-[#94A3B8] hover:text-[#111827] disabled:opacity-30 cursor-pointer"><ArrowUp size={14} /></button>
                        <button type="button" aria-label="Move output down" disabled={i === form.outputs.length - 1} onClick={() => update({ outputs: listMove(form.outputs, i, 1) })} className="p-1.5 text-[#94A3B8] hover:text-[#111827] disabled:opacity-30 cursor-pointer"><ArrowDown size={14} /></button>
                        <button type="button" aria-label="Remove output" onClick={() => update({ outputs: form.outputs.filter((_, j) => j !== i) })} className="p-1.5 text-[#94A3B8] hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <ImageSlot
                      label={`Output ${i + 1}`}
                      value={o.image}
                      alt={o.alt}
                      onPick={(url) => update({ outputs: form.outputs.map((x, j) => (j === i ? { ...x, image: url } : x)) })}
                      onClear={() => update({ outputs: form.outputs.map((x, j) => (j === i ? { ...x, image: '' } : x)) })}
                    />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Alt text">
                        <Input value={o.alt} onChange={(e) => update({ outputs: form.outputs.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)) })} placeholder="Describe the example result" />
                      </Field>
                      <Field label="Caption">
                        <Input value={o.caption} onChange={(e) => update({ outputs: form.outputs.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)) })} placeholder="What this example shows" />
                      </Field>
                    </div>
                    <Field label="Prompt used (optional)">
                      <Textarea value={o.prompt} onChange={(e) => update({ outputs: form.outputs.map((x, j) => (j === i ? { ...x, prompt: e.target.value } : x)) })} rows={2} />
                    </Field>
                  </div>
                ))}
                {!form.outputs.length && (
                  <p className="text-[11.5px] text-[#94A3B8] bg-white/[0.5] border border-dashed border-[#CBD5E1] rounded-xl px-4 py-3.5">
                    No example outputs. The public page stays honest without them — prompts render as clean text examples.
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ==================== FAQS ==================== */}
        {tab === 'faqs' && (
          <div className="mt-5 space-y-5">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-[#64748B]">FAQs</h3>
                  <p className="text-[11px] text-[#94A3B8] mt-1">3+ active FAQs make the page eligible for FAQ structured data.</p>
                </div>
                <button
                  type="button"
                  className="text-[11px] font-extrabold text-[#5B5FEF] hover:underline cursor-pointer"
                  onClick={() => update({ faqs: [...form.faqs, emptyFaq()] })}
                >
                  + Add FAQ
                </button>
              </div>
              <div className="space-y-4">
                {form.faqs.map((f, i) => (
                  <div key={i} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] text-[11px] font-extrabold flex items-center justify-center shrink-0">Q{i + 1}</span>
                      <Input value={f.question} onChange={(e) => update({ faqs: form.faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)) })} placeholder="Question (e.g. Is it free?)" />
                      <div className="flex items-center shrink-0">
                        <button type="button" aria-label="Move FAQ up" disabled={i === 0} onClick={() => update({ faqs: listMove(form.faqs, i, -1) })} className="p-1.5 text-[#94A3B8] hover:text-[#111827] disabled:opacity-30 cursor-pointer"><ArrowUp size={14} /></button>
                        <button type="button" aria-label="Move FAQ down" disabled={i === form.faqs.length - 1} onClick={() => update({ faqs: listMove(form.faqs, i, 1) })} className="p-1.5 text-[#94A3B8] hover:text-[#111827] disabled:opacity-30 cursor-pointer"><ArrowDown size={14} /></button>
                        <button type="button" aria-label="Remove FAQ" onClick={() => update({ faqs: form.faqs.filter((_, j) => j !== i) })} className="p-1.5 text-[#94A3B8] hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <Textarea value={f.answer} onChange={(e) => update({ faqs: form.faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)) })} rows={2} placeholder="Answer — factual, no invented pricing." />
                    <label className="inline-flex items-center gap-2.5 cursor-pointer"><Toggle checked={f.active} onChange={(v) => update({ faqs: form.faqs.map((x, j) => (j === i ? { ...x, active: v } : x)) })} label="Active" /><span className="text-xs font-bold text-[#334155]">Active</span></label>
                  </div>
                ))}
                {!form.faqs.length && (
                  <p className="text-[11.5px] text-[#94A3B8] bg-white/[0.5] border border-dashed border-[#CBD5E1] rounded-xl px-4 py-3.5">
                    No FAQs yet — “What is …?”, “Is … free?”, “What can … create?” and “How do beginners start?” are proven starters.
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ==================== SEO ==================== */}
        {tab === 'seo' && (
          <div className="mt-5 space-y-5">
            <Card className="p-5 space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#64748B]">Google preview</h3>
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                <p className="text-[11px] text-[#475569] mb-0.5">https://branify.store/ai-tools/{slugPreview}</p>
                <p className="text-[17px] leading-snug text-[#1A0DAB] font-medium truncate">
                  {(form.seo_title || `${form.name || 'Tool'} — AI Tool Guide | BRANIFY`).slice(0, 70)}
                </p>
                <p className="text-[12px] text-[#4D5156] line-clamp-2">
                  {(form.seo_description || form.description || 'Add a meta description…').slice(0, 175)}
                </p>
              </div>
              <Field label="SEO title" counter={65} hint="Aim for 20–65 characters.">
                <Input value={form.seo_title} onChange={(e) => update({ seo_title: e.target.value })} placeholder={`${form.name || 'Tool'} — AI Tool Guide | BRANIFY`} />
              </Field>
              <Field label="Meta description" counter={165} hint="What the tool does, who it is for, and that BRANIFY has a beginner guide.">
                <Textarea value={form.seo_description} onChange={(e) => update({ seo_description: e.target.value })} rows={3} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Focus keyword" hint="Should appear in title/description/about.">
                  <Input value={form.focus_keyword} onChange={(e) => update({ focus_keyword: e.target.value })} placeholder={`${form.name || 'midjourney'} guide`} />
                </Field>
                <Field label="Canonical URL" hint="Leave empty to auto-generate.">
                  <Input value={form.canonical} onChange={(e) => update({ canonical: e.target.value })} placeholder={`https://branify.store/ai-tools/${slugPreview}`} />
                </Field>
              </div>
              <ChipsInput label="Secondary keywords" value={form.secondary_keywords} onChange={(v) => update({ secondary_keywords: v })} placeholder="how to use…" />
              <ChipsInput label="Keywords (meta keywords list)" value={form.keywords} onChange={(v) => update({ keywords: v })} placeholder={form.name || 'ai tool'} />
            </Card>
            <Card className="p-5 space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#64748B]">Open Graph / social</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="OG title (optional)">
                  <Input value={form.og_title} onChange={(e) => update({ og_title: e.target.value })} />
                </Field>
                <Field label="OG description (optional)">
                  <Input value={form.og_description} onChange={(e) => update({ og_description: e.target.value })} />
                </Field>
              </div>
              <Field label="OG image URL" hint="BRANIFY-owned or properly licensed imagery only; falls back to the site default.">
                <Input value={form.og_image} onChange={(e) => update({ og_image: e.target.value })} placeholder="https://…" />
              </Field>
            </Card>
          </div>
        )}

        {/* ==================== AUDIT ==================== */}
        {tab === 'audit' && audit && (
          <div className="mt-5 space-y-5">
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-[#111827]">On-page SEO quality check</h3>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">Calculated from real stored fields — this is an internal audit, not a Google ranking or guarantee.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cx('text-2xl font-black tabular-nums', scoreTone)}>{audit.scorePct}<span className="text-sm text-[#94A3B8]">/100</span></span>
                  <div className="text-right text-[10px] font-bold uppercase tracking-wider leading-4">
                    <p className="text-emerald-600">{audit.passed} pass</p>
                    <p className="text-amber-600">{audit.warned} warn</p>
                    <p className="text-red-600">{audit.failed} fail</p>
                  </div>
                </div>
              </div>
              <ul className="mt-4 divide-y divide-[#F1F5F9]">
                {audit.checks.map((c) => (
                  <li key={c.id} className="py-2.5 flex items-start gap-3">
                    <span className={cx(
                      'shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5',
                      c.status === 'pass' && 'bg-emerald-500/10 text-emerald-600',
                      c.status === 'warn' && 'bg-amber-500/10 text-amber-600',
                      c.status === 'fail' && 'bg-red-500/10 text-red-600',
                    )}>
                      {c.status === 'pass' ? <Check size={11} /> : c.status === 'warn' ? '!' : '×'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-[#111827]">{c.label}</p>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">{c.detail}</p>
                    </div>
                    <Badge tone={c.status === 'pass' ? 'green' : c.status === 'warn' ? 'amber' : 'red'}>{c.status}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-5">
              <h3 className="font-bold text-sm text-[#111827] mb-1">Readability</h3>
              <p className="text-[11px] text-[#94A3B8] mb-3">A writing-quality tool — it does not determine Google rankings.</p>
              <div className="flex items-center gap-3 mb-3">
                <span className={cx('text-xl font-black tabular-nums', scoreTone)}>{audit.readability.scorePct}%</span>
                <Badge tone={audit.readability.scorePct >= 80 ? 'green' : audit.readability.scorePct >= 60 ? 'amber' : 'red'}>{audit.readability.label}</Badge>
              </div>
              <p className="text-[11px] text-[#64748B]">{audit.readability.detail}</p>
            </Card>
            <Card className="p-5 space-y-3">
              <h3 className="font-bold text-sm text-[#111827]">Search performance</h3>
              <div className="rounded-xl border border-[#E2E8F0] bg-white/[0.5] p-4">
                <GscMiniPanel
                  path={`/ai-tools/${form.slug || slugify(form.name)}`}
                  published={Boolean(form.slug)}
                  onOpenCenter={(p) => navigate(`/seo/search-console?page=${encodeURIComponent(p)}`)}
                />
              </div>
            </Card>
          </div>
        )}

        {/* footer actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pb-10">
          <button
            type="button"
            onClick={() => (saveState === 'dirty' ? setConfirmBack(true) : navigate('/ai-tools'))}
            className="text-xs font-bold text-[#64748B] hover:text-[#111827] cursor-pointer"
          >
            ← Back to list
          </button>
          <div className="flex items-center gap-2">
            {form.slug && form.active && (
              <a
                href={`/ai-tools/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B5FEF] hover:underline"
              >
                View public page <ExternalLink size={12} />
              </a>
            )}
            <Btn variant="subtle" onClick={saveAndClose} disabled={saveState === 'saving'}>Save & close</Btn>
            <Btn variant="gold" onClick={() => void save()} disabled={saveState === 'saving'}>
              {saveState === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </Btn>
          </div>
        </div>
      </div>

      {/* icon picker via media library */}
      {pickerTarget?.kind === 'icon' && (
        <MediaPickerModal
          open
          onClose={() => setPickerTarget(null)}
          onPick={(img) => { update({ icon: img.url }); setPickerTarget(null); }}
          title="Select the tool icon"
        />
      )}

      <ConfirmDialog
        open={confirmBack}
        title="Unsaved changes"
        message="You have unsaved changes to this AI tool. Leave without saving?"
        confirmLabel="Leave without saving"
        cancelLabel="Keep editing"
        onConfirm={() => navigate('/ai-tools')}
        onClose={() => setConfirmBack(false)}
      />
    </div>
  );
};

export default AIToolEditor;
