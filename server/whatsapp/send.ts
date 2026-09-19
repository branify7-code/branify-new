// =============================================================================
// BRANIFY WHATSAPP CRM — outbound messaging (official Cloud API only)
// -----------------------------------------------------------------------------
// Policy enforcement, in order:
//   1. Configuration must exist (token + phone number id) — never fake sends.
//   2. FREE-FORM messages require an OPEN customer service window (24h after
//      the customer's last message). Closed ⇒ "template required" error, the
//      UI then offers approved templates. Rules are never bypassed.
//   3. Marketing templates respect the contact's opt-out flag.
//   4. Every send is written to whatsapp_messages FIRST (queued), then synced
//      with the real API result. Status transitions arrive via webhook.
//   5. Internal notes live in whatsapp_notes and are NEVER sendable.
// =============================================================================
import { loadConfig, WaConfig } from './store';
import { sbSelectOne, sbUpdate, sbInsert, isSchemaMissing } from './sb';
import { sendText, sendMedia, sendTemplate, GraphError, OutgoingMediaType } from './graph';
import { logActivityServer } from './activity';

export class SendError extends Error {
  code: string;
  status: number;
  metaCode: number | null;
  constructor(code: string, status: number, message: string, metaCode: number | null = null) {
    super(message);
    this.code = code;
    this.status = status;
    this.metaCode = metaCode;
  }
}

interface ConversationRow {
  id: string;
  contact_id: string;
  wa_id: string;
  window_expires_at: string | null;
  last_in_at: string | null;
  unread_count: number;
  assigned_to: string;
  status: string;
}

async function loadConversation(conversationId: string): Promise<{ conv: ConversationRow; optOut: boolean }> {
  const conv = await sbSelectOne<ConversationRow>(`/whatsapp_conversations?select=id,contact_id,wa_id,window_expires_at,last_in_at,unread_count,assigned_to,status&id=eq.${conversationId}`);
  if (!conv) throw new SendError('not_found', 404, 'This conversation no longer exists.');
  const contact = await sbSelectOne<{ opt_out: boolean }>(`/whatsapp_contacts?select=opt_out&id=eq.${conv.contact_id}`);
  return { conv, optOut: Boolean(contact?.opt_out) };
}

export function windowOpen(conv: { window_expires_at: string | null }): boolean {
  if (!conv.window_expires_at) return false;
  return new Date(conv.window_expires_at).getTime() > Date.now();
}

interface SendCommonResult {
  messageId: string;
  conversationId: string;
  status: string;
}

async function finalize(conv: ConversationRow, agentEmail: string, preview: string, ts: string): Promise<void> {
  await sbUpdate('whatsapp_conversations', `id=eq.${conv.id}`, {
    last_message_preview: preview,
    last_message_at: ts,
    last_out_at: ts,
    unread_count: 0,
    status: conv.status === 'archived' ? 'open' : conv.status,
    assigned_to: conv.assigned_to || agentEmail,
    updated_at: ts,
  });
}

export async function sendFreeForm(opts: {
  conversationId: string; agentEmail: string;
  kind: 'text' | OutgoingMediaType;
  text?: string;
  media?: { link?: string; caption?: string; filename?: string };
}): Promise<SendCommonResult> {
  const cfg = await loadConfig();
  const { conv, optOut } = await loadConversation(opts.conversationId);
  if (optOut) throw new SendError('opted_out', 409, 'This customer opted out of messages. Respect their preference and do not contact them here.');
  if (!opts.conversationId) throw new SendError('bad_request', 400, 'Conversation is required.');
  if (opts.kind === 'text' && !(opts.text || '').trim()) throw new SendError('bad_request', 400, 'Type a message before sending.');
  if (opts.kind !== 'text' && !opts.media?.link) throw new SendError('bad_request', 400, 'A media link is required to send media.');
  if (!windowOpen(conv)) {
    throw new SendError('template_required', 409,
      'The 24-hour customer service window is CLOSED. WhatsApp only allows approved template messages to this customer right now.');
  }
  const nowIso = new Date().toISOString();
  const inserted = await sbInsert<{ id: string }>('whatsapp_messages', {
    conversation_id: conv.id, wa_id: conv.wa_id, direction: 'out',
    type: opts.kind, body: opts.kind === 'text' ? (opts.text || '').trim() : (opts.media?.caption || ''),
    media: opts.kind === 'text' ? {} : { link: opts.media?.link || '', caption: opts.media?.caption || '', filename: opts.media?.filename || '' },
    status: 'queued', timestamp: nowIso,
  }, { represent: true });
  const rowId = inserted[0]?.id || '';
  try {
    const result = opts.kind === 'text'
      ? await sendText(cfg, conv.wa_id, (opts.text || '').trim())
      : await sendMedia(cfg, conv.wa_id, opts.kind as OutgoingMediaType, { link: opts.media?.link, caption: opts.media?.caption, filename: opts.media?.filename });
    await sbUpdate('whatsapp_messages', `id=eq.${rowId}`, { status: 'sent', wa_message_id: result.messageId });
    await finalize(conv, opts.agentEmail, previewOf(opts.kind === 'text' ? (opts.text || '') : mediaLabel(opts.kind, opts.media?.caption)), nowIso);
    await logActivityServer('whatsapp_message_sent', 'whatsapp_conversation', conv.id, { type: opts.kind, wa_id: conv.wa_id }, opts.agentEmail);
    return { messageId: result.messageId, conversationId: conv.id, status: 'sent' };
  } catch (e) {
    const g = e as GraphError;
    await sbUpdate('whatsapp_messages', `id=eq.${rowId}`, {
      status: 'failed',
      error: { code: g.metaCode ?? 0, title: 'Send failed', message: g.message },
    });
    await logActivityServer('whatsapp_message_failed', 'whatsapp_conversation', conv.id, { stage: 'send', reason: g.message }, opts.agentEmail);
    throw new SendError(g.code === 'config' ? 'config' : 'send_failed', g.status || 502, g.message, g.metaCode ?? null);
  }
}

function mediaLabel(kind: string, caption?: string): string {
  const icons: Record<string, string> = { image: '📷 Photo', document: '📄 Document', audio: '🎵 Audio', video: '🎬 Video' };
  return `${icons[kind] || 'Media'}${caption ? ` — ${caption}` : ''}`;
}

export interface SendTemplateInput {
  conversationId: string;
  agentEmail: string;
  name: string;
  language: string;
  category: string;
  bodyParams: string[];
}

export async function sendTemplateMessage(input: SendTemplateInput): Promise<SendCommonResult> {
  const cfg: WaConfig = await loadConfig();
  const { conv, optOut } = await loadConversation(input.conversationId);
  if (!input.name) throw new SendError('bad_request', 400, 'Select a template to send.');
  if (optOut && (input.category || 'MARKETING').toUpperCase() === 'MARKETING') {
    throw new SendError('opted_out', 409, 'This customer opted out of marketing messages. Only utility templates (e.g. appointment or support) may be considered, and only with the customer\'s consent.');
  }
  const nowIso = new Date().toISOString();
  const inserted = await sbInsert<{ id: string }>('whatsapp_messages', {
    conversation_id: conv.id, wa_id: conv.wa_id, direction: 'out', type: 'template',
    body: `Template: ${input.name}`, media: {}, template_name: input.name,
    status: 'queued', timestamp: nowIso,
  }, { represent: true });
  const rowId = inserted[0]?.id || '';
  try {
    const result = await sendTemplate(cfg, conv.wa_id, input.name, input.language || 'en', input.bodyParams);
    await sbUpdate('whatsapp_messages', `id=eq.${rowId}`, { status: 'sent', wa_message_id: result.messageId });
    await finalize(conv, input.agentEmail, `📋 ${input.name}`, nowIso);
    await logActivityServer('whatsapp_template_sent', 'whatsapp_conversation', conv.id, { template: input.name, language: input.language }, input.agentEmail);
    return { messageId: result.messageId, conversationId: conv.id, status: 'sent' };
  } catch (e) {
    const g = e as GraphError;
    await sbUpdate('whatsapp_messages', `id=eq.${rowId}`, {
      status: 'failed',
      error: { code: g.metaCode ?? 0, title: 'Template send failed', message: g.message },
    });
    await logActivityServer('whatsapp_message_failed', 'whatsapp_conversation', conv.id, { stage: 'template_send', template: input.name, reason: g.message }, input.agentEmail);
    throw new SendError(g.code === 'config' ? 'config' : 'send_failed', g.status || 502, g.message, g.metaCode ?? null);
  }
}

/** Mark a conversation read by the admin (resets unread badge). */
export async function markConversationRead(conversationId: string): Promise<void> {
  try {
    await sbUpdate('whatsapp_conversations', `id=eq.${conversationId}`, { unread_count: 0, updated_at: new Date().toISOString() });
  } catch (e) {
    if (!isSchemaMissing(e)) throw e;
  }
}

function previewOf(body: string): string {
  return body.length > 90 ? `${body.slice(0, 90)}…` : body;
}
