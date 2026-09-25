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
//
// Media flow (outbound): the admin's browser uploads the file to the PRIVATE
// whatsapp-media bucket; the server downloads it here, uploads to Meta
// (POST /{phone-id}/media → real media id), sends by id, and stores both ids
// on the message row so RETRY can re-send without re-uploading.
// Reply threading uses the official context.message_id reference (spec §14).
// =============================================================================
import { loadConfig, WaConfig } from './store';
import { sbSelectOne, sbUpdate, sbInsert, isSchemaMissing } from './sb';
import {
  sendText, sendMedia, sendTemplate, sendLocation, sendContacts,
  uploadMedia, markReadApi, GraphError, OutgoingMediaType, OutgoingLocation, OutgoingContactCard,
} from './graph';
import { downloadObject } from './storage';
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

export type SendKind = 'text' | OutgoingMediaType | 'location' | 'contacts' | 'template';

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

export interface OutMediaRef {
  storage_path?: string;      // private bucket path (browser upload)
  meta_id?: string;           // cached Meta media id (retry skips re-upload)
  link?: string;              // public https link (Meta fetches it)
  caption?: string;
  filename?: string;
  mime?: string;
  size?: number;
  location?: OutgoingLocation;
  contacts?: OutgoingContactCard[];
}

/** Resolve a media reference to a Meta media id (upload from storage if needed). */
async function metaMediaId(cfg: WaConfig, kind: OutgoingMediaType, m: OutMediaRef): Promise<string> {
  if (m.meta_id) return m.meta_id;
  if (m.storage_path) {
    const { buffer, mime } = await downloadObject(m.storage_path);
    const up = await uploadMedia(cfg, buffer, mime || String(m.mime || 'application/octet-stream'), m.filename || 'file');
    return up.id;
  }
  if (m.link) return ''; // link-based send needs no upload
  throw new SendError('bad_request', 400, 'Provide a file, a stored media path, or a public link.');
}

/** Quoted-message snapshot for bubble rendering (resolved locally, never invented). */
async function quotedSnapshot(conversationId: string, replyToWamid: string): Promise<Record<string, unknown>> {
  if (!replyToWamid) return {};
  const row = await sbSelectOne<{ body: string; type: string; direction: string; timestamp: string; media: Record<string, unknown> }>(
    `/whatsapp_messages?select=body,type,direction,timestamp,media&conversation_id=eq.${conversationId}&wa_message_id=eq.${encodeURIComponent(replyToWamid)}&limit=1`,
  );
  if (!row) return {};
  return {
    wamid: replyToWamid,
    body: row.body || '',
    type: row.type,
    direction: row.direction,
    ts: row.timestamp,
    filename: (row.media as { filename?: string } | null)?.filename || '',
  };
}

export async function sendFreeForm(opts: {
  conversationId: string; agentEmail: string;
  kind: SendKind;
  text?: string;
  media?: OutMediaRef;
  replyToWamid?: string;
}): Promise<SendCommonResult> {
  const cfg = await loadConfig();
  const { conv, optOut } = await loadConversation(opts.conversationId);
  if (optOut) throw new SendError('opted_out', 409, 'This customer opted out of messages. Respect their preference and do not contact them here.');
  if (!opts.conversationId) throw new SendError('bad_request', 400, 'Conversation is required.');
  const mediaKind = ['image', 'document', 'audio', 'video', 'sticker'].includes(opts.kind);
  if (opts.kind === 'text' && !(opts.text || '').trim()) throw new SendError('bad_request', 400, 'Type a message before sending.');
  if (mediaKind && !opts.media) throw new SendError('bad_request', 400, 'A file is required to send media.');
  if (opts.kind === 'location' && !opts.media?.location) throw new SendError('bad_request', 400, 'Location coordinates are required.');
  if (opts.kind === 'contacts' && !(opts.media?.contacts || []).length) throw new SendError('bad_request', 400, 'A contact card is required.');
  // Stickers must be static webp (official constraint) — validate the uploaded file.
  if (opts.kind === 'sticker') {
    const mime = String(opts.media?.mime || '');
    if (opts.media?.storage_path && !/webp/i.test(mime) && !/\.webp$/i.test(opts.media.storage_path)) {
      throw new SendError('unsupported_file', 415, 'Stickers must be static .webp images (512×512 recommended).');
    }
  }
  if (!windowOpen(conv)) {
    throw new SendError('template_required', 409,
      'The 24-hour customer service window is CLOSED. WhatsApp only allows approved template messages to this customer right now.');
  }
  const replyTo = (opts.replyToWamid || '').trim();
  const nowIso = new Date().toISOString();
  const quoted = replyTo ? await quotedSnapshot(conv.id, replyTo) : {};
  const m = opts.media || {};
  const rowMedia: Record<string, unknown> = opts.kind === 'text' ? {}
    : opts.kind === 'location' ? { location: m.location }
    : opts.kind === 'contacts' ? { contacts: m.contacts }
    : { storage_path: m.storage_path || '', meta_id: m.meta_id || '', link: m.link || '', caption: m.caption || '', filename: m.filename || '', mime: m.mime || '', size: m.size || 0 };
  const inserted = await sbInsert<{ id: string }>('whatsapp_messages', {
    conversation_id: conv.id, wa_id: conv.wa_id, direction: 'out',
    type: opts.kind,
    body: opts.kind === 'text' ? (opts.text || '').trim()
      : opts.kind === 'location' ? [m.location?.name, m.location?.address].filter(Boolean).join(' — ')
      : opts.kind === 'contacts' ? (m.contacts || []).map((c) => c.name.formatted_name).join(', ')
      : (m.caption || ''),
    media: rowMedia,
    reply_to_wamid: replyTo || null,
    quoted,
    status: 'queued', timestamp: nowIso,
  }, { represent: true });
  const rowId = inserted[0]?.id || '';
  try {
    let result: { messageId: string };
    if (opts.kind === 'text') {
      result = await sendText(cfg, conv.wa_id, (opts.text || '').trim(), replyTo || undefined);
    } else if (opts.kind === 'location') {
      result = await sendLocation(cfg, conv.wa_id, m.location as OutgoingLocation, replyTo || undefined);
    } else if (opts.kind === 'contacts') {
      result = await sendContacts(cfg, conv.wa_id, (m.contacts || []) as OutgoingContactCard[], replyTo || undefined);
    } else {
      const id = await metaMediaId(cfg, opts.kind as OutgoingMediaType, m);
      if (id) await sbUpdate('whatsapp_messages', `id=eq.${rowId}`, { media: { ...rowMedia, meta_id: id } });
      result = await sendMedia(cfg, conv.wa_id, opts.kind as OutgoingMediaType, { id: id || undefined, link: id ? undefined : m.link, caption: m.caption, filename: m.filename }, replyTo || undefined);
    }
    await sbUpdate('whatsapp_messages', `id=eq.${rowId}`, { status: 'sent', wa_message_id: result.messageId });
    await finalize(conv, opts.agentEmail, previewOf(opts.kind, opts.kind === 'text' ? (opts.text || '') : mediaLabel(opts.kind, m)), nowIso);
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

function mediaLabel(kind: string, m: OutMediaRef): string {
  if (kind === 'location' && m.location) return `📍 ${m.location.name || m.location.address || 'Location'}`;
  if (kind === 'contacts' && m.contacts) return `👤 ${(m.contacts || []).map((c) => c.name.formatted_name).join(', ')}`;
  const icons: Record<string, string> = { image: '📷 Photo', document: '📄 Document', audio: '🎵 Audio', video: '🎬 Video', sticker: '🩹 Sticker' };
  return `${icons[kind] || 'Media'}${m.caption ? ` — ${m.caption}` : ''}`;
}

export interface SendTemplateInput {
  conversationId: string;
  agentEmail: string;
  name: string;
  language: string;
  category: string;
  bodyParams: string[];
  headerMedia?: { kind: 'image' | 'document' | 'video'; storage_path?: string; meta_id?: string; link?: string; filename?: string; mime?: string };
  replyToWamid?: string;
}

export async function sendTemplateMessage(input: SendTemplateInput): Promise<SendCommonResult> {
  const cfg: WaConfig = await loadConfig();
  const { conv, optOut } = await loadConversation(input.conversationId);
  if (!input.name) throw new SendError('bad_request', 400, 'Select a template to send.');
  if (optOut && (input.category || 'MARKETING').toUpperCase() === 'MARKETING') {
    throw new SendError('opted_out', 409, 'This customer opted out of marketing messages. Only utility templates (e.g. appointment or support) may be considered, and only with the customer\'s consent.');
  }
  const nowIso = new Date().toISOString();
  const replyTo = (input.replyToWamid || '').trim();
  const quoted = replyTo ? await quotedSnapshot(conv.id, replyTo) : {};
  const headerMeta: Record<string, unknown> = input.headerMedia
    ? { storage_path: input.headerMedia.storage_path || '', meta_id: input.headerMedia.meta_id || '', link: input.headerMedia.link || '', mime: input.headerMedia.mime || '', filename: input.headerMedia.filename || '' }
    : {};
  const inserted = await sbInsert<{ id: string }>('whatsapp_messages', {
    conversation_id: conv.id, wa_id: conv.wa_id, direction: 'out', type: 'template',
    body: `Template: ${input.name}`, media: { ...headerMeta, template_params: input.bodyParams }, template_name: input.name,
    reply_to_wamid: replyTo || null, quoted,
    status: 'queued', timestamp: nowIso,
  }, { represent: true });
  const rowId = inserted[0]?.id || '';
  try {
    let headerParam: Parameters<typeof sendTemplate>[5];
    if (input.headerMedia) {
      const hm = input.headerMedia;
      const id = hm.meta_id || (hm.storage_path ? (await uploadMedia(cfg, (await downloadObject(hm.storage_path)).buffer, hm.mime || 'image/jpeg', hm.filename || 'header')).id : '');
      if (id) await sbUpdate('whatsapp_messages', `id=eq.${rowId}`, { media: { ...headerMeta, meta_id: id } });
      headerParam = { kind: hm.kind, id: id || undefined, link: id ? undefined : hm.link, filename: hm.filename };
    }
    const result = await sendTemplate(cfg, conv.wa_id, input.name, input.language || 'en', input.bodyParams, headerParam, replyTo || undefined);
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

/**
 * RETRY a failed outbound message with the SAME content (spec §5/§16/§29).
 * Rebuilds the payload from the stored row — no invented state, no fakes.
 */
export async function retryFailedMessage(rowId: string, agentEmail: string): Promise<SendCommonResult> {
  const row = await sbSelectOne<{
    id: string; conversation_id: string; wa_id: string; direction: string; type: string; body: string;
    media: Record<string, unknown>; template_name: string | null; status: string; error: Record<string, unknown> | null;
  }>(`/whatsapp_messages?select=id,conversation_id,wa_id,direction,type,body,media,template_name,status,error&id=eq.${rowId}`);
  if (!row) throw new SendError('not_found', 404, 'This message no longer exists.');
  if (row.direction !== 'out') throw new SendError('bad_request', 400, 'Only outgoing messages can be retried.');
  if (row.status !== 'failed') throw new SendError('bad_request', 400, 'Only failed messages can be retried.');
  const kind = row.type as SendKind;
  const media = (row.media || {}) as OutMediaRef & { template_params?: string[] };
  const cfg = await loadConfig();
  await sbUpdate('whatsapp_messages', `id=eq.${row.id}`, { status: 'queued', error: {} });
  try {
    let result: { messageId: string };
    if (kind === 'text') {
      result = await sendText(cfg, row.wa_id, row.body);
    } else if (kind === 'template') {
      result = await sendTemplate(cfg, row.wa_id, row.template_name || '', 'en', media.template_params || []);
    } else if (kind === 'location') {
      result = await sendLocation(cfg, row.wa_id, (media.location || {}) as OutgoingLocation);
    } else if (kind === 'contacts') {
      result = await sendContacts(cfg, row.wa_id, (media.contacts || []) as OutgoingContactCard[]);
    } else {
      const id = await metaMediaId(cfg, kind as OutgoingMediaType, media);
      if (id) await sbUpdate('whatsapp_messages', `id=eq.${row.id}`, { media: { ...media, meta_id: id } });
      result = await sendMedia(cfg, row.wa_id, kind as OutgoingMediaType, { id: id || undefined, link: id ? undefined : media.link, caption: media.caption, filename: media.filename });
    }
    await sbUpdate('whatsapp_messages', `id=eq.${row.id}`, { status: 'sent', wa_message_id: result.messageId });
    const conv = await sbSelectOne<ConversationRow>(`/whatsapp_conversations?select=id,contact_id,wa_id,window_expires_at,last_in_at,unread_count,assigned_to,status&id=eq.${row.conversation_id}`);
    if (conv) await finalize(conv, agentEmail, '', new Date().toISOString());
    await logActivityServer('whatsapp_message_retried', 'whatsapp_message', row.id, { type: kind }, agentEmail);
    return { messageId: result.messageId, conversationId: row.conversation_id, status: 'sent' };
  } catch (e) {
    const g = e as GraphError;
    await sbUpdate('whatsapp_messages', `id=eq.${row.id}`, {
      status: 'failed',
      error: { code: g.metaCode ?? 0, title: 'Retry failed', message: g.message },
    });
    throw new SendError(g.code === 'config' ? 'config' : 'send_failed', g.status || 502, g.message, g.metaCode ?? null);
  }
}

/**
 * Mark the conversation read locally AND on WhatsApp (official status:read).
 * Read receipts are best-effort on the Meta side — the CRM badge always resets.
 */
export async function markConversationRead(conversationId: string): Promise<void> {
  const nowIso = new Date().toISOString();
  try {
    const prev = await sbSelectOne<{ last_read_at: string | null }>(`/whatsapp_conversations?select=last_read_at&id=eq.${conversationId}`);
    await sbUpdate('whatsapp_conversations', `id=eq.${conversationId}`, { unread_count: 0, last_read_at: nowIso, updated_at: nowIso });
    // Best-effort official read receipt for inbound messages newer than last read.
    const since = prev?.last_read_at || new Date(Date.now() - 86400000).toISOString();
    const unread = await (await import('./sb')).sbSelect<{ wa_message_id: string }>(
      `/whatsapp_messages?select=wa_message_id&conversation_id=eq.${conversationId}&direction=eq.in&status=eq.received&timestamp=gt.${since}&order=timestamp.desc&limit=5`,
    );
    const wamid = unread.map((r) => r.wa_message_id).find(Boolean);
    if (wamid) {
      const cfg = await loadConfig();
      await markReadApi(cfg, wamid);
    }
  } catch (e) {
    if (!isSchemaMissing(e)) throw e;
  }
}

function previewOf(kind: string, body: string): string {
  const label = kind === 'text' ? body : mediaLabel(kind, {});
  return label.length > 90 ? `${label.slice(0, 90)}…` : label;
}
