/* GENERATED FILE — do not edit by hand. Source: server/* (see scripts/build-api.mjs). Regenerate with `npm run api:build`. */

// server/meta/callback.ts
import crypto from "node:crypto";
var maxDuration = 30;
var SB_URL = process.env.SUPABASE_URL || "https://uspshkegxhrglbpxqtil.supabase.co";
var SB_SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
var ADMIN_ORIGIN = (process.env.APP_URL || "https://branify.store").replace(/\/+$/, "");
var DEFAULT_REDIRECT_URI = "https://branify.store/api/meta/oauth/callback";
function q(req, name) {
  const raw = req.query instanceof URLSearchParams ? req.query.get(name) : req.query?.[name];
  const val = Array.isArray(raw) ? raw[0] : raw;
  return (val || "").toString();
}
function cookieOf(req, name) {
  const h = req.headers?.cookie;
  const raw = Array.isArray(h) ? h.join(";") : h || "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return "";
}
function redirectTo(res, path) {
  res.setHeader("Location", `${ADMIN_ORIGIN}${path}`);
  res.status(302).send("");
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
function safeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(2e4) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg.slice(0, 200));
  }
  return json;
}
async function restUpsertConnection(row) {
  if (!SB_SERVICE) throw new Error("service_role_missing");
  const res = await fetch(
    `${SB_URL}/rest/v1/social_connections?on_conflict=platform`,
    {
      method: "POST",
      headers: {
        apikey: SB_SERVICE,
        Authorization: `Bearer ${SB_SERVICE}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(2e4)
    }
  );
  if (!res.ok) throw new Error(`supabase_${res.status}`);
}
async function handler(req, res) {
  try {
    const code = q(req, "code");
    const stateParam = q(req, "state");
    const oauthError = q(req, "error");
    const cookieState = cookieOf(req, "meta_oauth_state");
    const platformCookie = cookieOf(req, "meta_oauth_platform") === "instagram" ? "instagram" : "facebook";
    const bail = (reason) => {
      redirectTo(res, `/admin/social?connect_error=${encodeURIComponent(reason)}`);
    };
    if (oauthError) {
      bail(oauthError === "access_denied" ? "denied" : "cancelled");
      return;
    }
    const appId = (process.env.META_APP_ID || "").trim();
    const appSecret = (process.env.META_APP_SECRET || "").trim();
    if (!appId || !appSecret) {
      bail("not_configured");
      return;
    }
    if (!code || !stateParam || !cookieState || !safeEqual(stateParam, cookieState)) {
      bail("invalid_state");
      return;
    }
    const dot = stateParam.indexOf(".");
    const random = dot > 0 ? stateParam.slice(0, dot) : "";
    const sig = dot > 0 ? stateParam.slice(dot + 1) : "";
    const expectedSig = crypto.createHmac("sha256", appSecret).update(random).digest("hex");
    if (!random || !sig || !safeEqual(sig, expectedSig)) {
      bail("invalid_state");
      return;
    }
    if (!SB_SERVICE) {
      bail("server_error");
      return;
    }
    const ver = (process.env.META_GRAPH_API_VERSION || "v22.0").trim();
    const redirectUri = (process.env.META_REDIRECT_URI || DEFAULT_REDIRECT_URI).trim();
    const shortTok = await getJson(
      `https://graph.facebook.com/${ver}/oauth/access_token?client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`
    );
    if (!shortTok.access_token) {
      bail("token_exchange_failed");
      return;
    }
    const longTok = await getJson(
      `https://graph.facebook.com/${ver}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(shortTok.access_token)}`
    );
    const userToken = longTok.access_token || shortTok.access_token;
    const pagesRes = await getJson(
      `https://graph.facebook.com/${ver}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(userToken)}&limit=50`
    );
    const pages = (pagesRes.data || []).filter((p) => p.id && p.access_token);
    if (!pages.length) {
      bail("no_pages");
      return;
    }
    const wantIg = platformCookie === "instagram";
    const chosen = wantIg ? pages.find((p) => p.instagram_business_account?.id) || pages[0] : pages[0];
    const pageToken = chosen.access_token;
    const ig = chosen.instagram_business_account;
    const expiresAt = longTok.expires_in ? new Date(Date.now() + Number(longTok.expires_in) * 1e3).toISOString() : null;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const scopes = ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish", "business_management"];
    const connected = [];
    await restUpsertConnection({
      platform: "facebook",
      page_id: chosen.id,
      page_name: chosen.name || "",
      ig_user_id: ig?.id || "",
      ig_username: ig?.username || "",
      token_encrypted: encryptToken(pageToken),
      token_kind: "page",
      token_expires_at: expiresAt,
      scopes,
      connected_by: "meta-oauth",
      connected_at: now,
      updated_at: now,
      metadata: { graph_version: ver, user_token_expires_in: longTok.expires_in || null }
    });
    connected.push("facebook");
    if (ig?.id) {
      await restUpsertConnection({
        platform: "instagram",
        page_id: chosen.id,
        page_name: chosen.name || "",
        ig_user_id: ig.id,
        ig_username: ig.username || "",
        token_encrypted: encryptToken(pageToken),
        // IG content publish uses the linked Page token
        token_kind: "page",
        token_expires_at: expiresAt,
        scopes,
        connected_by: "meta-oauth",
        connected_at: now,
        updated_at: now,
        metadata: { graph_version: ver }
      });
      connected.push("instagram");
    } else if (wantIg) {
      bail("no_instagram_account");
      return;
    }
    res.setHeader("Set-Cookie", [
      "meta_oauth_state=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax",
      "meta_oauth_platform=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax"
    ]);
    redirectTo(res, `/admin/social?connected=${connected.join(",")}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const safe = /supabase_/.test(msg) ? "server_error" : /service_role_missing/.test(msg) ? "server_error" : /timed?_?out|abort/i.test(msg) ? "network" : "token_exchange_failed";
    redirectTo(res, `/admin/social?connect_error=${safe}`);
  }
}
export {
  handler as default,
  maxDuration
};
