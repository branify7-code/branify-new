// =============================================================================
// BRANIFY WHATSAPP CRM — server router (hosted inside /api/ai/generate)
// -----------------------------------------------------------------------------
// Vercel Hobby caps the project at 12 serverless functions and all slots are
// used, so vercel.json rewrites /api/whatsapp/* INTO /api/ai/generate and this
// router dispatches on the ORIGINAL request path (the same proven pattern as
// /api/ai/prompt). A direct call to /api/ai/generate can never reach a WA
// handler, and the public webhook can never reach admin handlers.
//
//   GET  /api/whatsapp/webhook      Meta verification (hub.challenge)
//   POST /api/whatsapp/webhook      message/status events (signature-checked)
//   *    /api/whatsapp/media        admin-only media proxy (token stays server-side)
//   *    /api/whatsapp/*            admin-only (Bearer = signed-in allowlisted admin)
//
// Envelope: { ok:true, data } · { ok:false, error:{ code, message } } — same
// shape as /api/social/*. Secrets are NEVER included in any response.
// =============================================================================
import type { IncomingMessage, ServerResponse } from 'node:http';
import { HandlerResult, readJsonBody } from '../../lib/ai/routes';
import { loadConfig, maskedConfig, saveConfig } from './store';
import { testConnection, fetchMediaBuffer } from './graph';
import { webhookVerify, webhookProcess } from './webhook';
import { sendFreeForm, sendTemplateMessage, markConversationRead, SendError } from './send';
import { syncTemplates } from './templates';
import { runAiAction, saveAiNote, AiAction } from './ai-actions';
import { analyticsFor, resolveRange } from './analytics';
import { fireAutomation, WaTrigger } from './automations';
import { serviceRoleConfigured, sbSelect, isSchemaMissing } from './sb';
import { logActivityServer } from './activity';

const SB_URL = (process.env.SUPABASE_URL || 'https://uspshkegxhrglbpxqtil.supabase.co').replace(/\/+$/, '');
const SB_ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_X11QDwMSfS2ivSePRVDpLQ_xNFY_8vw';

class WaError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function ok(json: Record<string, unknown> = {}, status = 200): HandlerResult {
  return { status, json: { ok: true, ...json } };
}

function fail(e: unknown): HandlerResult {
  if (e instanceof WaError || e instanceof SendError) {
    const err = e as WaError | SendError;
    return { status: err.status, json: { ok: false, error: { code: err.code, message: err.message } } };
  }
  const msg = e instanceof Error ? e.message : 'Something went wrong.';
  const known = [
    'not configured yet', 'token is invalid or expired', 'required to', 'window is CLOSED',
    'opted out', 'not created yet', 'no messages in this conversation', 'database', 'WhatsApp',
  ].some((s) => msg.includes(s));
  if (known) {
    const code = /schema|created yet/.test(msg) ? 'schema_missing' : /token|configur/i.test(msg) ? 'config' : 'wa_error';
    return { status: /schema/.test(code) ? 503 : 400, json: { ok: false, error: { code, message: msg } } };
  }
  return { status: 500, json: { ok: false, error: { code: 'internal', message: 'Something went wrong in the WhatsApp module.' } } };
}

// ------------------------------------------------------------------ admin gate
function bearerOf(req: IncomingMessage): string {
  const raw = String(req.headers.authorization || '');
  const m = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return m ? m[1].trim() : '';
}

async function requireAdmin(req: IncomingMessage): Promise<{ id: string; email: string }> {
  const token = bearerOf(req);
  if (!token) throw new WaError('unauthorized', 401, 'Sign in to BRANIFY Admin first.');
  const uRes = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
  if (!uRes.ok) throw new WaError('unauthorized', 401, 'Your admin session is invalid or expired. Sign in again.');
  const user = (await uRes.json()) as { id?: string; email?: string };
  if (!user?.email) throw new WaError('unauthorized', 401, 'Your admin session is invalid or expired. Sign in again.');
  const aRes = await fetch(`${SB_URL}/rest/v1/admin_users?email=eq.${encodeURIComponent(user.email)}&select=email,active`, {
    headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000),
  });
  const admins = aRes.ok ? (await aRes.json()) as Array<{ email: string; active: boolean }> : [];
  if (!admins.some((a) => a.active)) throw new WaError('forbidden', 403, 'This account is not on the BRANIFY admin allowlist.');
  return { id: user.id || user.email, email: user.email };
}

// ------------------------------------------------------------------ routing
function pathOf(req: IncomingMessage): string {
  return (req.url || '/').split('?')[0].replace(/\/+$/, '') || '/';
}

export async function handleWhatsapp(req: IncomingMessage): Promise<HandlerResult> {
  const path = pathOf(req);
  const method = (req.method || 'GET').toUpperCase();

  // ---- public: Meta webhook verification + event receiving ----
  if (path === '/api/whatsapp/webhook') {
    if (method === 'GET') {
      const url = new URL(req.url || '/', 'http://x');
      const v = await webhookVerify(url);
      return { status: v.status, json: v.body, raw: true } as HandlerResult & { raw: true };
    }
    if (method === 'POST') {
      const rawChunks: Buffer[] = [];
      for await (const chunk of req) rawChunks.push(chunk as Buffer);
      const raw = Buffer.concat(rawChunks).toString('utf8');
      try {
        const outcome = await webhookProcess(raw, String(req.headers['x-hub-signature-256'] || ''));
        // Meta requires a fast 200; retries are deduped anyway.
        return ok({ webhook: outcome });
      } catch (e) {
        const statusCode = (e as { statusCode?: number }).statusCode;
        if (statusCode === 401) return { status: 401, json: { ok: false, error: { code: 'signature', message: 'Webhook signature check failed.' } } };
        if (isSchemaMissing(e)) {
          // Acknowledge so Meta does not retry-storm before the schema is applied.
          return ok({ webhook: { processed: 0, skipped: 0, detail: ['schema not created yet'] } });
        }
        return { status: 200, json: { ok: true, webhook: { processed: 0, skipped: 0, detail: ['processing deferred'] } } };
      }
    }
    throw new WaError('bad_request', 405, 'Method not allowed for the webhook.');
  }

  // ---- everything below is admin-only ----
  const admin = await requireAdmin(req);
  const body = method === 'POST' || method === 'PATCH' ? await readJsonBody(req) : {};

  if (path === '/api/whatsapp/config') {
    if (method === 'GET') {
      const cfg = await loadConfig();
      return ok({ config: maskedConfig(cfg, await schemaReady()) });
    }
    if (method === 'POST') {
      await saveConfig({
        wabaId: strOf(body.waba_id), phoneNumberId: strOf(body.phone_number_id),
        accessToken: strOf(body.access_token), verifyToken: strOf(body.verify_token),
        appSecret: strOf(body.app_secret),
      }, admin.email);
      await logActivityServer('whatsapp_settings_updated', 'whatsapp_settings', 'singleton', {}, admin.email);
      const cfg = await loadConfig();
      return ok({ config: maskedConfig(cfg, await schemaReady()) });
    }
  }

  if (path === '/api/whatsapp/status' && method === 'GET') {
    const cfg = await loadConfig();
    const masked = maskedConfig(cfg, await schemaReady());
    if (!masked.configured) {
      return ok({ state: 'Configuration Required', detail: 'Add the Phone Number ID and Access Token in Settings.', config: masked });
    }
    const test = await testConnection(cfg);
    if ('error' in test && test.error) {
      const state = test.error.code === 'config' ? 'Configuration Required' : test.error.code === 'timeout' ? 'Webhook Error' : 'Disconnected';
      return ok({ state, detail: test.error.message, config: masked });
    }
    const phone = (test as { phone: { id: string; display_phone_number: string; verified_name?: string; quality_rating?: string } }).phone;
    return ok({
      state: 'Connected',
      detail: `Verified against the WhatsApp Cloud API — ${phone.verified_name || phone.display_phone_number} (${phone.display_phone_number})`,
      phone: { id: phone.id, display: phone.display_phone_number, verified_name: phone.verified_name, quality: phone.quality_rating || '' },
      config: masked,
    });
  }

  if (path === '/api/whatsapp/send' && method === 'POST') {
    const kind = strOf(body.kind) || 'text';
    if (kind === 'template') {
      const result = await sendTemplateMessage({
        conversationId: strOf(body.conversation_id), agentEmail: admin.email,
        name: strOf(body.template_name), language: strOf(body.language) || 'en',
        category: strOf(body.category), bodyParams: Array.isArray(body.body_params) ? (body.body_params as string[]).map(String) : [],
      });
      return ok({ result });
    }
    const result = await sendFreeForm({
      conversationId: strOf(body.conversation_id), agentEmail: admin.email,
      kind: (['image', 'document', 'audio', 'video'].includes(kind) ? kind : 'text') as 'text',
      text: strOf(body.text), media: (body.media as { link?: string; caption?: string; filename?: string } | undefined) || undefined,
    });
    return ok({ result });
  }

  if (path === '/api/whatsapp/read' && method === 'POST') {
    await markConversationRead(strOf(body.conversation_id));
    return ok();
  }

  if (path === '/api/whatsapp/templates/sync' && method === 'POST') {
    const result = await syncTemplates(admin.email);
    return ok({ result });
  }

  if (path === '/api/whatsapp/ai' && method === 'POST') {
    const action = strOf(body.action) as AiAction;
    const convId = strOf(body.conversation_id);
    if (!convId) throw new WaError('bad_request', 400, 'Open a conversation first.');
    const result = await runAiAction(action, convId, { draft: strOf(body.draft), language: strOf(body.language) }, admin.email);
    // Optionally persist as INTERNAL NOTE (never a message).
    if (strOf(body.save_as_note) === 'true' && convId) {
      const conv = (await sbSelect<{ contact_id: string }>(`/whatsapp_conversations?select=contact_id&id=eq.${convId}`))[0];
      const text = String((result as { text?: string }).text || (result as { category?: string }).category || '');
      if (conv && text) await saveAiNote(conv.contact_id, action, text, admin.email);
    }
    return ok({ result });
  }

  if (path === '/api/whatsapp/analytics' && method === 'POST') {
    const range = resolveRange(strOf(body.preset) || '7d', strOf(body.start), strOf(body.end));
    const data = await analyticsFor(range);
    return ok({ analytics: data });
  }

  if (path === '/api/whatsapp/automations/run' && method === 'POST') {
    if (!serviceRoleConfigured()) throw new WaError('server_config', 500, 'Server database credentials are missing.');
    // customer_inactive: conversations with no inbound message in 7+ days, still open.
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
    const stale = await sbSelect<{ id: string; contact_id: string; wa_id: string }>(`/whatsapp_conversations?select=id,contact_id,wa_id&status=in.(open,waiting)&or=(last_in_at.is.null,last_in_at.lt.${cutoff})&limit=50`);
    let affected = 0;
    for (const conv of stale) {
      affected += await fireAutomation('customer_inactive', { contactId: conv.contact_id, conversationId: conv.id, waId: conv.wa_id });
    }
    await logActivityServer('whatsapp_automations_run', 'whatsapp_automations', 'customer_inactive', { checked: stale.length, affected }, admin.email);
    return ok({ checked: stale.length, affected });
  }

  if (path.startsWith('/api/whatsapp/media/') && method === 'GET') {
    const mediaId = path.split('/').pop() || '';
    if (!/^[A-Za-z0-9_-]+$/.test(mediaId)) throw new WaError('bad_request', 400, 'Invalid media id.');
    const cfg = await loadConfig();
    const { buffer, mime } = await fetchMediaBuffer(cfg, mediaId);
    return { status: 200, json: '', raw: true, buffer, mime } as HandlerResult & { buffer: Buffer; mime: string };
  }

  throw new WaError('not_found', 404, 'Unknown WhatsApp CRM endpoint.');
}

function strOf(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

async function schemaReady(): Promise<boolean> {
  try {
    await sbSelect('/whatsapp_settings?select=id&limit=1');
    return true;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ response plumbing
export function sendWhatsappResponse(res: ServerResponse, result: HandlerResult): void {
  const extra = result as HandlerResult & { raw?: boolean; buffer?: Buffer; mime?: string };
  if (extra.raw && extra.buffer) {
    res.statusCode = extra.status;
    res.setHeader('Content-Type', extra.mime || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.end(extra.buffer);
    return;
  }
  if (extra.raw) {
    res.statusCode = extra.status;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(String(extra.json ?? ''));
    return;
  }
  res.statusCode = result.status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(result.json));
}
