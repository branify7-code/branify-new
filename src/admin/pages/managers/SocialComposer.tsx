// =============================================================================
// BRANIFY ADMIN — AI Social Composer (generate → preview → save/schedule/publish)
// -----------------------------------------------------------------------------
// Mounted from SocialMediaManager. Four modes:
//   single        platform-aware post (facebook / instagram / both)
//   weekly        7-day content plan (BRANIFY pillars, adapted to recent content)
//   from_blog     promote a published blog post (1 FB post + IG caption + visual
//                 concept + carousel outline) — uses the REAL /blog/{slug} URL
//   from_service  promote an existing BRANIFY service (servicesRegistry only)
//
// Duplicate protection: recent captions + recent blog titles are sent to the
// model and a client-side similarity warning is shown before generating.
// Nothing auto-publishes: saving a generated post always starts as a draft
// (or scheduled row after the admin picked a slot). "Publish Now" is an
// explicit click that saves the row as approved first, then publishes.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Facebook, Image as ImageIcon, Instagram, Loader2, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { Badge, Btn, Field, Input, Modal, Select, Textarea, Toggle, cx, useToast } from '../../ui';
import { logActivity } from '../../lib/backend';
import { createRow } from '../../lib/backend';
import type { SocialPostRow } from '../../lib/types';
import {
  SocialApiError, generateSocialContent,
  type GeneratedSocialPost, type GenerateSocialPayload, type GenerateSocialResult, type SocialGenMode, type SocialTone,
} from '../../lib/socialApi';
import {
  AiImageError, generateAiImage, defaultAspect,
  type GeneratedImageAsset, type ImageAspectRatio, type ImageVisualStyle,
} from '../../lib/aiImage';

/** A generated post, optionally carrying its generated visual (Phase 3). */
export type ComposerPost = GeneratedSocialPost & { image?: GeneratedImageAsset };

const CONTENT_TYPES: Array<{ id: string; label: string }> = [
  { id: 'facebook_post', label: 'Facebook post' },
  { id: 'instagram_image', label: 'Instagram image' },
  { id: 'instagram_carousel', label: 'Instagram carousel' },
  { id: 'instagram_reel_idea', label: 'Instagram reel idea' },
  { id: 'instagram_story_idea', label: 'Instagram story idea' },
];

const TONES: Array<{ id: SocialTone; label: string }> = [
  { id: 'professional', label: 'Professional' },
  { id: 'expert', label: 'Expert' },
  { id: 'conversational', label: 'Conversational' },
  { id: 'premium', label: 'Premium' },
];

const MODES: Array<{ id: SocialGenMode; label: string; icon: React.ComponentType<{ size?: number | string }> }> = [
  { id: 'single', label: 'Generate Post', icon: Sparkles },
  { id: 'weekly', label: 'Generate Weekly Plan', icon: Wand2 },
  { id: 'from_blog', label: 'Generate From Blog', icon: RefreshCw },
  { id: 'from_service', label: 'Generate From Service', icon: Sparkles },
];

export interface ComposerServices { name: string; slug: string; tagline?: string; shortDescription?: string }
export interface ComposerBlogOption { id: string; title: string; slug: string; excerpt: string }

interface ComposerProps {
  open: boolean;
  onClose: () => void;
  mode: SocialGenMode;
  onModeChange: (m: SocialGenMode) => void;
  platformsEnabled: string[];
  approvalRequired: boolean;
  brandVoice: string;
  recentCaptions: string[];
  recentBlogTitles: string[];
  blogs: ComposerBlogOption[];
  services: ComposerServices[];
  defaultTimes: { facebook: string; instagram: string };
  onSaved: () => void;
}

// similarity warn (same heuristic family as aiBlog.ts findSimilarPosts)
function tokensOf(s: string): Set<string> {
  return new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 3));
}
function maxJaccard(a: string, list: string[]): number {
  const ta = tokensOf(a);
  if (!ta.size) return 0;
  let max = 0;
  for (const b of list) {
    const tb = tokensOf(b);
    if (!tb.size) continue;
    let inter = 0;
    for (const t of ta) if (tb.has(t)) inter++;
    max = Math.max(max, inter / (ta.size + tb.size - inter));
  }
  return max;
}

function nextOccurrence(day: string, time: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const target = days.indexOf(day);
  const [hh, mm] = time.split(':').map((n) => parseInt(n, 10) || 0);
  const d = new Date();
  const delta = (target - d.getDay() + 7) % 7 || (d.getHours() * 60 + d.getMinutes() >= hh * 60 + mm ? 7 : 0);
  d.setDate(d.getDate() + delta);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ASPECT_OPTIONS: Array<{ id: ImageAspectRatio; label: string }> = [
  { id: 'auto', label: 'Auto (per platform)' },
  { id: '1:1', label: '1:1 — square' },
  { id: '4:5', label: '4:5 — portrait' },
  { id: '16:9', label: '16:9 — wide' },
  { id: '9:16', label: '9:16 — story' },
];

const STYLE_OPTIONS: Array<{ id: ImageVisualStyle; label: string }> = [
  { id: 'auto', label: 'Auto (BRANIFY look)' },
  { id: 'professional', label: 'Professional' },
  { id: 'editorial', label: 'Editorial' },
  { id: '3d', label: '3D render' },
  { id: 'photorealistic', label: 'Photorealistic' },
  { id: 'minimal', label: 'Minimal' },
];

// ------------------------------------------------------------------ preview card
const PostPreview: React.FC<{
  post: ComposerPost;
  index: number;
  busy: string;
  imageBusy: boolean;
  imageError: string;
  promptOpen: boolean;
  onTogglePrompt: (i: number) => void;
  onGenerateImage: (i: number, prompt?: string) => void;
  onEdit: (i: number, patch: Partial<ComposerPost>) => void;
  onSaveDraft: (p: ComposerPost) => void;
  onSchedule: (p: ComposerPost, slot: string) => void;
  onPublishNow: (p: ComposerPost) => void;
}> = ({ post, index, busy, imageBusy, imageError, promptOpen, onTogglePrompt, onGenerateImage, onEdit, onSaveDraft, onSchedule, onPublishNow }) => {
  const [editing, setEditing] = useState(false);
  const [slot, setSlot] = useState('');
  const [promptDraft, setPromptDraft] = useState('');
  const isFb = post.platform === 'facebook';
  const hashtagLine = post.hashtags.join(' ');
  const busyHere = busy === `post-${index}`;
  const activePrompt = promptDraft || post.image?.prompt || post.image_prompt || '';
  return (
    <div className={cx('rounded-xl border p-3', isFb ? 'border-[#E2E8F0] bg-[#F8FAFC]' : 'border-[#C9A45C]/30 bg-[#FDFBF6]')}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {isFb ? <Facebook size={14} className="text-[#1877F2]" /> : <Instagram size={14} className="text-[#C13584]" />}
          <span className="text-xs font-bold text-[#111827]">{isFb ? 'Facebook' : 'Instagram'}</span>
          <Badge tone="zinc">{CONTENT_TYPES.find((c) => c.id === post.content_type)?.label || post.content_type}</Badge>
          {post.day && <Badge tone="gold">{post.day}</Badge>}
        </div>
        <button className="text-xs text-[#8F6B2D] hover:underline" onClick={() => setEditing((v) => !v)}>
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea rows={6} value={post.caption} onChange={(e) => onEdit(index, { caption: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input value={post.cta} placeholder="CTA" onChange={(e) => onEdit(index, { cta: e.target.value })} />
            <Input
              value={post.hashtags.join(', ')}
              placeholder="#hashtags, comma separated"
              onChange={(e) => onEdit(index, { hashtags: e.target.value.split(',').map((s) => s.trim().replace(/^#*/, '')).filter(Boolean).map((s) => `#${s}`) })}
            />
          </div>
          <Input value={post.image_prompt} placeholder="Image prompt" onChange={(e) => onEdit(index, { image_prompt: e.target.value })} />
        </div>
      ) : (
        <>
          {post.title && <p className="mb-1 text-xs font-bold text-[#475569]">{post.title}</p>}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#111827]">{post.caption}</p>
          {hashtagLine && <p className="mt-2 text-[13px] font-medium text-[#1877F2]">{hashtagLine}</p>}
          {post.cta && <p className="mt-1 text-xs font-semibold text-[#8F6B2D]">CTA · {post.cta}</p>}
          {post.image_prompt && <p className="mt-2 rounded-lg bg-[#0F172A]/[0.04] p-2 text-[11px] italic text-[#475569]">Image prompt · {post.image_prompt}</p>}
        </>
      )}

      {/* --- Phase 3: AI image panel --- */}
      <div className="mt-3 rounded-xl border border-[#0F172A]/[0.07] bg-white/60 p-2.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">
            <ImageIcon size={12} /> Visual
            {post.image && <Badge tone="green">ready</Badge>}
          </span>
          {post.image && (
            <span className="text-[10px] text-[#64748B]">
              {post.image.width}×{post.image.height} · {Math.round(post.image.sizeBytes / 1024)} KB · {post.image.model}
            </span>
          )}
        </div>

        {post.image && (
          <div className="relative mb-2 overflow-hidden rounded-lg border border-[#E2E8F0]">
            <img
              src={post.image.imageUrl}
              alt={post.image.altText || 'Generated visual preview'}
              className="max-h-72 w-full object-contain"
            />
          </div>
        )}
        {post.image && post.image.altText && (
          <p className="mb-2 text-[11px] leading-snug text-[#475569]"><span className="font-semibold">Alt:</span> {post.image.altText}</p>
        )}

        {imageBusy ? (
          <p className="flex items-center gap-2 text-xs text-[#8F6B2D]">
            <Loader2 size={13} className="animate-spin" /> Generating image… this can take up to a minute.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {!post.image && (
              <Btn size="sm" variant="gold" icon={ImageIcon} onClick={() => onGenerateImage(index)}>Generate Image</Btn>
            )}
            {post.image && (
              <>
                <Btn size="sm" variant="outline" icon={RefreshCw} onClick={() => onGenerateImage(index)}>Regenerate Image</Btn>
                <Btn size="sm" variant="subtle" icon={ImageIcon} onClick={() => onTogglePrompt(index)}>
                  {promptOpen ? 'Hide prompt' : 'Change Image'}
                </Btn>
              </>
            )}
            {!post.image && post.image_prompt && (
              <button className="text-xs text-[#8F6B2D] hover:underline" onClick={() => onTogglePrompt(index)}>
                {promptOpen ? 'Hide prompt' : 'Edit visual prompt'}
              </button>
            )}
          </div>
        )}

        {promptOpen && (
          <div className="mt-2 space-y-1.5">
            <Textarea
              rows={3}
              value={activePrompt}
              onChange={(e) => setPromptDraft(e.target.value)}
              placeholder="Describe the visual — subject, composition, lighting, mood…"
              aria-label="Visual prompt"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-[#64748B]">Advanced — the prompt is sent to the image model with BRANIFY art direction applied.</p>
              <Btn size="sm" variant="gold" onClick={() => { setPromptDraft(''); onGenerateImage(index, activePrompt.trim() || undefined); }}>
                Generate with this prompt
              </Btn>
            </div>
          </div>
        )}

        {imageError && <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-600">{imageError}</p>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#0F172A]/[0.06] pt-2">
        <Btn size="sm" variant="outline" loading={busyHere} onClick={() => onSaveDraft(post)}>Save Draft</Btn>
        <Input type="datetime-local" className="h-8 w-56 text-xs" value={slot} onChange={(e) => setSlot(e.target.value)} />
        <Btn size="sm" variant="outline" disabled={!slot || busyHere} onClick={() => onSchedule(post, slot ? new Date(slot).toISOString() : '')}>Schedule</Btn>
        <Btn size="sm" variant="gold" loading={busyHere} onClick={() => onPublishNow(post)}>Publish Now</Btn>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ composer modal
export const SocialComposer: React.FC<ComposerProps> = ({
  open, onClose, mode, onModeChange, platformsEnabled, approvalRequired, brandVoice,
  recentCaptions, recentBlogTitles, blogs, services, defaultTimes, onSaved,
}) => {
  const { push } = useToast();
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateSocialResult | null>(null);
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState('');
  const blogIdRef = useRef<string>('');
  const serviceSlugRef = useRef<string>('');

  // form state
  const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'both'>(platformsEnabled.length === 1 ? (platformsEnabled[0] as 'facebook' | 'instagram') : 'both');
  const [contentType, setContentType] = useState('facebook_post');
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [cta, setCta] = useState('');
  const [tone, setTone] = useState<SocialTone>('professional');
  const [withHashtags, setWithHashtags] = useState(true);
  const [withCreative, setWithCreative] = useState(true);

  // Phase 3: image state
  const [withImage, setWithImage] = useState(false);
  const [aspect, setAspect] = useState<ImageAspectRatio>('auto');
  const [imgStyle, setImgStyle] = useState<ImageVisualStyle>('auto');
  const [imgBusy, setImgBusy] = useState<string>(''); // index | 'all' | ''
  const [imgErrors, setImgErrors] = useState<Record<number, string>>({});
  const [promptOpenFor, setPromptOpenFor] = useState<number | null>(null);

  const dupScore = useMemo(() => (topic ? Math.round(maxJaccard(topic, [...recentCaptions, ...recentBlogTitles]) * 100) : 0), [topic, recentCaptions, recentBlogTitles]);

  useEffect(() => { if (!open) { setResult(null); setError(''); setImgBusy(''); setImgErrors({}); setPromptOpenFor(null); } }, [open]);

  const buildPayload = useCallback((m: SocialGenMode): GenerateSocialPayload => {
    const base: GenerateSocialPayload = {
      mode: m, tone, include_hashtags: withHashtags, include_creative_prompt: withCreative,
      recentCaptions: recentCaptions.slice(0, 8), recentTitles: recentBlogTitles.slice(0, 10),
    };
    if (m === 'single') {
      return { ...base, platform, content_type: platform === 'facebook' ? 'facebook_post' : contentType, topic, audience, cta };
    }
    if (m === 'from_blog') {
      const b = blogs.find((x) => x.id === blogIdRef.current);
      return { ...base, blog: b ? { title: b.title, url: `https://branify.store/blog/${b.slug}`, excerpt: b.excerpt } : undefined };
    }
    if (m === 'from_service') {
      const s = services.find((x) => x.slug === serviceSlugRef.current);
      return {
        ...base,
        service: s?.name,
        serviceData: s ? { name: s.name, slug: s.slug, url: `https://branify.store/services/${s.slug}`, description: s.shortDescription, tagline: s.tagline } : undefined,
      };
    }
    return base; // weekly
  }, [platform, contentType, topic, audience, cta, tone, withHashtags, withCreative, recentCaptions, recentBlogTitles, blogs, services]);

  const run = useCallback(async (m: SocialGenMode) => {
    setGenerating(true);
    setError('');
    try {
      const res = await generateSocialContent(buildPayload(m));
      setResult(res);
      setImgErrors({});
      setPromptOpenFor(null);
      void logActivity('supabase', null, 'social.generate', 'social_post', m, { model: res.model, count: res.posts.length });
      push('success', `Generated ${res.posts.length} post${res.posts.length === 1 ? '' : 's'} (${res.model}).`);
    } catch (e) {
      const msg = e instanceof SocialApiError ? e.message : (e as Error).message || 'Generation failed.';
      setError(msg);
      push('error', msg);
    } finally {
      setGenerating(false);
    }
  }, [buildPayload, push]);

  // ---------------------------------------------------------- Phase 3: image generation
  const setPostImage = (i: number, asset: GeneratedImageAsset | undefined) => {
    setResult((r) => (r ? { ...r, posts: r.posts.map((p, idx) => (idx === i ? { ...p, image: asset } : p)) } : r));
  };

  const genImageFor = useCallback(async (i: number, promptOverride?: string) => {
    const post = result?.posts[i];
    if (!post) return;
    setImgBusy(String(i));
    setImgErrors((prev) => ({ ...prev, [i]: '' }));
    try {
      const prompt = (promptOverride ?? post.image?.prompt ?? post.image_prompt ?? '').trim();
      const asset = await generateAiImage({
        prompt: prompt || undefined,
        brief: prompt ? undefined : `${post.title ? `${post.title}. ` : ''}${post.caption}`.slice(0, 800),
        aspectRatio: aspect === 'auto' ? defaultAspect(post.platform, 'social_post') : aspect,
        imageSize: '1K',
        visualStyle: imgStyle,
        purpose: 'social_post',
        platform: post.platform,
      });
      setPostImage(i, asset);
      void logActivity('supabase', null, 'ai.image', 'media_asset', asset.mediaId, {
        model: asset.model, provider: asset.provider, purpose: 'social_post',
        platform: post.platform, duration_ms: asset.durationMs, size_bytes: asset.sizeBytes,
      });
      push('success', `Image ready in ${(asset.durationMs / 1000).toFixed(1)}s — added to the media library.`);
    } catch (e) {
      const msg = e instanceof AiImageError ? e.message : (e as Error).message || 'Image generation failed.';
      setImgErrors((prev) => ({ ...prev, [i]: msg }));
      push('error', msg);
    } finally {
      setImgBusy('');
    }
  }, [result, aspect, imgStyle, push]);

  const genAllVisuals = useCallback(async () => {
    if (!result) return;
    setImgBusy('all');
    let ok = 0;
    const failures: number[] = [];
    for (let i = 0; i < result.posts.length; i++) {
      if (result.posts[i].image) continue; // never regenerate silently
      try {
        const post = result.posts[i];
        const prompt = (post.image?.prompt ?? post.image_prompt ?? '').trim();
        const asset = await generateAiImage({
          prompt: prompt || undefined,
          brief: prompt ? undefined : `${post.title ? `${post.title}. ` : ''}${post.caption}`.slice(0, 800),
          aspectRatio: aspect === 'auto' ? defaultAspect(post.platform, 'social_post') : aspect,
          imageSize: '1K',
          visualStyle: imgStyle,
          purpose: 'social_post',
          platform: post.platform,
        });
        setPostImage(i, asset);
        void logActivity('supabase', null, 'ai.image', 'media_asset', asset.mediaId, { model: asset.model, purpose: 'social_post', platform: post.platform });
        ok++;
      } catch (e) {
        const msg = e instanceof AiImageError ? e.message : (e as Error).message || 'Image generation failed.';
        setImgErrors((prev) => ({ ...prev, [i]: msg }));
        failures.push(i + 1);
      }
    }
    setImgBusy('');
    if (failures.length) push('error', `${ok} visual${ok === 1 ? '' : 's'} generated · ${failures.length} failed (post ${failures.join(', ')}).`);
    else push('success', `All ${ok} visual${ok === 1 ? '' : 's'} generated.`);
  }, [result, aspect, imgStyle, push]);

  const rowFromPost = useCallback((p: ComposerPost, status: 'draft' | 'scheduled' | 'approved', slot?: string) => {
    const payload: Record<string, unknown> = {
      platform: p.platform,
      content_type: p.content_type,
      title: p.title,
      caption: p.caption,
      hashtags: p.hashtags,
      media_url: p.image?.imageUrl || '',
      media_type: p.image ? 'image' : '',
      status,
      approval_required: approvalRequired,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
      scheduled_at: status === 'scheduled' ? (slot || null) : null,
      source_type: mode === 'single' ? 'ai' : mode === 'weekly' ? 'weekly_plan' : mode,
      source_id: mode === 'from_blog' ? blogIdRef.current : mode === 'from_service' ? serviceSlugRef.current : '',
      created_by: 'ai',
      metadata: {
        cta: p.cta, image_prompt: p.image?.prompt || p.image_prompt, alt_text: p.image?.altText || p.alt_text, creative_prompt: p.creative_prompt,
        plan_day: p.day || null, brand_voice: brandVoice, model: result?.model || '', provider: result?.provider || '',
        generated_at: new Date().toISOString(),
        image: p.image ? {
          media_id: p.image.mediaId, storage_path: p.image.storagePath, mime: p.image.mimeType,
          width: p.image.width, height: p.image.height, provider: p.image.provider, image_model: p.image.model,
        } : null,
      },
    };
    return payload;
  }, [mode, brandVoice, result, approvalRequired]);

  const saveDraft = async (p: ComposerPost) => {
    const key = `post-${result?.posts.indexOf(p)}`;
    setBusy(key);
    try {
      await createRow<SocialPostRow>('social_posts', rowFromPost(p, 'draft'));
      push('success', 'Draft saved.');
      onSaved();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Save failed.');
    } finally { setBusy(''); }
  };

  const saveScheduled = async (p: ComposerPost, slot: string) => {
    const key = `post-${result?.posts.indexOf(p)}`;
    setBusy(key);
    try {
      await createRow<SocialPostRow>('social_posts', rowFromPost(p, 'scheduled', slot));
      void logActivity('supabase', null, 'social.schedule', 'social_post', p.title, { scheduled_at: slot, platform: p.platform });
      push('success', 'Scheduled.');
      onSaved();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Scheduling failed.');
    } finally { setBusy(''); }
  };

  const publishNow = async (p: ComposerPost) => {
    // Instagram is image-only — catch it before the round-trip (server enforces too).
    if (p.platform === 'instagram' && !p.image?.imageUrl) {
      push('error', 'Instagram needs an image — click Generate Image first, or save as a Facebook-only post.');
      return;
    }
    const i = result?.posts.indexOf(p) ?? -1;
    const key = `post-${i}`;
    setBusy(key);
    try {
      const row = await createRow<SocialPostRow>('social_posts', rowFromPost(p, 'approved'));
      const { publishSocialPost } = await import('../../lib/socialApi');
      await publishSocialPost(row.id);
      push('success', `Published to ${p.platform}.`);
      onSaved();
      onClose();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Publishing failed.');
      onSaved();
    } finally { setBusy(''); }
  };

  const saveWeeklyAll = async (asScheduled: boolean) => {
    if (!result) return;
    setBusy('weekly-all');
    try {
      for (const p of result.posts) {
        const time = p.platform === 'facebook' ? defaultTimes.facebook : defaultTimes.instagram;
        const slot = asScheduled ? nextOccurrence(p.day || 'Mon', time) : null;
        await createRow<SocialPostRow>('social_posts', rowFromPost(p, asScheduled ? 'scheduled' : 'draft', slot || undefined));
      }
      void logActivity('supabase', null, 'social.generate', 'social_post', 'weekly_plan', { scheduled: asScheduled, count: result.posts.length });
      push('success', `Weekly plan saved as ${asScheduled ? 'scheduled posts' : 'drafts'}.`);
      onSaved();
      onClose();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Saving the weekly plan failed.');
    } finally { setBusy(''); }
  };

  const editPost = (i: number, patch: Partial<ComposerPost>) => {
    setResult((r) => (r ? { ...r, posts: r.posts.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) } : r));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="✨ AI Generate Social Post"
      subtitle="BRANIFY voice · BUILD. BRAND. GROW. Nothing publishes without you."
      width="xl"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Close</Btn>
          {result && (
            <Btn variant="outline" icon={RefreshCw} loading={generating} onClick={() => run(mode)}>Regenerate</Btn>
          )}
          <Btn variant="gold" icon={Sparkles} loading={generating} onClick={() => run(mode)}>
            {mode === 'weekly' ? 'Generate 7-Day Plan' : 'Generate with AI'}
          </Btn>
        </>
      }
    >
      {/* mode switcher */}
      <div className="mb-4 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => { onModeChange(m.id); setResult(null); }}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
              mode === m.id
                ? 'border-[#C9A45C] bg-[#C9A45C]/10 text-[#8F6B2D]'
                : 'border-[#E2E8F0] text-[#475569] hover:border-[#C9A45C]/50',
            )}
          >
            <m.icon size={13} /> {m.label}
          </button>
        ))}
      </div>

      {/* form */}
      {mode === 'single' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Platform" required>
            <Select value={platform} onChange={(e) => setPlatform(e.target.value as typeof platform)}>
              {platformsEnabled.includes('facebook') && platformsEnabled.includes('instagram') && <option value="both">Both</option>}
              {platformsEnabled.includes('facebook') && <option value="facebook">Facebook</option>}
              {platformsEnabled.includes('instagram') && <option value="instagram">Instagram</option>}
            </Select>
          </Field>
          <Field label="Content type">
            <Select value={contentType} onChange={(e) => setContentType(e.target.value)}>
              {CONTENT_TYPES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
          </Field>
          <Field label="Topic" hint="What should this post be about? Leave empty and pick a service instead.">
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Why slow websites kill premium brand perception" />
          </Field>
          <Field label="Service (optional)">
            <Select value={serviceSlugRef.current} onChange={(e) => { serviceSlugRef.current = e.target.value; }}>
              <option value="">— none —</option>
              {services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Target audience (optional)">
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. founders planning a rebrand" />
          </Field>
          <Field label="CTA (optional)">
            <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="e.g. Request a consultation" />
          </Field>
          <Field label="Tone">
            <Select value={tone} onChange={(e) => setTone(e.target.value as SocialTone)}>
              {TONES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </Select>
          </Field>
          <div className="flex items-end gap-4 pb-1">
            <Toggle checked={withHashtags} onChange={setWithHashtags} label="Hashtags" />
            <Toggle checked={withCreative} onChange={setWithCreative} label="Creative prompt" />
          </div>
          {withImage ? (
            <div className="sm:col-span-2 grid gap-3 rounded-xl border border-[#C9A45C]/30 bg-[#FDFBF6] p-3 sm:grid-cols-3">
              <div className="sm:col-span-3"><Toggle checked={withImage} onChange={setWithImage} label="Generate Image (AI visual per post — 1 image per click)" /></div>
              <Field label="Aspect ratio">
                <Select value={aspect} onChange={(e) => setAspect(e.target.value as ImageAspectRatio)}>
                  {ASPECT_OPTIONS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </Select>
              </Field>
              <Field label="Visual style">
                <Select value={imgStyle} onChange={(e) => setImgStyle(e.target.value as ImageVisualStyle)}>
                  {STYLE_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </Select>
              </Field>
              <p className="self-end pb-2 text-[11px] leading-snug text-[#64748B]">
                Auto: Instagram 4:5 · Facebook 1:1. Images land in the Media Library and attach to the post automatically.
              </p>
            </div>
          ) : (
            <div className="sm:col-span-2"><Toggle checked={withImage} onChange={setWithImage} label="Generate Image (AI visual per post)" /></div>
          )}
          {dupScore >= 45 && (
            <div className="sm:col-span-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700">
              Heads-up: this topic overlaps ~{Math.min(dupScore, 99)}% with recent content. Consider a different angle — the AI also avoids recent hooks.
            </div>
          )}
        </div>
      )}

      {mode === 'weekly' && (
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-3 text-sm text-[#475569]">
          <p>
            Generates a 7-day plan across your enabled platforms using BRANIFY content pillars —
            adjusted against your recent posts so nothing repeats. Saved posts land as drafts or
            scheduled slots (default times: FB {defaultTimes.facebook}, IG {defaultTimes.instagram}).
          </p>
          <div className="mt-2 grid gap-3 rounded-xl border border-[#C9A45C]/30 bg-[#FDFBF6] p-3 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <Toggle checked={withImage} onChange={setWithImage} label="Create image prompts + per-post visuals (on demand — nothing auto-generates)" />
            </div>
            <Field label="Aspect ratio">
              <Select value={aspect} onChange={(e) => setAspect(e.target.value as ImageAspectRatio)}>
                {ASPECT_OPTIONS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </Select>
            </Field>
            <Field label="Visual style">
              <Select value={imgStyle} onChange={(e) => setImgStyle(e.target.value as ImageVisualStyle)}>
                {STYLE_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </Select>
            </Field>
          </div>
        </div>
      )}

      {mode === 'from_blog' && (
        <Field label="Published blog post" hint="Uses the real public URL /blog/{slug} — never an invented link." required>
          <Select defaultValue="" onChange={(e) => { blogIdRef.current = e.target.value; }}>
            <option value="">— select a published post —</option>
            {blogs.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </Select>
        </Field>
      )}

      {mode === 'from_service' && (
        <Field label="BRANIFY service" hint="Pulled from the live services registry — no invented services." required>
          <Select defaultValue="" onChange={(e) => { serviceSlugRef.current = e.target.value; }}>
            <option value="">— select a service —</option>
            {services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </Select>
        </Field>
      )}

      {error && <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-600">{error}</p>}
      {generating && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[#8F6B2D]">
          <Loader2 size={15} className="animate-spin" /> Generating in BRANIFY voice… this can take up to a minute.
        </div>
      )}

      {/* previews */}
      {result && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8F6B2D]">
              {mode === 'weekly' ? '7-Day Plan' : 'Generated Posts'} · {result.provider}/{result.model}
            </p>
            <div className="flex gap-2">
              {mode === 'weekly' && withImage && (
                <Btn size="sm" variant="subtle" icon={ImageIcon} loading={imgBusy === 'all'} disabled={imgBusy !== ''} onClick={() => void genAllVisuals()}>
                  Generate All Visuals
                </Btn>
              )}
              {mode === 'weekly' && (
                <>
                  <Btn size="sm" variant="outline" loading={busy === 'weekly-all'} onClick={() => saveWeeklyAll(false)}>Save as Drafts</Btn>
                  <Btn size="sm" variant="gold" loading={busy === 'weekly-all'} onClick={() => saveWeeklyAll(true)}>Save &amp; Schedule Week</Btn>
                </>
              )}
            </div>
          </div>
          {result.posts.map((p, i) => (
            <PostPreview
              key={`${i}-${p.platform}-${p.title.slice(0, 12)}`}
              post={p}
              index={i}
              busy={busy}
              imageBusy={imgBusy === String(i)}
              imageError={imgErrors[i] || ''}
              promptOpen={promptOpenFor === i}
              onTogglePrompt={(idx) => setPromptOpenFor((cur) => (cur === idx ? null : idx))}
              onGenerateImage={(idx, promptOverride) => void genImageFor(idx, promptOverride)}
              onEdit={editPost}
              onSaveDraft={saveDraft}
              onSchedule={saveScheduled}
              onPublishNow={publishNow}
            />
          ))}
        </div>
      )}
    </Modal>
  );
};
