// =============================================================================
// BRANIFY — browser AI client
// -----------------------------------------------------------------------------
// The ONLY module the UI uses to reach AI features. It talks exclusively to
// this application's own server-side endpoints (/api/ai/*):
//
//   production : Vercel serverless functions (api/ai/*.ts)
//   dev/sandbox: local preview API on :3033 via the dev proxy
//
// It never sees, requests, stores or transmits any provider or gateway key —
// all of that lives on the server. Errors arrive as { kind, message } and are
// mapped to friendly, non-technical copy here.
// =============================================================================

import { supabase } from './supabase';

export type AiErrorKind =
  | 'config'
  | 'auth'
  | 'rate_limit'
  | 'model_not_found'
  | 'provider'
  | 'timeout'
  | 'unavailable'
  | 'malformed'
  | 'internal'
  | 'network'
  | string;

export class AiClientError extends Error {
  kind: AiErrorKind;
  status: number;

  constructor(kind: AiErrorKind, message: string, status: number) {
    super(message);
    this.name = 'AiClientError';
    this.kind = kind;
    this.status = status;
  }
}

export interface AiStatus {
  ok: boolean;
  gateway: 'omniroute' | string;
  configured: boolean;
  base_url_set: boolean;
  api_key_set: boolean;
  reachable: boolean | null;
  models: string[] | null;
  error_kind: string | null;
  blog_model_set: boolean;
  blog_model_source: string;
  blog_model: string;
}

export interface BlogDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author_name: string;
  author_role: string;
  seo: { title: string; description: string; keywords: string[] };
  meta: {
    model: string;
    model_source: string;
    usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  };
}

export interface BlogDraftInput {
  topic: string;
  category?: string;
  tone?: string;
  keywords?: string[];
  length?: 'short' | 'medium' | 'long';
  notes?: string;
}

const TIMEOUT_BLOG_MS = 120_000;
const TIMEOUT_STATUS_MS = 8_000;

// ------------------------------------------------------------------ internals

/**
 * Attach the signed-in admin's own Supabase session token so the optional
 * OMNIROUTE_REQUIRE_AUTH server hardening works without a second code path.
 * The token is the admin's own session JWT — never a gateway or provider key.
 * Production (Supabase mode) reads the live session; the legacy local-preview
 * keys remain as a fallback for the dev sandbox.
 */
async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) return { Authorization: `Bearer ${token}` };
  } catch { /* no Supabase session — fall through to local-preview keys */ }
  try {
    const legacy = sessionStorage.getItem('branify_admin_token')
      || localStorage.getItem('branify_admin_token');
    if (legacy) return { Authorization: `Bearer ${legacy}` };
  } catch { /* storage unavailable — proceed unauthenticated */ }
  return {};
}

async function requestJson<T>(path: string, init: RequestInit & { timeoutMs: number }): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init.timeoutMs);
  let res: Response;
  try {
    res = await fetch(path, { ...init, signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    const e = err as Error;
    if (e.name === 'AbortError') {
      throw new AiClientError('timeout', 'The AI request took too long. Please try again.', 504);
    }
    throw new AiClientError(
      'network',
      'The AI service is not reachable right now. If this is a local preview, start the local AI API (npm run api).',
      503,
    );
  }
  clearTimeout(timer);

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    throw new AiClientError('malformed', 'The AI service returned an unreadable response.', 502);
  }

  const rec = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  const errRec = (rec.error && typeof rec.error === 'object' ? rec.error : {}) as Record<string, unknown>;

  if (!res.ok || rec.ok === false) {
    const kind = typeof errRec.kind === 'string' ? errRec.kind : 'internal';
    throw new AiClientError(kind, friendlyMessage(kind, typeof errRec.message === 'string' ? errRec.message : ''), res.status);
  }
  return payload as T;
}

function friendlyMessage(kind: AiErrorKind, serverMessage: string): string {
  // Server messages are already user-safe; the switch only upgrades the
  // generic ones into actionable guidance.
  switch (kind) {
    case 'timeout':
      return serverMessage || 'The AI request timed out. Please try again.';
    case 'unavailable':
      return 'The AI gateway is offline or unreachable. Check that OmniRoute is running, then retry.';
    case 'auth':
      return 'The AI gateway rejected the request (invalid or expired gateway key). Update OMNIROUTE_API_KEY on the server.';
    case 'rate_limit':
      return 'The AI gateway is rate limiting requests. Wait a moment and try again.';
    case 'model_not_found':
      return 'The configured AI model was not found on the gateway. Check OMNIROUTE_BLOG_MODEL.';
    case 'config':
      return serverMessage || 'The AI feature is not fully configured on the server yet.';
    case 'malformed':
      return serverMessage || 'The AI response could not be read. Please retry.';
    case 'network':
      return serverMessage;
    default:
      return serverMessage || 'The AI request failed. Please try again.';
  }
}

// ------------------------------------------------------------------ public API

export async function fetchAiStatus(probe = false): Promise<AiStatus> {
  return requestJson<AiStatus>(`/api/ai/status${probe ? '?probe=1' : ''}`, {
    method: 'GET',
    headers: { ...(await authHeaders()) },
    timeoutMs: TIMEOUT_STATUS_MS,
  });
}

export async function generateAiBlog(input: BlogDraftInput): Promise<BlogDraft> {
  const res = await requestJson<{ draft: BlogDraft }>('/api/ai/blog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(input),
    timeoutMs: TIMEOUT_BLOG_MS,
  });
  return res.draft;
}

export async function generateAiText(prompt: string, opts: { temperature?: number; max_tokens?: number } = {}): Promise<string> {
  const res = await requestJson<{ content: string }>('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ prompt, ...opts }),
    timeoutMs: TIMEOUT_BLOG_MS,
  });
  return res.content;
}
