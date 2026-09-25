// =============================================================================
// BRANIFY WHATSAPP CRM — media persistence bridge (server-only)
// -----------------------------------------------------------------------------
// LAZY-PERSIST strategy (webhook stays fast so Meta never retry-storms):
//   · Inbound webhook stores only {media_id, mime, filename…} — no downloads.
//   · The first time an admin opens the message, ensureStoredMedia() downloads
//     the bytes from Meta's temporary URL ONCE, stores them in the private
//     bucket, records storage_path on the message row, and returns a fresh
//     short-lived signed URL. Later views skip Meta entirely.
// Outbound attachments are already in the bucket (admin upload) — the send
// path reads them with downloadObject() and uploads to Meta by media id.
// =============================================================================
import { loadConfig, WaConfig } from './store';
import { fetchMediaBuffer } from './graph';
import { uploadObject, mediaPath, MEDIA_BUCKET } from './storage';
import { sbUpdate } from './sb';

export interface StoredMedia {
  storagePath: string;
  mime: string;
  size: number;
}

interface MessageMedia {
  media_id?: string;
  mime?: string;
  filename?: string;
  storage_path?: string;
  size?: number;
  [k: string]: unknown;
}

/**
 * Persist a message's WhatsApp media into the private bucket (once).
 * `rowId` — whatsapp_messages.id; `media` — the row's current media jsonb.
 * Returns the storage path, or null when there is nothing storable
 * (e.g. Meta expired the media, or the message has no downloadable id).
 */
export async function ensureStoredMedia(
  cfg: WaConfig, rowId: string, media: MessageMedia,
): Promise<StoredMedia | null> {
  if (media.storage_path) {
    return { storagePath: String(media.storage_path), mime: String(media.mime || ''), size: Number(media.size || 0) };
  }
  const mediaId = String(media.media_id || '');
  if (!mediaId || !/^[A-Za-z0-9_-]+$/.test(mediaId)) return null;
  const { buffer, mime } = await fetchMediaBuffer(cfg, mediaId);
  // 100 MB Meta cap, but stay defensive on function memory.
  if (buffer.length > 80 * 1024 * 1024) throw new Error('Media exceeds the 80 MB storage limit.');
  const path = mediaPath('inbound', mediaId, String(media.filename || ''), mime || String(media.mime || ''));
  await uploadObject(path, buffer, mime);
  const updated: MessageMedia = { ...media, storage_path: path, mime: mime || String(media.mime || ''), size: buffer.length };
  await sbUpdate('whatsapp_messages', `id=eq.${rowId}`, { media: updated });
  return { storagePath: path, mime: mime || String(media.mime || ''), size: buffer.length };
}

/** Convenience for handlers: resolve a message row id → signed media URL. */
export async function signedMediaForMessage(rowId: string, expiresSec = 3600): Promise<{
  url: string; mime: string; filename: string; storagePath: string;
} | null> {
  const { sbSelectOne } = await import('./sb');
  const row = await sbSelectOne<{ media: MessageMedia }>(`/whatsapp_messages?select=media&id=eq.${rowId}`);
  if (!row) return null;
  const cfg = await loadConfig();
  const stored = await ensureStoredMedia(cfg, rowId, row.media || {});
  if (!stored) return null;
  const { createSignedUrl } = await import('./storage');
  const url = await createSignedUrl(stored.storagePath, expiresSec);
  return { url, mime: stored.mime, filename: String(row.media?.filename || ''), storagePath: stored.storagePath };
}

export { MEDIA_BUCKET };
