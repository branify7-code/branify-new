// =============================================================================
// BRANIFY — AI HTTP route handlers (SERVER-SIDE ONLY)
// -----------------------------------------------------------------------------
// Framework-agnostic request handlers shared by:
//   * the Vercel serverless functions in /api/ai (production), and
//   * scripts/local-api.ts (dev preview API on :3033).
// Each handler receives a standard Node IncomingMessage and returns a plain
// result, so the transport layer stays thin and swappable.
//
// Every response is either:
//   { ok: true,  ...payload }
//   { ok: false, error: { kind, message } }   ← message is user-safe, no secrets
// =============================================================================

import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  generateWithOmniRoute,
  getOmniRouteStatus,
  logSafe,
  modelAllowedByAllowlist,
  OmniRouteError,
  redactSecrets,
  resolveDefaultModel,
  type OmniRouteRole,
} from './omniroute';
import { generateBlog, resolveBlogModel, type BlogDraftInput } from './blog';

export interface HandlerResult {
  status: number;
  json: unknown;
  /** When set, the response is a raw byte pass-through (SSE streaming). */
  stream?: { body: ReadableStream<Uint8Array>; contentType: string; status: number };
}

const MAX_BODY_BYTES = 64 * 1024; // AI prompts are small; refuse larger bodies

// ------------------------------------------------------------------ helpers

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    total += (chunk as Buffer).length;
    if (total > MAX_BODY_BYTES) {
      throw new OmniRouteError('provider', 'The AI request body was too large.', 413);
    }
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    throw new OmniRouteError('provider', 'The AI request body was not valid JSON.', 400);
  }
}

function errorResult(err: unknown): HandlerResult {
  if (err instanceof OmniRouteError) {
    return {
      status: err.status,
      json: { ok: false, error: { kind: err.kind, message: err.message, ...(err.detail ? { detail: err.detail } : {}) } },
    };
  }
  // Unknown failure — log safely (redacted) and keep the response generic.
  logSafe('unhandled error:', err instanceof Error ? redactSecrets(`${err.name}: ${err.message}`) : String(err));
  return {
    status: 500,
    json: { ok: false, error: { kind: 'internal', message: 'Something went wrong while handling the AI request.' } },
  };
}

function okResult(status: number, json: unknown): HandlerResult {
  return { status, json: { ok: true, ...json as object } };
}

function requireMethod(req: IncomingMessage, method: 'GET' | 'POST'): OmniRouteError | null {
  if (!req.method || req.method.toUpperCase() !== method) {
    return new OmniRouteError('provider', 'Method not allowed for this AI endpoint.', 405);
  }
  return null;
}

// ------------------------------------------------------------------ /api/ai/status

export async function handleAiStatus(req: IncomingMessage): Promise<HandlerResult> {
  const methodErr = requireMethod(req, 'GET');
  if (methodErr) return errorResult(methodErr);

  const url = new URL(req.url || '/', 'http://local');
  const probe = url.searchParams.get('probe') === '1';
  const info = await getOmniRouteStatus(probe);
  const blog = resolveBlogModel();

  return okResult(200, {
    gateway: 'omniroute',
    configured: info.configured,
    base_url_set: info.base_url_set,
    api_key_set: info.api_key_set,
    reachable: info.reachable,
    models: info.models,
    error_kind: info.error_kind,
    blog_model_set: Boolean((process.env.OMNIROUTE_BLOG_MODEL || '').trim()),
    blog_model_source: blog.source,
    // The combo name is configuration metadata, not a secret — it lets the
    // admin verify the right combo is wired without exposing any key.
    blog_model: blog.model,
  });
}

// ------------------------------------------------------------------ /api/ai/generate

export async function handleAiGenerate(req: IncomingMessage): Promise<HandlerResult> {
  const methodErr = requireMethod(req, 'POST');
  if (methodErr) return errorResult(methodErr);

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return errorResult(err);
  }

  // Resolve the model: env default unless an allowlisted override was sent.
  const fallback = resolveDefaultModel();
  const requested = typeof body.model === 'string' ? body.model.trim() : '';
  let model: string;
  if (requested && requested !== fallback.model) {
    if (!modelAllowedByAllowlist(requested)) {
      return errorResult(new OmniRouteError(
        'provider',
        'The requested AI model is not available for this application.',
        400,
        'Add it to OMNIROUTE_ALLOWED_MODELS on the server to allow client overrides.',
      ));
    }
    model = requested;
  } else if (fallback.model) {
    model = fallback.model;
  } else {
    return errorResult(new OmniRouteError(
      'config',
      'No AI model is configured. Set OMNIROUTE_BLOG_MODEL (or OMNIROUTE_DEFAULT_MODEL) in the server environment.',
      500,
    ));
  }

  // Accept either a raw `prompt` string or a full OpenAI-style messages array.
  let messages: Array<{ role: OmniRouteRole; content: string }>;
  if (Array.isArray(body.messages)) {
    messages = (body.messages as unknown[])
      .map((m) => {
        const rec = (m && typeof m === 'object' ? m : {}) as Record<string, unknown>;
        const rawRole = typeof rec.role === 'string' ? rec.role : '';
        const role: OmniRouteRole = rawRole === 'system' || rawRole === 'assistant' ? rawRole : 'user';
        const content = typeof rec.content === 'string' ? rec.content : '';
        return { role, content };
      })
      .filter((m) => m.content.length > 0)
      .slice(0, 32);
  } else if (typeof body.prompt === 'string' && body.prompt.trim()) {
    messages = [{ role: 'user', content: body.prompt.trim().slice(0, 12_000) }];
  } else {
    return errorResult(new OmniRouteError('provider', 'Provide a `prompt` string or a `messages` array.', 400));
  }

  const temperatureRaw = Number(body.temperature);
  const maxTokensRaw = Number(body.max_tokens);

  const baseOpts = {
    model,
    messages,
    temperature: Number.isFinite(temperatureRaw) ? Math.min(Math.max(temperatureRaw, 0), 2) : undefined,
    max_tokens: Number.isFinite(maxTokensRaw) ? Math.min(Math.max(Math.floor(maxTokensRaw), 16), 8_000) : undefined,
  };

  try {
    if (body.stream === true) {
      // Streaming today: raw SSE pass-through (same code path, no rewrite later).
      const result = await generateWithOmniRoute({ ...baseOpts, stream: true });
      return {
        status: 0,
        json: null,
        stream: { body: result.body, contentType: result.content_type, status: result.status },
      };
    }
    const result = await generateWithOmniRoute(baseOpts);
    logSafe(`generate ok (model=${result.model}, chars=${result.content.length})`);
    return okResult(200, {
      content: result.content,
      model: result.model,
      finish_reason: result.finish_reason,
      usage: result.usage,
    });
  } catch (err) {
    return errorResult(err);
  }
}

// ------------------------------------------------------------------ /api/ai/blog

export async function handleAiBlog(req: IncomingMessage): Promise<HandlerResult> {
  const methodErr = requireMethod(req, 'POST');
  if (methodErr) return errorResult(methodErr);

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return errorResult(err);
  }

  const input: BlogDraftInput = {
    topic: typeof body.topic === 'string' ? body.topic : '',
    category: typeof body.category === 'string' ? body.category : undefined,
    tone: typeof body.tone === 'string' ? body.tone : undefined,
    keywords: Array.isArray(body.keywords) ? body.keywords.map(String) : undefined,
    length: (['short', 'medium', 'long'] as const).includes(body.length as 'short') ? body.length as BlogDraftInput['length'] : undefined,
    notes: typeof body.notes === 'string' ? body.notes : undefined,
  };

  try {
    const draft = await generateBlog(input);
    return okResult(200, { draft });
  } catch (err) {
    return errorResult(err);
  }
}

// ------------------------------------------------------------------ transport glue

/** Write a HandlerResult onto a Node ServerResponse (JSON path). */
export function sendJson(res: ServerResponse, result: HandlerResult): void {
  if (res.headersSent) return;
  const body = JSON.stringify(result.json);
  res.writeHead(result.status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

/** Write a streaming HandlerResult onto a Node ServerResponse (SSE pass-through). */
export function sendStream(res: ServerResponse, result: HandlerResult): void {
  if (res.headersSent || !result.stream) return;
  res.writeHead(result.stream.status, {
    'Content-Type': result.stream.contentType,
    'Cache-Control': 'no-store',
  });
  const reader = result.stream.body.getReader();
  const pump = (): Promise<void> => reader.read().then(({ done, value }) => {
    if (done) {
      res.end();
      return;
    }
    res.write(Buffer.from(value));
    return pump();
  }).catch(() => {
    try { res.end(); } catch { /* socket already gone */ }
  });
  void pump();
}
