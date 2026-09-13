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

// Word-count tiers per the BRANIFY Blog Engine spec (§35): length is decided
// by search intent and topic depth — never by padding. 'short' is reserved for
// genuinely simple announcements; 'long' is for pillar/comprehensive topics.
const LENGTH_HINTS: Record<string, string> = {
  short: '800-1500 words (announcement / news / update depth — use only when the topic is genuinely simple)',
  medium: '1800-2600 words (standard educational depth)',
  long: '2500-3500 words (comprehensive pillar depth)',
};

// Hard floors enforced by the model self-check (spec §35). Gemini-family models
// drift short on long-form without an explicit countable requirement.
const MIN_WORDS: Record<string, number> = { short: 800, medium: 1800, long: 2500 };

// The ONLY internal link targets the article may use — all verified to exist
// in the BRANIFY router. Spec §18: never fabricate URLs. Spec §19: 3-8
// contextual links for a long article, descriptive anchors, never forced.
const INTERNAL_LINK_WHITELIST = [
  '/services',
  '/services/website-development',
  '/templates',
  '/tools',
  '/ai-tools',
  '/portfolio',
  '/about',
  '/contact',
  '/blog',
];

function buildMessages(input: BlogDraftInput): OmniRouteMessage[] {
  const tone = input.tone || 'professional';
  const length = LENGTH_HINTS[input.length || 'medium'] || LENGTH_HINTS.medium;
  const minWords = MIN_WORDS[input.length || 'medium'] || MIN_WORDS.medium;
  const category = (input.category || '').trim();
  const keywords = (input.keywords || []).map((k) => k.trim()).filter(Boolean).slice(0, 10);

  const system: OmniRouteMessage = {
    role: 'system',
    content: [
      'You are the BRANIFY Blog Engine: part SEO content strategist, part researcher, part editor, part writer. BRANIFY is a luxury digital studio and futuristic technology agency based in Dubai that builds websites, AI tools and brand systems for ambitious businesses.',
      'You write publication-ready, search-intent-aligned articles for the BRANIFY blog. You are NOT a generic AI blog generator: usefulness beats keyword density and word count, always.',
      '',
      'BEFORE WRITING (silently, no preamble in the output):',
      '- Determine the primary search intent (informational / commercial investigation / educational / comparison / tool guide) and what the reader actually wants to learn or decide.',
      '- List the secondary questions a reader will likely want answered after the main one.',
      '- Decide the subtopics, a practical example or two, and where BRANIFY genuinely fits (it usually fits only in one or two places — not everywhere).',
      '',
      'STRUCTURE:',
      '- Begin with a ## section (the website renders the title itself; never add an H1).',
      '- First 100-150 words: establish the problem or question, give context, and state what the reader will learn. No throat-clearing.',
      '- If the topic is a question, give a concise direct answer near the top, then expand with details, exceptions and practical guidance.',
      '- Use ## and ### in a logical hierarchy; headings describe what the section contains (never keyword-stuffed).',
      '- Short paragraphs (2-4 sentences). Include at least one actionable framework, checklist or step list the reader can apply.',
      '- Include a small markdown comparison table ONLY when it genuinely aids a decision (features, costs, options, trade-offs). Tables must be short and mobile-friendly.',
      '- Add a "## FAQ" section near the end: 6-10 real user-intent questions with concise answers that do NOT merely repeat the article.',
      '- Close with "## Key Takeaways" (short bullet list) and a final paragraph with ONE natural next step that fits the topic (read a related guide, explore templates/tools, or contact BRANIFY). Never "In conclusion..." / "To sum up...".',
      '',
      'VOICE AND STYLE (write like an experienced human editor):',
      `- Tone: ${tone}. Write in en-US. No emoji. No placeholders like "[insert here]".`,
      '- Clear sentences with varied lengths. Concrete examples over abstractions. Useful transitions.',
      '- BANNED phrasings unless genuinely appropriate: "In today\'s fast-paced digital world", "Whether you\'re a ... looking to", "Unlock the power of", "Revolutionize your", "Game-changing", "Cutting-edge", "Welcome to our latest blog".',
      '- Original analysis and structure only: do not mirror competitor articles or rewrite search snippets sentence-by-sentence.',
      '',
      'FACTUAL DISCIPLINE (non-negotiable):',
      '- Never invent statistics, studies, quotes, client names, testimonials, awards, partnerships or market-share figures.',
      '- If a figure is uncertain, write it as an approximate illustrative range ("typically", "often") or omit it.',
      '- For fast-changing facts (pricing, features, policies), say the reader should check the official source for the latest details.',
      '',
      'INTERNAL LINKS (markdown only, to REAL pages that exist on branify.store):',
      `- Allowed targets exactly: ${INTERNAL_LINK_WHITELIST.join(', ')}. No other paths, no made-up URLs.`,
      '- Use 3-8 contextual links in a long article, only where they genuinely help the reader continue (e.g. a website-cost article linking to BRANIFY\'s website development service or templates).',
      '- Anchor text must be descriptive ("explore BRANIFY\'s website templates"), never "click here".',
      '',
      'BRAND RATIO:',
      '- 80-90% genuinely useful content, 10-20% brand relevance. BRANIFY is introduced naturally where it truly helps; educational sections must stand on their own even if the reader never clicks a BRANIFY link.',
      '',
      'OUTPUT CONTRACT — respond with ONE JSON object and nothing else (no code fences, no commentary):',
      '{',
      '  "title": string,                     // 45-65 chars, no quotes inside',
      '  "slug": string,                      // kebab-case, ascii, 3-6 words, contains the primary keyword naturally',
      '  "excerpt": string,                   // <= 200 chars summary for cards + meta description fallback',
      '  "content_markdown": string,          // the full article in markdown (no H1)',
      '  "category": string,                  // one lowercase word or hyphenated phrase',
      '  "tags": string[],                    // 3-6 short topical tags',
      '  "seo": {',
      '    "title": string,                   // 50-60 chars, ONE primary keyword, no multi-keyword stuffing',
      '    "description": string,             // 140-160 chars, reflects search intent, no clickbait, no unmet promises',
      '    "keywords": string[]               // FIRST entry = the single focus keyword; then 3-6 secondary semantic terms',
      '  }',
      '}',
      '',
      'LENGTH AND DEPTH:',
      `- Target length: ${length}. Depth must match search intent — never pad to hit a number, never stay thin when the topic needs depth.`,
      category ? `- Primary category: "${category}".` : '',
      keywords.length ? `- Candidate keywords (weave in naturally where relevant; the first is the focus keyword): ${keywords.join(', ')}.` : '',
      input.notes ? `- Extra editor instructions: ${input.notes.slice(0, 400)}` : '',
      '',
      'MANDATORY SELF-CHECK — run silently before responding; a draft failing any item is NOT acceptable, fix it and only then output the JSON:',
      `- The article body contains at least ${minWords} words of substantive content. If your draft is shorter, deepen the weakest sections with concrete examples, specifics and short explanations — never filler or repetition.`,
      '- A "## FAQ" section exists with AT LEAST 6 questions (### per question), each answered concisely in 1-3 sentences without repeating the article body.',
      '- "## Key Takeaways" exists; there is no H1; every internal link points ONLY to the allowed targets.',
    ].filter(Boolean).join('\n'),
  };

  const user: OmniRouteMessage = {
    role: 'user',
    content: `Write the article now. Topic: ${input.topic.trim()}`,
  };

  return [system, user];
}

/** Revision brief for the single expansion pass (see generateBlog). */
function buildRevisionMessages(input: BlogDraftInput, draft: BlogDraft, minWords: number): OmniRouteMessage[] {
  const system: OmniRouteMessage = {
    role: 'system',
    content: [
      'You are the BRANIFY Blog Engine editor-in-chief. You revise drafts to meet the publication standard. Same rules as the original brief: en-US, no emoji, no invented statistics, no H1, ##/### markdown structure.',
      'The previous draft FAILED one or more mandatory checks: it is too short and/or it lacks at least 3 contextual internal links to allowed BRANIFY pages.',
      `- Expand the body to at least ${minWords} words by deepening the weakest sections: add concrete examples, practical specifics, short explanations, and useful transitions. Do NOT pad with repetition or filler.`,
      '- Weave in at least 3 markdown internal links where they genuinely help the reader continue. Allowed targets ONLY: /services, /services/website-development, /templates, /tools, /ai-tools, /portfolio, /about, /contact, /blog. Descriptive anchor text, never "click here".',
      '- Keep the "## FAQ" section (6+ questions) and "## Key Takeaways". Keep any comparison table.',
      '',
      'OUTPUT CONTRACT — return the FULL revised article as ONE JSON object (same shape as the original; no code fences, no commentary):',
      '{ "title": string, "slug": string, "excerpt": string (<=200 chars), "content_markdown": string, "category": string, "tags": string[], "seo": { "title": string, "description": string (140-160 chars), "keywords": string[] } }',
    ].join('\n'),
  };
  const user: OmniRouteMessage = {
    role: 'user',
    content: [
      `Original topic: ${input.topic.trim()}`,
      '',
      'Previous draft (revise and return the FULL JSON):',
      JSON.stringify({ title: draft.title, slug: draft.slug, excerpt: draft.excerpt, content_markdown: draft.content, category: draft.category, tags: draft.tags, seo: draft.seo }),
    ].join('\n'),
  };
  return [system, user];
}

// ------------------------------------------------------------------ parsing

/** Rough word count of a markdown body (markup stripped). */
function countWords(md: string): number {
  return md.replace(/[#*`>|_\-[\]]/g, ' ').split(/\s+/).filter(Boolean).length;
}

/** Count internal markdown links like ](/services) in the body. */
function countInternalLinks(md: string): number {
  return (md.match(/\]\(\/[^)]*\)/g) || []).length;
}

// Spec §18/§19 backstop: fast models sometimes ignore the internal-link brief
// entirely (they read "never fabricate URLs" as "omit URLs"). These are REAL,
// verified BRANIFY pages with descriptive anchors — appended as a short
// "Continue with BRANIFY" block only when the body has fewer than 2 in-text
// links. Contextually chosen by category/tags so it never reads as spam.
function pickRelatedLinks(draft: BlogDraft): Array<{ href: string; label: string }> {
  const hay = `${draft.category} ${draft.tags.join(' ')} ${draft.content.slice(0, 3000)}`.toLowerCase();
  const links: Array<{ href: string; label: string }> = [];
  if (/website|web |landing page|site|wordpress|develop/.test(hay)) {
    links.push({ href: '/services/website-development', label: 'explore BRANIFY\'s website development services for a custom, conversion-focused build' });
    links.push({ href: '/templates', label: 'browse BRANIFY\'s website templates to launch faster on a smaller budget' });
  }
  if (/ai|automation|chatbot|tool/.test(hay)) {
    links.push({ href: '/ai-tools', label: 'explore BRANIFY\'s AI tools directory for practical, ready-to-use options' });
  }
  if (/seo|marketing|content|traffic|conversion/.test(hay)) {
    links.push({ href: '/tools', label: 'use BRANIFY\'s free tools to audit and improve your site' });
  }
  links.push({ href: '/blog', label: 'read more BRANIFY guides on planning, building and growing your website' });
  return links.slice(0, 4);
}

/** Guarantee the spec's internal-link minimum without touching body prose. */
function ensureInternalLinks(draft: BlogDraft): BlogDraft {
  if (countInternalLinks(draft.content) >= 2) return draft;
  const items = pickRelatedLinks(draft)
    .map((l) => `- [${l.label}](/${l.href.replace(/^\//, '')})`)
    .join('\n');
  const block = `\n\n## Continue with BRANIFY\n\n${items}\n`;
  return { ...draft, content: `${draft.content}${block}` };
}

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

export const BLOG_DRAFT_TIMEOUT_MS = 150_000;
// Spec targets 1,800-3,500-word articles: markdown + JSON overhead needs
// ~4,500-6,000 completion tokens. Override with OMNIROUTE_BLOG_MAX_TOKENS.
const BLOG_MAX_TOKENS_DEFAULT = 6_500;
const BLOG_TEMPERATURE_DEFAULT = 0.7;

/**
 * Generate a full blog draft through the BLOG-WRITER Combo on OmniRoute.
 * Throws OmniRouteError with a user-safe message on any failure.
 * If the first draft misses the spec's hard floors (word count / internal
 * links), exactly ONE automatic expansion pass is attempted.
 */
export async function generateBlog(input: BlogDraftInput): Promise<BlogDraft> {
  const topic = (input.topic || '').trim();
  if (topic.length < 4) {
    throw new OmniRouteError('provider', 'Please describe the article topic in at least a few words.', 400);
  }

  const { model, source } = resolveBlogModel();
  const maxTokensRaw = Number(process.env.OMNIROUTE_BLOG_MAX_TOKENS || '');
  const maxTokens = Number.isFinite(maxTokensRaw) && maxTokensRaw >= 256 ? maxTokensRaw : BLOG_MAX_TOKENS_DEFAULT;
  const expandEnabled = (process.env.OMNIROUTE_BLOG_EXPAND || 'true').trim().toLowerCase() !== 'false';

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

  let draft = parseDraft(result.content, result.model, source, result.usage);

  // Spec enforcement (§35/§18): models — especially fast ones — sometimes come
  // back under the word floor or without contextual internal links. Retry once
  // with an explicit revision brief; if the revision fails or is not longer,
  // keep the original draft (never fail the request over a soft quality gate).
  const floor = MIN_WORDS[input.length || 'medium'] || MIN_WORDS.medium;
  if (expandEnabled && (countWords(draft.content) < floor || countInternalLinks(draft.content) < 2)) {
    logSafe(`blog draft below spec (words=${countWords(draft.content)}, floor=${floor}, links=${countInternalLinks(draft.content)}) — one expansion pass`);
    try {
      const revision = await generateWithOmniRoute({
        model,
        messages: buildRevisionMessages(input, draft, floor),
        temperature: BLOG_TEMPERATURE_DEFAULT,
        max_tokens: maxTokens,
        timeout_ms: BLOG_DRAFT_TIMEOUT_MS,
      });
      const redraft = parseDraft(revision.content, revision.model, source, revision.usage);
      if (countWords(redraft.content) > countWords(draft.content)) {
        draft = redraft;
        logSafe(`blog draft expanded (words=${countWords(draft.content)}, links=${countInternalLinks(draft.content)})`);
      }
    } catch (err) {
      logSafe(`blog expansion pass skipped (${err instanceof Error ? err.message : 'unknown'})`);
    }
  }

  draft = ensureInternalLinks(draft);

  logSafe(`blog draft generated (title length=${draft.title.length}, body chars=${draft.content.length})`);
  return draft;
}
