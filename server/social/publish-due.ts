// =============================================================================
// BRANIFY — Social Publishing · CRON endpoint (server-side only)
// -----------------------------------------------------------------------------
// GET /api/social/publish-due        (called by Vercel Cron every 5 minutes)
//   Authorization: Bearer $CRON_SECRET   (Vercel injects this automatically
//   when the CRON_SECRET environment variable is set)
//
// Finds scheduled social posts whose scheduled_at <= now and publishes them:
//   • Respects the social_publishing.auto_publish setting — when it is OFF the
//     run is a no-op (manual "Publish Now" still works via /api/social/publish).
//   • Idempotency: each post is claimed with an atomic conditional UPDATE
//     (status scheduled → publishing); a zero-row result means another worker
//     (cron tick or dashboard) already took it → skipped, never double-posted.
//   • Failures mark the row status=failed with a human-readable error_message.
//
// SELF-CONTAINED (zero relative imports): the publish engine is duplicated
// here from api/social/publish.ts because this repo's Vercel runtime crashes
// multi-file function bundles (see api/gsc.ts / blog generate.ts precedent).
// =============================================================================

import crypto from 'node:crypto';

export const maxDuration = 120;

const SB_URL = process.env.SUPABASE_URL || 'https://uspshkegxhrglbpxqtil.supabase.co';
const SB_SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

class CronError extends Error {
  status: number;
  code: string;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ------------------------------------------------------------------ supabase rest (service role)
function sbHeaders(extra: Record<string, string> = {}): Record<string, string> {
  if (!SB_SERVICE) throw new CronError('server_error', 503, 'Service role key is not configured on the server.');
  return { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`, 'Content-Type': 'application/json', ...extra };
}

async function sbSelect<T>(path: string): Promise<T[]> {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbHeaders(), signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new CronError('server_error', 502, `Database read failed (HTTP ${res.status}).`);
  return (await res.json()) as T[];
}

async function sbPatch(path: string, body: Record<string, unknown>): Promise<boolean> {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: sbHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new CronError('server_error', 502, `Database update failed (HTTP ${res.status}).`);
  const rows = (await res.json()) as unknown[];
  return rows.length > 0;
}

async function logActivity(action: string, targetId: string, meta: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${SB_URL}/rest/v1/activity_log`, {
      method: 'POST',
      headers: sbHeaders({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ user_id: null, user_email: 'cron@branify.store', action, target_type: 'social_post', target_id: targetId, meta }),
      signal: AbortSignal.timeout(15000),
    });
  } catch { /* logging must never break publishing */ }
}

// ------------------------------------------------------------------ tokens
interface ConnectionRow {
  platform: string; page_id: string; page_name: string; ig_user_id: string;
  token_encrypted: string; token_expires_at: string | null;
}

function encKey(): Buffer {
  const raw = (process.env.META_TOKEN_ENCRYPTION_KEY || '').trim();
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  return crypto.createHash('sha256').update(raw || 'branify-unconfigured').digest();
}

function decryptToken(blob64: string): string {
  try {
    const buf = Buffer.from(blob64, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', encKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  } catch {
    throw new CronError('token_decrypt_failed', 502, 'Stored Meta credentials could not be decrypted.');
  }
}

async function connectionFor(platform: 'facebook' | 'instagram'): Promise<ConnectionRow> {
  const rows = await sbSelect<ConnectionRow>(
    `social_connections?platform=eq.${platform}&select=platform,page_id,page_name,ig_user_id,token_encrypted,token_expires_at&limit=1`,
  );
  if (!rows.length || !rows[0].token_encrypted) {
    throw new CronError('not_connected', 409, `${platform} is not connected.`);
  }
  const row = rows[0];
  if (row.token_expires_at && new Date(row.token_expires_at).getTime() < Date.now()) {
    throw new CronError('token_expired', 409, 'The stored Meta token has expired.');
  }
  return row;
}

// ------------------------------------------------------------------ graph publishing (same engine as publish.ts)
function graphVersion(): string {
  const v = (process.env.META_GRAPH_API_VERSION || 'v22.0').trim();
  return /^v\d+\.\d+$/.test(v) ? v : 'v22.0';
}

async function graphPost(path: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(`https://graph.facebook.com/${graphVersion()}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(45000),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: { message?: string; code?: number } };
  if (!res.ok || json.error) {
    const msg = json.error?.message || `HTTP ${res.status}`;
    if (json.error?.code === 190) throw new CronError('token_expired', 409, 'Meta rejected the stored token.');
    throw new CronError('publish_failed', 502, msg.slice(0, 220));
  }
  return json;
}

async function publishFacebook(post: { caption: string; media_url: string }, conn: ConnectionRow, token: string): Promise<string> {
  if (post.media_url) {
    const r = await graphPost(`${conn.page_id}/photos`, { url: post.media_url, caption: post.caption, access_token: token });
    return String(r.post_id || r.id || '');
  }
  const r = await graphPost(`${conn.page_id}/feed`, { message: post.caption, access_token: token });
  return String(r.id || '');
}

async function publishInstagram(post: { caption: string; media_url: string; hashtags: string[] }, conn: ConnectionRow, token: string): Promise<string> {
  if (!conn.ig_user_id) throw new CronError('no_instagram_account', 409, 'No Instagram Professional account is linked.');
  if (!post.media_url) throw new CronError('invalid_media', 400, 'Instagram posts require an image.');
  const caption = `${post.caption}${post.hashtags.length ? '\n\n' + post.hashtags.join(' ') : ''}`.slice(0, 2200);
  const container = await graphPost(`${conn.ig_user_id}/media`, { image_url: post.media_url, caption, access_token: token });
  const creationId = String(container.id || '');
  if (!creationId) throw new CronError('publish_failed', 502, 'Instagram did not return a media container id.');
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1700));
    const res = await fetch(
      `https://graph.facebook.com/${graphVersion()}/${creationId}?fields=status_code&access_token=${encodeURIComponent(token)}`,
      { signal: AbortSignal.timeout(15000) },
    );
    const st = (await res.json().catch(() => ({}))) as { status_code?: string };
    if (st.status_code === 'FINISHED') break;
    if (st.status_code === 'ERROR') throw new CronError('publish_failed', 502, 'Instagram rejected the media container.');
  }
  const published = await graphPost(`${conn.ig_user_id}/media_publish`, { creation_id: creationId, access_token: token });
  return String(published.id || '');
}

// ------------------------------------------------------------------ due pipeline
interface SocialPostRow {
  id: string; platform: 'facebook' | 'instagram'; caption: string; hashtags: string[];
  media_url: string; status: string; title: string;
}

const CLAIMABLE = 'draft,approved,scheduled,failed';

async function publishOne(post: SocialPostRow): Promise<string> {
  const conn = await connectionFor(post.platform);
  const token = decryptToken(conn.token_encrypted);
  const externalId = post.platform === 'facebook'
    ? await publishFacebook({ caption: post.caption, media_url: post.media_url }, conn, token)
    : await publishInstagram({ caption: post.caption, media_url: post.media_url, hashtags: post.hashtags || [] }, conn, token);
  if (!externalId) throw new CronError('publish_failed', 502, 'The platform did not return a post id.');
  return externalId;
}

async function finalize(post: SocialPostRow, ok: boolean, externalId: string | undefined, message?: string): Promise<void> {
  const now = new Date().toISOString();
  if (ok) {
    await sbPatch(`social_posts?id=eq.${encodeURIComponent(post.id)}`, {
      status: 'published', published_at: now, external_post_id: externalId, error_message: null, updated_at: now,
    });
    await logActivity('social.publish', post.id, { platform: post.platform, external_post_id: externalId, via: 'cron' });
  } else {
    await sbPatch(`social_posts?id=eq.${encodeURIComponent(post.id)}`, {
      status: 'failed', error_message: (message || 'Scheduled publishing failed.').slice(0, 500), updated_at: now,
    });
    await logActivity('social.publish_failed', post.id, { platform: post.platform, error: (message || '').slice(0, 300), via: 'cron' });
  }
}

// ------------------------------------------------------------------ handler
interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}
interface Res {
  setHeader(name: string, value: string): Res;
  status(code: number): Res;
  send(body: string): void;
  json(body: unknown): void;
}

export default async function handler(req: Req, res: Res): Promise<void> {
  try {
    if (String(req.method || 'GET').toUpperCase() !== 'GET') {
      throw new CronError('bad_request', 405, 'Use GET.');
    }
    const secret = (process.env.CRON_SECRET || '').trim();
    if (!secret) throw new CronError('not_configured', 503, 'CRON_SECRET is not set on the server.');
    const h = req.headers?.authorization;
    const bearer = (Array.isArray(h) ? (h[0] || '') : (h || '')).replace(/^Bearer\s+/i, '').trim();
    if (!bearer || bearer !== secret) {
      throw new CronError('unauthorized', 401, 'Invalid cron credentials.');
    }

    // auto_publish gate
    const settings = await sbSelect<{ value?: Record<string, unknown> }>(`settings?key=eq.social_publishing&select=value`);
    const cfg = (settings[0]?.value || {}) as Record<string, unknown>;
    if (cfg.auto_publish !== true) {
      res.status(200).json({ ok: true, data: { ran: true, attempted: 0, published: 0, failed: 0, skipped: 0, reason: 'auto_publish_off' } });
      return;
    }

    const due = await sbSelect<SocialPostRow>(
      `social_posts?status=eq.scheduled&scheduled_at=lte.${new Date().toISOString()}&select=id,platform,caption,hashtags,media_url,status,title&order=scheduled_at.asc&limit=10`,
    );
    const result = { ran: true, attempted: due.length, published: 0, failed: 0, skipped: 0 };
    for (const post of due) {
      try {
        // Atomic claim (idempotency): only a row still in a claimable state is taken.
        const claimed = await sbPatch(
          `social_posts?id=eq.${encodeURIComponent(post.id)}&status=in.(${CLAIMABLE})`,
          { status: 'publishing', error_message: null, updated_at: new Date().toISOString() },
        );
        if (!claimed) { result.skipped++; continue; }
        const externalId = await publishOne(post);
        await finalize(post, true, externalId);
        result.published++;
      } catch (e) {
        const message = e instanceof Error ? e.message.slice(0, 300) : 'Scheduled publishing failed.';
        await finalize(post, false, undefined, message);
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
    res.status(500).json({ ok: false, error: { code: 'internal', message: `Unexpected cron error (ref ${ref}).` } });
  }
}
