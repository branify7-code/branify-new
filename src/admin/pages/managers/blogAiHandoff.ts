// =============================================================================
// BRANIFY ADMIN — AI draft → BlogEditor handoff
// -----------------------------------------------------------------------------
// The AI generator lives on the blog LIST page; "Use This Draft" must open the
// EXISTING full-page Blog Editor (/blog?post=new) prefilled. Since the editor
// is a separate route, the draft travels through this module-level bridge
// (same pattern as the nav bridge in BlogManager). The editor consumes the
// seed exactly once on mount and the status stays 'draft' — the AI never
// saves or publishes anything itself.
// =============================================================================

import type { GeneratedBlogDraft } from '../../lib/aiBlog';
import { DEFAULT_ROBOTS, type EditorSeo } from './BlogEditorSeo';

/** Structurally identical to the editor's BlogForm — see BlogEditor.tsx. */
export interface AiBlogFormSeed {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  coverImage: string;
  coverAlt: string;
  /** Phase 3: image prompt from the AI draft — feeds "Generate with AI" cover. */
  coverImagePrompt: string;
  authorName: string;
  authorRole: string;
  publishedAtLocal: string;
  category: string;
  tags: string[];
  status: string;
  featured: boolean;
  seo: EditorSeo;
}

export const aiDraftBridge: { current: GeneratedBlogDraft | null } = { current: null };

/** One-shot consume — the editor reads and clears the bridge. */
export function consumeAiDraftSeed(): GeneratedBlogDraft | null {
  const seed = aiDraftBridge.current;
  aiDraftBridge.current = null;
  return seed;
}

/** Map a generated draft into the editor's form shape (status stays 'draft'). */
export function draftToSeed(draft: GeneratedBlogDraft): AiBlogFormSeed {
  return {
    title: draft.title || '',
    slug: draft.slug || '',
    excerpt: draft.excerpt || '',
    contentHtml: draft.contentHtml || '',
    coverImage: '',
    coverAlt: draft.coverAlt || '',
    coverImagePrompt: draft.coverImagePrompt || '',
    authorName: draft.authorName || 'BRANIFY Team',
    authorRole: draft.authorRole || '',
    publishedAtLocal: '',
    category: draft.category || '',
    tags: Array.isArray(draft.tags) ? draft.tags : [],
    status: 'draft',
    featured: false,
    seo: {
      title: draft.seo?.title || '',
      description: draft.seo?.description || '',
      focus_keyword: draft.seo?.focus_keyword || '',
      keywords: Array.isArray(draft.seo?.keywords) ? draft.seo.keywords : [],
      canonical: '',
      og_title: draft.seo?.title || '',
      og_description: draft.seo?.description || '',
      og_image: '',
      twitter_image: '',
      robots: DEFAULT_ROBOTS,
    },
  };
}
