/* GENERATED FILE — do not edit by hand. Source: server/* (see scripts/build-api.mjs). Regenerate with `npm run api:build`. */

// server/social/connect-token.ts
import crypto from "node:crypto";
var maxDuration = 30;
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
var ConnError = class extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code;
    this.status = status;
  }
};
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
async function verifyAdmin(token) {
  if (!token) throw new ConnError("unauthorized", 401, "Sign in to BRANIFY Admin first.");
  const uRes = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } });
  if (!uRes.ok) throw new ConnError("unauthorized", 401, "Your admin session is invalid or expired. Sign in again.");
  const user = await uRes.json();
  if (!user?.email) throw new ConnError("unauthorized", 401, "Your admin session is invalid or expired. Sign in again.");
  const aRes = await fetch(
    `${SB_URL}/rest/v1/admin_users?email=eq.${encodeURIComponent(user.email)}&select=email,active,role`,
    { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } }
  );
  if (!aRes.ok) throw new ConnError("upstream", 502, "Admin verification failed.");
  const admins = await aRes.json();
  if (!admins.some((a) => a.active)) throw new ConnError("forbidden", 403, "This account is not on the BRANIFY admin allowlist.");
  return { id: user.id || user.email, email: user.email };
}
function sbHeaders(extra = {}) {
  if (!SB_SERVICE) throw new ConnError("server_error", 503, "Service role key is not configured on the server.");
  return { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`, "Content-Type": "application/json", ...extra };
}
async function restUpsertConnection(row) {
  const res = await fetch(
    `${SB_URL}/rest/v1/social_connections?on_conflict=platform`,
    {
      method: "POST",
      headers: sbHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(2e4)
    }
  );
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error(`[social-connect-token] upsert HTTP ${res.status}: ${detail}`);
    throw new ConnError("server_error", 502, `Database write failed (HTTP ${res.status}).`);
  }
}
async function logActivity(email, action, targetId, meta) {
  try {
    await fetch(`${SB_URL}/rest/v1/activity_log`, {
      method: "POST",
      headers: sbHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify({
        user_id: null,
        user_email: email || "system",
        action,
        target_type: "social_connection",
        target_id: targetId,
        meta
      }),
      signal: AbortSignal.timeout(15e3)
    });
  } catch {
  }
}
function encKey() {
  const raw = (process.env.META_TOKEN_ENCRYPTION_KEY || "").trim();
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  return crypto.createHash("sha256").update(raw || "branify-unconfigured").digest();
}
function encryptToken(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}
async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(2e4) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || `HTTP ${res.status}`;
    throw new ConnError("meta_rejected", 400, msg.slice(0, 200));
  }
  return json;
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
    if (method !== "POST") throw new ConnError("bad_request", 405, "Use POST.");
    const admin = await verifyAdmin(bearerOf(req));
    const appId = (process.env.META_APP_ID || "").trim();
    const appSecret = (process.env.META_APP_SECRET || "").trim();
    if (!appId || !appSecret) throw new ConnError("not_configured", 503, "Meta app credentials are not configured on the server.");
    if (!SB_SERVICE) throw new ConnError("server_error", 503, "Service role key is not configured on the server.");
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const token = String(body.token || "").trim();
    const wantPageId = String(body.page_id || "").trim();
    if (!/^[A-Za-z0-9_-]{20,2000}$/.test(token)) {
      throw new ConnError("bad_token", 400, "That does not look like a Meta access token. Paste the full token string from Business Settings \u2192 System Users \u2192 Generate token.");
    }
    const ver = (process.env.META_GRAPH_API_VERSION || "v22.0").trim();
    const appAt = `${appId}|${appSecret}`;
    const dbg = await getJson(
      `https://graph.facebook.com/${ver}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(appAt)}`
    );
    const info = dbg.data || {};
    if (!info.is_valid) throw new ConnError("invalid_token", 400, "Meta reports this token as invalid or revoked. Generate a fresh one.");
    if (String(info.app_id) !== appId) throw new ConnError("wrong_app", 400, "This token belongs to a different Meta app. Generate it for the Branify blog app.");
    const scopes = (info.scopes || []).filter((s) => /^[a-z_]{1,64}$/.test(s));
    const has = (s) => scopes.includes(s);
    if (!has("pages_manage_posts") || !has("pages_show_list")) {
      throw new ConnError("missing_scopes", 400, "Re-generate the token with at least: pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish.");
    }
    const pagesRes = await getJson(
      `https://graph.facebook.com/${ver}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}&limit=50`
    );
    const pages = (pagesRes.data || []).filter((p) => p.id && p.access_token);
    if (!pages.length) throw new ConnError("no_pages", 400, "No Facebook Pages are visible to this token. Assign the Page to the system user in Business Settings \u2192 System Users \u2192 Assigned assets.");
    const chosen = wantPageId && pages.find((p) => p.id === wantPageId) || pages.find((p) => p.instagram_business_account?.id) || pages[0];
    const pageToken = chosen.access_token;
    const ig = chosen.instagram_business_account;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const connected = [];
    const missing = [];
    if (!has("instagram_basic")) missing.push("instagram_basic");
    if (!has("instagram_content_publish")) missing.push("instagram_content_publish");
    await restUpsertConnection({
      platform: "facebook",
      page_id: chosen.id,
      page_name: chosen.name || "",
      ig_user_id: ig?.id || "",
      ig_username: ig?.username || "",
      token_encrypted: encryptToken(pageToken),
      token_kind: "page",
      token_expires_at: null,
      // system-user derived page tokens do not expire
      scopes,
      connected_by: "system-user",
      connected_at: now,
      updated_at: now,
      metadata: { graph_version: ver, token_type: info.type || "system_user", method: "manual_token" }
    });
    connected.push("facebook");
    if (ig?.id && has("instagram_basic") && has("instagram_content_publish")) {
      await restUpsertConnection({
        platform: "instagram",
        page_id: chosen.id,
        page_name: chosen.name || "",
        ig_user_id: ig.id,
        ig_username: ig.username || "",
        token_encrypted: encryptToken(pageToken),
        // IG content publish uses the linked Page token
        token_kind: "page",
        token_expires_at: null,
        scopes,
        connected_by: "system-user",
        connected_at: now,
        updated_at: now,
        metadata: { graph_version: ver, token_type: info.type || "system_user", method: "manual_token" }
      });
      connected.push("instagram");
    } else if (ig?.id) {
      missing.push("(re-run after adding the instagram scopes to link Instagram)");
    }
    await logActivity(admin.email, "social.connect", String(chosen.id), {
      method: "manual_system_token",
      token_type: info.type || "system_user",
      page_id: chosen.id,
      page_name: chosen.name || "",
      instagram: ig?.id || null,
      connected,
      missing_scopes: missing
    });
    res.status(200).json({
      ok: true,
      data: {
        connected,
        page: { id: chosen.id, name: chosen.name || "" },
        instagram: ig?.id ? { id: ig.id, username: ig.username || "" } : null,
        missing_scopes: missing,
        note: missing.length ? "Facebook is live. Re-generate the token with the listed scopes and POST again to add Instagram." : ""
      }
    });
  } catch (e) {
    if (e instanceof ConnError) {
      res.status(e.status).json({ ok: false, error: { code: e.code, message: e.message } });
      return;
    }
    const ref = crypto.randomUUID().slice(0, 8);
    console.error(`[social-connect-token:${ref}]`, e instanceof Error ? e.message : e);
    res.status(500).json({ ok: false, error: { code: "internal", message: `Unexpected connection error (ref ${ref}).` } });
  }
}
export {
  handler as default,
  maxDuration
};
