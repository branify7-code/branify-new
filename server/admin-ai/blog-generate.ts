// =============================================================================
// BRANIFY — AI Blog Generation · serverless endpoint (SERVER-SIDE ONLY)
// -----------------------------------------------------------------------------
// POST /api/admin/ai/blog/generate
//   Authorization: Bearer <BRANIFY admin Supabase session JWT>
//   Body: GenerateBlogRequest  →  { ok: true, data: GenerateBlogResponseData }
//
// Security model (identical to api/gsc.ts):
//   • Only allowlisted BRANIFY admins (admin_users + RLS) can call this.
//   • AI provider credentials live ONLY in server env vars (AI_API_KEY …).
//     They are never returned, echoed, or logged. The browser receives the
//     generated draft only.
//   • Request body is validated + size-limited; provider errors map to safe
//     human-readable messages; malformed model output gets exactly one repair
//     attempt and otherwise fails without creating anything.
//
// IMPORTANT (Vercel): this file is intentionally SELF-CONTAINED — zero relative
// imports. The repo's root tsconfig (module: ESNext) makes @vercel/node crash
// multi-file function bundles at runtime, while single-file functions (this
// one and api/gsc.ts) deploy and run correctly. The AIProvider abstraction,
// BRANIFY system prompt and JSON handling therefore live here. To extend:
// add another provider branch inside resolveProvider()/chatComplete().
//
// No new tables, no schema changes, no new npm dependencies.
// =============================================================================

// ------------------------------------------------------------------ config
const CORS_ORIGINS = [
  'https://branify.store',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const SB_URL = process.env.SUPABASE_URL || 'https://uspshkegxhrglbpxqtil.supabase.co';
// Public (anon) key — same value the browser already holds; only used to carry
// the ADMIN USER's own JWT through Supabase Auth/REST (RLS enforces the rest).
const SB_ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_X11QDwMSfS2ivSePRVDpLQ_xNFY_8vw';

export const maxDuration = 120;

class AiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ------------------------------------------------------------------ admin verification (mirrors api/gsc.ts verifyAdmin)
async function verifyAdmin(token: string): Promise<{ id: string; email: string }> {
  if (!token) {
    throw new AiError('unauthorized', 401, 'Sign in to BRANIFY Admin to use AI generation.');
  }
  const uRes = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } });
  if (!uRes.ok) throw new AiError('unauthorized', 401, 'Your admin session is invalid or expired. Sign in again.');
  const user = (await uRes.json()) as { id?: string; email?: string };
  if (!user?.email) throw new AiError('unauthorized', 401, 'Your admin session is invalid or expired. Sign in again.');

  const aRes = await fetch(
    `${SB_URL}/rest/v1/admin_users?email=eq.${encodeURIComponent(user.email)}&select=email,active,role`,
    { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } },
  );
  if (!aRes.ok) throw new AiError('upstream', 502, `Admin verification failed (HTTP ${aRes.status}).`);
  const admins = (await aRes.json()) as Array<{ email: string; active: boolean; role: string }>;
  if (!admins.some((a) => a.active)) {
    throw new AiError('forbidden', 403, 'This account is not on the BRANIFY admin allowlist.');
  }
  return { id: user.id || user.email, email: user.email };
}

// ------------------------------------------------------------------ request/response contract
export interface ExistingPostRef { title: string; slug: string; category: string }

export interface GenerateBlogRequest {
  topic: string;
  keyword: string;
  secondaryKeywords?: string[];
  audience?: string;
  goal: string;
  category?: string;
  length: number;
  tone: string;
  includeFaq: boolean;
  includeInternalLinks: boolean;
  generateImagePrompt: boolean;
  generateSeo: boolean;
  existing?: ExistingPostRef[];
  linkCandidates?: string[];
}

export interface GeneratedSeoMeta { title: string; description: string; focus_keyword: string; keywords: string[] }

export interface GeneratedBlogDraft {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  category: string;
  tags: string[];
  authorName: string;
  authorRole: string;
  seo: GeneratedSeoMeta;
  coverImagePrompt: string;
  coverAlt: string;
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

// ------------------------------------------------------------------ provider abstraction (OpenAI-compatible)
interface AiProviderConfig { name: string; baseUrl: string; apiKey: string; model: string; timeoutMs: number }

const PROVIDER_DEFAULTS: Record<string, { baseUrl: string; model: string }> = {
  glm: { baseUrl: 'https://api.z.ai/api/paas/v4', model: 'glm-4.6' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
  // Gemini via its OpenAI-compatible endpoint. Reuses the project's existing
  // GEMINI_API_KEY env var when AI_API_KEY is not set (see resolveProvider).
  gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash' },
  // Vercel AI Gateway — one OpenAI-compatible endpoint for every model.
  // Authenticates with the deployment's auto-injected OIDC token, so no
  // static key is needed when this endpoint runs on Vercel itself.
  gateway: { baseUrl: 'https://ai-gateway.vercel.sh/v1', model: 'zai/glm-4.6' },
  custom: { baseUrl: '', model: '' },
};

export function resolveProvider(oidcToken?: string): AiProviderConfig {
  const name = (process.env.AI_PROVIDER || 'glm').toLowerCase().trim();
  const preset = PROVIDER_DEFAULTS[name] || PROVIDER_DEFAULTS.custom;
  const baseUrl = (process.env.AI_API_BASE_URL || preset.baseUrl).replace(/\/+$/, '');
  // AI_API_KEY wins; provider-specific fallbacks keep zero-secret setups
  // working: gemini reuses the project's GEMINI_API_KEY, gateway uses the
  // OIDC token Vercel delivers on every function invocation as the
  // 'x-vercel-oidc-token' request header (falls back to the env var for
  // local development via `vercel env pull`).
  const apiKey = (
    process.env.AI_API_KEY
    || (name === 'gemini' ? process.env.GEMINI_API_KEY : '')
    || (name === 'gateway' ? (oidcToken || process.env.VERCEL_OIDC_TOKEN || '') : '')
    || ''
  ).trim();
  const model = (process.env.AI_MODEL || preset.model).trim();

  if (!apiKey) {
    throw new AiError('not_configured', 503,
      name === 'gemini'
        ? 'AI generation (gemini provider) needs AI_API_KEY or GEMINI_API_KEY in the server environment variables, then redeploy.'
        : name === 'gateway'
          ? 'AI generation (gateway provider) needs an AI Gateway API key in AI_API_KEY (Vercel dashboard → AI Gateway → API keys). On Vercel deployments the OIDC token is used automatically.'
          : 'AI generation is not configured yet. Add AI_API_KEY (and optionally AI_PROVIDER, AI_API_BASE_URL, AI_MODEL) to the server environment variables, then redeploy.');
  }
  if (!baseUrl) throw new AiError('not_configured', 503, 'AI base URL is missing. Set AI_API_BASE_URL for the configured provider.');
  if (!model) throw new AiError('not_configured', 503, 'AI model is missing. Set AI_MODEL in the server environment.');
  // BUGFIX: previously `Number(process.env.AI_TIMEOUT_MS || 0)` made the
  // unset case fall through `Number.isFinite(0)` and clamp to the 15s floor —
  // killing every real generation (a 1200-word draft needs 20–50s). Unset now
  // means the 50s default. The clamp keeps the abort inside the function's
  // `maxDuration = 120` platform window while reserving time to validate the
  // output and return a friendly JSON error instead of a platform kill.
  // Ceiling is 100s: HF-router open models (DeepSeek-V3) write a 1200-word
  // draft in ~60-80s, so AI_TIMEOUT_MS=100000 is the supported HF setting.
  const rawTimeout = process.env.AI_TIMEOUT_MS ? Number(process.env.AI_TIMEOUT_MS) : NaN;
  const timeoutMs = Math.min(100000, Math.max(15000, Number.isFinite(rawTimeout) ? rawTimeout : 50000));
  return { name, baseUrl, apiKey, model, timeoutMs };
}

interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

async function chatComplete(cfg: AiProviderConfig, messages: ChatMessage[], temperature: number, maxTokens: number): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
  let res: Response;
  const body: Record<string, unknown> = {
    model: cfg.model, messages, temperature, max_tokens: maxTokens, stream: false,
  };
  // Gemini 3.x "thinking" models spend a large share of the generation window
  // reasoning before writing. For editorial output with this detailed system
  // prompt, low effort trims latency meaningfully without hurting draft
  // quality — and keeps long-brief generations inside the platform's function
  // window. Other providers keep the exact payload they had before.
  if (cfg.name === 'gemini') body.reasoning_effort = 'low';
  try {
    res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (e) {
    const aborted = e instanceof Error && (e.name === 'AbortError' || /abort/i.test(e.message || ''));
    if (aborted) {
      throw new AiError('provider_timeout', 504,
        'The AI provider took too long to respond. Retry — long articles can occasionally exceed the generation window.');
    }
    throw new AiError('network', 502, 'The AI provider could not be reached. Check connectivity and try again.');
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  if (!res.ok) {
    let msg = '';
    try { msg = (JSON.parse(text) as { error?: { message?: string } })?.error?.message || ''; } catch { /* raw */ }
    msg = (msg || text || '').slice(0, 300);
    if (res.status === 401 || res.status === 403) {
      // Safe to surface the provider's own message to authenticated admins —
      // it never contains the credential and helps them fix the configuration.
      throw new AiError('provider_auth', 502,
        `The AI provider rejected the server credential (HTTP ${res.status}).${msg ? ' Provider said: ' + msg : ' Verify AI_API_KEY on the server.'}`);
    }
    if (res.status === 429) throw new AiError('rate_limited', 429, 'The AI provider rate limit was hit. Wait a minute and try again.');
    if (res.status === 404) throw new AiError('provider_model', 502, `The model "${cfg.model}" was not found on the provider. Check AI_MODEL.`);
    throw new AiError('upstream', 502, `AI provider error (HTTP ${res.status}).${msg ? ' ' + msg : ''}`);
  }

  let content = '';
  try {
    const j = JSON.parse(text) as { choices?: Array<{ message?: { content?: string | null } }> };
    content = j.choices?.[0]?.message?.content || '';
  } catch { /* handled below */ }
  if (!content.trim()) throw new AiError('empty_content', 502, 'The AI provider returned an empty response. Try again.');
  return content;
}

/** Extract the first JSON object from a model response (tolerates fences/prose). */
export function extractJsonObject(raw: string): Record<string, unknown> | null {
  let t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = t.slice(start, end + 1);
  try {
    const parsed = JSON.parse(candidate) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    try {
      const parsed = JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1')) as unknown;
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}

export function maxTokensForLength(words: number): number {
  return Math.min(16000, Math.round(words * 2.6) + 1400);
}

export function wordCountOf(html: string): number {
  const plain = html.replace(/<[^>]*>/g, ' ').replace(/[#>*`_\[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
  return plain ? plain.split(' ').length : 0;
}

async function generateStructuredJson(
  cfg: AiProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<{ parsed: Record<string, unknown>; repaired: boolean }> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  const raw = await chatComplete(cfg, messages, 0.75, maxTokens);
  const first = extractJsonObject(raw);
  if (first) return { parsed: first, repaired: false };

  const repairMessages: ChatMessage[] = [
    ...messages,
    { role: 'assistant', content: raw.slice(0, 24000) },
    {
      role: 'user',
      content:
        'Your previous response was not parseable as a single JSON object. ' +
        'Return ONLY the corrected JSON object — no markdown fences, no commentary, no trailing text. ' +
        'Keep every field and the full article content from your previous answer.',
    },
  ];
  const raw2 = await chatComplete(cfg, repairMessages, 0.2, maxTokens);
  const second = extractJsonObject(raw2);
  if (second) return { parsed: second, repaired: true };
  throw new AiError('invalid_output', 502,
    'The AI returned structured data that could not be parsed as JSON after one repair attempt. Nothing was saved — please try again.');
}

// ------------------------------------------------------------------ BRANIFY system prompt
const GOAL_LABELS: Record<string, string> = {
  informational: 'Informational — genuinely educate the reader; trust converts later',
  lead_generation: 'Lead generation — inform first, then invite a relevant BRANIFY conversation (discovery call / project inquiry) as a natural next step',
  service_promotion: 'Service promotion — position a relevant BRANIFY service through useful insight, never a hard sell',
  educational: 'Educational — teach a how-to or decision framework the reader can act on',
};

const TONE_LABELS: Record<string, string> = {
  professional: 'Professional — clear, confident, corporate-grade writing',
  expert: 'Expert — senior practitioner voice, concrete specifics, no hand-holding',
  conversational: 'Conversational — warm and direct, like a smart consultant explaining to a founder',
  educational: 'Educational — patient, structured, explains terms the first time',
};

const LENGTH_HINTS: Record<number, string> = {
  // Hard-floor phrasing: several open models (DeepSeek-V3 notably) otherwise
  // stop at 300-500 words. Stating a NON-NEGOTIABLE word floor + a section
  // budget is far more effective than a loose target with a range.
  1200: 'HARD MINIMUM 1200 words of article body (target 1200–1400). Do NOT stop early — a shorter submission is a failed response',
  1500: 'HARD MINIMUM 1500 words of article body (target 1500–1700). Do NOT stop early — a shorter submission is a failed response',
  2000: 'HARD MINIMUM 2000 words of article body (target 2000–2200). Do NOT stop early — a shorter submission is a failed response',
  2500: 'HARD MINIMUM 2500 words of article body (target 2500–2700). Do NOT stop early — a shorter submission is a failed response',
};

export const BRANIFY_SYSTEM_PROMPT = `You are BRANIFY's senior SEO content strategist and editorial writer.

## Who BRANIFY is
BRANIFY (https://branify.store) is a premium digital agency and creative studio.
Positioning: "BUILD. BRAND. GROW." — the studio designs, builds and grows digital
products: custom websites and web apps, brand identity, UI/UX, AI automation and
a large library of free tools and templates that demonstrate expertise openly.
Visual identity: black / very dark surfaces with a luxury gold accent —
premium, modern, corporate, technology-focused, creative, professional.

## Who you write for
Real business owners and decision-makers evaluating agencies and their own next
investment. Assume intelligence and limited time. Be concrete: name tradeoffs,
give numbers when honest, describe real workflows. No fake claims, no fake
testimonials, no invented statistics or fake research citations, no exaggerated
promises, no guaranteed-ranking claims, no childish language, no clickbait, no
keyword stuffing, no emojis, no generic AI filler ("in today's fast-paced digital
landscape…", "unlock the power of…"), no robotic repetition of the brand name.

## Voice
Write like a senior strategist at a premium studio: calm confidence, specific
knowledge, honest advice. Sentences vary in length and average under 20 words.
Paragraphs are 40–110 words — never walls of text. It is fine to say "it
depends" if you then explain what it depends on. CTAs (when the goal calls for
one) must feel like a natural next step, mention BRANIFY at most once or twice
in the whole article, and never pressure the reader.

## Output format — semantic HTML, exactly this vocabulary
The article body is HTML rendered by the BRANIFY site and sanitized by its
editor. Use ONLY these tags: <p>, <h2>, <h3>, <h4>, <strong>, <em>, <u>,
<blockquote>, <ul>, <ol>, <li>, <a>, <pre>, <code>, <hr> (sparingly).
FORBIDDEN: <h1>, <img>, <figure>, <script>, <iframe>, <table>, inline styles,
class attributes, event handlers, javascript:/data: URLs.
Rules:
- Start directly with an introduction <p> — no <h1> (the page renders its own H1).
- 7 to 9 <h2> sections for every 1200 words of requested length; use <h3> subsections inside longer ones. EACH <h2> section must carry 2–4 substantial <p> paragraphs (3–5 sentences each).
- Wrap every paragraph in <p>. Bullet lists as <ul><li>; numbered steps as <ol><li>.
- <blockquote> for at most one or two key takeaways.
- <strong> for genuine emphasis, <em> sparingly, <code> only for literals.
- Internal links: <a href="/allowed/path">natural anchor text</a> — see the
  internal-links rule. Never use "click here" as anchor text.

## Internal links rule (critical)
You will receive an ALLOWED_PATHS list of real routes on branify.store.
- If internal links are requested, include 1–3 of them — placed where they
  genuinely help the reader. The anchor text must describe the destination.
- Every href MUST be copied EXACTLY from ALLOWED_PATHS. Do NOT invent, modify,
  or guess any other path — when nothing fits naturally, link nothing.
- When internal links are NOT requested, include no links at all.
- Do not add external links (the site adds authoritative citations itself).

## SEO rules (scored by the existing on-page audit — follow the numbers)
- seo_title: 30–60 characters (Google displays ~50–60), contains the primary
  keyword naturally, no clickbait, no brand-name prefix.
- seo.description: 120–160 characters, one concrete reason to read, honest,
  contains the primary keyword naturally.
- Primary keyword must also appear: in the introduction (first paragraph), in
  at least one H2/H3 heading, and in the slug (hyphenated, if it keeps the
  slug readable). Keyword density across the whole body: 0.5%–2.5% — use
  semantic variations instead of repeating the exact phrase mechanically.
- slug: lowercase, hyphen-separated, readable, at least two meaningful words,
  no filler words ("a", "the", "you"), no "in-2026" style padding, max 60 chars.
- excerpt: 140–200 characters, a specific promise of what the reader learns.
- Never claim guaranteed rankings, traffic numbers, or results you cannot know.

## Duplicate protection
You will receive a RECENT_POSTS list (titles + slugs + categories) of articles
already published or drafted on the blog. Do not duplicate them: no repeated
titles, no near-duplicate topics, no near-duplicate slugs. If the requested
topic is close to an existing post, take a clearly differentiated angle
(different sub-problem, different audience, different decision stage) and note
what you changed in the "warnings" array.

## Images
Do NOT include any <img> tags. A featured-image art-direction prompt and alt
text are returned separately (the team adds images through the media library).

## Response contract (critical)
Respond with ONE valid JSON object and nothing else — no markdown fences, no
commentary before or after. Shape:
{
  "title": string,
  "slug": string,
  "excerpt": string,
  "contentHtml": string,
  "category": string,
  "tags": string[],
  "authorName": string,
  "authorRole": string,
  "seo": { "title": string, "description": string, "keywords": string[] },
  "coverImagePrompt": string,
  "coverAlt": string,
  "warnings": string[]
}
- contentHtml must be a single JSON string — escape quotes and newlines
  correctly. Never break JSON.
- Every array field must exist (use [] when empty). Every string field must
  exist (use "" when not requested, e.g. coverImagePrompt).
- If image prompt is requested: write a rich art-direction prompt for a premium
  editorial hero image matching BRANIFY's identity (dark background, luxury
  gold accents, modern, no text/logos/watermarks in the image); coverAlt is
  descriptive accessibility text (8–14 words).`;

export function buildUserPrompt(req: GenerateBlogRequest): string {
  const lines: string[] = [];
  lines.push('## Request');
  lines.push(`Topic: ${req.topic}`);
  lines.push(`Primary target keyword: ${req.keyword}`);
  if (req.secondaryKeywords?.length) lines.push(`Secondary keywords (use naturally, sparingly): ${req.secondaryKeywords.join(', ')}`);
  lines.push(`Target audience: ${req.audience || 'Business owners and decision-makers researching this topic'}`);
  lines.push(`Content goal: ${GOAL_LABELS[req.goal] || req.goal}`);
  if (req.category) lines.push(`Category: ${req.category} (use exactly this category label)`);
  lines.push(`Article length: ${LENGTH_HINTS[req.length] || `${req.length} words (±15%)`}`);
  lines.push(`Tone: ${TONE_LABELS[req.tone] || req.tone}`);
  lines.push(`Include FAQ section: ${req.includeFaq ? 'yes — end with a "Frequently Asked Questions" H2 using H3 for each question' : 'no'}`);
  lines.push(`Include internal links: ${req.includeInternalLinks ? 'yes — 1-3 links, hrefs ONLY from ALLOWED_PATHS below' : 'no — include no links at all'}`);
  lines.push(`Generate featured image prompt + alt: ${req.generateImagePrompt ? 'yes' : 'no — return "" for coverImagePrompt and coverAlt'}`);

  const existing = (req.existing || []).slice(0, 60);
  lines.push('');
  lines.push('## RECENT_POSTS (avoid duplicating these titles, topics or slugs)');
  if (existing.length) {
    for (const p of existing) lines.push(`- ${p.title} | /${p.slug}${p.category ? ` | ${p.category}` : ''}`);
  } else {
    lines.push('(none provided — the blog is new)');
  }

  lines.push('');
  lines.push('## ALLOWED_PATHS (the ONLY internal link targets permitted)');
  const paths = (req.linkCandidates || []).slice(0, 160);
  if (paths.length && req.includeInternalLinks) {
    for (const p of paths) lines.push(p);
  } else {
    lines.push('(none — insert no internal links)');
  }

  lines.push('');
  lines.push('Now write the JSON object. JSON only — no fences, no commentary.');
  return lines.join('\n');
}

// ------------------------------------------------------------------ rate limit (best-effort, in-memory)
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 12;
const rateBuckets = new Map<string, number[]>();

function checkRate(key: string): void {
  const now = Date.now();
  const arr = (rateBuckets.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    throw new AiError('rate_limited', 429, 'AI generation limit reached (12 per hour). Try again later.');
  }
  arr.push(now);
  rateBuckets.set(key, arr);
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
  topic: string; keyword: string; secondaryKeywords: string[]; audience: string;
  goal: string; category: string; length: number; tone: string;
  includeFaq: boolean; includeInternalLinks: boolean;
  generateImagePrompt: boolean; generateSeo: boolean;
  existing: ExistingPostRef[]; linkCandidates: string[];
}

function validateRequest(body: Record<string, unknown>): ValidatedRequest {
  const topic = str(body.topic, 300);
  const keyword = str(body.keyword, 120);
  if (topic.length < 8) throw new AiError('bad_request', 400, 'Blog topic is required (at least 8 characters).');
  if (keyword.length < 2) throw new AiError('bad_request', 400, 'Primary target keyword is required.');

  const secondaryRaw = Array.isArray(body.secondaryKeywords) ? body.secondaryKeywords : [];
  const secondaryKeywords = secondaryRaw.map((k) => str(k, 80)).filter(Boolean).slice(0, 10);

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
  const linkCandidates = candidatesRaw.map((p) => str(p, 200)).filter((p) => p.startsWith('/') && !p.includes('..')).slice(0, 160);

  return {
    topic, keyword, secondaryKeywords,
    audience: str(body.audience, 200),
    goal, category: str(body.category, 80), length, tone,
    includeFaq: body.includeFaq !== false,
    includeInternalLinks: body.includeInternalLinks === true,
    generateImagePrompt: body.generateImagePrompt === true,
    generateSeo: body.generateSeo !== false,
    existing, linkCandidates,
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
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\shref\s*=\s*("|')\s*(javascript|vbscript|data):[^"']*\1/gi, ' href="#"')
    .replace(/\ssrc\s*=\s*("|')\s*(javascript|vbscript|data):[^"']*\1/gi, '');
}

function normalizeDraft(parsed: Record<string, unknown>, topic: string, keyword: string): GeneratedBlogDraft {
  const title = str(parsed.title, 160) || topic.slice(0, 120);
  const contentRaw = typeof parsed.contentHtml === 'string' ? parsed.contentHtml : (typeof parsed.content === 'string' ? parsed.content : '');
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

void SLUG_RE;

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

/** OIDC token Vercel attaches to every function invocation (x-vercel-oidc-token). */
function oidcTokenOf(req: Req): string {
  const h = req.headers?.['x-vercel-oidc-token'];
  const raw = Array.isArray(h) ? (h[0] || '') : (h || '');
  return raw.trim();
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

    const cfg = resolveProvider(oidcTokenOf(req));
    const t0 = Date.now();
    const { parsed, repaired } = await generateStructuredJson(
      cfg,
      BRANIFY_SYSTEM_PROMPT,
      buildUserPrompt(validated),
      maxTokensForLength(validated.length),
    );

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
