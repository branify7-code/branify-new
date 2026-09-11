// =============================================================================
// BRANIFY — AI Blog Generation · provider abstraction (SERVER-SIDE ONLY)
// -----------------------------------------------------------------------------
// AIProvider interface + a first-class OpenAI-compatible implementation that
// covers GLM (Z.ai), OpenAI and any compatible gateway. The provider is chosen
// entirely from server env vars — no key ever reaches the browser:
//   AI_PROVIDER    "glm" (default) | "openai" | "custom"
//   AI_API_BASE_URL override of the provider base URL (no /chat/completions)
//   AI_API_KEY     REQUIRED secret
//   AI_MODEL       model id (default per provider)
// Future providers: implement `chatComplete()` and register in resolveProvider().
// =============================================================================

import type { GenerateBlogRequest } from './aiTypes';

export class AiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export interface AiProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

const DEFAULTS: Record<string, { baseUrl: string; model: string }> = {
  glm: { baseUrl: 'https://api.z.ai/api/paas/v4', model: 'glm-4.6' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
  custom: { baseUrl: '', model: '' },
};

/** Build the provider config from env — throws a safe 503 when unconfigured. */
export function resolveProvider(): AiProviderConfig {
  const name = (process.env.AI_PROVIDER || 'glm').toLowerCase().trim();
  const preset = DEFAULTS[name] || DEFAULTS.custom;
  const baseUrl = (process.env.AI_API_BASE_URL || preset.baseUrl).replace(/\/+$/, '');
  const apiKey = (process.env.AI_API_KEY || '').trim();
  const model = (process.env.AI_MODEL || preset.model).trim();

  if (!apiKey) {
    throw new AiError('not_configured', 503,
      'AI generation is not configured yet. Add AI_API_KEY (and optionally AI_PROVIDER, AI_API_BASE_URL, AI_MODEL) to the server environment variables, then redeploy.');
  }
  if (!baseUrl) {
    throw new AiError('not_configured', 503, 'AI base URL is missing. Set AI_API_BASE_URL for the configured provider.');
  }
  if (!model) {
    throw new AiError('not_configured', 503, 'AI model is missing. Set AI_MODEL in the server environment.');
  }
  const rawTimeout = Number(process.env.AI_TIMEOUT_MS || 0);
  const timeoutMs = Math.min(110000, Math.max(15000, Number.isFinite(rawTimeout) ? rawTimeout : 52000));
  return { name, baseUrl, apiKey, model, timeoutMs };
}

// ------------------------------------------------------------------ wire format
interface ChoiceShape {
  message?: { content?: string | null };
}

/** Single OpenAI-compatible chat completion call with timeout + error mapping. */
export async function chatComplete(
  cfg: AiProviderConfig,
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: opts.temperature ?? 0.75,
        max_tokens: opts.maxTokens ?? 8000,
        stream: false,
      }),
      signal: ctrl.signal,
    });
  } catch (e) {
    const aborted = e instanceof Error && (e.name === 'AbortError' || /abort/i.test(e.message || ''));
    if (aborted) {
      throw new AiError('provider_timeout', 504,
        'The AI provider took too long to respond. Retry — long articles can occasionally exceed the generation window.');
    }
    throw new AiError('network', 502, 'The AI provider could not be reached. Check connectivity and try again.');
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  if (!res.ok) {
    let msg = '';
    try { msg = (JSON.parse(text) as { error?: { message?: string } })?.error?.message || ''; } catch { /* raw */ }
    msg = (msg || text || '').slice(0, 300);
    if (res.status === 401 || res.status === 403) {
      throw new AiError('provider_auth', 502, 'The AI provider rejected the server API key. Verify AI_API_KEY on the server.');
    }
    if (res.status === 429) {
      throw new AiError('rate_limited', 429, 'The AI provider rate limit was hit. Wait a minute and try again.');
    }
    if (res.status === 404) {
      throw new AiError('provider_model', 502, `The model "${cfg.model}" was not found on the provider. Check AI_MODEL.`);
    }
    throw new AiError('upstream', 502, `AI provider error (HTTP ${res.status}).${msg ? ' ' + msg : ''}`);
  }

  let content = '';
  try {
    const j = JSON.parse(text) as { choices?: ChoiceShape[] };
    content = j.choices?.[0]?.message?.content || '';
  } catch { /* handled below */ }
  if (!content.trim()) {
    throw new AiError('empty_content', 502, 'The AI provider returned an empty response. Try again.');
  }
  return content;
}

// ------------------------------------------------------------------ JSON handling
/** Extract the first JSON object from a model response (tolerates fences/prose). */
export function extractJsonObject(raw: string): Record<string, unknown> | null {
  let t = raw.trim();
  // strip ```json fences … ``` (and any prose around them)
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = t.slice(start, end + 1);
  try {
    const parsed = JSON.parse(candidate) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    // one small, safe repair: trailing commas
    try {
      const parsed = JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1')) as unknown;
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}

/** Target tokens: ~2.2 tokens/word for the article + JSON/meta overhead. */
export function maxTokensForLength(words: number): number {
  return Math.min(16000, Math.round(words * 2.6) + 1400);
}

export function wordCountOf(html: string): number {
  const plain = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#>*`_\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain ? plain.split(' ').length : 0;
}

/** Comfortable typing for the provider generate step used by the endpoint. */
export interface ProviderGenerateResult {
  raw: string;
  parsed: Record<string, unknown> | null;
  repaired: boolean;
}

/**
 * Generate + parse with ONE safe repair round-trip (spec: malformed structured
 * output gets a single repair attempt, never a silently broken record).
 */
export async function generateStructuredJson(
  cfg: AiProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<ProviderGenerateResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  const raw = await chatComplete(cfg, messages, { temperature: 0.75, maxTokens });
  const first = extractJsonObject(raw);
  if (first) return { raw, parsed: first, repaired: false };

  // one repair attempt — show the model its own invalid output
  const repairMessages: ChatMessage[] = [
    ...messages,
    { role: 'assistant', content: raw.slice(0, 24000) },
    {
      role: 'user',
      content:
        'Your previous response was not parseable as a single JSON object. ' +
        'Return ONLY the corrected JSON object — no markdown fences, no commentary, no trailing text. ' +
        'Keep every field and the full article content from your previous answer.',
    },
  ];
  const raw2 = await chatComplete(cfg, repairMessages, { temperature: 0.2, maxTokens });
  const second = extractJsonObject(raw2);
  if (second) return { raw: raw2, parsed: second, repaired: true };
  throw new AiError('invalid_output', 502,
    'The AI returned structured data that could not be parsed as JSON after one repair attempt. Nothing was saved — please try again.');
}

/** Re-export for the endpoint's prompt builder typing convenience. */
export type { GenerateBlogRequest };
