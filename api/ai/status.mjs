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
async function getOmniRouteStatus(probe = false) {
  let env;
  try {
    env = getOmniRouteEnv();
  } catch (err) {
    const e = err;
    return {
      configured: false,
      base_url_set: Boolean((process.env.OMNIROUTE_BASE_URL || "").trim()),
      api_key_set: Boolean((process.env.OMNIROUTE_API_KEY || "").trim()),
      reachable: null,
      models: null,
      error_kind: e.kind || "config"
    };
  }
  const info = {
    configured: true,
    base_url_set: true,
    api_key_set: true,
    reachable: null,
    models: null,
    error_kind: null
  };
  if (!probe) return info;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4e3);
  try {
    const res = await fetch(`${env.baseUrl}/models`, {
      headers: { "Authorization": `Bearer ${env.apiKey}` },
      signal: controller.signal
    });
    if (res.ok) {
      const json = await res.json();
      info.reachable = true;
      info.models = Array.isArray(json?.data) ? json.data.map((m) => typeof m?.id === "string" ? m.id : "").filter(Boolean).slice(0, 40) : [];
    } else {
      info.reachable = true;
      info.error_kind = res.status === 401 || res.status === 403 ? "auth" : "provider";
    }
  } catch {
    info.reachable = false;
    info.error_kind = "unavailable";
  } finally {
    clearTimeout(timer);
  }
  return info;
}

// lib/ai/blog.ts
function resolveBlogModel() {
  const blog = (process.env.OMNIROUTE_BLOG_MODEL || "").trim();
  if (blog) return { model: blog, source: "OMNIROUTE_BLOG_MODEL" };
  const shared = (process.env.OMNIROUTE_DEFAULT_MODEL || "").trim();
  if (shared) return { model: shared, source: "OMNIROUTE_DEFAULT_MODEL" };
  return { model: "auto", source: "fallback:auto-router" };
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
async function handleAiStatus(req) {
  const methodErr = requireMethod(req, "GET");
  if (methodErr) return errorResult(methodErr);
  const authErr = await requireAdminAuth(req);
  if (authErr) return errorResult(authErr);
  const url = new URL(req.url || "/", "http://local");
  const probe = url.searchParams.get("probe") === "1";
  const info = await getOmniRouteStatus(probe);
  const blog = resolveBlogModel();
  return okResult(200, {
    gateway: "omniroute",
    configured: info.configured,
    base_url_set: info.base_url_set,
    api_key_set: info.api_key_set,
    reachable: info.reachable,
    models: info.models,
    error_kind: info.error_kind,
    blog_model_set: Boolean((process.env.OMNIROUTE_BLOG_MODEL || "").trim()),
    blog_model_source: blog.source,
    // The combo name is configuration metadata, not a secret — it lets the
    // admin verify the right combo is wired without exposing any key.
    blog_model: blog.model
  });
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

// server/ai/status.ts
async function handler(req, res) {
  try {
    sendJson(res, await handleAiStatus(req));
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
