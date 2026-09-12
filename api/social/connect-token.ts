// =============================================================================
// BRANIFY — Social Connections · manual system-user token install (SERVER ONLY)
// -----------------------------------------------------------------------------
// POST /api/social/connect-token   Authorization: Bearer <admin Supabase JWT>
//   Body { token, page_id? }
//
// Alternative connect path for the Meta "System User" token minted in
// Business Manager (Business Settings → System Users → Generate token).
// A system-user token NEVER expires (unlike the 60-day OAuth user token),
// so this path removes reconnect churn for a single-brand setup. The normal
// OAuth flow (Admin → Social → Connect) remains fully available as the
// primary/reconnect path — this endpoint only writes the same
// public.social_connections rows the OAuth callback would write.
//
// Server-side steps:
//   1. Admin JWT verification (same as /api/social/publish).
//   2. debug_token check: token must belong to THIS Meta app, be valid, and
//      carry pages_manage_posts (+ instagram_* for the IG row).
//   3. /me/accounts discovery: pages visible to the token (+ linked IG
//      Professional account), take the PAGE access token (never the raw
//      system-user token) — identical storage shape to the OAuth callback.
//   4. AES-256-GCM encrypt (META_TOKEN_ENCRYPTION_KEY) → upsert
//      social_connections with the service-role key → activity_log.
//
// The token travels once in the request body over TLS, is never persisted in
// plaintext, never logged, and never returned to the client.
//
// SELF-CONTAINED (zero relative imports) — repo's Vercel runtime constraint.
// =============================================================================

import crypto from 'node:crypto';

export const maxDuration = 30;

const CORS_ORIGINS = [
  'https://branify.store',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const SB_URL = process.env.SUPABASE_URL || 'https://uspshkegxhrglbpxqtil.supabase.co';
const SB_ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_X11QDwMSfS2ivSePRVDpLQ_xNFY_8vw';
const SB_SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

class ConnError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

interface Req {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}
interface Res {
  setHeader(name: string, value: string | string[]): Res;
  status(code: number): Res;
  send(body: string): void;
  json(body: unknown): void;
}

function cors(origin: string, res: Res): void {
  if (CORS_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function bearerOf(req: Req): string {
  const h = req.headers?.authorization;
  const raw = Array.isArray(h) ? (h[0] || '') : (h || '');
  return raw.replace(/^Bearer\s+/i, '').trim();
}

// ------------------------------------------------------------------ admin verification
async function verifyAdmin(token: string): Promise<{ id: string; email: string }> {
  if (!token) throw new ConnError('unauthorized', 401, 'Sign in to BRANIFY Admin first.');
  const uRes = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } });
  if (!uRes.ok) throw new ConnError('unauthorized', 401, 'Your admin session is invalid or expired. Sign in again.');
  const user = (await uRes.json()) as { id?: string; email?: string };
  if (!user?.email) throw new ConnError('unauthorized', 401, 'Your admin session is invalid or expired. Sign in again.');
  const aRes = await fetch(
    `${SB_URL}/rest/v1/admin_users?email=eq.${encodeURIComponent(user.email)}&select=email,active,role`,
    { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } },
  );
  if (!aRes.ok) throw new ConnError('upstream', 502, 'Admin verification failed.');
  const admins = (await aRes.json()) as Array<{ email: string; active: boolean }>;
  if (!admins.some((a) => a.active)) throw new ConnError('forbidden', 403, 'This account is not on the BRANIFY admin allowlist.');
  return { id: user.id || user.email, email: user.email };
}

// ------------------------------------------------------------------ supabase rest (service role)
function sbHeaders(extra: Record<string, string> = {}): Record<string, string> {
  if (!SB_SERVICE) throw new ConnError('server_error', 503, 'Service role key is not configured on the server.');
  return { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`, 'Content-Type': 'application/json', ...extra };
}

async function restUpsertConnection(row: Record<string, unknown>): Promise<void> {
  const res = await fetch(
    `${SB_URL}/rest/v1/social_connections?onConflict=platform`,
    {
      method: 'POST',
      headers: sbHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!res.ok) throw new ConnError('server_error', 502, `Database write failed (HTTP ${res.status}).`);
}

async function logActivity(email: string, action: string, targetId: string, meta: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${SB_URL}/rest/v1/activity_log`, {
      method: 'POST',
      headers: sbHeaders({ Prefer: 'return=minimal' }),
      body: JSON.stringify({
        user_id: null, user_email: email || 'system', action,
        target_type: 'social_connection', target_id: targetId, meta,
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch { /* logging must never break connecting */ }
}

// ------------------------------------------------------------------ crypto (same vault as OAuth callback)
function encKey(): Buffer {
  const raw = (process.env.META_TOKEN_ENCRYPTION_KEY || '').trim();
  // Accept a 64-char hex key directly; anything else is hashed to 32 bytes.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  return crypto.createHash('sha256').update(raw || 'branify-unconfigured').digest();
}

function encryptToken(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

// ------------------------------------------------------------------ meta api
async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`;
    throw new ConnError('meta_rejected', 400, msg.slice(0, 200));
  }
  return json;
}

interface DebugInfo {
  is_valid?: boolean;
  app_id?: string;
  type?: string;
  user_id?: string;
  expires_at?: number;
  scopes?: string[];
  error?: { message?: string };
}
interface IgAccount { id?: string; username?: string }
interface PageEntry { id?: string; name?: string; access_token?: string; instagram_business_account?: IgAccount }

export default async function handler(req: Req, res: Res): Promise<void> {
  const h = req.headers || {};
  const origin = String((Array.isArray(h.origin) ? h.origin[0] : h.origin) || '');
  try {
    cors(origin, res);
    const method = String(req.method || 'GET').toUpperCase();
    if (method === 'OPTIONS') { res.status(204).send(''); return; }
    if (method !== 'POST') throw new ConnError('bad_request', 405, 'Use POST.');

    const admin = await verifyAdmin(bearerOf(req));

    const appId = (process.env.META_APP_ID || '').trim();
    const appSecret = (process.env.META_APP_SECRET || '').trim();
    if (!appId || !appSecret) throw new ConnError('not_configured', 503, 'Meta app credentials are not configured on the server.');
    if (!SB_SERVICE) throw new ConnError('server_error', 503, 'Service role key is not configured on the server.');

    // ---- body
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const token = String(body.token || '').trim();
    const wantPageId = String(body.page_id || '').trim();
    if (!/^[A-Za-z0-9_-]{20,2000}$/.test(token)) {
      throw new ConnError('bad_token', 400, 'That does not look like a Meta access token. Paste the full token string from Business Settings → System Users → Generate token.');
    }

    const ver = (process.env.META_GRAPH_API_VERSION || 'v22.0').trim();

    // ---- 1) token must belong to THIS app and carry the scopes we need
    const appAt = `${appId}|${appSecret}`;
    const dbg = await getJson<{ data?: DebugInfo }>(
      `https://graph.facebook.com/${ver}/debug_token?input_token=${encodeURIComponent(token)}` +
      `&access_token=${encodeURIComponent(appAt)}`,
    );
    const info = dbg.data || {};
    if (!info.is_valid) throw new ConnError('invalid_token', 400, 'Meta reports this token as invalid or revoked. Generate a fresh one.');
    if (String(info.app_id) !== appId) throw new ConnError('wrong_app', 400, 'This token belongs to a different Meta app. Generate it for the Branify blog app.');
    const scopes = (info.scopes || []).filter((s) => /^[a-z_]{1,64}$/.test(s));
    const has = (s: string) => scopes.includes(s);
    if (!has('pages_manage_posts') || !has('pages_show_list')) {
      throw new ConnError('missing_scopes', 400, 'Re-generate the token with at least: pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish.');
    }

    // ---- 2) discover pages (+ linked IG professional account), take page tokens
    const pagesRes = await getJson<{ data?: PageEntry[] }>(
      `https://graph.facebook.com/${ver}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}` +
      `&access_token=${encodeURIComponent(token)}&limit=50`,
    );
    const pages = (pagesRes.data || []).filter((p) => p.id && p.access_token);
    if (!pages.length) throw new ConnError('no_pages', 400, 'No Facebook Pages are visible to this token. Assign the Page to the system user in Business Settings → System Users → Assigned assets.');

    const chosen = (wantPageId && pages.find((p) => p.id === wantPageId))
      || pages.find((p) => p.instagram_business_account?.id)
      || pages[0];
    const pageToken = chosen.access_token as string;
    const ig = chosen.instagram_business_account;

    // ---- 3) store rows (same shape as the OAuth callback)
    const now = new Date().toISOString();
    const connected: string[] = [];
    const missing: string[] = [];
    if (!has('instagram_basic')) missing.push('instagram_basic');
    if (!has('instagram_content_publish')) missing.push('instagram_content_publish');

    await restUpsertConnection({
      platform: 'facebook',
      page_id: chosen.id,
      page_name: chosen.name || '',
      ig_user_id: ig?.id || '',
      ig_username: ig?.username || '',
      token_encrypted: encryptToken(pageToken),
      token_kind: 'page',
      token_expires_at: null, // system-user derived page tokens do not expire
      scopes,
      connected_by: 'system-user',
      connected_at: now,
      updated_at: now,
      metadata: { graph_version: ver, token_type: info.type || 'system_user', method: 'manual_token' },
    });
    connected.push('facebook');

    if (ig?.id && has('instagram_basic') && has('instagram_content_publish')) {
      await restUpsertConnection({
        platform: 'instagram',
        page_id: chosen.id,
        page_name: chosen.name || '',
        ig_user_id: ig.id,
        ig_username: ig.username || '',
        token_encrypted: encryptToken(pageToken), // IG content publish uses the linked Page token
        token_kind: 'page',
        token_expires_at: null,
        scopes,
        connected_by: 'system-user',
        connected_at: now,
        updated_at: now,
        metadata: { graph_version: ver, token_type: info.type || 'system_user', method: 'manual_token' },
      });
      connected.push('instagram');
    } else if (ig?.id) {
      missing.push('(re-run after adding the instagram scopes to link Instagram)');
    }

    await logActivity(admin.email, 'social.connect', String(chosen.id), {
      method: 'manual_system_token', token_type: info.type || 'system_user',
      page_id: chosen.id, page_name: chosen.name || '', instagram: ig?.id || null,
      connected, missing_scopes: missing,
    });

    res.status(200).json({
      ok: true,
      data: {
        connected,
        page: { id: chosen.id, name: chosen.name || '' },
        instagram: ig?.id ? { id: ig.id, username: ig.username || '' } : null,
        missing_scopes: missing,
        note: missing.length ? 'Facebook is live. Re-generate the token with the listed scopes and POST again to add Instagram.' : '',
      },
    });
  } catch (e) {
    if (e instanceof ConnError) {
      res.status(e.status).json({ ok: false, error: { code: e.code, message: e.message } });
      return;
    }
    const ref = crypto.randomUUID().slice(0, 8);
    console.error(`[social-connect-token:${ref}]`, e instanceof Error ? e.message : e);
    res.status(500).json({ ok: false, error: { code: 'internal', message: `Unexpected connection error (ref ${ref}).` } });
  }
}
