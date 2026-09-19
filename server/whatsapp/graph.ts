// =============================================================================
// BRANIFY WHATSAPP CRM — official WhatsApp Cloud API client (server-only)
// -----------------------------------------------------------------------------
// Talks ONLY to the official WhatsApp Business Platform (Cloud API) at
// graph.facebook.com. No scraping, no QR automation, no unofficial libraries.
// Every failure is mapped to a human-readable, secret-free error.
// =============================================================================
import { WaConfig } from './store';

export const GRAPH_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export class GraphError extends Error {
  code: string;
  status: number;
  /** Meta error subcode / code when present (for precise UI states). */
  metaCode: number | null;
  metaSubcode: number | null;
  constructor(code: string, status: number, message: string, metaCode: number | null = null, metaSubcode: number | null = null) {
    super(message);
    this.code = code;
    this.status = status;
    this.metaCode = metaCode;
    this.metaSubcode = metaSubcode;
  }
}

function friendly(metaCode: number | null, metaSubcode: number | null, fallback: string): string {
  if (metaCode === 190) return 'The WhatsApp access token is invalid or expired. Generate a fresh System User token and update it in Settings.';
  if (metaSubcode === 2494055 || metaCode === 131047) return 'Re-engagement required — the 24-hour customer service window is closed for this person. Send an approved template message instead.';
  if (metaCode === 131026 || metaSubcode === 2105005) return 'The message could not be delivered to this WhatsApp number.';
  if (metaCode === 131049) return 'This customer selected to stop messages from this business number. Marketing contact is no longer permitted.';
  if (metaCode === 130429 || metaCode === 80007) return 'The WhatsApp Cloud API rate limit was hit. Wait a moment and try again.';
  if (metaCode === 100) return 'The request to WhatsApp was missing a required parameter. Check the configuration in Settings.';
  if (metaCode === 10 || metaCode === 200) return 'The WhatsApp access token does not have permission for this action. Check the token scopes in Meta Business settings.';
  return fallback;
}

async function call<T>(method: 'GET' | 'POST', path: string, cfg: WaConfig, body?: unknown, timeoutMs = 25000): Promise<T> {
  if (!cfg.accessToken) throw new GraphError('config', 400, 'WhatsApp is not configured yet. Add the credentials in WhatsApp CRM → Settings.');
  let url = `${GRAPH_BASE}/${path.replace(/^\//, '')}`;
  if (method === 'GET') url += (url.includes('?') ? '&' : '?') + `access_token=${encodeURIComponent(cfg.accessToken)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: method === 'POST' ? {
        Authorization: `Bearer ${cfg.accessToken}`,
        'Content-Type': 'application/json',
      } : undefined,
      body: method === 'POST' ? JSON.stringify(body || {}) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const aborted = e instanceof Error && (e.name === 'AbortError' || /timeout|abort/i.test(e.message || ''));
    throw new GraphError(aborted ? 'timeout' : 'network', aborted ? 504 : 502,
      aborted ? 'WhatsApp did not respond in time. Try again.' : 'Could not reach the WhatsApp API. Check connectivity.');
  }
  const json = await res.json().catch(() => ({}) as Record<string, unknown>);
  if (!res.ok) {
    const err = (json as { error?: { message?: string; code?: number; error_subcode?: number } }).error || {};
    throw new GraphError('graph', res.status,
      friendly(err.code ?? null, err.error_subcode ?? null, err.message || `WhatsApp API error (HTTP ${res.status}).`),
      err.code ?? null, err.error_subcode ?? null);
  }
  return json as T;
}

// ------------------------------------------------------------------ identity
export interface PhoneNumberInfo {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating?: string;
  name_status?: string;
}

/** REAL verification: reads the configured phone number from the Cloud API. */
export async function testConnection(cfg: WaConfig): Promise<{ ok: true; phone: PhoneNumberInfo } | { ok: false; error: GraphError }> {
  if (!cfg.phoneNumberId || !cfg.accessToken) {
    return { ok: false, error: new GraphError('config', 400, 'Phone Number ID and Access Token are required to test the connection.') };
  }
  try {
    const phone = await call<PhoneNumberInfo>('GET', `/${cfg.phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,name_status`, cfg);
    return { ok: true, phone };
  } catch (e) {
    return { ok: false, error: e instanceof GraphError ? e : new GraphError('graph', 502, 'The WhatsApp API test failed.') };
  }
}

// ------------------------------------------------------------------ templates
export interface GraphTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  quality?: string;
  components?: unknown[];
}

/** Sync templates from the business account (real API state, no fakes). */
export async function fetchTemplates(cfg: WaConfig): Promise<GraphTemplate[]> {
  if (!cfg.wabaId) throw new GraphError('config', 400, 'WhatsApp Business Account ID is required to sync templates.');
  const data = await call<{ data?: GraphTemplate[] }>('GET', `/${cfg.wabaId}/message_templates?limit=200&fields=id,name,language,category,status,quality,components`, cfg);
  return data.data || [];
}

// ------------------------------------------------------------------ sending
export interface SendResult {
  messageId: string;
  waId: string;
}

async function sendPayload(cfg: WaConfig, payload: Record<string, unknown>, to: string): Promise<SendResult> {
  const out = await call<{ messages?: Array<{ id: string }> }>('POST', `/${cfg.phoneNumberId}/messages`, cfg, { messaging_product: 'whatsapp', recipient_type: 'individual', to, ...payload });
  const messageId = out.messages?.[0]?.id || '';
  if (!messageId) throw new GraphError('graph', 502, 'WhatsApp accepted the request but returned no message id.');
  return { messageId, waId: to };
}

export async function sendText(cfg: WaConfig, to: string, text: string): Promise<SendResult> {
  return sendPayload(cfg, { type: 'text', text: { preview_url: true, body: text } }, to);
}

export type OutgoingMediaType = 'image' | 'document' | 'audio' | 'video';

export async function sendMedia(
  cfg: WaConfig, to: string, kind: OutgoingMediaType,
  media: { link?: string; id?: string; caption?: string; filename?: string },
): Promise<SendResult> {
  const mediaPayload: Record<string, unknown> = { caption: media.caption || undefined };
  if (media.link) mediaPayload.link = media.link;
  else if (media.id) mediaPayload.id = media.id;
  if (kind === 'document' && media.filename) mediaPayload.filename = media.filename;
  return sendPayload(cfg, { type: kind, [kind]: mediaPayload }, to);
}

export interface TemplateComponent {
  type: string;
  parameters?: Array<{ type: string; text?: string }>;
}

/** Send an APPROVED template with validated body variables. */
export async function sendTemplate(
  cfg: WaConfig, to: string, templateName: string, language: string,
  bodyParams: string[],
): Promise<SendResult> {
  const components: TemplateComponent[] | undefined = bodyParams.length
    ? [{ type: 'body', parameters: bodyParams.map((text) => ({ type: 'text', text })) }]
    : undefined;
  return sendPayload(cfg, {
    type: 'template',
    template: { name: templateName, language: { code: language || 'en' }, ...(components ? { components } : {}) },
  }, to);
}

// ------------------------------------------------------------------ media download
/** Stream a media object: GET media id → URL → bytes. Admin-authenticated callers only. */
export async function fetchMediaBuffer(cfg: WaConfig, mediaId: string): Promise<{ buffer: Buffer; mime: string }> {
  const meta = await call<{ url?: string; mime_type?: string }>('GET', `/${mediaId}`, cfg);
  if (!meta.url) throw new GraphError('graph', 404, 'WhatsApp returned no downloadable link for this media.');
  let res: Response;
  try {
    res = await fetch(meta.url, { headers: { Authorization: `Bearer ${cfg.accessToken}` }, signal: AbortSignal.timeout(30000) });
  } catch {
    throw new GraphError('network', 502, 'Could not download the media from WhatsApp.');
  }
  if (!res.ok) throw new GraphError('graph', res.status, 'WhatsApp refused the media download.');
  const buf = Buffer.from(await res.arrayBuffer());
  return { buffer: buf, mime: meta.mime_type || res.headers.get('content-type') || 'application/octet-stream' };
}
