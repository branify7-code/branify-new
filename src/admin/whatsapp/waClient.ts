// =============================================================================
// BRANIFY WHATSAPP CRM — browser client
// -----------------------------------------------------------------------------
// Two transports, both matching existing admin patterns:
//   · Supabase (RLS-protected, signed-in admin) for CRM records — contacts,
//     conversations, messages, notes, quick replies, automations, events.
//   · Server endpoints (/api/whatsapp/*) for anything that touches WhatsApp
//     credentials: config, status/test, send, template sync, AI, analytics,
//     media proxy. Bearer = the admin's own Supabase access token; secrets
//     stay server-side.
// =============================================================================
import { supabase } from '../../lib/supabase';
import type {
  WaContact, WaConversation, WaMessage, WaTemplate, WaNote, WaQuickReply,
  WaAutomation, WaStatusResponse, WaMaskedConfig, WaAnalytics, WaHealth,
} from './waTypes';

export class WaError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const DEV = Boolean((import.meta as { env?: Record<string, unknown> }).env?.DEV);
const BASE = DEV ? 'https://branify.store/api/whatsapp' : '/api/whatsapp';
const TIMEOUT_MS = 60000;

function timeoutSignal(ms: number): AbortSignal {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

async function token(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const t = data?.session?.access_token;
  if (!t) throw new WaError('unauthorized', 401, 'Sign in to BRANIFY Admin first.');
  return t;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}`, ...(init.headers || {}) },
      signal: timeoutSignal(TIMEOUT_MS),
    });
  } catch (e) {
    const aborted = e instanceof Error && (e.name === 'AbortError' || /abort/i.test(e.message || ''));
    throw new WaError(aborted ? 'timeout' : 'network', aborted ? 504 : 502,
      aborted ? 'The request took too long. Try again.' : 'Could not reach the WhatsApp service.');
  }
  if (res.status === 204) return undefined as T;
  let json: { ok?: boolean; data?: T; error?: { code: string; message: string } } | null = null;
  try { json = await res.json(); } catch { json = null; }
  if (!res.ok || (json && json.ok === false)) {
    const err = json?.error;
    throw new WaError(err?.code || 'wa_error', res.status, err?.message || `Request failed (${res.status}).`);
  }
  return (json ? (json.data !== undefined ? json.data : json) : null) as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return call<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

// ------------------------------------------------------------------ supabase CRUD
function sbErr(e: { message?: string } | null, fallback: string): never {
  const msg = e?.message || fallback;
  const code = /PGRST205|does not exist/i.test(msg) ? 'schema_missing' : 'db';
  throw new WaError(code, code === 'schema_missing' ? 503 : 400,
    code === 'schema_missing' ? 'The WhatsApp CRM tables are not created yet.' : msg);
}

export async function schemaReady(): Promise<boolean> {
  const { error } = await supabase.from('whatsapp_contacts').select('id').limit(1);
  return !error;
}

async function list<T>(table: string, qs: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*');
  if (error) sbErr(error, 'Read failed');
  void qs;
  return (data || []) as T[];
}

// conversations — server-side filters + search (spec §2/§28: never dump the DB)
// search matches contact name/email/company, phone, and last preview via PostgREST.
export async function listConversations(opts: { search?: string; limit?: number } = {}): Promise<WaConversation[]> {
  let q = supabase
    .from('whatsapp_conversations')
    .select('*, contact:whatsapp_contacts(id,name,email,company,tags,lead_status,opt_out)')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(opts.limit || 120);
  const s = (opts.search || '').trim();
  if (s) {
    const esc = s.replace(/[%,()]/g, ' ').trim();
    if (esc) q = q.or(`wa_id.ilike.%${esc}%,last_message_preview.ilike.%${esc}%,contact.name.ilike.%${esc}%,contact.email.ilike.%${esc}%,contact.company.ilike.%${esc}%`);
  }
  const { data, error } = await q;
  if (error) sbErr(error, 'Read failed');
  return (data || []) as unknown as WaConversation[];
}

/** Conversation ids whose messages match a text query (trigram-indexed, server-side). */
export async function searchConversationIdsByText(q: string, limit = 30): Promise<string[]> {
  const s = q.trim();
  if (!s) return [];
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('conversation_id')
    .ilike('body', `%${s.replace(/[%,()]/g, ' ').trim()}%`)
    .limit(limit * 4);
  if (error) sbErr(error, 'Search failed');
  return Array.from(new Set((data || []).map((r: { conversation_id: string }) => r.conversation_id))).slice(0, limit);
}

export const listContacts = (): Promise<WaContact[]> => list<WaContact>('whatsapp_contacts', '');
export const listTemplates = (): Promise<WaTemplate[]> => list<WaTemplate>('whatsapp_templates', '');
export const listQuickReplies = (): Promise<WaQuickReply[]> => list<WaQuickReply>('whatsapp_quick_replies', '');
export const listAutomations = (): Promise<WaAutomation[]> => list<WaAutomation>('whatsapp_automations', '');

/** Paginated history (oldest page ends at `before`) — infinite scroll, §3. */
export async function listMessages(conversationId: string, opts: { before?: string; limit?: number } = {}): Promise<WaMessage[]> {
  let q = supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: false })
    .limit(opts.limit || 50);
  if (opts.before) q = q.lt('timestamp', opts.before);
  const { data, error } = await q;
  if (error) sbErr(error, 'Read failed');
  return ((data || []) as WaMessage[]).slice().reverse();
}

export async function listNotes(contactId: string): Promise<WaNote[]> {
  const { data, error } = await supabase
    .from('whatsapp_notes')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) sbErr(error, 'Read failed');
  return (data || []) as WaNote[];
}

export const createNote = async (contactId: string, body: string, authorEmail: string): Promise<void> => {
  const { error } = await supabase.from('whatsapp_notes').insert({ contact_id: contactId, body, author_email: authorEmail });
  if (error) sbErr(error, 'Could not save the note');
};

export const updateContact = async (id: string, patch: Partial<WaContact>): Promise<void> => {
  const { error } = await supabase.from('whatsapp_contacts').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) sbErr(error, 'Could not update the contact');
};

export const createContact = async (payload: { wa_id: string; name?: string; email?: string; company?: string; source?: string }): Promise<WaContact> => {
  const { data, error } = await supabase.from('whatsapp_contacts').insert(payload).select().single();
  if (error) sbErr(error, 'Could not create the contact');
  return data as WaContact;
};

export const updateConversation = async (id: string, patch: Partial<WaConversation>): Promise<void> => {
  const { error } = await supabase.from('whatsapp_conversations').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) sbErr(error, 'Could not update the conversation');
};

export const saveQuickReply = async (row: Partial<WaQuickReply> & { title: string; body: string }): Promise<void> => {
  const { error } = await supabase.from('whatsapp_quick_replies').upsert(row);
  if (error) sbErr(error, 'Could not save the quick reply');
};

export const deleteQuickReply = async (id: string): Promise<void> => {
  const { error } = await supabase.from('whatsapp_quick_replies').delete().eq('id', id);
  if (error) sbErr(error, 'Could not delete the quick reply');
};

export const saveAutomation = async (row: Partial<WaAutomation> & { name: string; trigger: WaAutomation['trigger']; actions: WaAutomation['actions'] }): Promise<void> => {
  const { error } = await supabase.from('whatsapp_automations').upsert({ ...row, updated_at: new Date().toISOString() });
  if (error) sbErr(error, 'Could not save the automation');
};

export const deleteAutomation = async (id: string): Promise<void> => {
  const { error } = await supabase.from('whatsapp_automations').delete().eq('id', id);
  if (error) sbErr(error, 'Could not delete the automation');
};

// ------------------------------------------------------------------ server endpoints
export const getStatus = (): Promise<WaStatusResponse> => call<WaStatusResponse>('/status');
export const getConfig = (): Promise<{ config: WaMaskedConfig }> => call<{ config: WaMaskedConfig }>('/config');
export const saveConfigServer = (payload: {
  waba_id?: string; phone_number_id?: string; access_token?: string; verify_token?: string; app_secret?: string;
}): Promise<{ config: WaMaskedConfig }> => post<{ config: WaMaskedConfig }>('/config', payload);
export const syncTemplatesServer = (): Promise<{ result: { synced: number; statuses: Record<string, number> } }> => post('/templates/sync', {});
export const runInactiveAutomations = (): Promise<{ checked: number; affected: number }> => post('/automations/run', {});
export const analyticsServer = (payload: { preset: string; start?: string; end?: string }): Promise<{ analytics: WaAnalytics }> => post('/analytics', payload);
export const aiAction = (payload: { action: string; conversation_id: string; draft?: string; language?: string; save_as_note?: boolean }): Promise<{ result: Record<string, unknown> }> => post('/ai', payload);

export const sendMessage = (payload: {
  conversation_id: string; kind: string; text?: string;
  media?: { storage_path?: string; meta_id?: string; link?: string; caption?: string; filename?: string; mime?: string; size?: number; location?: { latitude: string | number; longitude: string | number; name?: string; address?: string }; contacts?: Array<{ name: { formatted_name: string; first_name?: string; last_name?: string }; phones?: Array<{ phone: string; type?: string }> }> };
  reply_to?: string;
}): Promise<{ result: { messageId: string } }> =>
  post('/send', payload);

export const retryMessage = (messageId: string): Promise<{ result: { messageId: string } }> => post('/retry', { message_id: messageId });

/** Short-lived signed URL for a message's media (inbound lazily persisted on first view). */
export const mediaSignedUrl = (messageId: string): Promise<{ media: { url: string; mime: string; filename: string; storagePath: string } }> =>
  post('/media-url', { message_id: messageId });

/** Honest inbound health (spec §30) — "Connected" ≠ messages actually arriving. */
export const health = (): Promise<{ health: WaHealth }> => call<{ health: WaHealth }>('/health');

// ------------------------------------------------------------------ private storage (outbound attachments)
const SB_URL = ((import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL || 'https://uspshkegxhrglbpxqtil.supabase.co').replace(/\/+$/, '');
const MEDIA_BUCKET = 'whatsapp-media';

/** Sanitize a filename into a storage-safe key segment. */
function safeName(name: string): string {
  return (name || 'file').replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80);
}

export function buildAttachmentPath(conversationId: string, file: File): string {
  return `outbound/${conversationId}/${Date.now()}-${safeName(file.name)}`;
}

/**
 * Upload an attachment to the PRIVATE bucket with real progress (spec §7).
 * Uses XHR because supabase-js storage upload does not expose progress events.
 * Storage RLS: authenticated BRANIFY admins only.
 */
export function uploadAttachment(path: string, file: File, onProgress?: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    void token().then((t) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${SB_URL}/storage/v1/object/${MEDIA_BUCKET}/${path}`);
      xhr.setRequestHeader('Authorization', `Bearer ${t}`);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new WaError('storage', xhr.status, `Upload failed (HTTP ${xhr.status}).`)));
      xhr.onerror = () => reject(new WaError('network', 502, 'Upload failed — network error.'));
      xhr.send(file);
    }).catch(reject);
  });
}

/** Official Meta media constraints — validated BEFORE upload (spec §7/§10/§29). */
export const MEDIA_LIMITS = {
  image: { maxMb: 5, mimes: ['image/jpeg', 'image/png', 'image/webp'] },
  video: { maxMb: 16, mimes: ['video/mp4', 'video/3gpp'] },
  audio: { maxMb: 16, mimes: ['audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/amr'] },
  document: { maxMb: 100, mimes: [] as string[] },
  sticker: { maxMb: 1, mimes: ['image/webp'] },
} as const;

export function validateAttachment(kind: keyof typeof MEDIA_LIMITS, file: File): string | null {
  const lim = MEDIA_LIMITS[kind];
  if (lim.mimes.length && !lim.mimes.some((m) => file.type.startsWith(m.split('/')[0]) && file.type === m)) {
    return `Unsupported ${kind} format (${file.type || 'unknown'}). Allowed: ${lim.mimes.join(', ')}.`;
  }
  if (file.size > lim.maxMb * 1024 * 1024) return `File too large — max ${lim.maxMb} MB for ${kind} (selected ${(file.size / 1048576).toFixed(1)} MB).`;
  if (file.size === 0) return 'The selected file is empty.';
  return null;
}

// ------------------------------------------------------------------ realtime (§22)
export interface RealtimeHandle { unsubscribe: () => void }

/** Live conversation list updates (INSERT/UPDATE on conversations). */
export function subscribeConversations(handlers: {
  onUpsert?: (row: WaConversation) => void;
  onError?: () => void;
}): RealtimeHandle {
  const ch = supabase
    .channel('wa-conversations')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, (payload) => {
      const p = payload as unknown as { eventType?: string; new?: WaConversation };
      if (p.eventType === 'INSERT' || p.eventType === 'UPDATE') {
        if (p.new) handlers.onUpsert?.(p.new);
      }
    })
    .subscribe((status) => { if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') handlers.onError?.(); });
  return { unsubscribe: () => { void supabase.removeChannel(ch); } };
}

/** Live messages for the OPEN conversation (INSERT + status UPDATEs). */
export function subscribeMessages(conversationId: string, handlers: {
  onInsert?: (row: WaMessage) => void;
  onUpdate?: (row: WaMessage) => void;
  onError?: () => void;
}): RealtimeHandle {
  const ch = supabase
    .channel(`wa-messages-${conversationId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => handlers.onInsert?.(payload.new as WaMessage))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'whatsapp_messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => handlers.onUpdate?.(payload.new as WaMessage))
    .subscribe((status) => { if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') handlers.onError?.(); });
  return { unsubscribe: () => { void supabase.removeChannel(ch); } };
}

export const sendTemplateMessage = (payload: {
  conversation_id: string; template_name: string; language: string; category: string; body_params: string[];
  header_media?: { kind: 'image' | 'document' | 'video'; storage_path?: string; meta_id?: string; link?: string; filename?: string; mime?: string };
  reply_to?: string;
}): Promise<{ result: { messageId: string } }> =>
  post('/send', { kind: 'template', ...payload });

export const markRead = (conversationId: string): Promise<void> => post('/read', { conversation_id: conversationId });

/** Fetch media through the server proxy as a blob URL (token stays server-side). */
export async function mediaBlobUrl(mediaId: string): Promise<string> {
  const res = await fetch(`${BASE}/media/${encodeURIComponent(mediaId)}`, {
    headers: { Authorization: `Bearer ${await token()}` },
    signal: timeoutSignal(TIMEOUT_MS),
  });
  if (!res.ok) throw new WaError('media', res.status, 'Could not load this media.');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/** Team member list for assignment (admin_users is admin-readable via RLS). */
export async function listAgents(): Promise<Array<{ email: string; name: string; role: string }>> {
  const { data, error } = await supabase.from('admin_users').select('email,name,role').eq('active', true).order('email');
  if (error) sbErr(error, 'Could not load the team');
  return (data || []) as Array<{ email: string; name: string; role: string }>;
}

/** Website contact settings (official business WhatsApp number — single source of truth). */
export async function officialNumber(): Promise<string> {
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', 'contact').limit(1);
    const value = (data?.[0] as { value?: { whatsapp?: string } } | undefined)?.value;
    return value?.whatsapp || '9233706922381';
  } catch {
    return '9233706922381';
  }
}
