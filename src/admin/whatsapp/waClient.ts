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
  WaAutomation, WaStatusResponse, WaMaskedConfig, WaAnalytics,
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

// conversations (ordered by most recent activity — sort happens client-side on last_message_at)
export const listConversations = (): Promise<WaConversation[]> => list<WaConversation>('whatsapp_conversations', '');
export const listContacts = (): Promise<WaContact[]> => list<WaContact>('whatsapp_contacts', '');
export const listTemplates = (): Promise<WaTemplate[]> => list<WaTemplate>('whatsapp_templates', '');
export const listQuickReplies = (): Promise<WaQuickReply[]> => list<WaQuickReply>('whatsapp_quick_replies', '');
export const listAutomations = (): Promise<WaAutomation[]> => list<WaAutomation>('whatsapp_automations', '');

export async function listMessages(conversationId: string, limit = 200): Promise<WaMessage[]> {
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: false })
    .limit(limit);
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

export const sendMessage = (payload: { conversation_id: string; kind: string; text?: string; media?: { link?: string; caption?: string; filename?: string } }): Promise<{ result: { messageId: string } }> =>
  post('/send', payload);

export const sendTemplateMessage = (payload: { conversation_id: string; template_name: string; language: string; category: string; body_params: string[] }): Promise<{ result: { messageId: string } }> =>
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
