/* GENERATED FILE — do not edit by hand. Source: server/* (see scripts/build-api.mjs). Regenerate with `npm run api:build`. */

// server/social/generate.ts
import crypto from "node:crypto";
var maxDuration = 120;
var CORS_ORIGINS = [
  "https://branify.store",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
  "http://127.0.0.1:4173"
];
var SB_URL = process.env.SUPABASE_URL || "https://uspshkegxhrglbpxqtil.supabase.co";
var SB_ANON = process.env.SUPABASE_ANON_KEY || "sb_publishable_X11QDwMSfS2ivSePRVDpLQ_xNFY_8vw";
var AiError = class extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code;
    this.status = status;
  }
};
async function verifyAdmin(token) {
  if (!token) throw new AiError("unauthorized", 401, "Sign in to BRANIFY Admin to use AI generation.");
  const uRes = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } });
  if (!uRes.ok) throw new AiError("unauthorized", 401, "Your admin session is invalid or expired. Sign in again.");
  const user = await uRes.json();
  if (!user?.email) throw new AiError("unauthorized", 401, "Your admin session is invalid or expired. Sign in again.");
  const aRes = await fetch(
    `${SB_URL}/rest/v1/admin_users?email=eq.${encodeURIComponent(user.email)}&select=email,active,role`,
    { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } }
  );
  if (!aRes.ok) throw new AiError("upstream", 502, `Admin verification failed (HTTP ${aRes.status}).`);
  const admins = await aRes.json();
  if (!admins.some((a) => a.active)) throw new AiError("forbidden", 403, "This account is not on the BRANIFY admin allowlist.");
  return { id: user.id || user.email, email: user.email };
}
var rateBuckets = /* @__PURE__ */ new Map();
var RATE_WINDOW_MS = 60 * 60 * 1e3;
var RATE_MAX = 24;
function checkRate(key) {
  const now = Date.now();
  const arr = (rateBuckets.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    throw new AiError("rate_limited", 429, "AI generation limit reached (24 per hour). Try again later.");
  }
  arr.push(now);
  rateBuckets.set(key, arr);
  if (rateBuckets.size > 500) {
    for (const [k, v] of rateBuckets) if (v.every((t) => now - t >= RATE_WINDOW_MS)) rateBuckets.delete(k);
  }
}
var PROVIDER_DEFAULTS = {
  glm: { baseUrl: "https://api.z.ai/api/paas/v4", model: "glm-4.6" },
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o" },
  gemini: { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.5-flash" },
  gateway: { baseUrl: "https://ai-gateway.vercel.sh/v1", model: "zai/glm-4.6" },
  custom: { baseUrl: "", model: "" }
};
function resolveProvider(oidcToken) {
  const name = (process.env.AI_PROVIDER || "glm").toLowerCase().trim();
  const preset = PROVIDER_DEFAULTS[name] || PROVIDER_DEFAULTS.custom;
  const baseUrl = (process.env.AI_API_BASE_URL || preset.baseUrl).replace(/\/+$/, "");
  const apiKey = process.env.AI_API_KEY || (name === "gemini" ? process.env.GEMINI_API_KEY : "") || "";
  if (!apiKey) {
    throw new AiError(
      "not_configured",
      503,
      name === "gemini" ? "AI generation (gemini provider) needs AI_API_KEY or GEMINI_API_KEY in the server environment variables, then redeploy." : "AI generation is not configured yet. Add AI_API_KEY (and optionally AI_PROVIDER, AI_API_BASE_URL, AI_MODEL) to the server environment variables, then redeploy."
    );
  }
  if (!baseUrl) throw new AiError("not_configured", 503, "AI base URL is missing. Set AI_API_BASE_URL for the configured provider.");
  const model = (process.env.AI_MODEL || preset.model).trim();
  if (!model) throw new AiError("not_configured", 503, "AI model is missing. Set AI_MODEL in the server environment.");
  const rawTimeout = process.env.AI_TIMEOUT_MS ? Number(process.env.AI_TIMEOUT_MS) : NaN;
  const timeoutMs = Math.min(1e5, Math.max(15e3, Number.isFinite(rawTimeout) ? rawTimeout : 5e4));
  void oidcToken;
  return { name, baseUrl, apiKey, model, timeoutMs };
}
async function chatComplete(cfg, messages, temperature, maxTokens) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
  let res;
  const body = { model: cfg.model, messages, temperature, max_tokens: maxTokens, stream: false };
  if (cfg.name === "gemini") body.reasoning_effort = "low";
  try {
    res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
  } catch (e) {
    const aborted = e instanceof Error && (e.name === "AbortError" || /abort/i.test(e.message || ""));
    if (aborted) {
      throw new AiError("provider_timeout", 504, "The AI provider took too long to respond. Retry \u2014 shorter briefs generate faster.");
    }
    throw new AiError("network", 502, "The AI provider could not be reached. Check connectivity and try again.");
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  if (!res.ok) {
    let msg = "";
    try {
      msg = JSON.parse(text)?.error?.message || "";
    } catch {
    }
    msg = (msg || text || "").slice(0, 300);
    if (res.status === 401 || res.status === 403) {
      throw new AiError("provider_auth", 502, `The AI provider rejected the server credential (HTTP ${res.status}).${msg ? " Provider said: " + msg : " Verify AI_API_KEY on the server."}`);
    }
    if (res.status === 429) throw new AiError("rate_limited", 429, "The AI provider rate limit was hit. Wait a minute and try again.");
    if (res.status === 404) throw new AiError("provider_model", 502, `The model "${cfg.model}" was not found on the provider. Check AI_MODEL.`);
    throw new AiError("upstream", 502, `AI provider error (HTTP ${res.status}).${msg ? " " + msg : ""}`);
  }
  let content = "";
  try {
    const j = JSON.parse(text);
    content = j.choices?.[0]?.message?.content || "";
  } catch {
  }
  if (!content.trim()) throw new AiError("empty_content", 502, "The AI provider returned an empty response. Try again.");
  return content;
}
function extractJsonObject(raw) {
  let t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = t.slice(start, end + 1);
  try {
    const parsed = JSON.parse(candidate);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    try {
      const parsed = JSON.parse(candidate.replace(/,\s*([}\]])/g, "$1"));
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
}
var SOCIAL_SYSTEM_PROMPT = `You are BRANIFY's senior social media strategist and content manager.

## Who BRANIFY is
BRANIFY \u2014 BUILD. BRAND. GROW. A premium digital agency & creative studio:
web development, branding & UI/UX, AI & automation, e-commerce, digital marketing.
Brand characteristics: premium, modern, professional, creative, technology-focused,
confident, human, helpful. Visual identity: black/dark luxury-gold, clean, modern.

## Voice rules (non-negotiable)
- Write natural, human social copy \u2014 like a sharp strategist posting on the company page.
- Prioritise customer value over self-praise; every post must teach, help, or genuinely interest the reader.
- Vary hooks, sentence rhythms and openings. NEVER reuse a hook or opening line from RECENT POSTS.
- No childish wording, no generic AI filler ("in today's fast-paced digital landscape"), no clickbait.
- Never invent facts, statistics, client names, testimonials, case-study results or phone numbers.
- Never claim measurable results without provided source data.
- No exaggerated promises ("guaranteed 10x sales"). No spammy or pushy CTAs.
- At most 1 emoji per post, only when it truly fits the brand. No hashtag stuffing.

## Platform rules
Facebook: 60\u2013130 words. Hook first line, then a short useful explanation with concrete value,
close with ONE clear CTA (e.g. "Visit Branify", "Contact Branify", "Explore our services",
"Request a consultation"). May include the real URLs given in the brief \u2014 never invent URLs.
Instagram: visual-first. Strong scannable first line, short paragraphs (1\u20132 lines), useful CTA,
then 5\u201310 highly relevant hashtags (no random mega-blocks). If include_hashtags=false, return [].

## Output contract
Return ONLY a JSON object \u2014 no prose around it. Shape:
{"posts":[{"platform":"facebook"|"instagram","content_type":"facebook_post"|"instagram_image"|"instagram_carousel","title":"short internal title","caption":"final post text WITHOUT hashtags appended","hashtags":["#tag",...],"cta":"the call to action used or empty","image_prompt":"image generation prompt when requested, else empty","alt_text":"8-14 word accessibility description when image is involved, else empty","creative_prompt":"extra creative direction when requested, else empty","day":"Mon|Tue|Wed|Thu|Fri|Sat|Sun (weekly plan only, else empty)"}]}
Captions must NOT include the hashtags inside "caption" \u2014 hashtags live in the "hashtags" array.
Every caption must be publish-ready: correct line breaks, no placeholder text, no markdown symbols.`;
var CONTENT_TYPES = ["facebook_post", "instagram_image", "instagram_carousel", "instagram_reel_idea", "instagram_story_idea"];
var TONES = ["professional", "expert", "conversational", "premium"];
function validateRequest(b) {
  const mode = String(b.mode || "single");
  if (!["single", "weekly", "from_blog", "from_service"].includes(mode)) {
    throw new AiError("bad_request", 400, "Unknown generation mode.");
  }
  const platformRaw = String(b.platform || "facebook");
  const platform = ["facebook", "instagram", "both"].includes(platformRaw) ? platformRaw : "facebook";
  const content_type = CONTENT_TYPES.includes(String(b.content_type)) ? String(b.content_type) : "facebook_post";
  const tone = TONES.includes(String(b.tone)) ? String(b.tone) : "professional";
  const str = (v, max) => String(v || "").slice(0, max).trim();
  const strList = (v, maxItems, maxLen) => Array.isArray(v) ? v.slice(0, maxItems).map((x) => str(x, maxLen)).filter(Boolean) : [];
  const blog = b.blog && typeof b.blog === "object" ? b.blog : {};
  const svc = b.serviceData && typeof b.serviceData === "object" ? b.serviceData : {};
  const req = {
    mode,
    platform,
    content_type,
    topic: str(b.topic, 300),
    service: str(b.service, 200),
    audience: str(b.audience, 300),
    cta: str(b.cta, 200),
    tone,
    include_hashtags: b.include_hashtags !== false,
    include_creative_prompt: b.include_creative_prompt === true,
    recentCaptions: strList(b.recentCaptions, 8, 400),
    recentTitles: strList(b.recentTitles, 10, 200),
    blog: {
      title: str(blog.title, 200),
      url: str(blog.url, 300),
      excerpt: str(blog.excerpt, 500)
    },
    serviceData: {
      name: str(svc.name, 120),
      slug: str(svc.slug, 120),
      url: str(svc.url, 300),
      description: str(svc.description, 800),
      tagline: str(svc.tagline, 300)
    }
  };
  if (req.mode === "single" && !req.topic && !req.service) {
    throw new AiError("bad_request", 400, "Give the post a topic (or pick a service) first.");
  }
  if (req.mode === "from_blog" && !req.blog?.title) {
    throw new AiError("bad_request", 400, "Select a blog post to promote.");
  }
  if (req.mode === "from_service" && !req.serviceData?.name) {
    throw new AiError("bad_request", 400, "Select a BRANIFY service to promote.");
  }
  return req;
}
function recentBlock(r) {
  const caps = (r.recentCaptions || []).map((c) => `- ${c.replace(/\s+/g, " ").slice(0, 160)}`).join("\n");
  const titles = (r.recentTitles || []).map((t) => `- ${t}`).join("\n");
  const parts = [];
  if (caps) parts.push(`RECENT SOCIAL CAPTIONS (never repeat these hooks, angles or CTAs):
${caps}`);
  if (titles) parts.push(`RECENT BLOG TITLES (avoid repeating the same ideas):
${titles}`);
  return parts.length ? parts.join("\n\n") : "No recent content \u2014 still vary the angle creatively.";
}
function baseBrief(r) {
  const lines = [];
  if (r.topic) lines.push(`Topic: ${r.topic}`);
  if (r.service) lines.push(`Service focus: ${r.service}`);
  if (r.audience) lines.push(`Target audience: ${r.audience}`);
  if (r.cta) lines.push(`Call to action to use (verbatim intent, not spammy): ${r.cta}`);
  lines.push(`Tone: ${r.tone}`);
  lines.push(`Include hashtags: ${r.include_hashtags ? "yes" : "no \u2014 return empty arrays"}`);
  lines.push(`Generate image prompt: ${r.include_creative_prompt ? "yes" : "no \u2014 return empty image_prompt/creative_prompt"}`);
  return lines.join("\n");
}
function buildUserPrompt(r) {
  switch (r.mode) {
    case "single": {
      const platforms = r.platform === "both" ? "both platforms (facebook AND instagram \u2014 two posts)" : `platform: ${r.platform}`;
      const ct = r.content_type === "facebook_post" ? "facebook_post" : r.platform === "facebook" ? "facebook_post" : r.content_type;
      return `${recentBlock(r)}

Create ${platforms}. Platform: ${r.platform}. Content type: ${ct}.
${baseBrief(r)}

Rules: adapt each post to its platform per the system rules. When platform is "both", write two
DISTINCT posts (different hook and structure, same core message). Return {"posts":[\u2026]} only.`;
    }
    case "weekly": {
      return `${recentBlock(r)}

Create a 7-day content plan for the coming week. Default pillar rotation \u2014 adjust when recent
content makes another topic smarter (never repeat yesterday's angle):
Mon Website Development \xB7 Tue Business/Growth Tip \xB7 Wed AI/Automation \xB7 Thu Branding/UI-UX \xB7
Fri Digital Marketing \xB7 Sat Portfolio/Case study \xB7 Sunday Educational/Engagement.
Rules: alternate facebook and instagram sensibly (roughly half each); every post different hook;
content_type facebook_post for facebook, instagram_image for instagram; day = Mon\u2026Sun.
Return {"posts":[\u2026]} with exactly 7 items. ${baseBrief(r)}`;
    }
    case "from_blog": {
      return `${recentBlock(r)}

Create social promotion for this published blog post.
Blog title: ${r.blog?.title}
Public URL (use verbatim in the Facebook post): ${r.blog?.url}
Blog excerpt: ${r.blog?.excerpt || "(none given \u2014 stay strictly within the title topic)"}

Return {"posts":[\u2026]} with EXACTLY these items:
1. facebook_post \u2014 hook + why it matters + what the reader learns + CTA "Read the full article: ${r.blog?.url}" (shortened naturally).
2. instagram_image caption \u2014 visual-first tease of the article; CTA "Link in bio".
3. instagram_image VISUAL CONCEPT \u2014 title starts with "Visual concept:", caption describes the artwork to create (scene, mood, BRANIFY black/gold identity), image_prompt filled.
4. instagram_carousel OUTLINE \u2014 title starts with "Carousel outline:", caption = slide-by-slide outline (Slide 1..5, one line each).`;
    }
    case "from_service": {
      return `${recentBlock(r)}

Create promotional content for this EXISTING BRANIFY service (do not invent features):
Service: ${r.serviceData?.name} (page: ${r.serviceData?.url})
Tagline: ${r.serviceData?.tagline || "(none)"}
Description: ${r.serviceData?.description || "(none)"}

Return {"posts":[\u2026]} with EXACTLY these items:
1. facebook_post \u2014 value-first promo with the service page URL.
2. instagram_image caption \u2014 visual-first promo + CTA to the service page.
3. instagram_image VISUAL CONCEPT \u2014 title starts with "Visual concept:", BRANIFY black/gold art direction, image_prompt filled.`;
    }
  }
}
function postCount(r) {
  if (r.mode === "weekly") return 7;
  if (r.mode === "single") return r.platform === "both" ? 2 : 1;
  return 4;
}
function sanitizePosts(raw, r) {
  const list = Array.isArray(raw.posts) ? raw.posts : [];
  const expected = postCount(r);
  const out = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const o = item;
    const caption = String(o.caption || "").trim();
    if (!caption) continue;
    const platform = ["facebook", "instagram"].includes(String(o.platform)) ? String(o.platform) : r.platform === "instagram" ? "instagram" : "facebook";
    const ct = String(o.content_type || "");
    const contentType = platform === "facebook" ? "facebook_post" : ["instagram_image", "instagram_carousel", "instagram_reel_idea", "instagram_story_idea"].includes(ct) ? ct : "instagram_image";
    out.push({
      platform,
      content_type: contentType,
      title: String(o.title || "").slice(0, 180).trim(),
      caption: caption.slice(0, 3e3),
      hashtags: Array.isArray(o.hashtags) ? o.hashtags.slice(0, 15).map((h) => String(h).replace(/^#+/, "")).filter(Boolean).map((h) => `#${h.replace(/[^a-zA-Z0-9_]/g, "")}`).filter((h) => h.length > 1) : [],
      cta: String(o.cta || "").slice(0, 200).trim(),
      image_prompt: String(o.image_prompt || "").slice(0, 900).trim(),
      alt_text: String(o.alt_text || "").slice(0, 160).trim(),
      creative_prompt: String(o.creative_prompt || "").slice(0, 900).trim(),
      day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].includes(String(o.day)) ? String(o.day) : ""
    });
  }
  return { posts: out, repaired: out.length >= expected };
}
function cors(origin, res) {
  if (CORS_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}
function bearerOf(req) {
  const h = req.headers?.authorization;
  const raw = Array.isArray(h) ? h[0] || "" : h || "";
  return raw.replace(/^Bearer\s+/i, "").trim();
}
function oidcTokenOf(req) {
  const h = req.headers?.["x-vercel-oidc-token"];
  const raw = Array.isArray(h) ? h[0] || "" : h || "";
  return raw.trim();
}
async function handler(req, res) {
  const h = req.headers || {};
  const origin = String((Array.isArray(h.origin) ? h.origin[0] : h.origin) || "");
  try {
    cors(origin, res);
    const method = String(req.method || "GET").toUpperCase();
    if (method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (method !== "POST") {
      throw new AiError("bad_request", 405, "Use POST.");
    }
    const admin = await verifyAdmin(bearerOf(req));
    checkRate(`${admin.email}`);
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const brief = validateRequest(body);
    const cfg = resolveProvider(oidcTokenOf(req));
    const t0 = Date.now();
    const maxTokens = brief.mode === "weekly" ? 6e3 : 3500;
    const temperature = brief.mode === "weekly" ? 0.8 : 0.75;
    const raw = await chatComplete(cfg, [
      { role: "system", content: SOCIAL_SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(brief) }
    ], temperature, maxTokens);
    let parsed = extractJsonObject(raw);
    let repaired = false;
    if (!parsed) {
      const raw2 = await chatComplete(cfg, [
        { role: "system", content: SOCIAL_SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(brief) },
        { role: "assistant", content: raw.slice(0, 4e3) },
        { role: "user", content: "That was not valid JSON. Return the corrected JSON object only \u2014 same contract, no prose." }
      ], 0.2, maxTokens);
      parsed = extractJsonObject(raw2);
      repaired = true;
    }
    if (!parsed) {
      throw new AiError("invalid_model_output", 502, "The AI returned an unreadable response. Try again \u2014 it usually succeeds on retry.");
    }
    const { posts } = sanitizePosts(parsed, brief);
    if (!posts.length) {
      throw new AiError("invalid_model_output", 502, "The AI returned no usable post content. Adjust the brief and try again.");
    }
    res.status(200).json({
      ok: true,
      data: {
        posts,
        model: cfg.model,
        provider: cfg.name,
        durationMs: Date.now() - t0,
        repaired
      }
    });
  } catch (e) {
    if (e instanceof AiError) {
      res.status(e.status).json({ ok: false, error: { code: e.code, message: e.message } });
      return;
    }
    const id = crypto.randomUUID();
    console.error(`[social-generate:${id}]`, e instanceof Error ? e.message : e);
    res.status(500).json({ ok: false, error: { code: "internal", message: `Unexpected generation error (ref ${id.slice(0, 8)}).` } });
  }
}
export {
  handler as default,
  maxDuration
};
