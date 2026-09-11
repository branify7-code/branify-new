// =============================================================================
// BRANIFY — Meta OAuth · START (server-side only)
// -----------------------------------------------------------------------------
// GET /api/meta/oauth/start?platform=facebook|instagram
//
// The admin clicks "Connect Facebook/Instagram" in Admin → Social Media. This
// endpoint builds a CSRF-safe OAuth redirect:
//   • state = random + HMAC-SHA256(random, META_APP_SECRET) — the callback
//     verifies both the cookie copy and the signature before exchanging code.
//   • state travels in an HttpOnly + Secure + SameSite=Lax cookie (600s).
//   • The browser is 302-redirected to Meta's OAuth dialog.
//
// Secrets: META_APP_SECRET never leaves this process; only client_id (public)
// appears in the redirect URL. No tokens exist yet at this stage.
//
// SELF-CONTAINED (zero relative imports) — required by this repo's Vercel
// runtime (multi-file function bundles crash; single-file functions work).
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

const DEFAULT_REDIRECT_URI = 'https://branify.store/api/meta/oauth/callback';
// Admin dashboard origin used for error redirects. APP_URL wins when set.
const ADMIN_ORIGIN = (process.env.APP_URL || 'https://branify.store').replace(/\/+$/, '');

const SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
  'business_management',
].join(',');

function graphVersion(): string {
  const v = (process.env.META_GRAPH_API_VERSION || 'v22.0').trim();
  return /^v\d+\.\d+$/.test(v) ? v : 'v22.0';
}

function redirectUri(): string {
  return (process.env.META_REDIRECT_URI || DEFAULT_REDIRECT_URI).trim();
}

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

function cors(origin: string, res: Res): void {
  if (CORS_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function redirectTo(res: Res, path: string): void {
  res.setHeader('Location', `${ADMIN_ORIGIN}${path}`);
  res.status(302).send('');
}

export default async function handler(req: Req, res: Res): Promise<void> {
  const h = req.headers || {};
  const origin = String((Array.isArray(h.origin) ? h.origin[0] : h.origin) || '');
  try {
    cors(origin, res);
    const method = String(req.method || 'GET').toUpperCase();
    if (method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (method !== 'GET') {
      res.status(405).json({ ok: false, error: { code: 'bad_request', message: 'Use GET.' } });
      return;
    }

    const platform = q(req, 'platform') === 'instagram' ? 'instagram' : 'facebook';
    const appId = (process.env.META_APP_ID || '').trim();
    const appSecret = (process.env.META_APP_SECRET || '').trim();
    if (!appId || !appSecret) {
      // Meta app not configured yet — send the admin back with a safe reason.
      redirectTo(res, '/admin/social?connect_error=not_configured');
      return;
    }

    // CSRF-safe state: random + HMAC signature (key = app secret, server-only).
    const random = crypto.randomBytes(24).toString('hex');
    const sig = crypto.createHmac('sha256', appSecret).update(random).digest('hex');
    const state = `${random}.${sig}`;

    const cookieBase = 'Path=/; Max-Age=600; Secure; HttpOnly; SameSite=Lax';
    res.setHeader('Set-Cookie', [
      `meta_oauth_state=${state}; ${cookieBase}`,
      `meta_oauth_platform=${platform}; ${cookieBase}`,
    ]);

    const url =
      `https://www.facebook.com/${graphVersion()}/dialog/oauth` +
      `?client_id=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri())}` +
      `&state=${encodeURIComponent(state)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(SCOPES)}`;
    res.setHeader('Location', url);
    res.status(302).send('');
  } catch {
    redirectTo(res, '/admin/social?connect_error=server_error');
  }
}
