// =============================================================================
// BRANIFY ADMIN — Social Media client (browser side, Phase 2)
// -----------------------------------------------------------------------------
// Talks to the serverless endpoints:
//   POST /api/social/generate   (AI social post generation — 4 modes)
//   POST /api/social/publish    (publish one post / run due batch)
// Mirrors the AI blog client (aiBlog.ts). Provider + Meta credentials stay
// server-side; the browser receives generated text / publish results only.
// =============================================================================

import { supabase } from '../../lib/supabase';
import type { SocialPlatform, SocialContentType } from './types';

// In local dev (sandbox preview) there is no /api route — call the live
// endpoint (CORS-allowlisted). Compiled out of production builds.
const DEV = Boolean((import.meta as { env?: Record<string, unknown> }).env?.DEV);
const GEN_BASE = DEV ? 'https://branify.store/api/social' : '/api/social';

export class SocialApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ------------------------------------------------------------------ types
export type SocialGenMode = 'single' | 'weekly' | 'from_blog' | 'from_service';
export type SocialTone = 'professional' | 'expert' | 'conversational' | 'premium';

export interface GeneratedSocialPost {
  platform: SocialPlatform;
  content_type: SocialContentType;
  title: string;
  caption: string;
  hashtags: string[];
  cta: string;
  image_prompt: string;
  alt_text: string;
  creative_prompt: string;
  day: string;
}

export interface GenerateSocialPayload {
  mode: SocialGenMode;
  platform?: 'facebook' | 'instagram' | 'both';
  content_type?: string;
  topic?: string;
  service?: string;
  audience?: string;
  cta?: string;
  tone?: SocialTone;
  include_hashtags?: boolean;
  include_creative_prompt?: boolean;
  recentCaptions?: string[];
  recentTitles?: string[];
  blog?: { title: string; url: string; excerpt?: string };
  serviceData?: { name: string; slug: string; url: string; description?: string; tagline?: string };
}

export interface GenerateSocialResult {
  posts: GeneratedSocialPost[];
  model: string;
  provider: string;
  durationMs: number;
}

export interface PublishDueResult {
  ran: boolean;
  attempted: number;
  published: number;
  failed: number;
  skipped: number;
  reason?: string;
}

// ------------------------------------------------------------------ auth + call
const REQUEST_TIMEOUT_MS = 150_000;

async function adminToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new SocialApiError('unauthorized', 401, 'Sign in to BRANIFY Admin first.');
  return token;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${GEN_BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await adminToken()}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (e) {
    const aborted = e instanceof Error && (e.name === 'AbortError' || /abort/i.test(e.message || ''));
    throw new SocialApiError(aborted ? 'timeout' : 'network', aborted ? 504 : 502,
      aborted
        ? 'The request took too long and was stopped. Try again.'
        : 'Could not reach the social service. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }

  let json: { ok?: boolean; data?: T; error?: { code: string; message: string } } | null = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok || !json?.ok) {
    const code = json?.error?.code || (res.status === 404 ? 'service_missing' : 'upstream');
    const message = json?.error?.message
      || (code === 'service_missing'
        ? 'The social service is not reachable yet — deploy the latest build or retry in a minute.'
        : 'The request failed.');
    throw new SocialApiError(code, res.status, message);
  }
  return json.data as T;
}

/** Authenticated call with one automatic retry after session refresh. */
async function callWithRetry<T>(path: string, body: unknown): Promise<T> {
  try {
    return await postJson<T>(path, body);
  } catch (e) {
    if (e instanceof SocialApiError && (e.code === 'unauthorized' || e.status === 401)) {
      await supabase.auth.refreshSession();
      return postJson<T>(path, body);
    }
    throw e;
  }
}

// ------------------------------------------------------------------ public api
export function generateSocialContent(payload: GenerateSocialPayload): Promise<GenerateSocialResult> {
  return callWithRetry<GenerateSocialResult>('generate', payload);
}

export function publishSocialPost(id: string): Promise<{ platform: string; external_post_id: string }> {
  return callWithRetry('publish', { id });
}

export function publishDueNow(): Promise<PublishDueResult> {
  return callWithRetry('publish', { due: true });
}

/** OAuth start URL (regular navigation — the server 302s to Meta's dialog). */
export function metaOAuthStartUrl(platform: 'facebook' | 'instagram'): string {
  return `/api/meta/oauth/start?platform=${platform}`;
}

/** Human-readable messages for the ?connect_error= codes the callback redirects with. */
export function connectErrorMessage(code: string): string {
  const map: Record<string, string> = {
    denied: 'Connection was declined at the Meta consent screen. Connect again and approve the permissions.',
    cancelled: 'Connection was cancelled before finishing.',
    invalid_state: 'The connection attempt could not be verified (expired or tampered link). Start again.',
    not_configured: 'Meta is not configured on the server yet (META_APP_ID / META_APP_SECRET). See the setup notes in the Social Media page.',
    token_exchange_failed: 'Meta did not accept the connection code. Try again — if it persists, check the Meta App settings and redirect URI.',
    no_pages: 'No Facebook Page is manageable by this account. Create a Page or grant the app access to it.',
    no_instagram_account: 'No Instagram Professional account is linked to the connected Facebook Page. Link one in Meta Business Suite, then reconnect.',
    network: 'Network issue while connecting. Try again.',
    server_error: 'The connection could not be saved (server issue). Try again shortly.',
  };
  return map[code] || 'Connection failed. Try again.';
}
