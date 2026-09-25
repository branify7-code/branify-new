// =============================================================================
// BRANIFY WHATSAPP CRM — server-side Supabase (service_role) REST helpers
// -----------------------------------------------------------------------------
// The webhook has no admin session: it writes conversations/messages with the
// service_role key. These helpers are server-only (never imported by frontend
// code) and never log or return the key itself.
// =============================================================================
const SB_URL = (process.env.SUPABASE_URL || 'https://uspshkegxhrglbpxqtil.supabase.co').replace(/\/+$/, '');
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '';

export function serviceRoleConfigured(): boolean {
  return Boolean(SERVICE_ROLE);
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export class StoreError extends Error {
  status: number;
  code: string;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function run(method: string, path: string, body?: unknown, extra: Record<string, string> = {}): Promise<{ status: number; json: unknown; text: string }> {
  if (!SERVICE_ROLE) throw new StoreError('server_config', 500, 'Supabase service credentials are not configured on the server.');
  let res: Response;
  try {
    res = await fetch(`${SB_URL}/rest/v1${path}`, {
      method,
      headers: headers(extra),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new StoreError('network', 502, 'Could not reach the BRANIFY database. Please try again.');
  }
  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return { status: res.status, json, text };
}

function sbMessage(json: unknown, fallback: string): string {
  const j = json as { message?: string; error_description?: string; error?: string } | null;
  return (j && (j.message || j.error_description || j.error)) || fallback;
}

/** True when a PostgREST failure means "table does not exist yet". */
export function isSchemaMissing(err: unknown): boolean {
  if (err instanceof StoreError && err.code === 'schema_missing') return true;
  const msg = err instanceof Error ? err.message : '';
  return /PGRST205|does not exist|schema_missing/i.test(msg);
}

/** SELECT with a full PostgREST querystring (e.g. "/whatsapp_contacts?select=*&wa_id=eq.123"). */
export async function sbSelect<T>(path: string): Promise<T[]> {
  const { status, json, text } = await run('GET', path.startsWith('/') ? path : `/${path}`);
  if (status === 404 || text.includes('PGRST205')) {
    throw new StoreError('schema_missing', 503, 'The WhatsApp CRM database tables are not created yet.');
  }
  if (status >= 400) throw new StoreError('db', 502, sbMessage(json, `Database read failed (HTTP ${status}).`));
  return (Array.isArray(json) ? json : []) as T[];
}

/** Single-row select convenience (or null). */
export async function sbSelectOne<T>(path: string): Promise<T | null> {
  const rows = await sbSelect<T>(path);
  return rows.length ? rows[0] : null;
}

/** INSERT one row. Returns inserted row when represent. */
export async function sbInsert<T>(table: string, row: Record<string, unknown>, opts: { represent?: boolean; onConflictIgnore?: boolean; conflictColumn?: string } = {}): Promise<T[]> {
  const extra: Record<string, string> = {};
  if (opts.represent) extra.Prefer = opts.onConflictIgnore ? 'resolution=merge-duplicates,return=representation' : 'return=representation';
  else if (opts.onConflictIgnore) extra.Prefer = 'resolution=ignore-duplicates';
  // Deterministic duplicate handling under concurrent webhook deliveries.
  const conflict = opts.conflictColumn ? `?on_conflict=${opts.conflictColumn}` : '';
  const { status, json } = await run('POST', `/${table}${conflict}`, row, extra);
  if (status >= 400) throw new StoreError('db', 502, sbMessage(json, `Database insert failed (HTTP ${status}).`));
  return (Array.isArray(json) ? json : []) as T[];
}

/** UPDATE rows matching a raw querystring filter. */
export async function sbUpdate<T>(table: string, search: string, patch: Record<string, unknown>, represent = false): Promise<T[]> {
  const { status, json } = await run('PATCH', `/${table}?${search}`, patch, represent ? { Prefer: 'return=representation' } : {});
  if (status >= 400) throw new StoreError('db', 502, sbMessage(json, `Database update failed (HTTP ${status}).`));
  return (Array.isArray(json) ? json : []) as T[];
}

/** UPSERT one row (insert on_conflict=merge). */
export async function sbUpsert<T>(table: string, row: Record<string, unknown>, conflict: string, represent = false): Promise<T[]> {
  const { status, json } = await run('POST', `/${table}?on_conflict=${conflict}`, row, {
    Prefer: represent ? 'resolution=merge-duplicates,return=representation' : 'resolution=merge-duplicates',
  });
  if (status >= 400) throw new StoreError('db', 502, sbMessage(json, `Database upsert failed (HTTP ${status}).`));
  return (Array.isArray(json) ? json : []) as T[];
}

/** DELETE rows matching a raw querystring filter. */
export async function sbDelete(table: string, search: string): Promise<void> {
  const { status, json } = await run('DELETE', `/${table}?${search}`);
  if (status >= 400) throw new StoreError('db', 502, sbMessage(json, `Database delete failed (HTTP ${status}).`));
}
