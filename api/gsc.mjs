/* GENERATED FILE — do not edit by hand. Source: server/* (see scripts/build-api.mjs). Regenerate with `npm run api:build`. */

// server/gsc.ts
import crypto from "node:crypto";
var SB_URL = process.env.SUPABASE_URL || "https://uspshkegxhrglbpxqtil.supabase.co";
var SB_ANON = process.env.SUPABASE_ANON_KEY || "sb_publishable_X11QDwMSfS2ivSePRVDpLQ_xNFY_8vw";
var SITE_ORIGIN = process.env.GSC_PUBLIC_ORIGIN || "https://branify.store";
var PROD_REDIRECT = `${SITE_ORIGIN}/api/gsc?action=callback`;
var VAULT_KEY_HEX = process.env.GSC_VAULT_KEY || "51c06a4a94f3fe8989d5385b89d70ad6c984d9f1ae394a776bc26b7bd84cc7e9";
var VAULT_SETTINGS_KEY = "gsc_vault_v1";
var STATE_TTL_MS = 10 * 60 * 1e3;
var CORS_ORIGINS = [
  "https://branify.store",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
  "http://127.0.0.1:4173"
];
var SCOPES = "https://www.googleapis.com/auth/webmasters.readonly openid email";
var DEFAULT_PROPERTY = "https://branify.store/";
var GscError = class extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code;
    this.status = status;
  }
};
function vaultKey() {
  const key = Buffer.from(VAULT_KEY_HEX, "hex");
  if (key.length !== 32) throw new GscError("server_config", 500, "Server encryption key is misconfigured.");
  return key;
}
function encryptJson(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", vaultKey(), iv);
  const plain = Buffer.from(JSON.stringify(value), "utf8");
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  const b64 = (b) => b.toString("base64url");
  return `v1.${b64(iv)}.${b64(enc)}.${b64(tag)}`;
}
function decryptJson(blob) {
  try {
    const [v, ivS, ctS, tagS] = String(blob).split(".");
    if (v !== "v1" || !ivS || !ctS || !tagS) throw new Error("format");
    const decipher = crypto.createDecipheriv("aes-256-gcm", vaultKey(), Buffer.from(ivS, "base64url"));
    decipher.setAuthTag(Buffer.from(tagS, "base64url"));
    const plain = Buffer.concat([decipher.update(Buffer.from(ctS, "base64url")), decipher.final()]);
    return JSON.parse(plain.toString("utf8"));
  } catch {
    throw new GscError("vault_corrupt", 500, "Stored Search Console credentials could not be decrypted. Reconnect the integration.");
  }
}
function stateHmac(payloadB64, clientSecret) {
  return crypto.createHmac("sha256", clientSecret).update(payloadB64).digest("base64url");
}
function signState(clientSecret, payload) {
  const full = { ...payload, iat: Date.now(), exp: Date.now() + STATE_TTL_MS };
  const body = Buffer.from(JSON.stringify(full), "utf8").toString("base64url");
  return `${body}.${stateHmac(body, clientSecret)}`;
}
function verifyState(clientSecret, state, sub) {
  const [body, sig] = String(state).split(".");
  if (!body || !sig) throw new GscError("bad_request", 400, "Invalid OAuth state.");
  const expected = stateHmac(body, clientSecret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new GscError("bad_request", 400, "OAuth state signature mismatch \u2014 restart the connection flow.");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (payload.exp < Date.now()) throw new GscError("bad_request", 400, "The connection request expired \u2014 start again.");
  if (payload.sub !== sub) throw new GscError("forbidden", 403, "This confirmation belongs to a different admin session.");
  if (!CORS_ORIGINS.includes(payload.back)) throw new GscError("bad_request", 400, "Invalid return origin.");
  return payload;
}
async function loadVaultRefs() {
  const vault = await readVault();
  const refs = { vault, client: null, conn: null, connCorrupt: false };
  if (vault.client) refs.client = decryptJson(vault.client);
  if (vault.connection) {
    try {
      refs.conn = decryptJson(vault.connection);
    } catch {
      refs.connCorrupt = true;
    }
  }
  return refs;
}
async function persistRefs(refs, bearer) {
  refs.vault.client = refs.client ? encryptJson(refs.client) : null;
  refs.vault.connection = refs.conn ? encryptJson(refs.conn) : null;
  await writeVault(refs.vault, bearer);
}
async function readVault() {
  const res = await fetch(`${SB_URL}/rest/v1/settings?key=eq.${VAULT_SETTINGS_KEY}&select=value`, {
    headers: { apikey: SB_ANON }
  });
  if (!res.ok) throw new GscError("upstream", 502, `Could not read the integration vault (HTTP ${res.status}).`);
  const rows = await res.json();
  return rows[0]?.value || { client: null, connection: null };
}
async function writeVault(vault, bearer) {
  const res = await fetch(`${SB_URL}/rest/v1/settings?on_conflict=key`, {
    method: "POST",
    headers: {
      apikey: SB_ANON,
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify([{ key: VAULT_SETTINGS_KEY, value: { ...vault, updated_at: (/* @__PURE__ */ new Date()).toISOString() } }])
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GscError(
      "forbidden",
      res.status === 401 || res.status === 403 ? res.status : 502,
      `Saving the integration state failed (HTTP ${res.status}).${detail ? " " + detail.slice(0, 160) : ""}`
    );
  }
}
async function verifyAdmin(token) {
  if (!token) {
    throw new GscError("unauthorized", 401, "Sign in to BRANIFY Admin to use Search Console.");
  }
  const uRes = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } });
  if (!uRes.ok) throw new GscError("unauthorized", 401, "Your admin session is invalid or expired. Sign in again.");
  const user = await uRes.json();
  if (!user?.email) throw new GscError("unauthorized", 401, "Your admin session is invalid or expired. Sign in again.");
  const aRes = await fetch(
    `${SB_URL}/rest/v1/admin_users?email=eq.${encodeURIComponent(user.email)}&select=email,active,role`,
    { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } }
  );
  if (!aRes.ok) throw new GscError("upstream", 502, `Admin verification failed (HTTP ${aRes.status}).`);
  const admins = await aRes.json();
  if (!admins.some((a) => a.active)) {
    throw new GscError("forbidden", 403, "This account is not on the BRANIFY admin allowlist.");
  }
  return { id: user.id || user.email, email: user.email };
}
function buildAuthUrl(clientId, redirectUri, state) {
  const q = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    include_granted_scopes: "false",
    prompt: "consent",
    state
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`;
}
function googleErr(res, body, fallback) {
  let msg = fallback;
  let reason = "";
  try {
    const j = JSON.parse(body);
    if (typeof j.error === "string") {
      msg = j.error_description || j.error;
      reason = j.error;
    } else if (j.error?.message) {
      msg = j.error.message;
      reason = j.error.errors?.[0]?.reason || j.error.status || "";
    }
  } catch {
  }
  const s = res.status;
  if (s === 429 || s === 403 && /quota|rateLimit|userRateLimit/i.test(reason)) {
    return new GscError("rate_limited", 429, "Google API rate limit reached. Wait a minute and try again.");
  }
  if (s === 401 && /invalid_client/i.test(reason)) {
    return new GscError("oauth_rejected", 400, "Google rejected the OAuth client credentials \u2014 re-check the stored Client ID / Client Secret.");
  }
  if (s === 401 || /invalid_grant|Token has been expired|unauthorized/i.test(msg + reason)) {
    return new GscError("reconnect_required", 409, "The Google connection expired. Reconnect Search Console to continue.");
  }
  if (s === 403) {
    if (/permission|has not been granted|forbidden/i.test(msg + reason)) {
      return new GscError("permission_denied", 403, "The connected Google account does not have permission for this Search Console property.");
    }
    return new GscError("permission_denied", 403, msg);
  }
  if (s === 404) return new GscError("invalid_property", 400, "This Search Console property was not found. Pick a verified property.");
  return new GscError("upstream", 502, `${fallback}: ${msg.slice(0, 200)}`);
}
async function exchangeCode(clientId, clientSecret, code, redirectUri) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    }).toString()
  });
  const body = await res.text();
  if (!res.ok) throw googleErr(res, body, "Google OAuth token exchange failed.");
  return JSON.parse(body);
}
async function refreshAccessToken(clientId, clientSecret, refreshToken) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token"
    }).toString()
  });
  const body = await res.text();
  if (!res.ok) throw googleErr(res, body, "Refreshing the Google access token failed.");
  return JSON.parse(body);
}
async function fetchGoogleEmail(accessToken) {
  try {
    const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return "";
    const j = await res.json();
    return j.email || "";
  } catch {
    return "";
  }
}
async function listSites(accessToken) {
  const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const body = await res.text();
  if (!res.ok) throw googleErr(res, body, "Listing Search Console properties failed.");
  const j = JSON.parse(body);
  return j.siteEntry || [];
}
async function searchAnalytics(accessToken, siteUrl, body) {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );
  const text = await res.text();
  if (!res.ok) throw googleErr(res, text, "Search Analytics query failed.");
  const j = JSON.parse(text);
  return j.rows || [];
}
async function inspectUrl(accessToken, siteUrl, inspectionUrl) {
  const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ siteUrl, inspectionUrl })
  });
  const text = await res.text();
  if (!res.ok) throw googleErr(res, text, "URL inspection failed.");
  const j = JSON.parse(text);
  const r = j.inspectionResult?.indexStatusResult || {};
  const verdict = r.verdict === "PASS" ? "indexed" : r.verdict === "FAIL" ? "not_indexed" : "unknown";
  return {
    verdict,
    coverageState: r.coverageState,
    lastCrawlTime: r.lastCrawlTime,
    robotsTxtState: r.robotsTxtState,
    indexingState: r.indexingState,
    userCanonical: r.userCanonical,
    googleCanonical: r.googleCanonical
  };
}
async function freshAccessToken(bearer) {
  const refs = await loadVaultRefs();
  if (!refs.client) throw new GscError("not_configured", 400, "Google OAuth client is not configured yet.");
  if (!refs.conn) throw new GscError(
    refs.connCorrupt ? "vault_corrupt" : "not_connected",
    refs.connCorrupt ? 500 : 409,
    refs.connCorrupt ? "Stored credentials could not be decrypted \u2014 reconnect the integration." : "Google Search Console is not connected."
  );
  const conn = refs.conn;
  if (conn.needsReconnect) throw new GscError("reconnect_required", 409, "The Google connection needs to be renewed. Click Reconnect.");
  let token = conn.access_token;
  if (!conn.expires_at || conn.expires_at - 6e4 < Date.now()) {
    try {
      const refreshed = await refreshAccessToken(refs.client.client_id, refs.client.client_secret, conn.refresh_token);
      token = refreshed.access_token;
      conn.access_token = token;
      conn.expires_at = Date.now() + (refreshed.expires_in || 3600) * 1e3;
      await persistRefs(refs, bearer);
    } catch (e) {
      if (e instanceof GscError && e.code === "reconnect_required") {
        conn.needsReconnect = true;
        await persistRefs(refs, bearer).catch(() => {
        });
      }
      throw e;
    }
  }
  return { conn, refs, token };
}
function resolveRange(days) {
  const DAY = 864e5;
  const end = new Date(Date.now() - 2 * DAY);
  const start = new Date(end.getTime() - (days - 1) * DAY);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}
function normalizePageUrl(input, property) {
  const raw = String(input || "").trim();
  if (!raw) throw new GscError("bad_request", 400, "Enter a page path or URL to analyze.");
  const originFor = () => {
    if (property.startsWith("http")) return new URL(property).origin;
    if (property.startsWith("sc-domain:")) return `https://${property.slice("sc-domain:".length)}`;
    return SITE_ORIGIN;
  };
  let url;
  try {
    url = new URL(raw.startsWith("http") ? raw : `${originFor()}${raw.startsWith("/") ? "" : "/"}${raw}`);
  } catch {
    throw new GscError("bad_request", 400, `Not a valid URL: ${raw}`);
  }
  const host = url.host.replace(/^www\./, "");
  const expected = originFor().replace(/^https?:\/\//, "").replace(/^www\./, "");
  if (host !== expected) {
    throw new GscError("bad_request", 400, `Only URLs on ${expected} can be analyzed (got ${host}).`);
  }
  return url.origin + url.pathname + (url.search || "");
}
function pickProperty(sites) {
  const exact = sites.find((s) => s.siteUrl === DEFAULT_PROPERTY);
  if (exact) return { property: exact.siteUrl, matched: true };
  const domain = sites.find((s) => s.siteUrl === "sc-domain:branify.store");
  if (domain) return { property: domain.siteUrl, matched: true };
  const owner = sites.find((s) => /owner|fullUser/i.test(s.permissionLevel)) || sites[0];
  return owner ? { property: owner.siteUrl, matched: false } : { property: "", matched: false };
}
function cors(origin, res) {
  if (CORS_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}
function bearerOf(req) {
  const h = req.headers?.authorization;
  const raw = Array.isArray(h) ? h[0] || "" : h || "";
  return raw.replace(/^Bearer\s+/i, "").trim();
}
async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}
function param(req, name) {
  const q = req.query;
  if (!q) return "";
  if (q instanceof URLSearchParams) return q.get(name) || "";
  const v = q[name];
  return Array.isArray(v) ? v[0] || "" : v || "";
}
async function actionStatus() {
  const refs = await loadVaultRefs();
  const c = refs.connCorrupt ? null : refs.conn;
  let clientId = null;
  try {
    clientId = refs.client ? `${refs.client.client_id.slice(0, 12)}\u2026` : null;
  } catch {
    clientId = null;
  }
  return {
    configured: Boolean(refs.client),
    clientId,
    connected: Boolean(c && !c.needsReconnect),
    needsReconnect: Boolean(refs.connCorrupt || c?.needsReconnect),
    property: c?.property || null,
    sites: c?.sites || [],
    googleEmail: c?.google_email || null,
    connectedAt: c?.connected_at || null,
    redirectUri: PROD_REDIRECT,
    propertyDefault: DEFAULT_PROPERTY
  };
}
async function actionConfigSet(bearer, body) {
  const clientId = String(body.clientId || "").trim();
  const clientSecret = String(body.clientSecret || "").trim();
  if (!clientId || !clientSecret) throw new GscError("bad_request", 400, "Both Client ID and Client Secret are required.");
  if (!/^[0-9a-z-]+\.apps\.googleusercontent\.com$/i.test(clientId)) {
    throw new GscError("bad_request", 400, 'Client ID should look like "1234-abc.apps.googleusercontent.com".');
  }
  if (clientSecret.length < 10) throw new GscError("bad_request", 400, "That Client Secret looks too short.");
  const refs = await loadVaultRefs();
  refs.client = { client_id: clientId, client_secret: clientSecret };
  await persistRefs(refs, bearer);
  return { configured: true, clientId: `${clientId.slice(0, 12)}\u2026` };
}
async function actionConfigClear(bearer) {
  const refs = await loadVaultRefs();
  refs.client = null;
  await persistRefs(refs, bearer);
  return { configured: false };
}
async function actionConnectStart(bearer, body) {
  const refs = await loadVaultRefs();
  if (!refs.client) throw new GscError("not_configured", 400, "Add the Google OAuth client credentials first.");
  const admin = await verifyAdmin(bearer);
  const back = String(body.back || "https://branify.store");
  if (!CORS_ORIGINS.includes(back)) throw new GscError("bad_request", 400, "Unrecognized admin origin.");
  const state = signState(refs.client.client_secret, { sub: admin.id, ru: PROD_REDIRECT, back });
  return { authUrl: buildAuthUrl(refs.client.client_id, PROD_REDIRECT, state) };
}
async function actionConnectComplete(bearer, body) {
  const admin = await verifyAdmin(bearer);
  const refs = await loadVaultRefs();
  if (!refs.client) throw new GscError("not_configured", 400, "Google OAuth client is no longer configured.");
  const code = String(body.code || "");
  const state = String(body.state || "");
  if (!code || !state) throw new GscError("bad_request", 400, "Missing code/state from the Google redirect.");
  const st = verifyState(refs.client.client_secret, state, admin.id);
  const tokens = await exchangeCode(refs.client.client_id, refs.client.client_secret, code, st.ru);
  if (!tokens.refresh_token) {
    throw new GscError("bad_request", 400, "Google did not return a refresh token. Remove this app's access at myaccount.google.com/permissions, then connect again (consent screen will reappear).");
  }
  const sites = await listSites(tokens.access_token);
  if (sites.length === 0) {
    throw new GscError("no_property", 409, "This Google account has no verified Search Console properties. Verify branify.store in Google Search Console first.");
  }
  const picked = pickProperty(sites);
  const googleEmail = await fetchGoogleEmail(tokens.access_token);
  refs.conn = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + (tokens.expires_in || 3600) * 1e3,
    scope: tokens.scope || SCOPES,
    google_email: googleEmail,
    property: picked.property,
    sites,
    needsReconnect: false,
    connected_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  await persistRefs(refs, bearer);
  return { connected: true, property: picked.property, matchedPreferred: picked.matched, sites, googleEmail };
}
async function actionDisconnect(bearer, full) {
  const refs = await loadVaultRefs();
  refs.conn = null;
  if (full) refs.client = null;
  await persistRefs(refs, bearer);
  return { connected: false, configured: Boolean(refs.client) };
}
async function actionPropertySet(bearer, body) {
  const property = String(body.property || "");
  const { conn, refs } = await freshAccessToken(bearer);
  if (!conn.sites.some((s) => s.siteUrl === property)) {
    throw new GscError("invalid_property", 400, "Pick one of the properties listed for the connected Google account.");
  }
  conn.property = property;
  await persistRefs(refs, bearer);
  return { property };
}
function rowsToMetric(rows, keyIndex = 0) {
  return rows.map((r) => ({
    key: r.keys?.[keyIndex] ?? "",
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0
  }));
}
async function actionOverview(bearer, body) {
  const { conn, token } = await freshAccessToken(bearer);
  const days = Number(body.days) || 28;
  const { startDate, endDate } = resolveRange(days);
  const [totalsRows, trendRows] = await Promise.all([
    searchAnalytics(token, conn.property, { startDate, endDate, dataState: "final" }),
    searchAnalytics(token, conn.property, { startDate, endDate, dimensions: ["date"], rowLimit: 400, dataState: "final" })
  ]);
  const t = totalsRows[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  return {
    property: conn.property,
    startDate,
    endDate,
    totals: { clicks: t.clicks || 0, impressions: t.impressions || 0, ctr: t.ctr || 0, position: t.position || 0 },
    trend: trendRows.map((r) => ({ date: r.keys?.[0] || "", clicks: r.clicks || 0, impressions: r.impressions || 0 }))
  };
}
async function actionQueries(bearer, body) {
  const { conn, token } = await freshAccessToken(bearer);
  const days = Number(body.days) || 28;
  const limit = Math.min(50, Math.max(1, Number(body.limit) || 20));
  const { startDate, endDate } = resolveRange(days);
  const rows = await searchAnalytics(token, conn.property, {
    startDate,
    endDate,
    dimensions: ["query"],
    rowLimit: limit,
    dataState: "final"
  });
  return { rows: rowsToMetric(rows), startDate, endDate, property: conn.property };
}
async function actionPages(bearer, body) {
  const { conn, token } = await freshAccessToken(bearer);
  const days = Number(body.days) || 28;
  const limit = Math.min(50, Math.max(1, Number(body.limit) || 20));
  const { startDate, endDate } = resolveRange(days);
  const rows = await searchAnalytics(token, conn.property, {
    startDate,
    endDate,
    dimensions: ["page"],
    rowLimit: limit,
    dataState: "final"
  });
  return { rows: rowsToMetric(rows), startDate, endDate, property: conn.property };
}
async function actionPage(bearer, body) {
  const { conn, token } = await freshAccessToken(bearer);
  const url = normalizePageUrl(String(body.url || ""), conn.property);
  const days = Number(body.days) || 28;
  const { startDate, endDate } = resolveRange(days);
  const filter = { dimension: "page", expression: url };
  const [totalsRows, queryRows] = await Promise.all([
    searchAnalytics(token, conn.property, { startDate, endDate, dimensionFilter: filter, dataState: "final" }),
    searchAnalytics(token, conn.property, {
      startDate,
      endDate,
      dimensions: ["query"],
      dimensionFilter: filter,
      rowLimit: 10,
      dataState: "final"
    })
  ]);
  const t = totalsRows[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  return {
    url,
    property: conn.property,
    startDate,
    endDate,
    totals: { clicks: t.clicks || 0, impressions: t.impressions || 0, ctr: t.ctr || 0, position: t.position || 0 },
    queries: rowsToMetric(queryRows)
  };
}
async function actionInspect(bearer, body) {
  const { conn, token } = await freshAccessToken(bearer);
  const url = normalizePageUrl(String(body.url || ""), conn.property);
  const result = await inspectUrl(token, conn.property, url);
  return { url, ...result };
}
async function handleAction(action, req, res) {
  const bearer = bearerOf(req);
  const body = await readBody(req);
  if (action !== "ping") await verifyAdmin(bearer);
  let data;
  switch (action) {
    case "ping":
      data = { ok: true, service: "gsc", time: (/* @__PURE__ */ new Date()).toISOString() };
      break;
    case "status":
      data = await actionStatus();
      break;
    case "config.set":
      data = await actionConfigSet(bearer, body);
      break;
    case "config.clear":
      data = await actionConfigClear(bearer);
      break;
    case "connect.start":
      data = await actionConnectStart(bearer, body);
      break;
    case "connect.complete":
      data = await actionConnectComplete(bearer, body);
      break;
    case "disconnect":
      data = await actionDisconnect(bearer, false);
      break;
    case "config.reset":
      data = await actionDisconnect(bearer, true);
      break;
    case "property.set":
      data = await actionPropertySet(bearer, body);
      break;
    case "overview":
      data = await actionOverview(bearer, body);
      break;
    case "queries":
      data = await actionQueries(bearer, body);
      break;
    case "pages":
      data = await actionPages(bearer, body);
      break;
    case "page":
      data = await actionPage(bearer, body);
      break;
    case "inspect":
      data = await actionInspect(bearer, body);
      break;
    default:
      throw new GscError("bad_request", 400, `Unknown action "${action}".`);
  }
  res.status(200).json({ ok: true, data });
}
async function gscHandler(req, res) {
  const h = req.headers || {};
  const origin = String((Array.isArray(h.origin) ? h.origin[0] : h.origin) || "");
  try {
    cors(origin, res);
    if (String(req.method || "GET").toUpperCase() === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    const action = param(req, "action");
    if (action === "callback") {
      const err = param(req, "error");
      const host = String((Array.isArray(h["x-forwarded-host"]) ? h["x-forwarded-host"][0] : h["x-forwarded-host"]) || new URL(SITE_ORIGIN).host);
      const proto = String((Array.isArray(h["x-forwarded-proto"]) ? h["x-forwarded-proto"][0] : h["x-forwarded-proto"]) || "https");
      const code = param(req, "code");
      const state = param(req, "state");
      let back = `${proto}://${host}/admin/seo/search-console`;
      try {
        const [bodyB64] = state.split(".");
        if (bodyB64) {
          const payload = JSON.parse(Buffer.from(bodyB64, "base64url").toString("utf8"));
          if (payload.back && CORS_ORIGINS.includes(payload.back)) back = `${payload.back}/admin/seo/search-console`;
        }
      } catch {
      }
      const qs = err ? `gsc_error=${encodeURIComponent(err)}` : `gsc_code=${encodeURIComponent(code)}&gsc_state=${encodeURIComponent(state)}`;
      res.setHeader("Cache-Control", "no-store");
      res.redirect(302, `${back}?${qs}`);
      return;
    }
    if (String(req.method || "GET").toUpperCase() !== "POST" && action !== "ping") {
      throw new GscError("bad_request", 405, "Use POST with an action.");
    }
    await handleAction(action, req, res);
  } catch (e) {
    const ge = e instanceof GscError ? e : new GscError("server_error", 500, e?.message || "Unexpected server error.");
    if (ge.status >= 500) console.error("[gsc]", ge.code, ge.message);
    res.status(ge.status).json({ ok: false, error: { code: ge.code, message: ge.message } });
  }
}
async function handler(req, res) {
  return gscHandler(req, res);
}
export {
  CORS_ORIGINS,
  GscError,
  buildAuthUrl,
  decryptJson,
  handler as default,
  encryptJson,
  exchangeCode,
  gscHandler,
  inspectUrl,
  listSites,
  normalizePageUrl,
  pickProperty,
  refreshAccessToken,
  resolveRange,
  searchAnalytics,
  signState,
  verifyAdmin,
  verifyState
};
