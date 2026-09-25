// =============================================================================
// BRANIFY WHATSAPP CRM — message bubble (spec §3/§15/§16)
// All officially supported inbound/outbound types, quoted replies, real status
// ticks from webhook events, per-message actions. Media is resolved through the
// admin-only signed-URL endpoint (lazy-persisted to private storage, §8/§25).
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import {
  Check, CheckCheck, Clock, Copy, CornerUpLeft, Download, ExternalLink,
  FileText, MapPin, Music, TriangleAlert, UserRound, Video,
} from 'lucide-react';
import { cx } from '../../ui';
import * as wa from '../waClient';
import type { WaMessage, WaQuotedSnapshot } from '../waTypes';

export const timeLabel = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const dayKeyOf = (iso: string): string => new Date(iso).toDateString();
export const dayLabelOf = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date().toDateString();
  const yest = new Date(Date.now() - 86400000).toDateString();
  if (d.toDateString() === today) return 'Today';
  if (d.toDateString() === yest) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
};

// ---------------------------------------------------------------- media resolution
interface ResolvedMedia { url: string; mime: string; filename: string }
const mediaCache = new Map<string, { data: ResolvedMedia | null; exp: number }>();

async function resolveMedia(m: WaMessage): Promise<ResolvedMedia | null> {
  const hit = mediaCache.get(m.id);
  if (hit && hit.exp > Date.now()) return hit.data;
  try {
    const res = await wa.mediaSignedUrl(m.id);
    const data: ResolvedMedia = { url: res.media.url, mime: res.media.mime, filename: res.media.filename };
    mediaCache.set(m.id, { data, exp: Date.now() + 45 * 60000 });
    return data;
  } catch {
    mediaCache.set(m.id, { data: null, exp: Date.now() + 5 * 60000 });
    return null;
  }
}

// ---------------------------------------------------------------- status ticks
export const StatusTicks: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'queued') return <Clock size={11} aria-label="Sending" />;
  if (status === 'sent') return <Check size={11} aria-label="Sent" />;
  if (status === 'delivered') return <CheckCheck size={11} aria-label="Delivered" />;
  if (status === 'read') return <CheckCheck size={11} className="text-sky-500" aria-label="Read" />;
  if (status === 'failed') return <TriangleAlert size={11} className="text-red-500" aria-label="Failed" />;
  return null;
};

const fmtSize = (b?: number): string => (b ? (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`) : '');

// ---------------------------------------------------------------- bubble
export const Bubble: React.FC<{
  message: WaMessage;
  onReply: (m: WaMessage) => void;
  isOwnLastFailed?: boolean;
}> = ({ message: m, onReply }) => {
  const out = m.direction === 'out';
  const [media, setMedia] = useState<ResolvedMedia | null>(null);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const isMedia = ['image', 'document', 'audio', 'video', 'sticker'].includes(m.type)
    && Boolean(m.media?.media_id || m.media?.storage_path || m.media?.link);

  useEffect(() => {
    if (!isMedia) return;
    let alive = true;
    setMediaFailed(false);
    if (m.media?.link && !m.media?.storage_path && !m.media?.media_id) {
      setMedia({ url: String(m.media.link), mime: String(m.media.mime || ''), filename: String(m.media.filename || '') });
      return () => { alive = false; };
    }
    resolveMedia(m).then((r) => { if (alive) { if (r) setMedia(r); else setMediaFailed(true); } });
    return () => { alive = false; if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; } };
  }, [isMedia, m.id]);

  const quoted = (m.quoted && typeof m.quoted === 'object' && 'wamid' in (m.quoted as Record<string, unknown>)) ? m.quoted as WaQuotedSnapshot : null;

  const copyText = () => {
    void navigator.clipboard.writeText(m.body || '').catch(() => undefined);
  };

  const retry = async () => {
    setRetrying(true);
    try { await wa.retryMessage(m.id); } catch { /* toast handled by caller via status refresh */ } finally { setRetrying(false); }
  };

  const download = () => {
    if (!media) return;
    const a = document.createElement('a');
    a.href = media.url;
    a.download = media.filename || `whatsapp-${m.id}`;
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
  };

  const QuotedBox = quoted ? (
    <div className="mb-1.5 rounded-lg border-l-[3px] border-[#C9A45C] bg-black/[0.06] px-2 py-1.5 text-[10.5px] leading-snug">
      <p className="font-bold text-[#8F6B2D]">{quoted.direction === 'out' ? 'You' : 'Customer'}</p>
      <p className="line-clamp-2 text-[#334155]">
        {quoted.type === 'image' ? '📷 Photo' : quoted.type === 'video' ? '🎬 Video' : quoted.type === 'audio' ? '🎵 Voice note' : quoted.type === 'document' ? `📄 ${quoted.filename || 'Document'}` : quoted.body || 'Message'}
      </p>
    </div>
  ) : null;

  return (
    <div className={cx('group flex w-full items-end gap-1.5', out ? 'justify-end' : 'justify-start')}>
      {out && (
        <MessageActions out onReply={() => onReply(m)} onCopy={copyText} onDetails={() => setShowDetails((v) => !v)} failed={m.status === 'failed'} onRetry={retry} retrying={retrying} />
      )}
      <div className={cx('relative max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-sm sm:max-w-[68%]',
        out ? 'rounded-br-sm bg-[#DCC18A]/40 text-[#1A1206]' : 'rounded-bl-sm bg-white text-[#111827] border border-[#0F172A]/[0.08]')}>
        {m.type === 'template' && (
          <p className="mb-1 inline-flex rounded-full bg-[#8F6B2D]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#8F6B2D]">
            Template{m.template_name ? ` · ${m.template_name}` : ''}
          </p>
        )}
        {QuotedBox}

        {/* --- media bodies --- */}
        {m.type === 'image' && (media
          ? <a href={media.url} target="_blank" rel="noopener noreferrer"><img src={media.url} alt={m.media?.caption || 'WhatsApp image'} className="mb-1 max-h-56 rounded-lg" loading="lazy" /></a>
          : <div className="mb-1 flex h-28 w-44 items-center justify-center rounded-lg bg-black/[0.05] text-[10.5px] text-[#7E8DA6]">{mediaFailed ? 'Photo unavailable' : 'Loading photo…'}</div>)}
        {m.type === 'sticker' && (media
          ? <img src={media.url} alt="Sticker" className="mb-1 max-h-40" loading="lazy" />
          : <div className="mb-1 flex h-24 w-24 items-center justify-center rounded-lg bg-black/[0.05] text-[10.5px] text-[#7E8DA6]">{mediaFailed ? 'Sticker unavailable' : '…'}</div>)}
        {m.type === 'video' && (media
          ? <video controls src={media.url} className="mb-1 max-h-56 rounded-lg" preload="metadata" />
          : <div className="mb-1 flex h-28 w-44 items-center justify-center gap-1.5 rounded-lg bg-black/[0.05] text-[10.5px] text-[#7E8DA6]"><Video size={13} /> {mediaFailed ? 'Video unavailable' : 'Loading video…'}</div>)}
        {m.type === 'audio' && (media
          ? <div className="mb-1 flex items-center gap-2"><Music size={13} className="shrink-0 text-[#8F6B2D]" /><audio controls src={media.url} className="max-w-[220px]" preload="metadata" /></div>
          : <div className="mb-1 flex h-10 items-center gap-2 rounded-lg bg-black/[0.05] px-2 text-[10.5px] text-[#7E8DA6]"><Music size={13} /> {mediaFailed ? 'Voice note unavailable' : 'Loading voice note…'}</div>)}
        {m.type === 'document' && (
          <div className="mb-1 flex items-center gap-2 rounded-lg bg-black/[0.04] px-2.5 py-2">
            <FileText size={16} className="shrink-0 text-[#8F6B2D]" />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold">{m.media?.filename || 'Document'}</p>
              <p className="text-[9px] text-[#7E8DA6]">{fmtSize(m.media?.size)}{media ? '' : mediaFailed ? ' · unavailable' : ' · loading…'}</p>
            </div>
            {media && <a href={media.url} download={media.filename || 'document'} target="_blank" rel="noopener noreferrer" className="ml-1 shrink-0 rounded-md p-1 text-[#8F6B2D] hover:bg-black/[0.06]" aria-label="Download document"><Download size={13} /></a>}
          </div>
        )}
        {m.type === 'location' && (() => {
          const loc = (m.media?.location || { latitude: m.media?.latitude, longitude: m.media?.longitude }) as { latitude?: number | string | null; longitude?: number | string | null; name?: string; address?: string };
          const hasCoords = loc.latitude != null && loc.longitude != null;
          return (
            <div className="mb-1 flex items-start gap-2 rounded-lg bg-black/[0.04] px-2.5 py-2">
              <MapPin size={15} className="mt-0.5 shrink-0 text-[#8F6B2D]" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold">{loc.name || 'Location'}</p>
                {loc.address && <p className="text-[10.5px] text-[#5B6B82]">{loc.address}</p>}
                {hasCoords && <a href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#8F6B2D] underline">Open map <ExternalLink size={9} /></a>}
              </div>
            </div>
          );
        })()}
        {m.type === 'contacts' && (
          <div className="mb-1 flex items-start gap-2 rounded-lg bg-black/[0.04] px-2.5 py-2">
            <UserRound size={15} className="mt-0.5 shrink-0 text-[#8F6B2D]" />
            <div className="min-w-0">
              {(m.media?.contacts || []).map((c, i) => (
                <div key={i}>
                  <p className="text-[11px] font-bold">{c.name?.formatted_name || 'Contact'}</p>
                  {(c.phones || []).map((p, j) => <p key={j} className="text-[10.5px] text-[#5B6B82]">{p.phone}{p.wa_id ? ' · WhatsApp' : ''}</p>)}
                </div>
              ))}
            </div>
          </div>
        )}
        {m.type === 'interactive' && (
          <p className="mb-1 inline-flex items-center gap-1 rounded-full bg-[#8F6B2D]/12 px-2 py-0.5 text-[10px] font-bold text-[#8F6B2D]">
            🔘 {m.media?.title || m.body.replace(/^\[(button|interactive)\]\s*/, '') || 'Button reply'}
          </p>
        )}
        {m.type === 'reaction' && (
          <p className="text-[11px]">{m.media?.emoji ? <span className="text-[15px]">{m.media.emoji}</span> : '↩️ reaction removed'}</p>
        )}

        {m.type !== 'reaction' && m.body && <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>}

        <p className={cx('mt-1 flex items-center justify-end gap-1 text-[9px]', out ? 'text-[#8F6B2D]' : 'text-[#94A3B8]')}>
          {showDetails && m.wa_message_id && <span className="mr-1 max-w-[160px] truncate font-mono" title={m.wa_message_id}>{m.wa_message_id}</span>}
          {timeLabel(m.timestamp)}
          {out && <StatusTicks status={m.status} />}
        </p>
        {m.status === 'failed' && m.error?.message && (
          <div className="mt-1 flex items-start justify-between gap-2 rounded-md bg-red-500/10 px-1.5 py-1">
            <p className="flex items-start gap-1 text-[9.5px] text-red-600"><TriangleAlert size={11} className="mt-px shrink-0" /> {m.error.message}</p>
            <button onClick={retry} disabled={retrying} className="shrink-0 rounded-md bg-red-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-red-700 hover:bg-red-500/25">
              {retrying ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        )}
      </div>
      {!out && (
        <MessageActions onReply={() => onReply(m)} onCopy={copyText} onDetails={() => setShowDetails((v) => !v)} onDownload={isMedia && media ? download : undefined} />
      )}
    </div>
  );
};

// ---------------------------------------------------------------- hover actions
const MessageActions: React.FC<{
  onReply: () => void;
  onCopy: () => void;
  onDetails: () => void;
  onDownload?: () => void;
}> = ({ onReply, onCopy, onDetails, onDownload }) => (
  <div className="flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/90 p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-within:opacity-100">
    <button onClick={onReply} className="rounded-full p-1.5 text-[#5B6B82] hover:bg-[#C9A45C]/15 hover:text-[#8F6B2D]" title="Reply" aria-label="Reply"><CornerUpLeft size={12} /></button>
    <button onClick={onCopy} className="rounded-full p-1.5 text-[#5B6B82] hover:bg-[#C9A45C]/15 hover:text-[#8F6B2D]" title="Copy text" aria-label="Copy message text"><Copy size={12} /></button>
    {onDownload && <button onClick={onDownload} className="rounded-full p-1.5 text-[#5B6B82] hover:bg-[#C9A45C]/15 hover:text-[#8F6B2D]" title="Download" aria-label="Download media"><Download size={12} /></button>}
    <button onClick={onDetails} className="rounded-full p-1.5 text-[#5B6B82] hover:bg-[#C9A45C]/15 hover:text-[#8F6B2D]" title="Message details" aria-label="Message details"><i className="text-[10px] not-italic font-black">i</i></button>
  </div>
);
