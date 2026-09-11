// =============================================================================
// BRANIFY — AI Blog Generation · shared server types
// -----------------------------------------------------------------------------
// Contract between the admin UI (src/admin/lib/aiBlog.ts) and the serverless
// endpoint (api/admin/ai/blog/generate.ts). Strict types, no `any`.
// =============================================================================

// ------------------------------------------------------------------ request
export type ContentGoal = 'informational' | 'lead_generation' | 'service_promotion' | 'educational';
export type ContentTone = 'professional' | 'expert' | 'conversational' | 'educational';

export interface ExistingPostRef {
  title: string;
  slug: string;
  category: string;
}

export interface GenerateBlogRequest {
  topic: string;
  keyword: string;
  secondaryKeywords?: string[];
  audience?: string;
  goal: ContentGoal | string;
  category?: string;
  length: number;                 // 1200 | 1500 | 2000 | 2500
  tone: ContentTone | string;
  includeFaq: boolean;
  includeInternalLinks: boolean;
  generateImagePrompt: boolean;
  generateSeo: boolean;
  /** Recent posts from the existing blog_posts table — duplicate protection */
  existing?: ExistingPostRef[];
  /** Real internal route paths from the site registries — the only links allowed */
  linkCandidates?: string[];
}

// ------------------------------------------------------------------ response
export interface GeneratedSeoMeta {
  title: string;
  description: string;
  focus_keyword: string;
  keywords: string[];
}

export interface GeneratedBlogDraft {
  title: string;
  slug: string;
  excerpt: string;
  /** Semantic article HTML using exactly the vocabulary of the existing
   *  editor + sanitizer (p, h2-h4, strong/em/u, blockquote, ul/ol/li, a,
   *  figure/figcaption, pre/code, hr). No H1, no script/iframe, no inline <img>. */
  contentHtml: string;
  category: string;
  tags: string[];
  authorName: string;
  authorRole: string;
  seo: GeneratedSeoMeta;
  coverImagePrompt: string;
  coverAlt: string;
  /** Non-fatal model notes (e.g. "narrowed the angle to X to avoid duplicating …") */
  warnings: string[];
}

export interface GenerateBlogResponseData {
  draft: GeneratedBlogDraft;
  model: string;
  provider: string;
  durationMs: number;
  wordCount: number;
  repaired: boolean;
}
