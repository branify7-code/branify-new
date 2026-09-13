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
  short: "800-1500 words (announcement / news / update depth \u2014 use only when the topic is genuinely simple)",
  medium: "1800-2600 words (standard educational depth)",
  long: "2500-3500 words (comprehensive pillar depth)"
};
var MIN_WORDS = { short: 800, medium: 1800, long: 2500 };
var INTERNAL_LINK_WHITELIST = [
  "/services",
  "/services/website-development",
  "/templates",
  "/tools",
  "/ai-tools",
  "/portfolio",
  "/about",
  "/contact",
  "/blog"
];
function buildMessages(input) {
  const tone = input.tone || "professional";
  const length = LENGTH_HINTS[input.length || "medium"] || LENGTH_HINTS.medium;
  const minWords = MIN_WORDS[input.length || "medium"] || MIN_WORDS.medium;
  const category = (input.category || "").trim();
  const keywords = (input.keywords || []).map((k) => k.trim()).filter(Boolean).slice(0, 10);
  const system = {
    role: "system",
    content: [
      "You are the BRANIFY Blog Engine: part SEO content strategist, part researcher, part editor, part writer. BRANIFY is a luxury digital studio and futuristic technology agency based in Dubai that builds websites, AI tools and brand systems for ambitious businesses.",
      "You write publication-ready, search-intent-aligned articles for the BRANIFY blog. You are NOT a generic AI blog generator: usefulness beats keyword density and word count, always.",
      "",
      "BEFORE WRITING (silently, no preamble in the output):",
      "- Determine the primary search intent (informational / commercial investigation / educational / comparison / tool guide) and what the reader actually wants to learn or decide.",
      "- List the secondary questions a reader will likely want answered after the main one.",
      "- Decide the subtopics, a practical example or two, and where BRANIFY genuinely fits (it usually fits only in one or two places \u2014 not everywhere).",
      "",
      "STRUCTURE:",
      "- Begin with a ## section (the website renders the title itself; never add an H1).",
      "- First 100-150 words: establish the problem or question, give context, and state what the reader will learn. No throat-clearing.",
      "- If the topic is a question, give a concise direct answer near the top, then expand with details, exceptions and practical guidance.",
      "- Use ## and ### in a logical hierarchy; headings describe what the section contains (never keyword-stuffed).",
      "- Short paragraphs (2-4 sentences). Include at least one actionable framework, checklist or step list the reader can apply.",
      "- Include a small markdown comparison table ONLY when it genuinely aids a decision (features, costs, options, trade-offs). Tables must be short and mobile-friendly.",
      '- Add a "## FAQ" section near the end: 6-10 real user-intent questions with concise answers that do NOT merely repeat the article.',
      '- Close with "## Key Takeaways" (short bullet list) and a final paragraph with ONE natural next step that fits the topic (read a related guide, explore templates/tools, or contact BRANIFY). Never "In conclusion..." / "To sum up...".',
      "",
      "VOICE AND STYLE (write like an experienced human editor):",
      `- Tone: ${tone}. Write in en-US. No emoji. No placeholders like "[insert here]".`,
      "- Clear sentences with varied lengths. Concrete examples over abstractions. Useful transitions.",
      `- BANNED phrasings unless genuinely appropriate: "In today's fast-paced digital world", "Whether you're a ... looking to", "Unlock the power of", "Revolutionize your", "Game-changing", "Cutting-edge", "Welcome to our latest blog".`,
      "- Original analysis and structure only: do not mirror competitor articles or rewrite search snippets sentence-by-sentence.",
      "",
      "FACTUAL DISCIPLINE (non-negotiable):",
      "- Never invent statistics, studies, quotes, client names, testimonials, awards, partnerships or market-share figures.",
      '- If a figure is uncertain, write it as an approximate illustrative range ("typically", "often") or omit it.',
      "- For fast-changing facts (pricing, features, policies), say the reader should check the official source for the latest details.",
      "",
      "INTERNAL LINKS (markdown only, to REAL pages that exist on branify.store):",
      `- Allowed targets exactly: ${INTERNAL_LINK_WHITELIST.join(", ")}. No other paths, no made-up URLs.`,
      "- Use 3-8 contextual links in a long article, only where they genuinely help the reader continue (e.g. a website-cost article linking to BRANIFY's website development service or templates).",
      `- Anchor text must be descriptive ("explore BRANIFY's website templates"), never "click here".`,
      "",
      "BRAND RATIO:",
      "- 80-90% genuinely useful content, 10-20% brand relevance. BRANIFY is introduced naturally where it truly helps; educational sections must stand on their own even if the reader never clicks a BRANIFY link.",
      "",
      "OUTPUT CONTRACT \u2014 respond with ONE JSON object and nothing else (no code fences, no commentary):",
      "{",
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
      "  }",
      "}",
      "",
      "LENGTH AND DEPTH:",
      `- Target length: ${length}. Depth must match search intent \u2014 never pad to hit a number, never stay thin when the topic needs depth.`,
      category ? `- Primary category: "${category}".` : "",
      keywords.length ? `- Candidate keywords (weave in naturally where relevant; the first is the focus keyword): ${keywords.join(", ")}.` : "",
      input.notes ? `- Extra editor instructions: ${input.notes.slice(0, 400)}` : "",
      "",
      "MANDATORY SELF-CHECK \u2014 run silently before responding; a draft failing any item is NOT acceptable, fix it and only then output the JSON:",
      `- The article body contains at least ${minWords} words of substantive content. If your draft is shorter, deepen the weakest sections with concrete examples, specifics and short explanations \u2014 never filler or repetition.`,
      '- A "## FAQ" section exists with AT LEAST 6 questions (### per question), each answered concisely in 1-3 sentences without repeating the article body.',
      '- "## Key Takeaways" exists; there is no H1; every internal link points ONLY to the allowed targets.'
    ].filter(Boolean).join("\n")
  };
  const user = {
    role: "user",
    content: `Write the article now. Topic: ${input.topic.trim()}`
  };
  return [system, user];
}
function buildRevisionMessages(input, draft, minWords) {
  const system = {
    role: "system",
    content: [
      "You are the BRANIFY Blog Engine editor-in-chief. You revise drafts to meet the publication standard. Same rules as the original brief: en-US, no emoji, no invented statistics, no H1, ##/### markdown structure.",
      "The previous draft FAILED one or more mandatory checks: it is too short and/or it lacks at least 3 contextual internal links to allowed BRANIFY pages.",
      `- Expand the body to at least ${minWords} words by deepening the weakest sections: add concrete examples, practical specifics, short explanations, and useful transitions. Do NOT pad with repetition or filler.`,
      '- Weave in at least 3 markdown internal links where they genuinely help the reader continue. Allowed targets ONLY: /services, /services/website-development, /templates, /tools, /ai-tools, /portfolio, /about, /contact, /blog. Descriptive anchor text, never "click here".',
      '- Keep the "## FAQ" section (6+ questions) and "## Key Takeaways". Keep any comparison table.',
      "",
      "OUTPUT CONTRACT \u2014 return the FULL revised article as ONE JSON object (same shape as the original; no code fences, no commentary):",
      '{ "title": string, "slug": string, "excerpt": string (<=200 chars), "content_markdown": string, "category": string, "tags": string[], "seo": { "title": string, "description": string (140-160 chars), "keywords": string[] } }'
    ].join("\n")
  };
  const user = {
    role: "user",
    content: [
      `Original topic: ${input.topic.trim()}`,
      "",
      "Previous draft (revise and return the FULL JSON):",
      JSON.stringify({ title: draft.title, slug: draft.slug, excerpt: draft.excerpt, content_markdown: draft.content, category: draft.category, tags: draft.tags, seo: draft.seo })
    ].join("\n")
  };
  return [system, user];
}
function countWords(md) {
  return md.replace(/[#*`>|_\-[\]]/g, " ").split(/\s+/).filter(Boolean).length;
}
function countInternalLinks(md) {
  return (md.match(/\]\(\/[^)]*\)/g) || []).length;
}
function pickRelatedLinks(draft) {
  const hay = `${draft.category} ${draft.tags.join(" ")} ${draft.content.slice(0, 3e3)}`.toLowerCase();
  const links = [];
  if (/website|web |landing page|site|wordpress|develop/.test(hay)) {
    links.push({ href: "/services/website-development", label: "explore BRANIFY's website development services for a custom, conversion-focused build" });
    links.push({ href: "/templates", label: "browse BRANIFY's website templates to launch faster on a smaller budget" });
  }
  if (/ai|automation|chatbot|tool/.test(hay)) {
    links.push({ href: "/ai-tools", label: "explore BRANIFY's AI tools directory for practical, ready-to-use options" });
  }
  if (/seo|marketing|content|traffic|conversion/.test(hay)) {
    links.push({ href: "/tools", label: "use BRANIFY's free tools to audit and improve your site" });
  }
  links.push({ href: "/blog", label: "read more BRANIFY guides on planning, building and growing your website" });
  return links.slice(0, 4);
}
function ensureInternalLinks(draft) {
  if (countInternalLinks(draft.content) >= 2) return draft;
  const items = pickRelatedLinks(draft).map((l) => `- [${l.label}](/${l.href.replace(/^\//, "")})`).join("\n");
  const block = `

## Continue with BRANIFY

${items}
`;
  return { ...draft, content: `${draft.content}${block}` };
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
var BLOG_DRAFT_TIMEOUT_MS = 15e4;
var BLOG_MAX_TOKENS_DEFAULT = 6500;
var BLOG_TEMPERATURE_DEFAULT = 0.7;
async function generateBlog(input) {
  const topic = (input.topic || "").trim();
  if (topic.length < 4) {
    throw new OmniRouteError("provider", "Please describe the article topic in at least a few words.", 400);
  }
  const { model, source } = resolveBlogModel();
  const maxTokensRaw = Number(process.env.OMNIROUTE_BLOG_MAX_TOKENS || "");
  const maxTokens = Number.isFinite(maxTokensRaw) && maxTokensRaw >= 256 ? maxTokensRaw : BLOG_MAX_TOKENS_DEFAULT;
  const expandEnabled = (process.env.OMNIROUTE_BLOG_EXPAND || "true").trim().toLowerCase() !== "false";
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
  let draft = parseDraft(result.content, result.model, source, result.usage);
  const floor = MIN_WORDS[input.length || "medium"] || MIN_WORDS.medium;
  if (expandEnabled && (countWords(draft.content) < floor || countInternalLinks(draft.content) < 2)) {
    logSafe(`blog draft below spec (words=${countWords(draft.content)}, floor=${floor}, links=${countInternalLinks(draft.content)}) \u2014 one expansion pass`);
    try {
      const revision = await generateWithOmniRoute({
        model,
        messages: buildRevisionMessages(input, draft, floor),
        temperature: BLOG_TEMPERATURE_DEFAULT,
        max_tokens: maxTokens,
        timeout_ms: BLOG_DRAFT_TIMEOUT_MS
      });
      const redraft = parseDraft(revision.content, revision.model, source, revision.usage);
      if (countWords(redraft.content) > countWords(draft.content)) {
        draft = redraft;
        logSafe(`blog draft expanded (words=${countWords(draft.content)}, links=${countInternalLinks(draft.content)})`);
      }
    } catch (err) {
      logSafe(`blog expansion pass skipped (${err instanceof Error ? err.message : "unknown"})`);
    }
  }
  draft = ensureInternalLinks(draft);
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
