// =============================================================================
// BRANIFY ADMIN — AI blog draft generator (OmniRoute via server-side /api/ai)
// -----------------------------------------------------------------------------
// Form → POST /api/ai/blog → preview the returned draft → create a real
// blog_posts row (status: draft) through the normal admin backend.
// No keys ever pass through here; the browser only ever talks to /api/ai.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import {
  Badge, Btn, Field, Input, Modal, Select, Textarea, ChipsInput, useToast, cx,
} from '../ui';
import { createRow } from '../lib/backend';
import { generateAiBlog, AiClientError, type BlogDraft } from '../../lib/aiClient';

const TONES = ['professional', 'friendly', 'bold', 'luxury', 'educational'];
const LENGTHS = [
  { value: 'short', label: 'Short (~600 words)' },
  { value: 'medium', label: 'Medium (~1000 words)' },
  { value: 'long', label: 'Long (~1800 words)' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after a draft row was created so the list can refresh. */
  onCreated: () => void;
}

const AiBlogDraftModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const { push } = useToast();

  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<BlogDraft | null>(null);

  // Reset transient state whenever the modal opens.
  useEffect(() => {
    if (open) {
      setError(null);
      setDraft(null);
      setBusy(false);
      setCreating(false);
    }
  }, [open]);

  const resetForm = () => {
    setTopic('');
    setCategory('');
    setTone('professional');
    setLength('medium');
    setKeywords([]);
    setNotes('');
  };

  const generate = async () => {
    if (topic.trim().length < 4) {
      setError('Describe the topic in at least a few words.');
      return;
    }
    setBusy(true);
    setError(null);
    setDraft(null);
    try {
      const result = await generateAiBlog({
        topic: topic.trim(),
        category: category.trim() || undefined,
        tone,
        length,
        keywords: keywords.length ? keywords : undefined,
        notes: notes.trim() || undefined,
      });
      setDraft(result);
    } catch (e) {
      const err = e as AiClientError;
      setError(err.message || 'The AI request failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const createDraftPost = async () => {
    if (!draft) return;
    setCreating(true);
    setError(null);
    try {
      await createRow('blog_posts', {
        title: draft.title,
        slug: draft.slug,
        excerpt: draft.excerpt,
        content: draft.content,
        cover_image: '',
        author_name: draft.author_name,
        author_role: draft.author_role,
        published_at: null,
        category: draft.category,
        tags: draft.tags,
        status: 'draft',
        featured: false,
        seo: {
          title: draft.seo.title,
          description: draft.seo.description,
          keywords: draft.seo.keywords,
        },
      });
      push('success', `AI draft created: “${draft.title}” (status: draft)`);
      resetForm();
      setDraft(null);
      onClose();
      onCreated();
    } catch (e) {
      setError(`Saving the draft failed: ${(e as Error).message}`);
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy || creating ? () => {} : onClose}
      width="xl"
      title={(
        <span className="flex items-center gap-2">
          <Sparkles size={15} className="text-[#E8C97C]" /> AI Blog Draft
        </span>
      )}
      subtitle="Generated through the BRANIFY AI gateway (OmniRoute) — saved as a draft you can edit before publishing."
      footer={(
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-[#6B7280]">
            {draft?.meta ? (
              <>Model: <span className="font-mono text-[#A7AFBA]">{draft.meta.model}</span> · routed server-side — no keys in the browser</>
            ) : (
              'Requests are routed through the server-side AI gateway.'
            )}
          </span>
          <div className="flex items-center gap-2">
            <Btn variant="ghost" size="sm" onClick={onClose} disabled={busy || creating}>Cancel</Btn>
            {draft ? (
              <>
                <Btn variant="ghost" size="sm" icon={RefreshCw} onClick={() => void generate()} loading={busy} disabled={creating}>
                  Regenerate
                </Btn>
                <Btn variant="gold" size="sm" onClick={() => void createDraftPost()} loading={creating} disabled={busy}>
                  Create draft post
                </Btn>
              </>
            ) : (
              <Btn variant="gold" size="sm" icon={Sparkles} onClick={() => void generate()} loading={busy}>
                Generate draft
              </Btn>
            )}
          </div>
        </div>
      )}
    >
      <div className="flex flex-col gap-4">
        {/* ------------------------------------------------------------ form */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Topic" required className="sm:col-span-2">
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              placeholder="e.g. Why Dubai startups should invest in a fast website before paid ads"
              disabled={busy || Boolean(draft)}
            />
          </Field>
          <Field label="Category" hint="Free-text, lower-case — matches the blog filter.">
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="marketing"
              disabled={busy || Boolean(draft)}
            />
          </Field>
          <Field label="Tone">
            <Select value={tone} onChange={(e) => setTone(e.target.value)} disabled={busy || Boolean(draft)}>
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Length">
            <Select
              value={length}
              onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'long')}
              disabled={busy || Boolean(draft)}
            >
              {LENGTHS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </Select>
          </Field>
          <Field label="Keywords" hint="Optional — woven in naturally for SEO.">
            <ChipsInput value={keywords} onChange={setKeywords} placeholder="Type and press Enter" />
          </Field>
          <Field label="Extra instructions" className="sm:col-span-2">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional — angles to cover, links to include, things to avoid…"
              disabled={busy || Boolean(draft)}
            />
          </Field>
        </div>

        {/* ------------------------------------------------------------ error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/[0.07] px-4 py-3 text-xs leading-relaxed text-red-200">
            {error}
          </div>
        )}

        {/* ------------------------------------------------------------ busy */}
        {busy && (
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-4 text-xs text-[#A7AFBA]">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#C9A45C]/40 border-t-[#E8C97C]" />
            Writing the draft through the AI gateway — this can take up to a minute…
          </div>
        )}

        {/* ------------------------------------------------------------ preview */}
        {draft && !busy && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="green">Draft ready</Badge>
              <Badge tone="zinc">{draft.category || 'uncategorised'}</Badge>
              <Badge tone="zinc">{draft.content.trim().split(/\s+/).length.toLocaleString()} words</Badge>
              {draft.tags.slice(0, 4).map((t) => <Badge key={t} tone="gold">{t}</Badge>)}
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="font-display text-base font-bold text-[#F5F6F2]">{draft.title}</p>
              <p className={cx('mt-1 font-mono text-[11px] text-[#6B7280]')}>/{draft.slug}</p>
              <p className="mt-2 text-xs leading-relaxed text-[#A7AFBA]">{draft.excerpt}</p>
              <pre className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-white/[0.05] bg-black/30 p-3 text-[11px] leading-relaxed text-[#C9D1D9]">
                {draft.content}
              </pre>
              <p className="mt-3 text-[11px] text-[#6B7280]">
                SEO title: <span className="text-[#A7AFBA]">{draft.seo.title}</span>
                {' · '}Meta: <span className="text-[#A7AFBA]">{draft.seo.description.slice(0, 80)}{draft.seo.description.length > 80 ? '…' : ''}</span>
              </p>
            </div>
            <p className="text-[11px] leading-relaxed text-[#6B7280]">
              “Create draft post” saves this as a <strong>draft</strong> blog post — open it from the list to edit
              the markdown, cover image and schedule before publishing.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AiBlogDraftModal;
