/* GENERATED FILE — do not edit by hand. Source: server/* (see scripts/build-api.mjs). Regenerate with `npm run api:build`. */

// server/social/publish.ts
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
var PubError = class extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code;
    this.status = status;
  }
};
async function verifyAdmin(token) {
  if (!token) throw new PubError("unauthorized", 401, "Sign in to BRANIFY Admin to publish.");
  const uRes = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } });
  if (!uRes.ok) throw new PubError("unauthorized", 401, "Your admin session is invalid or expired. Sign in again.");
  const user = await uRes.json();
  if (!user?.email) throw new PubError("unauthorized", 401, "Your admin session is invalid or expired. Sign in again.");
  const aRes = await fetch(
    `${SB_URL}/rest/v1/admin_users?email=eq.${encodeURIComponent(user.email)}&select=email,active,role`,
    { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } }
  );
  if (!aRes.ok) throw new PubError("upstream", 502, "Admin verification failed.");
  const admins = await aRes.json();
  if (!admins.some((a) => a.active)) throw new PubError("forbidden", 403, "This account is not on the BRANIFY admin allowlist.");
  return { id: user.id || user.email, email: user.email };
}
function sbHeaders(extra = {}) {
  if (!SB_SERVICE) throw new PubError("server_error", 503, "Service role key is not configured on the server.");
  return { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`, "Content-Type": "application/json", ...extra };
}
async function sbSelect(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbHeaders(), signal: AbortSignal.timeout(2e4) });
  if (!res.ok) throw new PubError("server_error", 502, `Database read failed (HTTP ${res.status}).`);
  return await res.json();
}
async function sbPatch(path, body) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: sbHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(2e4)
  });
  if (!res.ok) throw new PubError("server_error", 502, `Database update failed (HTTP ${res.status}).`);
  const rows = await res.json();
  return rows.length > 0;
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
        target_type: "social_post",
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
function decryptToken(blob64) {
  try {
    const buf = Buffer.from(blob64, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", encKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch {
    throw new PubError("token_decrypt_failed", 502, "Stored Meta credentials could not be decrypted. Reconnect the platform from Social Media.");
  }
}
async function connectionFor(platform) {
  const rows = await sbSelect(
    `social_connections?platform=eq.${platform}&select=platform,page_id,page_name,ig_user_id,token_encrypted,token_expires_at&limit=1`
  );
  if (!rows.length || !rows[0].token_encrypted) {
    throw new PubError("not_connected", 409, `${platform === "facebook" ? "Facebook" : "Instagram"} is not connected yet. Connect it from Admin \u2192 Social Media.`);
  }
  const row = rows[0];
  if (row.token_expires_at && new Date(row.token_expires_at).getTime() < Date.now()) {
    throw new PubError("token_expired", 409, "The stored Meta token has expired. Click Reconnect to refresh it.");
  }
  return row;
}
function graphVersion() {
  const v = (process.env.META_GRAPH_API_VERSION || "v22.0").trim();
  return /^v\d+\.\d+$/.test(v) ? v : "v22.0";
}
async function graphPost(path, params) {
  const res = await fetch(`https://graph.facebook.com/${graphVersion()}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(45e3)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const msg = json.error?.message || `HTTP ${res.status}`;
    const code = json.error?.code;
    if (code === 190) throw new PubError("token_expired", 409, "Meta rejected the stored token (expired or revoked). Reconnect the platform.");
    if (res.status === 4) throw new PubError("rate_limited", 429, "Meta API rate limit reached. Wait a few minutes and retry.");
    throw new PubError("publish_failed", 502, `${msg.slice(0, 220)}`);
  }
  return json;
}
async function publishFacebook(post, conn, token) {
  if (post.media_url) {
    const r2 = await graphPost(`${conn.page_id}/photos`, { url: post.media_url, caption: post.caption, access_token: token });
    return String(r2.post_id || r2.id || "");
  }
  const r = await graphPost(`${conn.page_id}/feed`, { message: post.caption, access_token: token });
  return String(r.id || "");
}
var IMAGE_MIME_RE = /^image\/(jpeg|png|webp)(;|$)/;
var MAX_MEDIA_BYTES = 8 * 1024 * 1024;
async function validateMediaForInstagram(mediaUrl) {
  let res;
  try {
    res = await fetch(mediaUrl, { method: "HEAD", signal: AbortSignal.timeout(8e3) });
    if (!res.ok && res.status === 405) {
      res = await fetch(mediaUrl, { headers: { Range: "bytes=0-2047" }, signal: AbortSignal.timeout(8e3) });
    }
  } catch {
    throw new PubError("invalid_media", 400, "Instagram post is pending its asset: the image URL is not publicly reachable. Generate an image for this post (or attach a public one), then publish.");
  }
  if (!res.ok) {
    throw new PubError("invalid_media", 400, `Instagram post is pending its asset: the image URL returned HTTP ${res.status}. Fix or regenerate the image, then publish.`);
  }
  const mime = (res.headers.get("content-type") || "").toLowerCase();
  if (!IMAGE_MIME_RE.test(mime)) {
    throw new PubError("invalid_media", 400, `Instagram post is pending its asset: unsupported media type (${mime || "unknown"}) \u2014 Instagram needs jpg, png or webp.`);
  }
  const lenHeader = res.headers.get("content-length") || res.headers.get("content-range") || "";
  const total = /\/(\d+)\s*$/.exec(lenHeader)?.[1];
  const bytes = Number(total || lenHeader || 0);
  if (bytes > MAX_MEDIA_BYTES) {
    throw new PubError("invalid_media", 400, "Instagram post is pending its asset: the image exceeds 8 MB. Use a smaller image.");
  }
}
async function publishInstagram(post, conn, token) {
  if (!conn.ig_user_id) {
    throw new PubError("no_instagram_account", 409, "No Instagram Professional account is linked to the connected Facebook Page. Link one in Meta Business Suite, then reconnect.");
  }
  if (!post.media_url) {
    throw new PubError("invalid_media", 400, "Instagram post is pending its asset: no image attached. Click Generate Image on the post (or attach a public image URL), then publish.");
  }
  await validateMediaForInstagram(post.media_url);
  const caption = `${post.caption}${post.hashtags.length ? "\n\n" + post.hashtags.join(" ") : ""}`.slice(0, 2200);
  const container = await graphPost(`${conn.ig_user_id}/media`, { image_url: post.media_url, caption, access_token: token });
  const creationId = String(container.id || "");
  if (!creationId) throw new PubError("publish_failed", 502, "Instagram did not return a media container id.");
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1700));
    const res = await fetch(
      `https://graph.facebook.com/${graphVersion()}/${creationId}?fields=status_code&access_token=${encodeURIComponent(token)}`,
      { signal: AbortSignal.timeout(15e3) }
    );
    const st = await res.json().catch(() => ({}));
    if (st.status_code === "FINISHED") break;
    if (st.status_code === "ERROR") throw new PubError("publish_failed", 502, "Instagram rejected the media container (check the image URL is public and jpg/png).");
  }
  const published = await graphPost(`${conn.ig_user_id}/media_publish`, { creation_id: creationId, access_token: token });
  return String(published.id || "");
}
var CLAIMABLE = "draft,approved,scheduled,failed";
async function claimPost(id) {
  const ok = await sbPatch(
    `social_posts?id=eq.${encodeURIComponent(id)}&status=in.(${CLAIMABLE})`,
    { status: "publishing", error_message: null, updated_at: (/* @__PURE__ */ new Date()).toISOString() }
  );
  if (!ok) return null;
  const rows = await sbSelect(`social_posts?id=eq.${encodeURIComponent(id)}&select=*`);
  return rows[0] || null;
}
async function publishOne(post) {
  const conn = await connectionFor(post.platform);
  const token = decryptToken(conn.token_encrypted);
  const externalId = post.platform === "facebook" ? await publishFacebook({ caption: post.caption, media_url: post.media_url }, conn, token) : await publishInstagram({ caption: post.caption, media_url: post.media_url, hashtags: post.hashtags || [] }, conn, token);
  if (!externalId) throw new PubError("publish_failed", 502, "The platform did not return a post id.");
  return { externalId };
}
async function finalize(post, out, actor) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (out.ok) {
    await sbPatch(`social_posts?id=eq.${encodeURIComponent(post.id)}`, {
      status: "published",
      published_at: now,
      external_post_id: out.externalId,
      error_message: null,
      updated_at: now
    });
    await logActivity(actor, "social.publish", post.id, { platform: post.platform, external_post_id: out.externalId });
  } else {
    await sbPatch(`social_posts?id=eq.${encodeURIComponent(post.id)}`, {
      status: "failed",
      error_message: (out.message || "Publishing failed.").slice(0, 500),
      updated_at: now
    });
    await logActivity(actor, "social.publish_failed", post.id, { platform: post.platform, error: (out.message || "").slice(0, 300) });
  }
}
async function publishSingle(id, actor) {
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) throw new PubError("bad_request", 400, "Invalid post id.");
  const claimed = await claimPost(id);
  if (!claimed) {
    const rows = await sbSelect(`social_posts?id=eq.${encodeURIComponent(id)}&select=status`);
    if (rows.length && (rows[0].status === "published" || rows[0].status === "publishing")) {
      throw new PubError("duplicate_publish", 409, "This post was already published (or is being published right now).");
    }
    throw new PubError("not_found", 404, "Social post not found.");
  }
  if (claimed.approval_required && !claimed.approved_at && claimed.status !== "approved") {
    await sbPatch(`social_posts?id=eq.${encodeURIComponent(id)}`, { status: "pending_approval", updated_at: (/* @__PURE__ */ new Date()).toISOString() });
    throw new PubError("approval_required", 403, "Approval is required before publishing. Approve the post first.");
  }
  try {
    const { externalId } = await publishOne(claimed);
    await finalize(claimed, { ok: true, externalId }, actor);
    return { platform: claimed.platform, external_post_id: externalId };
  } catch (e) {
    const message = e instanceof PubError ? e.message : e instanceof Error ? e.message.slice(0, 300) : "Publishing failed.";
    await finalize(claimed, { ok: false, message }, actor);
    throw new PubError("publish_failed", 502, message);
  }
}
async function publishDue(actor, respectAutoPublish) {
  if (respectAutoPublish) {
    const settings = await sbSelect(`settings?key=eq.social_publishing&select=value`);
    const cfg = settings[0]?.value || {};
    if (cfg.auto_publish !== true) {
      return { attempted: 0, published: 0, failed: 0, skipped: 1 };
    }
  }
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const due = await sbSelect(
    `social_posts?status=eq.scheduled&scheduled_at=lte.${nowIso}&select=id,platform,content_type,caption,hashtags,media_url,status,approval_required,approved_at,title&order=scheduled_at.asc&limit=10`
  );
  const result = { attempted: due.length, published: 0, failed: 0, skipped: 0 };
  for (const post of due) {
    try {
      const claimed = await claimPost(post.id);
      if (!claimed) {
        result.skipped++;
        continue;
      }
      const { externalId } = await publishOne(claimed);
      await finalize(claimed, { ok: true, externalId }, actor);
      result.published++;
    } catch (e) {
      const message = e instanceof Error ? e.message.slice(0, 300) : "Publishing failed.";
      await finalize(post, { ok: false, message }, actor);
      result.failed++;
    }
  }
  return result;
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
  try {
    cors(origin, res);
    const method = String(req.method || "GET").toUpperCase();
    if (method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (method !== "POST") {
      throw new PubError("bad_request", 405, "Use POST.");
    }
    const admin = await verifyAdmin(bearerOf(req));
    const body = req.body && typeof req.body === "object" ? req.body : {};
    if (body.due === true) {
      const result = await publishDue(admin.email, false);
      res.status(200).json({ ok: true, data: result });
      return;
    }
    const id = String(body.id || "");
    const out = await publishSingle(id, admin.email);
    res.status(200).json({ ok: true, data: out });
  } catch (e) {
    if (e instanceof PubError) {
      res.status(e.status).json({ ok: false, error: { code: e.code, message: e.message } });
      return;
    }
    const ref = crypto.randomUUID().slice(0, 8);
    console.error(`[social-publish:${ref}]`, e instanceof Error ? e.message : e);
    res.status(500).json({ ok: false, error: { code: "internal", message: `Unexpected publishing error (ref ${ref}).` } });
  }
}
export {
  handler as default,
  maxDuration
};
