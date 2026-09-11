// =============================================================================
// BRANIFY — Meta OAuth · CALLBACK (server-side only)
// -----------------------------------------------------------------------------
// GET /api/meta/oauth/callback?code=…&state=…
//
// Meta redirects the admin's browser here after consent. Server-side steps:
//   1. Validate OAuth state (cookie copy + HMAC signature, constant-time).
//   2. Exchange the authorization code for a short-lived user token.
//   3. Exchange for a long-lived user token (fb_exchange_token grant).
//   4. Resolve Pages (+ Instagram Professional account linked to a Page) and
//      take the Page access token (long-lived when derived from a long-lived
//      user token) — it covers both Facebook feed/photo publishing and
//      Instagram content publishing through the linked IG account.
//   5. Encrypt token material (AES-256-GCM, META_TOKEN_ENCRYPTION_KEY) and
//      upsert public.social_connections with the SERVICE-ROLE key (RLS bypass
//      happens server-side only; the browser receives a redirect, no data).
//   6. Redirect back to /admin/social?connected=… or ?connect_error=…
//
// The browser NEVER sees: app secret, access tokens, encryption key, or raw
// provider errors (all mapped to short safe codes).
//
// SELF-CONTAINED (zero relative imports) — repo's Vercel runtime constraint.
// =============================================================================

import crypto from 'node:crypto';

export const maxDuration = 30;

const SB_URL = process.env.SUPABASE_URL || 'https://uspshkegxhrglbpxqtil.supabase.co';
// Service role ONLY inside serverless functions — used here because the OAuth
// callback carries no admin JWT (it is a browser redirect from Meta).
const SB_SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const ADMIN_ORIGIN = (process.env.APP_URL || 'https://branify.store').replace(/\/+$/, '');
const DEFAULT_REDIRECT_URI = 'https://branify.store/api/meta/oauth/callback';

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined> | URLSearchParams;
}
interface Res {
  setHeader(name: string, value: string | string[]): Res;
  status(code: number): Res;
  send(body: string): void;
  json(body: unknown): void;
}

function q(req: Req, name: string): string {
  const raw = req.query instanceof URLSearchParams ? req.query.get(name) : req.query?.[name];
  const val = Array.isArray(raw) ? raw[0] : raw;
  return (val || '').toString();
}

function cookieOf(req: Req, name: string): string {
  const h = req.headers?.cookie;
  const raw = Array.isArray(h) ? h.join(';') : (h || '');
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return '';
}

function redirectTo(res: Res, path: string): void {
  res.setHeader('Location', `${ADMIN_ORIGIN}${path}`);
  res.status(302).send('');
}

// ------------------------------------------------------------------ crypto
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

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ------------------------------------------------------------------ meta api
interface TokenResponse { access_token?: string; token_type?: string; expires_in?: number; error?: { message?: string } }
interface IgAccount { id?: string; username?: string }
interface PageEntry { id?: string; name?: string; access_token?: string; instagram_business_account?: IgAccount }

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg.slice(0, 200));
  }
  return json;
}

async function restUpsertConnection(row: Record<string, unknown>): Promise<void> {
  if (!SB_SERVICE) throw new Error('service_role_missing');
  const res = await fetch(
    `${SB_URL}/rest/v1/social_connections?onConflict=platform`,
    {
      method: 'POST',
      headers: {
        apikey: SB_SERVICE,
        Authorization: `Bearer ${SB_SERVICE}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!res.ok) throw new Error(`supabase_${res.status}`);
}

// ------------------------------------------------------------------ handler
export default async function handler(req: Req, res: Res): Promise<void> {
  try {
    const code = q(req, 'code');
    const stateParam = q(req, 'state');
    const oauthError = q(req, 'error');
    const cookieState = cookieOf(req, 'meta_oauth_state');
    const platformCookie = cookieOf(req, 'meta_oauth_platform') === 'instagram' ? 'instagram' : 'facebook';

    const bail = (reason: string) => { redirectTo(res, `/admin/social?connect_error=${encodeURIComponent(reason)}`); };

    // 0) user-cancelled / denied at the consent screen
    if (oauthError) { bail(oauthError === 'access_denied' ? 'denied' : 'cancelled'); return; }

    // 1) state: presence, signature, cookie match (CSRF) — before any exchange
    const appId = (process.env.META_APP_ID || '').trim();
    const appSecret = (process.env.META_APP_SECRET || '').trim();
    if (!appId || !appSecret) { bail('not_configured'); return; }
    if (!code || !stateParam || !cookieState || !safeEqual(stateParam, cookieState)) { bail('invalid_state'); return; }
    const dot = stateParam.indexOf('.');
    const random = dot > 0 ? stateParam.slice(0, dot) : '';
    const sig = dot > 0 ? stateParam.slice(dot + 1) : '';
    const expectedSig = crypto.createHmac('sha256', appSecret).update(random).digest('hex');
    if (!random || !sig || !safeEqual(sig, expectedSig)) { bail('invalid_state'); return; }

    if (!SB_SERVICE) { bail('server_error'); return; }

    const ver = (process.env.META_GRAPH_API_VERSION || 'v22.0').trim();
    const redirectUri = (process.env.META_REDIRECT_URI || DEFAULT_REDIRECT_URI).trim();

    // 2) code → short-lived user token
    const shortTok = await getJson<TokenResponse>(
      `https://graph.facebook.com/${ver}/oauth/access_token?client_id=${encodeURIComponent(appId)}` +
      `&client_secret=${encodeURIComponent(appSecret)}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${encodeURIComponent(code)}`,
    );
    if (!shortTok.access_token) { bail('token_exchange_failed'); return; }

    // 3) → long-lived user token
    const longTok = await getJson<TokenResponse>(
      `https://graph.facebook.com/${ver}/oauth/access_token?grant_type=fb_exchange_token` +
      `&client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}` +
      `&fb_exchange_token=${encodeURIComponent(shortTok.access_token)}`,
    );
    const userToken = longTok.access_token || shortTok.access_token;

    // 4) pages + instagram professional account
    const pagesRes = await getJson<{ data?: PageEntry[] }>(
      `https://graph.facebook.com/${ver}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}` +
      `&access_token=${encodeURIComponent(userToken)}&limit=50`,
    );
    const pages = (pagesRes.data || []).filter((p) => p.id && p.access_token);
    if (!pages.length) { bail('no_pages'); return; }

    const wantIg = platformCookie === 'instagram';
    const chosen = wantIg ? (pages.find((p) => p.instagram_business_account?.id) || pages[0]) : pages[0];
    const pageToken = chosen.access_token as string;
    const ig = chosen.instagram_business_account;

    const expiresAt = longTok.expires_in
      ? new Date(Date.now() + Number(longTok.expires_in) * 1000).toISOString()
      : null; // null ≈ long-lived token without documented expiry (reconnect refreshes)

    const now = new Date().toISOString();
    const scopes = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'instagram_basic', 'instagram_content_publish', 'business_management'];
    const connected: string[] = [];

    await restUpsertConnection({
      platform: 'facebook',
      page_id: chosen.id,
      page_name: chosen.name || '',
      ig_user_id: ig?.id || '',
      ig_username: ig?.username || '',
      token_encrypted: encryptToken(pageToken),
      token_kind: 'page',
      token_expires_at: expiresAt,
      scopes,
      connected_by: 'meta-oauth',
      connected_at: now,
      updated_at: now,
      metadata: { graph_version: ver, user_token_expires_in: longTok.expires_in || null },
    });
    connected.push('facebook');

    if (ig?.id) {
      await restUpsertConnection({
        platform: 'instagram',
        page_id: chosen.id,
        page_name: chosen.name || '',
        ig_user_id: ig.id,
        ig_username: ig.username || '',
        token_encrypted: encryptToken(pageToken), // IG content publish uses the linked Page token
        token_kind: 'page',
        token_expires_at: expiresAt,
        scopes,
        connected_by: 'meta-oauth',
        connected_at: now,
        updated_at: now,
        metadata: { graph_version: ver },
      });
      connected.push('instagram');
    } else if (wantIg) {
      bail('no_instagram_account'); return; // facebook row already stored
    }

    // 6) back to the dashboard — success banner is rendered client-side
    res.setHeader('Set-Cookie', [
      'meta_oauth_state=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax',
      'meta_oauth_platform=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax',
    ]);
    redirectTo(res, `/admin/social?connected=${connected.join(',')}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    const safe = /supabase_/.test(msg) ? 'server_error'
      : /service_role_missing/.test(msg) ? 'server_error'
      : /timed?_?out|abort/i.test(msg) ? 'network'
      : 'token_exchange_failed';
    redirectTo(res, `/admin/social?connect_error=${safe}`);
  }
}
