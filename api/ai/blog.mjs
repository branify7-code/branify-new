/* GENERATED FILE — do not edit by hand. Source: server/* (see scripts/build-api.mjs). Regenerate with `npm run api:build`. */

// lib/ai/omniroute.ts
var OmniRouteError = class extends Error {
  constructor(kind, message, status, detail) {
    super(message);
    this.name = "OmniRouteError";
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
};
var DEFAULT_TIMEOUT_MS = 6e4;
function getOmniRouteEnv() {
  const baseUrl = (process.env.OMNIROUTE_BASE_URL || "").trim().replace(/\/+$/, "");
  const apiKey = (process.env.OMNIROUTE_API_KEY || "").trim();
  if (!baseUrl) {
    throw new OmniRouteError(
      "config",
      "The AI gateway is not configured (missing OMNIROUTE_BASE_URL).",
      500,
      "Set OMNIROUTE_BASE_URL (e.g. http://localhost:20128/v1) in the server environment."
    );
  }
  if (!apiKey) {
    throw new OmniRouteError(
      "config",
      "The AI gateway is not configured (missing OMNIROUTE_API_KEY).",
      500,
      "Set OMNIROUTE_API_KEY to the OmniRoute client key created for BRANIFY."
    );
  }
  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new OmniRouteError(
      "config",
      "The AI gateway is configured with an invalid OMNIROUTE_BASE_URL.",
      500,
      "OMNIROUTE_BASE_URL must start with http:// or https://."
    );
  }
  const parsedTimeout = Number(process.env.OMNIROUTE_TIMEOUT_MS || "");
  const timeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout >= 1e3 ? parsedTimeout : DEFAULT_TIMEOUT_MS;
  return { baseUrl, apiKey, timeoutMs };
}
function redactSecrets(input) {
  let out = input;
  const key = (process.env.OMNIROUTE_API_KEY || "").trim();
  if (key && out.includes(key)) out = out.split(key).join("[redacted]");
  out = out.replace(/sk-[A-Za-z0-9_-]{6,}/g, "[redacted]");
  out = out.replace(/AIza[0-9A-Za-z_-]{20,}/g, "[redacted]");
  return out;
}
function logSafe(...parts) {
  const line = parts.map((p) => typeof p === "string" ? p : JSON.stringify(p)).map((p) => typeof p === "string" ? redactSecrets(p) : p).join(" ");
  console.log(`[omniroute] ${line}`);
}
function mapHttpStatus(status, bodyPreview) {
  const detail = bodyPreview ? bodyPreview.slice(0, 400) : void 0;
  if (status === 401 || status === 403) {
    return {
      kind: "auth",
      status: 502,
      message: "The AI gateway rejected this application\u2019s credentials.",
      detail
    };
  }
  if (status === 404) {
    return {
      kind: "model_not_found",
      status: 502,
      message: "The AI gateway does not know the requested model or combo.",
      detail
    };
  }
  if (status === 429) {
    return {
      kind: "rate_limit",
      status: 429,
      message: "The AI gateway is rate limiting requests. Please retry in a moment.",
      detail
    };
  }
  if (status === 400) {
    return {
      kind: "provider",
      status: 502,
      message: "The AI gateway rejected the request as invalid.",
      detail
    };
  }
  if (status >= 500) {
    return {
      kind: "provider",
      status: 502,
      message: "The AI gateway\u2019s upstream provider failed to complete the request.",
      detail
    };
  }
  return {
    kind: "provider",
    status: 502,
    message: `The AI gateway returned an unexpected status (${status}).`,
    detail
  };
}
async function generateWithOmniRoute(opts) {
  const env = getOmniRouteEnv();
  const { model, messages } = opts;
  if (!model || typeof model !== "string") {
    throw new OmniRouteError(
      "config",
      "No AI model was configured for this request.",
      500,
      "Pass a model/combo id or set OMNIROUTE_BLOG_MODEL / OMNIROUTE_DEFAULT_MODEL."
    );
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new OmniRouteError("provider", "The AI request contained no messages.", 502);
  }
  const url = `${env.baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeoutMs = opts.timeout_ms && opts.timeout_ms >= 1e3 ? opts.timeout_ms : env.timeoutMs;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        ...opts.temperature !== void 0 ? { temperature: opts.temperature } : {},
        ...opts.max_tokens !== void 0 ? { max_tokens: opts.max_tokens } : {},
        ...opts.top_p !== void 0 ? { top_p: opts.top_p } : {},
        ...opts.stream ? { stream: true } : {}
      }),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timer);
    const e = err;
    const isAbort = e.name === "AbortError" || String(e?.message || "").includes("abort");
    if (isAbort) {
      throw new OmniRouteError(
        "timeout",
        "The AI request timed out before the gateway responded.",
        504,
        `Aborted after ${timeoutMs}ms.`
      );
    }
    const causeCode = e.cause?.code || e.code || "";
    const causeMsg = e.cause?.message || "";
    throw new OmniRouteError(
      "unavailable",
      "The AI gateway could not be reached. It may be offline.",
      503,
      redactSecrets(`${causeCode ? `${causeCode} ` : ""}${causeMsg}`.trim())
    );
  }
  if (opts.stream) {
    if (!res.ok || !res.body) {
      clearTimeout(timer);
      const preview = await safeBodyPreview(res);
      const mapped = mapHttpStatus(res.status, preview);
      throw new OmniRouteError(mapped.kind, mapped.message, mapped.status, mapped.detail);
    }
    return { stream: true, body: res.body, content_type: res.headers.get("content-type") || "text/event-stream", status: res.status };
  }
  try {
    if (!res.ok) {
      const preview = await safeBodyPreview(res);
      const mapped = mapHttpStatus(res.status, preview);
      throw new OmniRouteError(mapped.kind, mapped.message, mapped.status, mapped.detail);
    }
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new OmniRouteError(
        "malformed",
        "The AI gateway returned a response that could not be parsed.",
        502,
        redactSecrets(text.slice(0, 200))
      );
    }
    const content = extractContent(json);
    const usageRaw = json.usage;
    const usage = usageRaw && typeof usageRaw === "object" ? usageRaw : null;
    return {
      stream: false,
      content,
      finish_reason: json.choices?.[0]?.finish_reason ?? null,
      model: json.model || model,
      usage
    };
  } finally {
    clearTimeout(timer);
  }
}
function extractContent(json) {
  const choices = json.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new OmniRouteError("malformed", "The AI gateway response had no completion choices.", 502);
  }
  const message = choices[0].message;
  const content = message && typeof message === "object" ? message.content : void 0;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new OmniRouteError("malformed", "The AI gateway response contained no message content.", 502);
  }
  return content;
}
async function safeBodyPreview(res) {
  try {
    const text = await res.text();
    return redactSecrets(text).slice(0, 400);
  } catch {
    return "";
  }
}

// lib/ai/blog.ts
function resolveBlogModel() {
  const blog = (process.env.OMNIROUTE_BLOG_MODEL || "").trim();
  if (blog) return { model: blog, source: "OMNIROUTE_BLOG_MODEL" };
  const shared = (process.env.OMNIROUTE_DEFAULT_MODEL || "").trim();
  if (shared) return { model: shared, source: "OMNIROUTE_DEFAULT_MODEL" };
  return { model: "auto", source: "fallback:auto-router" };
}
var LENGTH_HINTS = {
  short: "roughly 500-700 words",
  medium: "roughly 900-1200 words",
  long: "roughly 1500-2000 words"
};
function buildMessages(input) {
  const tone = input.tone || "professional";
  const length = LENGTH_HINTS[input.length || "medium"] || LENGTH_HINTS.medium;
  const category = (input.category || "").trim();
  const keywords = (input.keywords || []).map((k) => k.trim()).filter(Boolean).slice(0, 10);
  const system = {
    role: "system",
    content: [
      "You are the senior content strategist for BRANIFY, a luxury digital studio and futuristic technology agency based in Dubai that builds websites, AI tools and brand systems for ambitious businesses.",
      "You write publication-ready blog articles for the BRANIFY website: confident, precise, practical, lightly aspirational, never fluffy, never salesy.",
      "",
      "OUTPUT CONTRACT \u2014 respond with ONE JSON object and nothing else (no code fences, no commentary):",
      "{",
      '  "title": string,                     // 45-65 chars, no quotes inside',
      '  "slug": string,                      // kebab-case, ascii, 3-6 words',
      '  "excerpt": string,                   // <= 200 chars summary for cards + meta description',
      '  "content_markdown": string,          // the full article in markdown',
      '  "category": string,                  // one lowercase word or hyphenated phrase',
      '  "tags": string[],                    // 3-6 short topical tags',
      '  "seo": { "title": string, "description": string, "keywords": string[] }',
      "}",
      "",
      "CONTENT RULES:",
      "- Start the article with a ## H2 section. Do NOT repeat the title as an H1; the website renders the title separately.",
      "- Use ## for section headings and ### for sub-points, short paragraphs, - bullet lists where they help, **bold** for key phrases, and `code` sparingly.",
      "- Include one actionable framework, checklist or step list the reader can apply.",
      '- Close with a short "## Key Takeaways" list and a final paragraph that invites the reader to contact BRANIFY.',
      "- Do not invent statistics with fake precision. General industry knowledge is fine; specific numbers only when you are certain.",
      '- Write in en-US. No emoji. No placeholders like "[insert here]".',
      `- Target length: ${length}. Tone: ${tone}.`,
      category ? `- Primary category: "${category}".` : "",
      keywords.length ? `- Work these keywords in naturally: ${keywords.join(", ")}.` : "",
      input.notes ? `- Extra editor instructions: ${input.notes.slice(0, 400)}` : ""
    ].filter(Boolean).join("\n")
  };
  const user = {
    role: "user",
    content: `Write the article now. Topic: ${input.topic.trim()}`
  };
  return [system, user];
}
function slugify(input) {
  return input.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "ai-draft";
}
function extractJsonObject(raw) {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(text);
  } catch {
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
    }
  }
  throw new OmniRouteError(
    "malformed",
    "The AI draft came back in an unexpected format and could not be read.",
    502,
    redactSecrets(raw.slice(0, 200))
  );
}
function asString(v, fallback = "") {
  return typeof v === "string" ? v.trim() : fallback;
}
function asStringArray(v, max) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => asString(x)).filter(Boolean).slice(0, max);
}
function parseDraft(raw, model, modelSource, usage) {
  const obj = extractJsonObject(raw);
  const title = asString(obj.title);
  const content = asString(obj.content_markdown);
  if (title.length < 8) {
    throw new OmniRouteError("malformed", "The AI draft was missing a usable title.", 502);
  }
  if (content.length < 300) {
    throw new OmniRouteError("malformed", "The AI draft came back too short to publish.", 502);
  }
  const excerptRaw = asString(obj.excerpt);
  const excerpt = excerptRaw.length > 200 ? `${excerptRaw.slice(0, 197)}\u2026` : excerptRaw || `${content.replace(/[#*`>-]/g, "").trim().slice(0, 180)}\u2026`;
  const seoRaw = obj.seo && typeof obj.seo === "object" ? obj.seo : {};
  const seoKeywords = asStringArray(seoRaw.keywords, 10);
  const seoDescription = asString(seoRaw.description) || excerpt;
  const contentClean = content.replace(/^#\s+.+\n+/, "").trim();
  return {
    title,
    slug: slugify(asString(obj.slug) || title),
    excerpt,
    content: contentClean,
    category: (asString(obj.category) || "insights").toLowerCase(),
    tags: asStringArray(obj.tags, 8),
    author_name: "BRANIFY Team",
    author_role: "AI-assisted draft",
    seo: {
      title: asString(seoRaw.title) || title,
      description: seoDescription.length > 160 ? `${seoDescription.slice(0, 157)}\u2026` : seoDescription,
      keywords: seoKeywords
    },
    meta: { model, model_source: modelSource, usage }
  };
}
var BLOG_DRAFT_TIMEOUT_MS = 9e4;
var BLOG_MAX_TOKENS_DEFAULT = 3e3;
var BLOG_TEMPERATURE_DEFAULT = 0.7;
async function generateBlog(input) {
  const topic = (input.topic || "").trim();
  if (topic.length < 4) {
    throw new OmniRouteError("provider", "Please describe the article topic in at least a few words.", 400);
  }
  const { model, source } = resolveBlogModel();
  const maxTokensRaw = Number(process.env.OMNIROUTE_BLOG_MAX_TOKENS || "");
  const maxTokens = Number.isFinite(maxTokensRaw) && maxTokensRaw >= 256 ? maxTokensRaw : BLOG_MAX_TOKENS_DEFAULT;
  logSafe(`blog draft requested (model=${model}, source=${source}, topic length=${topic.length})`);
  const result = await generateWithOmniRoute({
    model,
    messages: buildMessages(input),
    temperature: BLOG_TEMPERATURE_DEFAULT,
    max_tokens: maxTokens,
    timeout_ms: BLOG_DRAFT_TIMEOUT_MS
    // no `stream` → parsed chat result (streaming is available via the same
    // function with { stream: true } when needed, no architectural change).
  });
  const draft = parseDraft(result.content, result.model, source, result.usage);
  logSafe(`blog draft generated (title length=${draft.title.length}, body chars=${draft.content.length})`);
  return draft;
}

// lib/ai/adminAuth.ts
var SB_URL = (process.env.SUPABASE_URL || "https://uspshkegxhrglbpxqtil.supabase.co").replace(/\/+$/, "");
var SB_ANON = process.env.SUPABASE_ANON_KEY || "sb_publishable_X11QDwMSfS2ivSePRVDpLQ_xNFY_8vw";
function adminAuthRequired() {
  return (process.env.OMNIROUTE_REQUIRE_AUTH || "").trim().toLowerCase() === "true";
}
function bearerToken(req) {
  const raw = req.headers?.authorization;
  const value = Array.isArray(raw) ? String(raw[0] || "") : String(raw || "");
  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match ? match[1].trim() : "";
}
async function requireAdminAuth(req) {
  if (!adminAuthRequired()) return null;
  const token = bearerToken(req);
  if (!token) {
    return new OmniRouteError(
      "unauthorized",
      "Sign in to BRANIFY Admin to use AI features.",
      401
    );
  }
  let identity;
  try {
    const uRes = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8e3)
    });
    if (!uRes.ok) {
      return new OmniRouteError(
        "unauthorized",
        "Your admin session is invalid or expired. Sign in again.",
        401
      );
    }
    const user = await uRes.json();
    if (!user?.email) {
      return new OmniRouteError(
        "unauthorized",
        "Your admin session is invalid or expired. Sign in again.",
        401
      );
    }
    identity = { id: user.id || user.email, email: user.email };
  } catch {
    return new OmniRouteError(
      "upstream",
      "Admin verification is temporarily unavailable. Try again shortly.",
      502
    );
  }
  try {
    const aRes = await fetch(
      `${SB_URL}/rest/v1/admin_users?email=eq.${encodeURIComponent(identity.email)}&select=email,active,role`,
      { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8e3) }
    );
    if (!aRes.ok) {
      return new OmniRouteError("upstream", "Admin verification failed.", 502);
    }
    const admins = await aRes.json();
    if (!admins.some((a) => a.active)) {
      return new OmniRouteError(
        "forbidden",
        "This account is not on the BRANIFY admin allowlist.",
        403
      );
    }
  } catch {
    return new OmniRouteError("upstream", "Admin verification failed.", 502);
  }
  return null;
}

// lib/ai/routes.ts
var MAX_BODY_BYTES = 64 * 1024;
async function readJsonBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      throw new OmniRouteError("provider", "The AI request body was too large.", 413);
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    throw new OmniRouteError("provider", "The AI request body was not valid JSON.", 400);
  }
}
function errorResult(err) {
  if (err instanceof OmniRouteError) {
    return {
      status: err.status,
      json: { ok: false, error: { kind: err.kind, message: err.message, ...err.detail ? { detail: err.detail } : {} } }
    };
  }
  logSafe("unhandled error:", err instanceof Error ? redactSecrets(`${err.name}: ${err.message}`) : String(err));
  return {
    status: 500,
    json: { ok: false, error: { kind: "internal", message: "Something went wrong while handling the AI request." } }
  };
}
function okResult(status, json) {
  return { status, json: { ok: true, ...json } };
}
function requireMethod(req, method) {
  if (!req.method || req.method.toUpperCase() !== method) {
    return new OmniRouteError("provider", "Method not allowed for this AI endpoint.", 405);
  }
  return null;
}
async function handleAiBlog(req) {
  const methodErr = requireMethod(req, "POST");
  if (methodErr) return errorResult(methodErr);
  const authErr = await requireAdminAuth(req);
  if (authErr) return errorResult(authErr);
  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return errorResult(err);
  }
  const input = {
    topic: typeof body.topic === "string" ? body.topic : "",
    category: typeof body.category === "string" ? body.category : void 0,
    tone: typeof body.tone === "string" ? body.tone : void 0,
    keywords: Array.isArray(body.keywords) ? body.keywords.map(String) : void 0,
    length: ["short", "medium", "long"].includes(body.length) ? body.length : void 0,
    notes: typeof body.notes === "string" ? body.notes : void 0
  };
  try {
    const draft = await generateBlog(input);
    return okResult(200, { draft });
  } catch (err) {
    return errorResult(err);
  }
}
function sendJson(res, result) {
  if (res.headersSent) return;
  const body = JSON.stringify(result.json);
  res.writeHead(result.status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

// server/ai/blog.ts
async function handler(req, res) {
  try {
    sendJson(res, await handleAiBlog(req));
  } catch (err) {
    sendJson(res, {
      status: 500,
      json: { ok: false, error: { kind: "internal", message: "Something went wrong while handling the AI request." } }
    });
    void err;
  }
}
export {
  handler as default
};
