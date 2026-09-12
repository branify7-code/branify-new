/* GENERATED FILE — do not edit by hand. Source: server/* (see scripts/build-api.mjs). Regenerate with `npm run api:build`. */

// server/admin-ai/image-generate.ts
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
var SB_SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
var ImgError = class extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code;
    this.status = status;
  }
};
var ASPECTS = ["auto", "1:1", "4:5", "16:9", "9:16"];
var SIZES = ["1K", "2K", "4K"];
var STYLES = ["auto", "professional", "editorial", "3d", "photorealistic", "minimal"];
async function verifyAdmin(token) {
  if (!token) throw new ImgError("unauthorized", 401, "Sign in to BRANIFY Admin to generate images.");
  const uRes = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } });
  if (!uRes.ok) throw new ImgError("unauthorized", 401, "Your admin session is invalid or expired. Sign in again.");
  const user = await uRes.json();
  if (!user?.email) throw new ImgError("unauthorized", 401, "Your admin session is invalid or expired. Sign in again.");
  const aRes = await fetch(
    `${SB_URL}/rest/v1/admin_users?email=eq.${encodeURIComponent(user.email)}&select=email,active,role`,
    { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } }
  );
  if (!aRes.ok) throw new ImgError("upstream", 502, "Admin verification failed.");
  const admins = await aRes.json();
  if (!admins.some((a) => a.active)) throw new ImgError("forbidden", 403, "This account is not on the BRANIFY admin allowlist.");
  return { id: user.id || user.email, email: user.email };
}
var rateBuckets = /* @__PURE__ */ new Map();
var RATE_WINDOW_MS = 60 * 60 * 1e3;
var IMAGE_RATE_MAX = 12;
function checkRate(key) {
  const now = Date.now();
  const arr = (rateBuckets.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= IMAGE_RATE_MAX) {
    throw new ImgError("rate_limited", 429, `Image generation limit reached (${IMAGE_RATE_MAX} per hour). Try again later.`);
  }
  arr.push(now);
  rateBuckets.set(key, arr);
  if (rateBuckets.size > 500) {
    for (const [k, v] of rateBuckets) if (v.every((t) => now - t >= RATE_WINDOW_MS)) rateBuckets.delete(k);
  }
}
var IMAGE_BASE = "https://generativelanguage.googleapis.com/v1beta";
function imageModel() {
  return (process.env.IMAGE_AI_MODEL || "gemini-3.1-flash-image").trim();
}
function imageApiKey() {
  const key = (process.env.IMAGE_AI_API_KEY || process.env.GEMINI_API_KEY || "").trim();
  if (!key) {
    throw new ImgError("not_configured", 503, "Image generation is not configured yet. Add GEMINI_API_KEY to the server environment variables, then redeploy.");
  }
  return key;
}
function textConfig() {
  const name = (process.env.AI_PROVIDER || "glm").toLowerCase().trim();
  const defaults = {
    glm: { url: "https://api.z.ai/api/paas/v4", model: "glm-4.6" },
    openai: { url: "https://api.openai.com/v1", model: "gpt-4o" },
    gemini: { url: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.5-flash" },
    gateway: { url: "https://ai-gateway.vercel.sh/v1", model: "zai/glm-4.6" },
    custom: { url: "", model: "" }
  };
  const d = defaults[name] || defaults.custom;
  const url = (process.env.AI_API_BASE_URL || d.url).replace(/\/+$/, "");
  const key = (process.env.AI_API_KEY || (name === "gemini" ? process.env.GEMINI_API_KEY : "") || "").trim();
  const model = (process.env.AI_MODEL || d.model).trim();
  return { url, key, model };
}
async function chatOnce(system, user, maxTokens) {
  const cfg = textConfig();
  if (!cfg.key || !cfg.url || !cfg.model) throw new ImgError("not_configured", 503, "Text AI is not configured (needed for prompt crafting / alt text).");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3e4);
  try {
    const res = await fetch(`${cfg.url}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        temperature: 0.4,
        max_tokens: maxTokens,
        stream: false
      }),
      signal: ctrl.signal
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.choices?.[0]?.message?.content) {
      throw new ImgError("upstream", 502, (json.error?.message || `Text model HTTP ${res.status}`).slice(0, 200));
    }
    return (json.choices[0].message?.content || "").trim();
  } finally {
    clearTimeout(timer);
  }
}
var STYLE_SUFFIX = {
  auto: "",
  professional: "Clean professional composition, premium studio lighting, corporate polish.",
  editorial: "High-end editorial magazine art direction, sophisticated layout energy.",
  "3d": "Premium 3D render, soft global illumination, physically based materials, tasteful depth.",
  photorealistic: "Photorealistic, shallow depth of field, 85mm lens character, natural light.",
  minimal: "Minimalist composition, generous negative space, restrained palette."
};
var BRAND_BASE = "Premium, modern, visually striking and clean \u2014 befitting BRANIFY, a digital agency. Sophisticated dark visual language when appropriate with subtle luxury-gold accents; high contrast, polished, realistic photography or premium 3D depending on the subject.";
var NEGATIVES = "Avoid: childish graphics, random stock-photo appearance, generic templates, cluttered layouts, excessive text, spelling errors in any visible text, fake UI screenshots, fake statistics, fake third-party logos, distorted hands or faces, unnecessary people, watermarks, excessive branding.";
function buildFinalPrompt(prompt, style) {
  const parts = [prompt.trim(), BRAND_BASE];
  const s = STYLE_SUFFIX[style];
  if (s) parts.push(s);
  parts.push(NEGATIVES);
  parts.push(
    'If and only if the description calls for text in the image: keep it to one short headline (for example "BUILD. BRAND. GROW." or "Your Website Is Your First Impression"), render the exact wording with correct spelling and clean typographic hierarchy \u2014 no other copy.'
  );
  return parts.join(" ").slice(0, 6e3);
}
async function craftImagePrompt(brief) {
  const out = await chatOnce(
    "You are BRANIFY\u2019s senior art director and social media creative strategist. Turn the given brief into ONE vivid image-generation prompt (60-110 words). Describe subject, composition, lighting, mood, palette (dark cinematic with subtle luxury-gold accents when fitting for a premium digital agency). No in-image text unless the brief explicitly demands it, then specify the exact short headline. Output ONLY the prompt text.",
    brief.slice(0, 1200),
    300
  );
  return out.replace(/^["'\s]+|["'\s]+$/g, "").slice(0, 1800);
}
async function craftAltText(prompt) {
  try {
    const out = await chatOnce(
      'Write ONE natural alt-text sentence (max 140 characters) describing the visual an image model would produce from the given prompt. Plain language, no keyword stuffing, do not start with "image of", no unsupported claims. Output ONLY the sentence.',
      prompt.slice(0, 1200),
      80
    );
    const clean = out.replace(/^["'\s]+|["'\s]+$/g, "").replace(/\s+/g, " ");
    if (clean && clean.length >= 12) return clean.slice(0, 220);
  } catch {
  }
  const fallback = prompt.replace(/\s+/g, " ").trim();
  return fallback.length > 160 ? `${fallback.slice(0, 157)}\u2026` : fallback || "AI-generated brand visual";
}
async function callGeminiImage(model, apiKey, prompt, aspect, size) {
  const call = async (withImageConfig) => {
    const generationConfig = { responseModalities: ["TEXT", "IMAGE"] };
    if (withImageConfig) generationConfig.imageConfig = { aspectRatio: aspect, imageSize: size };
    const res = await fetch(`${IMAGE_BASE}/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig }),
      signal: AbortSignal.timeout(1e5)
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  };
  let out = await call(true);
  if (out.status === 400 && /imageConfig|imageSize|aspectRatio|Unknown name/i.test(JSON.stringify(out.body).slice(0, 600))) {
    out = await call(false);
  }
  const providerMsg = (() => {
    const err = out.body.error || {};
    return (err.message || "").slice(0, 220);
  })();
  if (out.status === 404) {
    throw new ImgError("model_unavailable", 502, `The image model "${model}" is not available for this API key. ${providerMsg || "Check IMAGE_AI_MODEL in the server environment."}`.trim());
  }
  if (out.status === 429) {
    throw new ImgError("quota", 429, `Image generation hit the provider quota. ${providerMsg || "Wait a minute and try again."}`.trim());
  }
  if (out.status !== 200) {
    const msg = JSON.stringify(out.body).slice(0, 200);
    console.error("[ai-image] gemini error", out.status, msg);
    throw new ImgError("provider", 502, `Image generation is temporarily unavailable. Please try again.${providerMsg ? ` Provider said: ${providerMsg}` : ""}`);
  }
  const candidates = out.body.candidates || [];
  const parts = candidates[0]?.content?.parts || [];
  const imgPart = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
  const b64 = imgPart?.inlineData?.data || imgPart?.inline_data?.data || "";
  const mime = (imgPart?.inlineData?.mimeType || imgPart?.inline_data?.mime_type || "image/png").toLowerCase();
  if (!b64) {
    const textOut = parts.map((p) => p.text || "").join(" ").slice(0, 160);
    console.error("[ai-image] no image part in response", textOut);
    throw new ImgError("malformed", 502, "The image model returned no visual. Rephrase the prompt and try again.");
  }
  const buf = Buffer.from(b64, "base64");
  if (buf.length < 1e3) throw new ImgError("malformed", 502, "The generated image was empty or corrupt. Try again.");
  if (buf.length > 10 * 1024 * 1024) throw new ImgError("oversized", 502, "The generated image exceeded the size limit. Try a smaller image size.");
  if (!/^image\/(png|jpeg|webp)$/.test(mime)) throw new ImgError("bad_mime", 502, `The model returned an unsupported media type (${mime}).`);
  return { data: buf, mime };
}
function probeDimensions(buf, mime) {
  try {
    if (mime === "image/png" && buf.length > 24 && buf.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (mime === "image/jpeg") {
      let off = 2;
      while (off + 9 < buf.length) {
        if (buf[off] !== 255) {
          off++;
          continue;
        }
        const marker = buf[off + 1];
        if (marker >= 192 && marker <= 207 && marker !== 196 && marker !== 200 && marker !== 204) {
          return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
        }
        const len = buf.readUInt16BE(off + 2);
        off += 2 + len;
      }
    }
  } catch {
  }
  return null;
}
var ASPECT_FALLBACK = {
  "1:1": [1024, 1024],
  "4:5": [1024, 1280],
  "16:9": [1280, 720],
  "9:16": [720, 1280]
};
function resolveAspect(aspect, platform, purpose) {
  if (aspect !== "auto") return aspect;
  if (purpose === "blog") return "16:9";
  if (platform === "instagram") return "4:5";
  if (platform === "facebook") return "1:1";
  return "1:1";
}
function sbServiceHeaders(extra = {}) {
  if (!SB_SERVICE) throw new ImgError("server_error", 503, "Service role key is not configured on the server.");
  return { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`, ...extra };
}
function slugOf(text, fallback) {
  const s = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return s || fallback;
}
async function uploadToMediaBucket(buf, mime, filename) {
  const ext = mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png";
  const storagePath = `ai/${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}/${Date.now()}-${slugOf(filename, "branify-ai")}.${ext}`;
  const up = await fetch(`${SB_URL}/storage/v1/object/media/${storagePath}`, {
    method: "POST",
    headers: sbServiceHeaders({ "Content-Type": mime }),
    body: new Uint8Array(buf),
    signal: AbortSignal.timeout(6e4)
  });
  if (!up.ok) {
    const t = (await up.text()).slice(0, 200);
    console.error("[ai-image] storage upload failed", up.status, t);
    throw new ImgError("storage", 502, "The image was generated but could not be saved to the media library. Try again.");
  }
  return { publicUrl: `${SB_URL}/storage/v1/object/public/media/${storagePath}`, storagePath };
}
async function insertMediaAsset(row) {
  const doInsert = async (payload) => fetch(`${SB_URL}/rest/v1/media_assets?select=id`, {
    method: "POST",
    headers: sbServiceHeaders({ "Content-Type": "application/json", Prefer: "return=representation" }),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(2e4)
  });
  let res = await doInsert(row);
  if (!res.ok && res.status === 400) {
    const { source: _s, metadata: _m, ...rest } = row;
    res = await doInsert(rest);
  }
  if (!res.ok) {
    const t = (await res.text()).slice(0, 200);
    console.error("[ai-image] media_assets insert failed", res.status, t);
    throw new ImgError("storage", 502, "The image was stored but the media library entry could not be created.");
  }
  const rows = await res.json();
  return rows[0]?.id || "";
}
async function logActivity(email, mediaId, meta) {
  try {
    await fetch(`${SB_URL}/rest/v1/activity_log`, {
      method: "POST",
      headers: sbServiceHeaders({ "Content-Type": "application/json", Prefer: "return=minimal" }),
      body: JSON.stringify({
        user_id: null,
        user_email: email || "system",
        action: "ai.image",
        target_type: "media_asset",
        target_id: mediaId,
        meta
      }),
      signal: AbortSignal.timeout(15e3)
    });
  } catch {
  }
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
async function handler(req, res) {
  const h = req.headers || {};
  const origin = String((Array.isArray(h.origin) ? h.origin[0] : h.origin) || "");
  const started = Date.now();
  try {
    cors(origin, res);
    const method = String(req.method || "GET").toUpperCase();
    if (method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (method !== "POST") throw new ImgError("bad_request", 405, "Use POST.");
    const admin = await verifyAdmin(bearerOf(req));
    checkRate(`image:${admin.email}`);
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const aspectRaw = String(body.aspectRatio || "auto");
    const sizeRaw = String(body.imageSize || "1K").toUpperCase();
    const styleRaw = String(body.visualStyle || "auto").toLowerCase();
    const request = {
      prompt: String(body.prompt || "").slice(0, 4e3).trim(),
      brief: String(body.brief || "").slice(0, 2e3).trim(),
      aspectRatio: ASPECTS.includes(aspectRaw) ? aspectRaw : "auto",
      imageSize: SIZES.includes(sizeRaw) ? sizeRaw : "1K",
      purpose: ["social_post", "blog", "manual"].includes(String(body.purpose)) ? String(body.purpose) : "manual",
      platform: ["facebook", "instagram", "both"].includes(String(body.platform)) ? String(body.platform) : "both",
      visualStyle: STYLES.includes(styleRaw) ? styleRaw : "auto"
    };
    if (!request.prompt && !request.brief) {
      throw new ImgError("bad_request", 400, "Describe the visual you need (prompt) or give a brief to craft one.");
    }
    let promptUsed = request.prompt;
    if (!promptUsed) promptUsed = await craftImagePrompt(request.brief);
    const finalPrompt = buildFinalPrompt(promptUsed, request.visualStyle);
    const model = imageModel();
    const key = imageApiKey();
    const aspect = resolveAspect(request.aspectRatio, request.platform, request.purpose);
    const img = await callGeminiImage(model, key, finalPrompt, aspect, request.imageSize);
    const dims = probeDimensions(img.data, img.mime) || (() => {
      const [w, hh] = ASPECT_FALLBACK[aspect] || ASPECT_FALLBACK["1:1"];
      return { width: w, height: hh };
    })();
    const altText = await craftAltText(promptUsed);
    const { publicUrl, storagePath } = await uploadToMediaBucket(img.data, img.mime, promptUsed);
    const mediaId = await insertMediaAsset({
      filename: storagePath.split("/").pop(),
      url: publicUrl,
      alt: altText,
      width: dims.width,
      height: dims.height,
      size_bytes: img.data.length,
      mime: img.mime,
      source: "ai",
      metadata: {
        provider: "gemini",
        model,
        purpose: request.purpose,
        platform: request.platform,
        aspect_ratio: aspect,
        image_size: request.imageSize,
        visual_style: request.visualStyle,
        prompt: promptUsed.slice(0, 1e3),
        created_by: admin.email
      }
    });
    await logActivity(admin.email, mediaId, {
      model,
      provider: "gemini",
      purpose: request.purpose,
      platform: request.platform,
      aspect_ratio: aspect,
      image_size: request.imageSize,
      size_bytes: img.data.length,
      duration_ms: Date.now() - started,
      media_id: mediaId,
      storage_path: storagePath
    });
    res.status(200).json({
      ok: true,
      data: {
        imageUrl: publicUrl,
        storagePath,
        mimeType: img.mime,
        width: dims.width,
        height: dims.height,
        prompt: promptUsed,
        altText,
        provider: "gemini",
        model,
        filename: String(storagePath.split("/").pop() || ""),
        sizeBytes: img.data.length,
        mediaId,
        durationMs: Date.now() - started
      }
    });
  } catch (e) {
    if (e instanceof ImgError) {
      res.status(e.status).json({ ok: false, error: { code: e.code, message: e.message } });
      return;
    }
    const aborted = e instanceof Error && (e.name === "AbortError" || /abort|timeout/i.test(e.message || ""));
    const ref = crypto.randomUUID().slice(0, 8);
    console.error(`[ai-image:${ref}]`, e instanceof Error ? e.message : e);
    res.status(aborted ? 504 : 500).json({
      ok: false,
      error: { code: aborted ? "timeout" : "internal", message: aborted ? "Image generation took too long and was stopped. Try again." : `Image generation failed unexpectedly (ref ${ref}).` }
    });
  }
}
export {
  handler as default,
  maxDuration
};
