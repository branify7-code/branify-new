/* GENERATED FILE — do not edit by hand. Source: server/* (see scripts/build-api.mjs). Regenerate with `npm run api:build`. */

// server/social/publish-due.ts
import crypto from "node:crypto";
var maxDuration = 120;
var SB_URL = process.env.SUPABASE_URL || "https://uspshkegxhrglbpxqtil.supabase.co";
var SB_SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
var CronError = class extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code;
    this.status = status;
  }
};
function sbHeaders(extra = {}) {
  if (!SB_SERVICE) throw new CronError("server_error", 503, "Service role key is not configured on the server.");
  return { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`, "Content-Type": "application/json", ...extra };
}
async function sbSelect(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbHeaders(), signal: AbortSignal.timeout(2e4) });
  if (!res.ok) throw new CronError("server_error", 502, `Database read failed (HTTP ${res.status}).`);
  return await res.json();
}
async function sbPatch(path, body) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: sbHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(2e4)
  });
  if (!res.ok) throw new CronError("server_error", 502, `Database update failed (HTTP ${res.status}).`);
  const rows = await res.json();
  return rows.length > 0;
}
async function logActivity(action, targetId, meta) {
  try {
    await fetch(`${SB_URL}/rest/v1/activity_log`, {
      method: "POST",
      headers: sbHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify({ user_id: null, user_email: "cron@branify.store", action, target_type: "social_post", target_id: targetId, meta }),
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
    throw new CronError("token_decrypt_failed", 502, "Stored Meta credentials could not be decrypted.");
  }
}
async function connectionFor(platform) {
  const rows = await sbSelect(
    `social_connections?platform=eq.${platform}&select=platform,page_id,page_name,ig_user_id,token_encrypted,token_expires_at&limit=1`
  );
  if (!rows.length || !rows[0].token_encrypted) {
    throw new CronError("not_connected", 409, `${platform} is not connected.`);
  }
  const row = rows[0];
  if (row.token_expires_at && new Date(row.token_expires_at).getTime() < Date.now()) {
    throw new CronError("token_expired", 409, "The stored Meta token has expired.");
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
    if (json.error?.code === 190) throw new CronError("token_expired", 409, "Meta rejected the stored token.");
    throw new CronError("publish_failed", 502, msg.slice(0, 220));
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
async function publishInstagram(post, conn, token) {
  if (!conn.ig_user_id) throw new CronError("no_instagram_account", 409, "No Instagram Professional account is linked.");
  if (!post.media_url) throw new CronError("invalid_media", 400, "Instagram posts require an image.");
  const caption = `${post.caption}${post.hashtags.length ? "\n\n" + post.hashtags.join(" ") : ""}`.slice(0, 2200);
  const container = await graphPost(`${conn.ig_user_id}/media`, { image_url: post.media_url, caption, access_token: token });
  const creationId = String(container.id || "");
  if (!creationId) throw new CronError("publish_failed", 502, "Instagram did not return a media container id.");
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1700));
    const res = await fetch(
      `https://graph.facebook.com/${graphVersion()}/${creationId}?fields=status_code&access_token=${encodeURIComponent(token)}`,
      { signal: AbortSignal.timeout(15e3) }
    );
    const st = await res.json().catch(() => ({}));
    if (st.status_code === "FINISHED") break;
    if (st.status_code === "ERROR") throw new CronError("publish_failed", 502, "Instagram rejected the media container.");
  }
  const published = await graphPost(`${conn.ig_user_id}/media_publish`, { creation_id: creationId, access_token: token });
  return String(published.id || "");
}
var CLAIMABLE = "draft,approved,scheduled,failed";
async function publishOne(post) {
  const conn = await connectionFor(post.platform);
  const token = decryptToken(conn.token_encrypted);
  const externalId = post.platform === "facebook" ? await publishFacebook({ caption: post.caption, media_url: post.media_url }, conn, token) : await publishInstagram({ caption: post.caption, media_url: post.media_url, hashtags: post.hashtags || [] }, conn, token);
  if (!externalId) throw new CronError("publish_failed", 502, "The platform did not return a post id.");
  return externalId;
}
async function finalize(post, ok, externalId, message) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (ok) {
    await sbPatch(`social_posts?id=eq.${encodeURIComponent(post.id)}`, {
      status: "published",
      published_at: now,
      external_post_id: externalId,
      error_message: null,
      updated_at: now
    });
    await logActivity("social.publish", post.id, { platform: post.platform, external_post_id: externalId, via: "cron" });
  } else {
    await sbPatch(`social_posts?id=eq.${encodeURIComponent(post.id)}`, {
      status: "failed",
      error_message: (message || "Scheduled publishing failed.").slice(0, 500),
      updated_at: now
    });
    await logActivity("social.publish_failed", post.id, { platform: post.platform, error: (message || "").slice(0, 300), via: "cron" });
  }
}
async function handler(req, res) {
  try {
    if (String(req.method || "GET").toUpperCase() !== "GET") {
      throw new CronError("bad_request", 405, "Use GET.");
    }
    const secret = (process.env.CRON_SECRET || "").trim();
    if (!secret) throw new CronError("not_configured", 503, "CRON_SECRET is not set on the server.");
    const h = req.headers?.authorization;
    const bearer = (Array.isArray(h) ? h[0] || "" : h || "").replace(/^Bearer\s+/i, "").trim();
    if (!bearer || bearer !== secret) {
      throw new CronError("unauthorized", 401, "Invalid cron credentials.");
    }
    const settings = await sbSelect(`settings?key=eq.social_publishing&select=value`);
    const cfg = settings[0]?.value || {};
    if (cfg.auto_publish !== true) {
      res.status(200).json({ ok: true, data: { ran: true, attempted: 0, published: 0, failed: 0, skipped: 0, reason: "auto_publish_off" } });
      return;
    }
    const due = await sbSelect(
      `social_posts?status=eq.scheduled&scheduled_at=lte.${(/* @__PURE__ */ new Date()).toISOString()}&select=id,platform,caption,hashtags,media_url,status,title&order=scheduled_at.asc&limit=10`
    );
    const result = { ran: true, attempted: due.length, published: 0, failed: 0, skipped: 0 };
    for (const post of due) {
      try {
        const claimed = await sbPatch(
          `social_posts?id=eq.${encodeURIComponent(post.id)}&status=in.(${CLAIMABLE})`,
          { status: "publishing", error_message: null, updated_at: (/* @__PURE__ */ new Date()).toISOString() }
        );
        if (!claimed) {
          result.skipped++;
          continue;
        }
        const externalId = await publishOne(post);
        await finalize(post, true, externalId);
        result.published++;
      } catch (e) {
        const message = e instanceof Error ? e.message.slice(0, 300) : "Scheduled publishing failed.";
        await finalize(post, false, void 0, message);
        result.failed++;
      }
    }
    res.status(200).json({ ok: true, data: result });
  } catch (e) {
    if (e instanceof CronError) {
      res.status(e.status).json({ ok: false, error: { code: e.code, message: e.message } });
      return;
    }
    const ref = crypto.randomUUID().slice(0, 8);
    console.error(`[social-publish-due:${ref}]`, e instanceof Error ? e.message : e);
    res.status(500).json({ ok: false, error: { code: "internal", message: `Unexpected cron error (ref ${ref}).` } });
  }
}
export {
  handler as default,
  maxDuration
};
