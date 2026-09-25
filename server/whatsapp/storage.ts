// =============================================================================
// BRANIFY WHATSAPP CRM — private media storage (server-only, service_role)
// -----------------------------------------------------------------------------
// Inbound customer media is downloaded from Meta's TEMPORARY URLs once and
// persisted into the PRIVATE `whatsapp-media` bucket (spec §8: never expose
// temporary Meta URLs as permanent public ones). Display happens through
// short-lived signed URLs created here — never public, never anonymous.
// Outbound attachments are uploaded by the signed-in admin's own JWT directly
// to the bucket (storage RLS: branify_is_admin only), then handed to this
// module server-side so the WhatsApp token never leaves the server.
// =============================================================================
import { StoreError } from './sb';

const SB_URL = (process.env.SUPABASE_URL || 'https://uspshkegxhrglbpxqtil.supabase.co').replace(/\/+$/, '');
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '';
export const MEDIA_BUCKET = 'whatsapp-media';

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { Authorization: `Bearer ${SERVICE_ROLE}`, apikey: SERVICE_ROLE, ...extra };
}

function requireService(): void {
  if (!SERVICE_ROLE) throw new StoreError('server_config', 500, 'Supabase service credentials are not configured on the server.');
}

/** Upload bytes to the private bucket (upsert). */
export async function uploadObject(path: string, buffer: Buffer, mime: string): Promise<void> {
  requireService();
  const res = await fetch(`${SB_URL}/storage/v1/object/${MEDIA_BUCKET}/${path}`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': mime || 'application/octet-stream', 'x-upsert': 'true' }),
    body: new Uint8Array(buffer),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new StoreError('storage', 502, `Media storage failed (HTTP ${res.status}).${text ? ' ' + text.slice(0, 140) : ''}`);
  }
}

/** Download bytes from the private bucket. */
export async function downloadObject(path: string): Promise<{ buffer: Buffer; mime: string }> {
  requireService();
  const res = await fetch(`${SB_URL}/storage/v1/object/${MEDIA_BUCKET}/${path}`, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new StoreError('storage', res.status === 404 ? 404 : 502, 'Stored media could not be read.');
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, mime: res.headers.get('content-type') || 'application/octet-stream' };
}

/** Short-lived signed URL for PRIVATE media (admin-only callers upstream). */
export async function createSignedUrl(path: string, expiresSec = 3600): Promise<string> {
  requireService();
  const res = await fetch(`${SB_URL}/storage/v1/object/sign/${MEDIA_BUCKET}/${path}`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ expiresIn: expiresSec }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new StoreError('storage', 502, 'Could not create a media link.');
  const json = (await res.json()) as { signedURL?: string; signedUrl?: string };
  const signed = json.signedURL || json.signedUrl || '';
  if (!signed) throw new StoreError('storage', 502, 'Media link response was empty.');
  return `${SB_URL}/storage/v1${signed}`;
}

/** Delete an object (best-effort cleanup). */
export async function deleteObject(path: string): Promise<void> {
  if (!SERVICE_ROLE) return;
  await fetch(`${SB_URL}/storage/v1/object/${MEDIA_BUCKET}/${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
    signal: AbortSignal.timeout(15000),
  }).catch(() => undefined);
}

/** Filename-safe storage path builder. */
export function mediaPath(prefix: 'inbound' | 'outbound', key: string, filename: string, mime: string): string {
  const safeName = (filename || '').replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80) || 'file';
  const ext = safeName.includes('.') ? '' : extFromMime(mime);
  return `${prefix}/${key}${ext ? '.' + ext : ''}-${safeName}`.replace(/\/+/g, '/');
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    'video/mp4': 'mp4', 'video/3gpp': '3gp', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a', 'audio/aac': 'aac', 'audio/amr': 'amr',
    'application/pdf': 'pdf', 'text/plain': 'txt',
  };
  return map[(mime || '').toLowerCase()] || 'bin';
}
