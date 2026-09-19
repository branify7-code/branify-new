// =============================================================================
// BRANIFY WHATSAPP CRM — webhook receiver (official Cloud API contract)
// -----------------------------------------------------------------------------
// GET  /api/whatsapp/webhook  → hub.mode/hub.verify_token/hub.challenge check
// POST /api/whatsapp/webhook  → message + status events
//
// Security:
//   · GET verification compares hub.verify_token against the configured token.
//   · POST verifies X-Hub-Signature-256 (HMAC-SHA256 with the App Secret) when
//     an app secret is configured; without it Meta retries are still safe via
//     the dedupe table, but configuring the secret is strongly recommended.
// Dedupe:
//   · Every event writes a unique dedupe_key (msg:<wamid>, status:<wamid>:<status>,
//     tpl:<id>:<status>) into whatsapp_events with resolution=ignore-duplicates.
//     Meta retries (which resend the SAME payload) hit the unique constraint and
//     are acknowledged 200 without reprocessing — no duplicate messages ever.
// Privacy: payloads stored in whatsapp_events are trimmed summaries; tokens and
// headers are never persisted or surfaced in the admin UI.
// =============================================================================
import crypto from 'node:crypto';
import { loadConfig } from './store';
import { sbSelectOne, sbInsert, sbUpdate, isSchemaMissing } from './sb';
import { logActivityServer } from './activity';
import { fireAutomation } from './automations';

// ------------------------------------------------------------------ helpers
const digitsOf = (v: string): string => (v || '').replace(/[^\d]/g, '');
const isoPlus24h = (d: Date): Date => new Date(d.getTime() + 24 * 60 * 60 * 1000);

function previewOf(body: string, kind: string): string {
  if (body) return body.length > 90 ? `${body.slice(0, 90)}…` : body;
  const labels: Record<string, string> = { image: '📷 Photo', document: '📄 Document', audio: '🎵 Voice note', video: '🎬 Video', template: '📋 Template', unsupported: 'Message' };
  return labels[kind] || 'Message';
}

export async function webhookVerify(url: URL): Promise<{ status: number; body: string }> {
  const cfg = await loadConfig();
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token') || '';
  const challenge = url.searchParams.get('hub.challenge') || '';
  if (mode === 'subscribe' && token && cfg.verifyToken && token === cfg.verifyToken) {
    return { status: 200, body: challenge };
  }
  // Distinguish "not configured" from "wrong token" for honest admin diagnosis.
  if (!cfg.verifyToken) return { status: 400, body: 'whatsapp: webhook verify token is not configured yet' };
  return { status: 403, body: 'whatsapp: verification failed' };
}

/** X-Hub-Signature-256 check. Enforced whenever an app secret is configured. */
async function signatureValid(raw: string, header: string, appSecret: string): Promise<boolean> {
  if (!appSecret) return true; // no secret configured → cannot verify (dedupe still guards retries)
  if (!header || !header.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', appSecret).update(raw, 'utf8').digest('hex');
  const got = header.slice(7);
  if (expected.length !== got.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(got, 'hex'));
  } catch {
    return false;
  }
}

interface WaInbound {
  from: string;
  profileName: string;
  wamid: string;
  kind: string;
  body: string;
  media: Record<string, unknown>;
  ts: Date;
}

function parseInbound(value: Record<string, unknown>): WaInbound | null {
  const kind = String(value.type || 'unsupported');
  const base = {
    from: String(value.from || ''),
    profileName: String((value.profile as { name?: string } | undefined)?.name || ''),
    wamid: String(value.id || ''),
    ts: new Date(Number(value.timestamp || 0) * 1000 || Date.now()),
  };
  const mediaOf = (v: Record<string, unknown>, captionKey: string): Record<string, unknown> => ({
    media_id: v.id || '',
    mime: v.mime_type || '',
    filename: (v.filename as string) || '',
    caption: (v[captionKey] as string) || '',
    sha256: v.sha256 || '',
  });
  switch (kind) {
    case 'text':
      return { ...base, kind, body: String((value.text as { body?: string })?.body || ''), media: {} };
    case 'image':
      return { ...base, kind, body: '', media: mediaOf(value.image as Record<string, unknown>, 'caption') };
    case 'document':
      return { ...base, kind, body: String((value.document as { caption?: string })?.caption || ''), media: mediaOf(value.document as Record<string, unknown>, 'caption') };
    case 'audio':
      return { ...base, kind, body: '', media: mediaOf(value.audio as Record<string, unknown>, 'caption') };
    case 'video':
      return { ...base, kind, body: String((value.video as { caption?: string })?.caption || ''), media: mediaOf(value.video as Record<string, unknown>, 'caption') };
    case 'sticker':
    case 'contacts':
    case 'location':
      return { ...base, kind: 'unsupported', body: `[${kind}]`, media: {} };
    default:
      return { ...base, kind: 'unsupported', body: '', media: {} };
  }
}

/** Upsert contact by wa_id + find/create the conversation. */
async function ensureContactConversation(waId: string, profileName: string, ts: Date): Promise<{ contactId: string; conversationId: string; isNewContact: boolean; isNewConversation: boolean }> {
  const existing = await sbSelectOne<{ id: string; name: string }>(`/whatsapp_contacts?select=id,name&wa_id=eq.${waId}`);
  let contactId: string;
  let isNewContact = false;
  if (existing) {
    contactId = existing.id;
    // Fill a blank name from the WhatsApp profile (only real data, never invented).
    if (!existing.name && profileName) {
      await sbUpdate('whatsapp_contacts', `id=eq.${contactId}`, { name: profileName, updated_at: new Date().toISOString() });
    }
  } else {
    const inserted = await sbInsert<{ id: string }>('whatsapp_contacts', {
      wa_id: waId, name: profileName || '', source: 'WhatsApp', lead_status: 'new',
    }, { represent: true, onConflictIgnore: true });
    if (inserted.length) {
      contactId = inserted[0].id;
      isNewContact = true;
    } else {
      const again = await sbSelectOne<{ id: string }>(`/whatsapp_contacts?select=id&wa_id=eq.${waId}`);
      if (!again) throw new Error('contact_upsert_failed');
      contactId = again.id;
    }
  }

  const conv = await sbSelectOne<{ id: string }>(`/whatsapp_conversations?select=id&contact_id=eq.${contactId}`);
  if (conv) return { contactId, conversationId: conv.id, isNewContact, isNewConversation: false };
  const created = await sbInsert<{ id: string }>('whatsapp_conversations', {
    contact_id: contactId, wa_id: waId, status: 'open', unread_count: 0,
    last_message_at: ts.toISOString(), last_in_at: ts.toISOString(),
    window_expires_at: isoPlus24h(ts).toISOString(),
  }, { represent: true, onConflictIgnore: true });
  const conversationId = created[0]?.id || (await sbSelectOne<{ id: string }>(`/whatsapp_conversations?select=id&contact_id=eq.${contactId}`))?.id || '';
  if (!conversationId) throw new Error('conversation_create_failed');
  return { contactId, conversationId, isNewContact, isNewConversation: true };
}

// ------------------------------------------------------------------ event processing
export interface WebhookOutcome {
  processed: number;
  skipped: number;
  detail: string[];
}

export async function webhookProcess(raw: string, signatureHeader: string): Promise<WebhookOutcome> {
  const cfg = await loadConfig();
  if (!(await signatureValid(raw, signatureHeader, cfg.appSecret))) {
    const e = new Error('invalid signature') as Error & { statusCode?: number };
    e.statusCode = 401;
    throw e;
  }
  const outcome: WebhookOutcome = { processed: 0, skipped: 0, detail: [] };
  let payload: {
    entry?: Array<{
      id?: string;
      changes?: Array<{
        field?: string;
        value?: {
          metadata?: { phone_number_id?: string };
          contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
          messages?: Array<Record<string, unknown>>;
          statuses?: Array<Record<string, unknown>>;
          message_template_id?: string;
          message_template_name?: string;
          reason?: string;
        };
      }>;
    }>;
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    const e = new Error('invalid json') as Error & { statusCode?: number };
    e.statusCode = 400;
    throw e;
  }

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      // Ignore webhooks for a different phone number id than configured (multi-number WABAs).
      if (value.metadata?.phone_number_id && cfg.phoneNumberId && value.metadata.phone_number_id !== cfg.phoneNumberId) {
        outcome.skipped += 1;
        outcome.detail.push('ignored: payload belongs to a different phone number');
        continue;
      }

      // ---- status events (sent / delivered / read / failed) ----
      for (const st of value.statuses || []) {
        const wamid = String(st.id || '');
        const status = String(st.status || '');
        const key = `status:${wamid}:${status}`;
        const dedupe = await sbInsert<{ id: string }>('whatsapp_events', { dedupe_key: key, event_type: `status_${status}`, payload: { wamid, status, ts: st.timestamp } }, { onConflictIgnore: true });
        if (!dedupe.length) { outcome.skipped += 1; continue; }
        if (!wamid || !['sent', 'delivered', 'read', 'failed'].includes(status)) { outcome.skipped += 1; continue; }
        const err = (st.errors as Array<{ code?: number; title?: string; message?: string }> | undefined)?.[0];
        const patch: Record<string, unknown> = { status };
        if (status === 'failed' && err) patch.error = { code: err.code, title: err.title, message: err.message };
        const updated = await sbUpdate('whatsapp_messages', `wa_message_id=eq.${encodeURIComponent(wamid)}`, patch, true);
        if (updated.length) {
          outcome.processed += 1;
          outcome.detail.push(`status ${status} → ${wamid}`);
          if (status === 'failed') {
            await logActivityServer('whatsapp_message_failed', 'whatsapp_message', String((updated[0] as { id?: string }).id || wamid), { wamid, error: patch.error || {} });
          }
        } else {
          outcome.skipped += 1;
          outcome.detail.push(`status ${status}: no local message ${wamid}`);
        }
      }

      // ---- inbound messages ----
      for (const m of value.messages || []) {
        const inbound = parseInbound(m);
        if (!inbound || !inbound.from || !inbound.wamid) { outcome.skipped += 1; continue; }
        const key = `msg:${inbound.wamid}`;
        const dedupe = await sbInsert<{ id: string }>('whatsapp_events', { dedupe_key: key, event_type: 'message_in', payload: { wamid: inbound.wamid, from: inbound.from, type: inbound.kind } }, { onConflictIgnore: true });
        if (!dedupe.length) { outcome.skipped += 1; outcome.detail.push(`duplicate message ${inbound.wamid}`); continue; }
        try {
          const waId = digitsOf(inbound.from);
          const profileName = inbound.profileName || ((value.contacts || []).find((c) => String(c.wa_id || '') === String(inbound.from))?.profile?.name || '');
          const { contactId, conversationId, isNewContact, isNewConversation } = await ensureContactConversation(waId, profileName, inbound.ts);
          await sbInsert('whatsapp_messages', {
            conversation_id: conversationId, wa_id: waId, wa_message_id: inbound.wamid,
            direction: 'in', type: inbound.kind, body: inbound.body, media: inbound.media,
            status: 'received', timestamp: inbound.ts.toISOString(),
          });
          await sbUpdate('whatsapp_conversations', `id=eq.${conversationId}`, {
            unread_count: await bumpUnread(conversationId, 1),
            last_message_preview: previewOf(inbound.body, inbound.kind),
            last_message_at: inbound.ts.toISOString(),
            last_in_at: inbound.ts.toISOString(),
            window_expires_at: isoPlus24h(inbound.ts).toISOString(),
            updated_at: new Date().toISOString(),
          });
          await sbUpdate('whatsapp_contacts', `id=eq.${contactId}`, { last_message_at: inbound.ts.toISOString(), updated_at: new Date().toISOString() });
          outcome.processed += 1;
          outcome.detail.push(`message ${inbound.wamid} (${inbound.kind}) from +${waId}`);
          await logActivityServer('whatsapp_message_received', 'whatsapp_conversation', conversationId, { wa_id: waId, type: inbound.kind });
          await fireAutomation(isNewConversation ? 'new_conversation' : isNewContact ? 'new_lead' : null, { contactId, conversationId, waId });
        } catch (e) {
          if (isSchemaMissing(e)) throw e;
          outcome.detail.push(`message ${inbound.wamid} processing failed: ${e instanceof Error ? e.message : 'error'}`);
        }
      }

      // ---- template status updates (real API state only) ----
      const tplId = String(value.message_template_id || '');
      const tplStatus = String((change.field === 'message_template_status_update' && (value as { message_template_status?: string }).message_template_status) || '');
      if (tplId && tplStatus) {
        const key = `tpl:${tplId}:${tplStatus}`;
        const dedupe = await sbInsert<{ id: string }>('whatsapp_events', { dedupe_key: key, event_type: 'template_status', payload: { tplId, tplStatus } }, { onConflictIgnore: true });
        if (dedupe.length && ['APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'ARCHIVED', 'DELETED'].includes(tplStatus)) {
          await sbUpdate('whatsapp_templates', `template_id=eq.${encodeURIComponent(tplId)}`, { status: tplStatus, updated_at: new Date().toISOString() });
          outcome.processed += 1;
          outcome.detail.push(`template ${tplId} → ${tplStatus}`);
        }
      }
    }
  }
  return outcome;
}

/** unread_count = unread_count + delta (read-modify-write; small race acceptable). */
async function bumpUnread(conversationId: string, delta: number): Promise<number> {
  const row = await sbSelectOne<{ unread_count: number }>(`/whatsapp_conversations?select=unread_count&id=eq.${conversationId}`);
  return Math.max(0, (row?.unread_count || 0) + delta);
}
