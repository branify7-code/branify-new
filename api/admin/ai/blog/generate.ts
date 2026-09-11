// =============================================================================
// BRANIFY — AI Blog Generation · serverless endpoint (SERVER-SIDE ONLY)
// -----------------------------------------------------------------------------
// POST /api/admin/ai/blog/generate
//   Authorization: Bearer <BRANIFY admin Supabase session JWT>
//   Body: GenerateBlogRequest (see api/_lib/aiTypes.ts)
//   → { ok: true, data: GenerateBlogResponseData }
//
// Security model (identical to api/gsc.ts):
//   • Only allowlisted BRANIFY admins (admin_users + RLS) can call this.
//   • AI provider credentials live ONLY in server env vars (AI_API_KEY …).
//     They are never returned, echoed, or logged. The browser receives the
//     generated draft only.
//   • Request body is validated + size-limited; provider errors are mapped to
//     safe human-readable messages; malformed model output gets exactly one
//     repair attempt and otherwise fails without creating anything.
//
// No new tables, no schema changes, no new npm dependencies.
// =============================================================================

import { verifyAdmin, CORS_ORIGINS } from '../../../gsc';
import { AiError, generateStructuredJson, maxTokensForLength, resolveProvider, wordCountOf } from '../../../_lib/aiProvider';
import { BRANIFY_SYSTEM_PROMPT, buildUserPrompt } from '../../../_lib/aiPrompt';
import type { ExistingPostRef, GenerateBlogResponseData, GeneratedBlogDraft } from '../../../_lib/aiTypes';

export const maxDuration = 60;

// ------------------------------------------------------------------ handler types (same pattern as api/gsc.ts)
interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined> | URLSearchParams;
  body?: unknown;
}
interface Res {
  setHeader(name: string, value: string): Res;
  status(code: number): Res;
  send(body: string): void;
  json(body: unknown): void;
}

function cors(origin: string, res: Res): void {
  if (CORS_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function bearerOf(req: Req): string {
  const h = req.headers?.authorization;
  const raw = Array.isArray(h) ? (h[0] || '') : (h || '');
  return raw.replace(/^Bearer\s+/i, '').trim();
}

// ------------------------------------------------------------------ rate limit (best-effort, in-memory)
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 12; // generations per admin per hour
const rateBuckets = new Map<string, number[]>();

function checkRate(key: string): void {
  const now = Date.now();
  const arr = (rateBuckets.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    throw new AiError('rate_limited', 429, 'AI generation limit reached (12 per hour). Try again later.');
  }
  arr.push(now);
  rateBuckets.set(key, arr);
  // opportunistic cleanup
  if (rateBuckets.size > 500) {
    for (const [k, v] of rateBuckets) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) rateBuckets.delete(k);
    }
  }
}

// ------------------------------------------------------------------ validation
const GOALS = new Set(['informational', 'lead_generation', 'service_promotion', 'educational']);
const TONES = new Set(['professional', 'expert', 'conversational', 'educational']);
const LENGTHS = new Set([1200, 1500, 2000, 2500]);

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

interface ValidatedRequest {
  topic: string;
  keyword: string;
  secondaryKeywords: string[];
  audience: string;
  goal: string;
  category: string;
  length: number;
  tone: string;
  includeFaq: boolean;
  includeInternalLinks: boolean;
  generateImagePrompt: boolean;
  generateSeo: boolean;
  existing: ExistingPostRef[];
  linkCandidates: string[];
}

function validateRequest(body: Record<string, unknown>): ValidatedRequest {
  const topic = str(body.topic, 300);
  const keyword = str(body.keyword, 120);
  if (topic.length < 8) throw new AiError('bad_request', 400, 'Blog topic is required (at least 8 characters).');
  if (keyword.length < 2) throw new AiError('bad_request', 400, 'Primary target keyword is required.');

  const secondaryRaw = Array.isArray(body.secondaryKeywords) ? body.secondaryKeywords : [];
  const secondaryKeywords = secondaryRaw
    .map((k) => str(k, 80))
    .filter(Boolean)
    .slice(0, 10);

  const goal = str(body.goal, 40);
  if (!GOALS.has(goal)) throw new AiError('bad_request', 400, 'Unknown content goal.');
  const tone = str(body.tone, 40);
  if (!TONES.has(tone)) throw new AiError('bad_request', 400, 'Unknown tone.');
  const length = Number(body.length);
  if (!LENGTHS.has(length)) throw new AiError('bad_request', 400, 'Article length must be one of 1200, 1500, 2000, 2500.');

  const existingRaw = Array.isArray(body.existing) ? body.existing : [];
  const existing: ExistingPostRef[] = existingRaw.slice(0, 100).map((r) => {
    const o = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>;
    return { title: str(o.title, 200), slug: str(o.slug, 120), category: str(o.category, 80) };
  }).filter((r) => r.title || r.slug);

  const candidatesRaw = Array.isArray(body.linkCandidates) ? body.linkCandidates : [];
  const linkCandidates = candidatesRaw
    .map((p) => str(p, 200))
    .filter((p) => p.startsWith('/') && !p.includes('..'))
    .slice(0, 160);

  return {
    topic,
    keyword,
    secondaryKeywords,
    audience: str(body.audience, 200),
    goal,
    category: str(body.category, 80),
    length,
    tone,
    includeFaq: body.includeFaq !== false,
    includeInternalLinks: body.includeInternalLinks === true,
    generateImagePrompt: body.generateImagePrompt === true,
    generateSeo: body.generateSeo !== false,
    existing,
    linkCandidates,
  };
}

// ------------------------------------------------------------------ draft normalization / sanitization
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function safeSlug(input: string): string {
  let s = input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
  s = s.replace(/-+$/g, '');
  return s || 'untitled-draft';
}

/** Article HTML first-pass hardening. The browser's existing sanitizer
 *  (src/lib/sanitizeHtml.ts, DOMPurify) is the authoritative layer — this only
 *  removes the obvious dangerous/broken stuff before it travels. */
function sanitizeArticleServerSide(html: string): string {
  return html
    .replace(/<\s*(script|iframe|object|embed|style|svg|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|style|svg|form)[^>]*\/?>/gi, '')
    .replace(/<img\b[^>]*>/gi, '')            // V1: no inline images — cover comes from the media workflow
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\shref\s*=\s*("|')\s*(javascript|vbscript|data):[^"']*\1/gi, ' href="#"')
    .replace(/\ssrc\s*=\s*("|')\s*(javascript|vbscript|data):[^"']*\1/gi, '');
}

function normalizeDraft(parsed: Record<string, unknown>, topic: string, keyword: string): GeneratedBlogDraft {
  const title = str(parsed.title, 160) || topic.slice(0, 120);
  const contentRaw = typeof parsed.contentHtml === 'string' ? parsed.contentHtml : (typeof parsed.content === 'string' ? parsed.content : '');
  // drop a leading H1 that just duplicates the title (site renders its own H1)
  let content = contentRaw.replace(/<h1[\s\S]*?<\/h1>/i, '').trim();
  content = sanitizeArticleServerSide(content);

  const wordCount = wordCountOf(content);
  if (wordCount < 150) {
    throw new AiError('invalid_output', 502, 'The AI returned an article that is too short to use. Nothing was saved — try again.');
  }

  const tagsRaw = Array.isArray(parsed.tags) ? parsed.tags : [];
  const tags = tagsRaw.map((t) => str(t, 40)).filter(Boolean).slice(0, 10);

  const seoObj = (parsed.seo && typeof parsed.seo === 'object' ? parsed.seo : {}) as Record<string, unknown>;
  const keywordsRaw = Array.isArray(seoObj.keywords) ? seoObj.keywords : [];

  const warningsRaw = Array.isArray(parsed.warnings) ? parsed.warnings : [];

  return {
    title,
    slug: safeSlug(str(parsed.slug, 80)),
    excerpt: str(parsed.excerpt, 400),
    contentHtml: content,
    category: str(parsed.category, 80),
    tags,
    authorName: str(parsed.authorName, 80) || 'BRANIFY Team',
    authorRole: str(parsed.authorRole, 80) || 'Growth Strategist',
    seo: {
      title: str(seoObj.title, 90),
      description: str(seoObj.description, 200),
      focus_keyword: keyword,
      keywords: keywordsRaw.map((k) => str(k, 60)).filter(Boolean).slice(0, 12),
    },
    coverImagePrompt: str(parsed.coverImagePrompt, 1200),
    coverAlt: str(parsed.coverAlt, 160),
    warnings: warningsRaw.map((w) => str(w, 300)).filter(Boolean).slice(0, 6),
  };
}

// ------------------------------------------------------------------ endpoint
export default async function handler(req: Req, res: Res): Promise<void> {
  const h = req.headers || {};
  const origin = String((Array.isArray(h.origin) ? h.origin[0] : h.origin) || '');
  try {
    cors(origin, res);
    if (String(req.method || 'GET').toUpperCase() === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (String(req.method || 'GET').toUpperCase() !== 'POST') {
      throw new AiError('bad_request', 405, 'Use POST.');
    }

    const admin = await verifyAdmin(bearerOf(req));
    checkRate(`${admin.email}`);

    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const validated = validateRequest(body);

    const cfg = resolveProvider();
    const t0 = Date.now();
    const { parsed, repaired } = await generateStructuredJson(
      cfg,
      BRANIFY_SYSTEM_PROMPT,
      buildUserPrompt(validated),
      maxTokensForLength(validated.length),
    );
    if (!parsed) throw new AiError('invalid_output', 502, 'The AI response could not be parsed as JSON. Nothing was saved — try again.');

    const draft = normalizeDraft(parsed, validated.topic, validated.keyword);
    const data: GenerateBlogResponseData = {
      draft,
      model: cfg.model,
      provider: cfg.name,
      durationMs: Date.now() - t0,
      wordCount: wordCountOf(draft.contentHtml),
      repaired,
    };
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true, data });
  } catch (e) {
    const err = e instanceof AiError
      ? e
      : new AiError('server_error', 500, (e as Error)?.message?.slice(0, 300) || 'Unexpected server error.');
    if (err.status >= 500) console.error('[ai-blog]', err.code, err.message.slice(0, 200));
    res.status(err.status).json({ ok: false, error: { code: err.code, message: err.message } });
  }
}
