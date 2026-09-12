// =============================================================================
// BRANIFY — OmniRoute AI Gateway client (SERVER-SIDE ONLY)
// -----------------------------------------------------------------------------
// Single entry point for every AI request the application makes. Talks to a
// local/self-hosted OmniRoute gateway using its OpenAI-compatible HTTP API:
//
//   POST ${OMNIROUTE_BASE_URL}/chat/completions
//   Authorization: Bearer ${OMNIROUTE_API_KEY}
//   Content-Type: application/json
//
// SECURITY CONTRACT
//   * This module MUST only be imported from server code (Vercel functions in
//     /api, the dev local API). NEVER import it from browser bundles — the
//     gateway key would leak.
//   * Provider keys (OpenAI / Gemini / Claude / DeepSeek / Groq) live inside
//     the OmniRoute gateway only. This app knows exactly one secret: the
//     OmniRoute client key, read from the environment, never logged, and
//     redacted from any error text before it leaves the server.
// STREAMING
//   * generateWithOmniRoute() accepts stream:true and returns the upstream
//     SSE body untouched, so streaming can be switched on later without an
//     architectural rewrite (handlers already pass the bytes through).
// =============================================================================

// ------------------------------------------------------------------ types

export type OmniRouteRole = 'system' | 'user' | 'assistant';

export interface OmniRouteMessage {
  role: OmniRouteRole;
  content: string;
}

export interface OmniRouteChatOptions {
  /** Model id / Combo id, e.g. the BLOG-WRITER combo. From env, never hardcoded inline. */
  model: string;
  messages: OmniRouteMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  /** Abort the request after this many ms (default OMNIROUTE_TIMEOUT_MS or 60s). */
  timeout_ms?: number;
  /** When true, resolves with the raw SSE stream instead of parsed content. */
  stream?: boolean;
}

export interface OmniRouteUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

/** Result of a standard (non-streaming) completion. */
export interface OmniRouteChatResult {
  stream: false;
  content: string;
  finish_reason: string | null;
  model: string;
  usage: OmniRouteUsage | null;
}

/** Result of a streaming completion — the raw SSE body is passed through. */
export interface OmniRouteStreamResult {
  stream: true;
  body: ReadableStream<Uint8Array>;
  content_type: string;
  status: number;
}

export type OmniRouteResult = OmniRouteChatResult | OmniRouteStreamResult;

export type OmniRouteErrorKind =
  | 'config'          // env vars missing/invalid — server misconfiguration
  | 'auth'            // gateway rejected the client key (401/403)
  | 'rate_limit'      // 429
  | 'model_not_found' // unknown model/combo id
  | 'provider'        // upstream provider failed (5xx behind the gateway)
  | 'timeout'         // request exceeded the allowed time
  | 'unavailable'     // gateway not reachable (connection refused / DNS)
  | 'malformed';      // gateway replied but the body is not valid OpenAI JSON

export class OmniRouteError extends Error {
  kind: OmniRouteErrorKind;
  status: number;
  /** Upstream context already stripped of anything secret — safe to show/log. */
  detail?: string;

  constructor(kind: OmniRouteErrorKind, message: string, status: number, detail?: string) {
    super(message);
    this.name = 'OmniRouteError';
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
}

export interface OmniRouteEnv {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
}

// ------------------------------------------------------------------ env helpers

const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * Read + validate the OmniRoute environment. Throws OmniRouteError('config')
 * with an actionable message when required variables are missing.
 */
export function getOmniRouteEnv(): OmniRouteEnv {
  const baseUrl = (process.env.OMNIROUTE_BASE_URL || '').trim().replace(/\/+$/, '');
  const apiKey = (process.env.OMNIROUTE_API_KEY || '').trim();

  if (!baseUrl) {
    throw new OmniRouteError(
      'config',
      'The AI gateway is not configured (missing OMNIROUTE_BASE_URL).',
      500,
      'Set OMNIROUTE_BASE_URL (e.g. http://localhost:20128/v1) in the server environment.',
    );
  }
  if (!apiKey) {
    throw new OmniRouteError(
      'config',
      'The AI gateway is not configured (missing OMNIROUTE_API_KEY).',
      500,
      'Set OMNIROUTE_API_KEY to the OmniRoute client key created for BRANIFY.',
    );
  }
  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new OmniRouteError(
      'config',
      'The AI gateway is configured with an invalid OMNIROUTE_BASE_URL.',
      500,
      'OMNIROUTE_BASE_URL must start with http:// or https://.',
    );
  }

  const parsedTimeout = Number(process.env.OMNIROUTE_TIMEOUT_MS || '');
  const timeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout >= 1_000
    ? parsedTimeout
    : DEFAULT_TIMEOUT_MS;

  return { baseUrl, apiKey, timeoutMs };
}

/**
 * Resolve the model used for generic completions:
 * OMNIROUTE_DEFAULT_MODEL → OMNIROUTE_BLOG_MODEL → null (caller decides fallback).
 */
export function resolveDefaultModel(): { model: string | null; source: string } {
  const def = (process.env.OMNIROUTE_DEFAULT_MODEL || '').trim();
  if (def) return { model: def, source: 'OMNIROUTE_DEFAULT_MODEL' };
  const blog = (process.env.OMNIROUTE_BLOG_MODEL || '').trim();
  if (blog) return { model: blog, source: 'OMNIROUTE_BLOG_MODEL' };
  return { model: null, source: 'unset' };
}

/**
 * Optional server-side allowlist for client-supplied model ids on the generic
 * endpoint. Comma-separated env value; when unset, client model overrides are
 * rejected (the env-configured default is used instead) — this keeps /api/ai
 * from becoming an open proxy to arbitrary models.
 */
export function modelAllowedByAllowlist(model: string): boolean {
  const raw = (process.env.OMNIROUTE_ALLOWED_MODELS || '').trim();
  if (!raw) return false;
  return raw.split(',').map((m) => m.trim()).filter(Boolean).includes(model);
}

// ------------------------------------------------------------------ redaction

/**
 * Strip anything that looks like a secret from text before it is stored,
 * logged, or returned to a client: the configured gateway key itself plus
 * common provider key shapes (sk-…, AIza…).
 */
export function redactSecrets(input: string): string {
  let out = input;
  const key = (process.env.OMNIROUTE_API_KEY || '').trim();
  if (key && out.includes(key)) out = out.split(key).join('[redacted]');
  out = out.replace(/sk-[A-Za-z0-9_-]{6,}/g, '[redacted]');
  out = out.replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted]');
  return out;
}

/** Safe console logging — redacts secret-shaped substrings, never logs headers. */
export function logSafe(...parts: unknown[]): void {
  const line = parts
    .map((p) => (typeof p === 'string' ? p : JSON.stringify(p)))
    .map((p) => (typeof p === 'string' ? redactSecrets(p) : p))
    .join(' ');
  console.log(`[omniroute] ${line}`);
}

// ------------------------------------------------------------------ core client

interface UpstreamFailure {
  kind: OmniRouteErrorKind;
  status: number;
  message: string;
  detail?: string;
}

function mapHttpStatus(status: number, bodyPreview: string): UpstreamFailure {
  const detail = bodyPreview ? bodyPreview.slice(0, 400) : undefined;
  if (status === 401 || status === 403) {
    return {
      kind: 'auth',
      status: 502,
      message: 'The AI gateway rejected this application’s credentials.',
      detail,
    };
  }
  if (status === 404) {
    return {
      kind: 'model_not_found',
      status: 502,
      message: 'The AI gateway does not know the requested model or combo.',
      detail,
    };
  }
  if (status === 429) {
    return {
      kind: 'rate_limit',
      status: 429,
      message: 'The AI gateway is rate limiting requests. Please retry in a moment.',
      detail,
    };
  }
  if (status === 400) {
    return {
      kind: 'provider',
      status: 502,
      message: 'The AI gateway rejected the request as invalid.',
      detail,
    };
  }
  if (status >= 500) {
    return {
      kind: 'provider',
      status: 502,
      message: 'The AI gateway’s upstream provider failed to complete the request.',
      detail,
    };
  }
  return {
    kind: 'provider',
    status: 502,
    message: `The AI gateway returned an unexpected status (${status}).`,
    detail,
  };
}

/**
 * Core OpenAI-compatible call to the OmniRoute gateway.
 * Validates env, enforces timeout, maps every failure into OmniRouteError,
 * and never includes credentials in results, errors, or logs.
 *
 * Overloads: omit `stream` (or pass false) → parsed chat result;
 * pass `stream: true` → the raw SSE body for pass-through.
 */
export async function generateWithOmniRoute(opts: OmniRouteChatOptions & { stream?: false }): Promise<OmniRouteChatResult>;
export async function generateWithOmniRoute(opts: OmniRouteChatOptions & { stream: true }): Promise<OmniRouteStreamResult>;
export async function generateWithOmniRoute(opts: OmniRouteChatOptions): Promise<OmniRouteResult> {
  const env = getOmniRouteEnv();
  const { model, messages } = opts;

  if (!model || typeof model !== 'string') {
    throw new OmniRouteError('config', 'No AI model was configured for this request.', 500,
      'Pass a model/combo id or set OMNIROUTE_BLOG_MODEL / OMNIROUTE_DEFAULT_MODEL.');
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new OmniRouteError('provider', 'The AI request contained no messages.', 502);
  }

  const url = `${env.baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeoutMs = opts.timeout_ms && opts.timeout_ms >= 1_000 ? opts.timeout_ms : env.timeoutMs;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
        ...(opts.max_tokens !== undefined ? { max_tokens: opts.max_tokens } : {}),
        ...(opts.top_p !== undefined ? { top_p: opts.top_p } : {}),
        ...(opts.stream ? { stream: true } : {}),
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const e = err as Error & { cause?: unknown; code?: string };
    const isAbort = e.name === 'AbortError' || String(e?.message || '').includes('abort');
    if (isAbort) {
      throw new OmniRouteError(
        'timeout',
        'The AI request timed out before the gateway responded.',
        504,
        `Aborted after ${timeoutMs}ms.`,
      );
    }
    const causeCode = (e.cause as { code?: string } | undefined)?.code || e.code || '';
    const causeMsg = (e.cause as { message?: string } | undefined)?.message || '';
    throw new OmniRouteError(
      'unavailable',
      'The AI gateway could not be reached. It may be offline.',
      503,
      redactSecrets(`${causeCode ? `${causeCode} ` : ''}${causeMsg}`.trim()),
    );
  }

  if (opts.stream) {
    if (!res.ok || !res.body) {
      clearTimeout(timer);
      const preview = await safeBodyPreview(res);
      const mapped = mapHttpStatus(res.status, preview);
      throw new OmniRouteError(mapped.kind, mapped.message, mapped.status, mapped.detail);
    }
    // Pass the SSE stream through; the caller owns closing/cleanup.
    return { stream: true, body: res.body, content_type: res.headers.get('content-type') || 'text/event-stream', status: res.status };
  }

  try {
    if (!res.ok) {
      const preview = await safeBodyPreview(res);
      const mapped = mapHttpStatus(res.status, preview);
      throw new OmniRouteError(mapped.kind, mapped.message, mapped.status, mapped.detail);
    }

    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new OmniRouteError('malformed', 'The AI gateway returned a response that could not be parsed.', 502,
        redactSecrets(text.slice(0, 200)));
    }

    const content = extractContent(json);
    const usageRaw = (json as { usage?: unknown }).usage;
    const usage = usageRaw && typeof usageRaw === 'object' ? (usageRaw as OmniRouteUsage) : null;

    return {
      stream: false,
      content,
      finish_reason: (json as { choices?: Array<{ finish_reason?: string | null }> }).choices?.[0]?.finish_reason ?? null,
      model: (json as { model?: string }).model || model,
      usage,
    };
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------------ parsing helpers

function extractContent(json: unknown): string {
  const choices = (json as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new OmniRouteError('malformed', 'The AI gateway response had no completion choices.', 502);
  }
  const message = (choices[0] as { message?: unknown }).message;
  const content = message && typeof message === 'object' ? (message as { content?: unknown }).content : undefined;
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new OmniRouteError('malformed', 'The AI gateway response contained no message content.', 502);
  }
  return content;
}

async function safeBodyPreview(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return redactSecrets(text).slice(0, 400);
  } catch {
    return '';
  }
}

// ------------------------------------------------------------------ status probe

export interface OmniRouteStatusInfo {
  configured: boolean;
  base_url_set: boolean;
  api_key_set: boolean;
  reachable: boolean | null; // null = not probed
  models: string[] | null;   // combo/model ids visible to this client key (safe to show)
  error_kind: OmniRouteErrorKind | null;
}

/**
 * Lightweight readiness probe for the admin Integrations card.
 * Returns configuration presence (never values) and, when reachable, the
 * model/combo ids the gateway exposes to this client key.
 */
export async function getOmniRouteStatus(probe = false): Promise<OmniRouteStatusInfo> {
  let env: OmniRouteEnv;
  try {
    env = getOmniRouteEnv();
  } catch (err) {
    const e = err as OmniRouteError;
    return {
      configured: false,
      base_url_set: Boolean((process.env.OMNIROUTE_BASE_URL || '').trim()),
      api_key_set: Boolean((process.env.OMNIROUTE_API_KEY || '').trim()),
      reachable: null,
      models: null,
      error_kind: e.kind || 'config',
    };
  }

  const info: OmniRouteStatusInfo = {
    configured: true,
    base_url_set: true,
    api_key_set: true,
    reachable: null,
    models: null,
    error_kind: null,
  };
  if (!probe) return info;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4_000);
  try {
    const res = await fetch(`${env.baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${env.apiKey}` },
      signal: controller.signal,
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: Array<{ id?: unknown }> };
      info.reachable = true;
      info.models = Array.isArray(json?.data)
        ? json.data.map((m) => (typeof m?.id === 'string' ? m.id : '')).filter(Boolean).slice(0, 40)
        : [];
    } else {
      info.reachable = true; // server answered, but auth failed
      info.error_kind = res.status === 401 || res.status === 403 ? 'auth' : 'provider';
    }
  } catch {
    info.reachable = false;
    info.error_kind = 'unavailable';
  } finally {
    clearTimeout(timer);
  }
  return info;
}
