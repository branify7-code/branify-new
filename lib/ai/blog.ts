// =============================================================================
// BRANIFY — Blog generation service (SERVER-SIDE ONLY)
// -----------------------------------------------------------------------------
// Dedicated wrapper around the OmniRoute client for the BLOG-WRITER Combo.
// OmniRoute owns provider routing (DeepSeek → Claude → Gemini → OpenAI) and
// fallback; this module only builds the prompt, calls the combo, and parses
// the draft into the shape the admin Blog manager stores in blog_posts.
// =============================================================================

import {
  generateWithOmniRoute,
  logSafe,
  redactSecrets,
  OmniRouteError,
  type OmniRouteMessage,
} from './omniroute';

// ------------------------------------------------------------------ public types

export interface BlogDraftInput {
  /** What the article should be about (required). */
  topic: string;
  /** Post category, e.g. "marketing". Free-text to match the existing manager. */
  category?: string;
  /** Voice of the article. */
  tone?: 'professional' | 'friendly' | 'bold' | 'luxury' | 'educational' | string;
  /** Optional SEO keywords to weave into the draft. */
  keywords?: string[];
  /** Approximate target length of the markdown body. */
  length?: 'short' | 'medium' | 'long';
  /** Optional extra instructions from the editor. */
  notes?: string;
}

export interface BlogDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string; // markdown (no leading H1 — BlogView renders the title itself)
  category: string;
  tags: string[];
  author_name: string;
  author_role: string;
  seo: { title: string; description: string; keywords: string[] };
  meta: {
    model: string;
    model_source: string;
    usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  };
}

// ------------------------------------------------------------------ model resolution

/**
 * Resolve the BLOG-WRITER combo model id.
 * 1. OMNIROUTE_BLOG_MODEL  — the configured combo model id (preferred).
 * 2. OMNIROUTE_DEFAULT_MODEL — shared fallback, if set.
 * 3. 'auto' — the gateway's auto-router, confirmed available by the owner.
 *    Set OMNIROUTE_BLOG_MODEL to the exact BLOG-WRITER combo id (as listed by
 *    GET /v1/models) to pin blog generation to that combo.
 */
export function resolveBlogModel(): { model: string; source: string } {
  const blog = (process.env.OMNIROUTE_BLOG_MODEL || '').trim();
  if (blog) return { model: blog, source: 'OMNIROUTE_BLOG_MODEL' };
  const shared = (process.env.OMNIROUTE_DEFAULT_MODEL || '').trim();
  if (shared) return { model: shared, source: 'OMNIROUTE_DEFAULT_MODEL' };
  return { model: 'auto', source: 'fallback:auto-router' };
}

// ------------------------------------------------------------------ prompt

const LENGTH_HINTS: Record<string, string> = {
  short: 'roughly 500-700 words',
  medium: 'roughly 900-1200 words',
  long: 'roughly 1500-2000 words',
};

function buildMessages(input: BlogDraftInput): OmniRouteMessage[] {
  const tone = input.tone || 'professional';
  const length = LENGTH_HINTS[input.length || 'medium'] || LENGTH_HINTS.medium;
  const category = (input.category || '').trim();
  const keywords = (input.keywords || []).map((k) => k.trim()).filter(Boolean).slice(0, 10);

  const system: OmniRouteMessage = {
    role: 'system',
    content: [
      'You are the senior content strategist for BRANIFY, a luxury digital studio and futuristic technology agency based in Dubai that builds websites, AI tools and brand systems for ambitious businesses.',
      'You write publication-ready blog articles for the BRANIFY website: confident, precise, practical, lightly aspirational, never fluffy, never salesy.',
      '',
      'OUTPUT CONTRACT — respond with ONE JSON object and nothing else (no code fences, no commentary):',
      '{',
      '  "title": string,                     // 45-65 chars, no quotes inside',
      '  "slug": string,                      // kebab-case, ascii, 3-6 words',
      '  "excerpt": string,                   // <= 200 chars summary for cards + meta description',
      '  "content_markdown": string,          // the full article in markdown',
      '  "category": string,                  // one lowercase word or hyphenated phrase',
      '  "tags": string[],                    // 3-6 short topical tags',
      '  "seo": { "title": string, "description": string, "keywords": string[] }',
      '}',
      '',
      'CONTENT RULES:',
      '- Start the article with a ## H2 section. Do NOT repeat the title as an H1; the website renders the title separately.',
      '- Use ## for section headings and ### for sub-points, short paragraphs, - bullet lists where they help, **bold** for key phrases, and `code` sparingly.',
      '- Include one actionable framework, checklist or step list the reader can apply.',
      '- Close with a short "## Key Takeaways" list and a final paragraph that invites the reader to contact BRANIFY.',
      '- Do not invent statistics with fake precision. General industry knowledge is fine; specific numbers only when you are certain.',
      '- Write in en-US. No emoji. No placeholders like "[insert here]".',
      `- Target length: ${length}. Tone: ${tone}.`,
      category ? `- Primary category: "${category}".` : '',
      keywords.length ? `- Work these keywords in naturally: ${keywords.join(', ')}.` : '',
      input.notes ? `- Extra editor instructions: ${input.notes.slice(0, 400)}` : '',
    ].filter(Boolean).join('\n'),
  };

  const user: OmniRouteMessage = {
    role: 'user',
    content: `Write the article now. Topic: ${input.topic.trim()}`,
  };

  return [system, user];
}

// ------------------------------------------------------------------ parsing

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'ai-draft';
}

function extractJsonObject(raw: string): unknown {
  let text = raw.trim();
  // Strip markdown fences the model may add despite instructions.
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(text);
  } catch { /* fall through to brace scan */ }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch { /* give up below */ }
  }
  throw new OmniRouteError(
    'malformed',
    'The AI draft came back in an unexpected format and could not be read.',
    502,
    redactSecrets(raw.slice(0, 200)),
  );
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v.trim() : fallback;
}

function asStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => asString(x)).filter(Boolean).slice(0, max);
}

function parseDraft(raw: string, model: string, modelSource: string, usage: BlogDraft['meta']['usage']): BlogDraft {
  const obj = extractJsonObject(raw) as Record<string, unknown>;
  const title = asString(obj.title);
  const content = asString(obj.content_markdown);
  if (title.length < 8) {
    throw new OmniRouteError('malformed', 'The AI draft was missing a usable title.', 502);
  }
  if (content.length < 300) {
    throw new OmniRouteError('malformed', 'The AI draft came back too short to publish.', 502);
  }

  const excerptRaw = asString(obj.excerpt);
  const excerpt = excerptRaw.length > 200 ? `${excerptRaw.slice(0, 197)}…` : excerptRaw || `${content.replace(/[#*`>-]/g, '').trim().slice(0, 180)}…`;

  const seoRaw = (obj.seo && typeof obj.seo === 'object' ? obj.seo : {}) as Record<string, unknown>;
  const seoKeywords = asStringArray(seoRaw.keywords, 10);
  const seoDescription = asString(seoRaw.description) || excerpt;

  // Strip a leading H1 if the model added one anyway — BlogView renders its own.
  const contentClean = content.replace(/^#\s+.+\n+/, '').trim();

  return {
    title,
    slug: slugify(asString(obj.slug) || title),
    excerpt,
    content: contentClean,
    category: (asString(obj.category) || 'insights').toLowerCase(),
    tags: asStringArray(obj.tags, 8),
    author_name: 'BRANIFY Team',
    author_role: 'AI-assisted draft',
    seo: {
      title: asString(seoRaw.title) || title,
      description: seoDescription.length > 160 ? `${seoDescription.slice(0, 157)}…` : seoDescription,
      keywords: seoKeywords,
    },
    meta: { model, model_source: modelSource, usage },
  };
}

// ------------------------------------------------------------------ public API

export const BLOG_DRAFT_TIMEOUT_MS = 90_000;
const BLOG_MAX_TOKENS_DEFAULT = 3_000;
const BLOG_TEMPERATURE_DEFAULT = 0.7;

/**
 * Generate a full blog draft through the BLOG-WRITER Combo on OmniRoute.
 * Throws OmniRouteError with a user-safe message on any failure.
 */
export async function generateBlog(input: BlogDraftInput): Promise<BlogDraft> {
  const topic = (input.topic || '').trim();
  if (topic.length < 4) {
    throw new OmniRouteError('provider', 'Please describe the article topic in at least a few words.', 400);
  }

  const { model, source } = resolveBlogModel();
  const maxTokensRaw = Number(process.env.OMNIROUTE_BLOG_MAX_TOKENS || '');
  const maxTokens = Number.isFinite(maxTokensRaw) && maxTokensRaw >= 256 ? maxTokensRaw : BLOG_MAX_TOKENS_DEFAULT;

  logSafe(`blog draft requested (model=${model}, source=${source}, topic length=${topic.length})`);

  const result = await generateWithOmniRoute({
    model,
    messages: buildMessages(input),
    temperature: BLOG_TEMPERATURE_DEFAULT,
    max_tokens: maxTokens,
    timeout_ms: BLOG_DRAFT_TIMEOUT_MS,
    // no `stream` → parsed chat result (streaming is available via the same
    // function with { stream: true } when needed, no architectural change).
  });

  const draft = parseDraft(result.content, result.model, source, result.usage);
  logSafe(`blog draft generated (title length=${draft.title.length}, body chars=${draft.content.length})`);
  return draft;
}
