/* GENERATED FILE — do not edit by hand. Source: server/* (see scripts/build-api.mjs). Regenerate with `npm run api:build`. */

// server/meta/start.ts
import crypto from "node:crypto";
var maxDuration = 30;
var CORS_ORIGINS = [
  "https://branify.store",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
  "http://127.0.0.1:4173"
];
var DEFAULT_REDIRECT_URI = "https://branify.store/api/meta/oauth/callback";
var ADMIN_ORIGIN = (process.env.APP_URL || "https://branify.store").replace(/\/+$/, "");
var SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "business_management"
].join(",");
function graphVersion() {
  const v = (process.env.META_GRAPH_API_VERSION || "v22.0").trim();
  return /^v\d+\.\d+$/.test(v) ? v : "v22.0";
}
function redirectUri() {
  return (process.env.META_REDIRECT_URI || DEFAULT_REDIRECT_URI).trim();
}
function q(req, name) {
  const raw = req.query instanceof URLSearchParams ? req.query.get(name) : req.query?.[name];
  const val = Array.isArray(raw) ? raw[0] : raw;
  return (val || "").toString();
}
function cors(origin, res) {
  if (CORS_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}
function redirectTo(res, path) {
  res.setHeader("Location", `${ADMIN_ORIGIN}${path}`);
  res.status(302).send("");
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
    if (method !== "GET") {
      res.status(405).json({ ok: false, error: { code: "bad_request", message: "Use GET." } });
      return;
    }
    const platform = q(req, "platform") === "instagram" ? "instagram" : "facebook";
    const appId = (process.env.META_APP_ID || "").trim();
    const appSecret = (process.env.META_APP_SECRET || "").trim();
    if (!appId || !appSecret) {
      redirectTo(res, "/admin/social?connect_error=not_configured");
      return;
    }
    const random = crypto.randomBytes(24).toString("hex");
    const sig = crypto.createHmac("sha256", appSecret).update(random).digest("hex");
    const state = `${random}.${sig}`;
    const cookieBase = "Path=/; Max-Age=600; Secure; HttpOnly; SameSite=Lax";
    res.setHeader("Set-Cookie", [
      `meta_oauth_state=${state}; ${cookieBase}`,
      `meta_oauth_platform=${platform}; ${cookieBase}`
    ]);
    const url = `https://www.facebook.com/${graphVersion()}/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri())}&state=${encodeURIComponent(state)}&response_type=code&scope=${encodeURIComponent(SCOPES)}`;
    res.setHeader("Location", url);
    res.status(302).send("");
  } catch {
    redirectTo(res, "/admin/social?connect_error=server_error");
  }
}
export {
  handler as default,
  maxDuration
};
