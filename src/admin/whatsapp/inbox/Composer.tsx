// =============================================================================
// BRANIFY WHATSAPP CRM — composer (spec §4-§13, §24)
// WhatsApp-style: text (Enter sends / Shift+Enter newline) · emoji picker ·
// attachment menu (image/video/document/audio/sticker/location/contact) with
// preview, caption, real upload progress, remove & retry · reply banner ·
// TEMPLATE REQUIRED fallback when the 24h window is closed · quick replies ·
// AI suggested reply (human approval, never auto-sent).
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import {
  FileText, Image as ImageIcon, Loader2, MapPin, Music, Paperclip, Plus,
  Send, Smile, Sparkles, Sticker, Trash2, UserRound, Video, X, Zap,
} from 'lucide-react';
import { Badge, Btn, Field, Input, LoadingBlock, Modal, Textarea, useToast } from '../../ui';
import * as wa from '../waClient';
import type { WaContact, WaConversation, WaMessage, WaQuickReply, WaTemplate } from '../waTypes';
import { EmojiPicker } from './EmojiPicker';

type AttachmentKind = 'image' | 'video' | 'document' | 'audio' | 'sticker';

interface PendingAttachment {
  kind: AttachmentKind | 'location' | 'contacts';
  file?: File;
  previewUrl?: string;
  caption: string;
  progress: number;
  uploading: boolean;
  uploadedPath?: string;
  error?: string;
  location?: { latitude: string; longitude: string; name: string; address: string };
  contact?: { formatted: string; first: string; last: string; phone: string };
}

const FILE_INPUTS: Record<AttachmentKind, string> = {
  image: 'image/*',
  video: 'video/*',
  document: '*/*',
  audio: 'audio/*',
  sticker: 'image/webp',
};

// ==============================================================================
export const Composer: React.FC<{
  conversation: WaConversation;
  contact: WaContact | null;
  replyTo: WaMessage | null;
  onCancelReply: () => void;
  onSent: () => void;
  onOptimistic?: () => void;
}> = ({ conversation, contact, replyTo, onCancelReply, onSent }) => {
  const { push } = useToast();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [quickReplies, setQuickReplies] = useState<WaQuickReply[]>([]);
  const [showQuick, setShowQuick] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [templateModal, setTemplateModal] = useState(false);
  const [aiBusy, setAiBusy] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [editingAi, setEditingAi] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileKindRef = useRef<AttachmentKind>('image');

  const winOpen = conversation.window_expires_at ? new Date(conversation.window_expires_at).getTime() > Date.now() : false;

  useEffect(() => {
    if (winOpen) wa.listQuickReplies().then(setQuickReplies).catch(() => setQuickReplies([]));
  }, [winOpen]);

  // ---------------- text send ----------------
  const doSendText = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await wa.sendMessage({ conversation_id: conversation.id, kind: 'text', text: body, reply_to: replyTo?.wa_message_id || undefined });
      setText('');
      setAiReply('');
      setEditingAi(false);
      onCancelReply();
      onSent();
    } catch (e) {
      const err = e as wa.WaError;
      if (err.code === 'template_required') {
        setTemplateModal(true);
        push('error', 'The 24-hour window is closed — choose an approved template instead.');
      } else {
        push('error', err.message || 'Could not send the message.');
      }
    } finally {
      setSending(false);
    }
  };

  // ---------------- attachment pick + upload ----------------
  const pickFile = (kind: AttachmentKind) => {
    setShowAttach(false);
    fileKindRef.current = kind;
    fileRef.current?.click();
  };

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const kind = fileKindRef.current;
    const invalid = wa.validateAttachment(kind, file);
    if (invalid) { push('error', invalid); return; }
    setAttachment({
      kind, file, caption: '', progress: 0, uploading: false,
      previewUrl: kind === 'image' || kind === 'sticker' || kind === 'video' ? URL.createObjectURL(file) : undefined,
    });
  };

  const startUpload = async () => {
    if (!attachment?.file) return;
    const invalid = wa.validateAttachment(attachment.kind as 'image', attachment.file);
    if (invalid) { setAttachment({ ...attachment, error: invalid }); return; }
    setAttachment((a) => (a ? { ...a, uploading: true, error: undefined, progress: 0 } : a));
    const path = wa.buildAttachmentPath(conversation.id, attachment.file);
    try {
      await wa.uploadAttachment(path, attachment.file, (pct) => setAttachment((a) => (a ? { ...a, progress: pct } : a)));
      setAttachment((a) => (a ? { ...a, uploading: false, uploadedPath: path, progress: 100 } : a));
    } catch (err) {
      setAttachment((a) => (a ? { ...a, uploading: false, error: err instanceof Error ? err.message : 'Upload failed.' } : a));
    }
  };

  const sendAttachment = async () => {
    if (!attachment) return;
    if (attachment.file && !attachment.uploadedPath) {
      await startUpload();
      // Re-read latest state via callback loop: send after upload completes.
      return;
    }
    setSending(true);
    try {
      await wa.sendMessage({
        conversation_id: conversation.id,
        kind: attachment.kind,
        media: attachment.kind === 'location'
          ? { location: attachment.location }
          : attachment.kind === 'contacts'
            ? { contacts: [{ name: { formatted_name: attachment.contact?.formatted || attachment.contact?.first || 'Contact', first_name: attachment.contact?.first || undefined, last_name: attachment.contact?.last || undefined }, phones: [{ phone: attachment.contact?.phone || '', type: 'CELL' }] }] }
            : { storage_path: attachment.uploadedPath, caption: attachment.caption || undefined, filename: attachment.file?.name, mime: attachment.file?.type, size: attachment.file?.size },
        reply_to: replyTo?.wa_message_id || undefined,
      });
      if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      setAttachment(null);
      onCancelReply();
      onSent();
    } catch (e) {
      const err = e as wa.WaError;
      if (err.code === 'template_required') {
        setTemplateModal(true);
        push('error', 'Window closed — templates only.');
      } else {
        push('error', err.message || 'Could not send the attachment.');
      }
    } finally {
      setSending(false);
    }
  };

  const sendLocation = async (loc: { latitude: string; longitude: string; name: string; address: string }) => {
    setSending(true);
    try {
      await wa.sendMessage({ conversation_id: conversation.id, kind: 'location', media: { location: loc }, reply_to: replyTo?.wa_message_id || undefined });
      setAttachment(null);
      onCancelReply();
      onSent();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not send the location.');
    } finally { setSending(false); }
  };

  const sendContactCard = async (c: { formatted: string; first: string; last: string; phone: string }) => {
    setSending(true);
    try {
      await wa.sendMessage({
        conversation_id: conversation.id, kind: 'contacts',
        media: { contacts: [{ name: { formatted_name: c.formatted, first_name: c.first || undefined, last_name: c.last || undefined }, phones: [{ phone: c.phone, type: 'CELL' }] }] },
        reply_to: replyTo?.wa_message_id || undefined,
      });
      setAttachment(null);
      onCancelReply();
      onSent();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not send the contact card.');
    } finally { setSending(false); }
  };

  // ---------------- AI (internal, approval required) ----------------
  const askAi = async (action: 'suggest' | 'rewrite') => {
    setAiBusy(action);
    try {
      const draft = action === 'rewrite' ? (aiReply || text) : undefined;
      const res = await wa.aiAction({ action, conversation_id: conversation.id, draft });
      setAiReply(String((res.result as { text?: string }).text || ''));
      setEditingAi(false);
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'AI request failed.');
    } finally {
      setAiBusy('');
    }
  };

  const replyPreview = replyTo
    ? (replyTo.type === 'image' ? '📷 Photo' : replyTo.type === 'video' ? '🎬 Video' : replyTo.type === 'audio' ? '🎵 Voice note' : replyTo.type === 'document' ? `📄 ${replyTo.media?.filename || 'Document'}` : replyTo.body || 'Message')
    : '';

  return (
    <div className="relative border-t border-white/[0.06] bg-white/[0.02] p-3">
      {/* hidden file input */}
      <input ref={fileRef} type="file" className="hidden" accept={FILE_INPUTS[fileKindRef.current]} onChange={onFilePicked} aria-hidden="true" />

      {/* ---- AI suggested reply ---- */}
      {aiReply && (
        <div className="mb-2 rounded-xl border border-[#C9A45C]/30 bg-[#C9A45C]/[0.07] p-2.5" data-testid="ai-suggested-reply">
          <p className="mb-1 flex items-center gap-1 text-[9.5px] font-black uppercase tracking-[0.16em] text-[#8F6B2D]">
            <Sparkles size={11} /> AI Suggested Reply — review before sending (AI never auto-sends)
          </p>
          {editingAi ? (
            <Textarea value={aiReply} onChange={(e) => setAiReply(e.target.value)} rows={3} className="text-xs" aria-label="Edit AI reply" />
          ) : (
            <p className="whitespace-pre-wrap text-xs text-[#334155]">{aiReply}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Btn variant="gold" size="sm" onClick={() => { setText(aiReply); setAiReply(''); setEditingAi(false); }}>Use Reply</Btn>
            <Btn variant="outline" size="sm" onClick={() => setEditingAi((v) => !v)}>{editingAi ? 'Done' : 'Edit'}</Btn>
            <Btn variant="ghost" size="sm" onClick={() => void askAi('suggest')} disabled={Boolean(aiBusy)}><Sparkles size={12} /> Regenerate</Btn>
          </div>
        </div>
      )}

      {/* ---- reply banner ---- */}
      {replyTo && (
        <div className="mb-2 flex items-start gap-2 rounded-xl border-l-[3px] border-[#C9A45C] bg-[#C9A45C]/[0.08] px-2.5 py-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[9.5px] font-black uppercase tracking-[0.14em] text-[#8F6B2D]">Replying to {replyTo.direction === 'out' ? 'yourself' : (contact?.name || 'customer')}</p>
            <p className="truncate text-[11px] text-[#334155]">{replyPreview}</p>
          </div>
          <button onClick={onCancelReply} className="rounded-md p-1 text-[#7E8DA6] hover:bg-black/[0.06]" aria-label="Cancel reply"><X size={12} /></button>
        </div>
      )}

      {/* ---- TEMPLATE REQUIRED (window closed, spec §24) ---- */}
      {!winOpen ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/[0.08] p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-700">
            ⏰ TEMPLATE REQUIRED
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#5B6B82]">
            The 24-hour customer service window is CLOSED. WhatsApp only allows approved template messages to this customer right now — free-form replies are blocked by Meta policy.
          </p>
          <div className="mt-2 flex gap-2">
            <Btn variant="gold" size="sm" onClick={() => setTemplateModal(true)}>Choose template</Btn>
            <Btn variant="ghost" size="sm" onClick={() => void askAi('suggest')} disabled={Boolean(aiBusy)}>
              <Sparkles size={12} /> {aiBusy === 'suggest' ? 'Drafting…' : 'AI draft (for the next open window)'}
            </Btn>
          </div>
        </div>
      ) : attachment ? (
        /* ---- attachment preview / progress ---- */
        <div className="rounded-xl border border-white/[0.1] bg-white p-3">
          {attachment.kind === 'location' && attachment.location ? (
            <div className="flex items-center gap-2 text-xs"><MapPin size={14} className="text-[#8F6B2D]" /> <span className="font-bold">{attachment.location.name || 'Location'}</span> <span className="text-[#5B6B82]">{attachment.location.latitude}, {attachment.location.longitude}</span></div>
          ) : attachment.kind === 'contacts' && attachment.contact ? (
            <div className="flex items-center gap-2 text-xs"><UserRound size={14} className="text-[#8F6B2D]" /> <span className="font-bold">{attachment.contact.formatted}</span> <span className="text-[#5B6B82]">{attachment.contact.phone}</span></div>
          ) : (
            <>
              <div className="flex items-start gap-2.5">
                {attachment.previewUrl && attachment.kind !== 'video' && attachment.kind !== 'audio' && (
                  <img src={attachment.previewUrl} alt="Attachment preview" className="h-16 w-16 rounded-lg object-cover" />
                )}
                {attachment.kind === 'video' && attachment.previewUrl && (
                  <video src={attachment.previewUrl} className="h-16 w-16 rounded-lg object-cover" muted />
                )}
                {(attachment.kind === 'audio' || !attachment.previewUrl) && (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-black/[0.05]">
                    {attachment.kind === 'audio' ? <Music size={18} className="text-[#8F6B2D]" /> : attachment.kind === 'document' ? <FileText size={18} className="text-[#8F6B2D]" /> : <Sticker size={18} className="text-[#8F6B2D]" />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold">{attachment.file?.name}</p>
                  <p className="text-[9.5px] text-[#7E8DA6]">{attachment.file ? `${(attachment.file.size / 1048576).toFixed(2)} MB · ${attachment.file.type || 'unknown type'}` : ''}</p>
                  {attachment.uploading && <p className="mt-1 flex items-center gap-1 text-[10px] text-[#8F6B2D]"><Loader2 size={10} className="animate-spin" /> Uploading… {attachment.progress}%</p>}
                  {attachment.uploadedPath && <Badge tone="green" className="mt-1">Uploaded to private storage</Badge>}
                  {attachment.error && <p className="mt-1 text-[10px] font-semibold text-red-600">{attachment.error}</p>}
                </div>
                <button onClick={() => { if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl); setAttachment(null); }} className="rounded-md p-1 text-[#7E8DA6] hover:bg-black/[0.06]" aria-label="Remove attachment"><Trash2 size={13} /></button>
              </div>
              {attachment.kind !== 'sticker' && (
                <Input value={attachment.caption} onChange={(e) => setAttachment({ ...attachment, caption: e.target.value })}
                  placeholder="Add a caption…" className="mt-2 h-8 text-xs" aria-label="Attachment caption" />
              )}
              {attachment.progress > 0 && attachment.progress < 100 && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/[0.06]"><div className="h-full bg-[#C9A45C] transition-all" style={{ width: `${attachment.progress}%` }} /></div>
              )}
              <div className="mt-2 flex justify-end gap-1.5">
                {attachment.file && !attachment.uploadedPath && !attachment.uploading && (
                  <Btn variant="outline" size="sm" onClick={() => void startUpload()}>Upload</Btn>
                )}
                {attachment.uploading && <Btn variant="outline" size="sm" disabled><Loader2 size={12} className="animate-spin" /> Uploading…</Btn>}
                <Btn variant="gold" size="sm" onClick={() => void sendAttachment()} disabled={sending || attachment.uploading || Boolean(attachment.error) || (Boolean(attachment.file) && !attachment.uploadedPath)}>
                  <Send size={12} /> {sending ? 'Sending…' : 'Send'}
                </Btn>
              </div>
            </>
          )}
          {attachment.kind === 'location' || attachment.kind === 'contacts' ? (
            <div className="mt-2 flex justify-end gap-1.5">
              <Btn variant="outline" size="sm" onClick={() => setAttachment(null)}>Cancel</Btn>
              <Btn variant="gold" size="sm" onClick={() => { if (attachment.location) void sendLocation(attachment.location); if (attachment.contact) void sendContactCard(attachment.contact); }} disabled={sending}>
                <Send size={12} /> {sending ? 'Sending…' : 'Send'}
              </Btn>
            </div>
          ) : null}
        </div>
      ) : (
        /* ---- normal composer ---- */
        <>
          {showQuick && quickReplies.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-2">
              {quickReplies.map((q) => (
                <button key={q.id} onClick={() => { setText(q.body); setShowQuick(false); }}
                  className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10.5px] font-semibold text-[#334155] hover:bg-[#C9A45C]/15 hover:text-[#8F6B2D]">
                  {q.title}
                </button>
              ))}
              <button onClick={() => setShowQuick(false)} className="ml-auto rounded-full p-1 text-[#7E8DA6] hover:text-[#111827]" aria-label="Hide quick replies"><X size={12} /></button>
            </div>
          )}

          <div className="relative flex items-end gap-1.5">
            {/* emoji */}
            <div className="relative">
              <Btn variant="ghost" size="sm" onClick={() => { setShowEmoji((v) => !v); setShowAttach(false); }} aria-label="Emoji" title="Emoji"><Smile size={14} /></Btn>
              {showEmoji && <EmojiPicker onPick={(e) => { setText((t) => t + e); }} onClose={() => setShowEmoji(false)} />}
            </div>
            {/* attachments */}
            <div className="relative">
              <Btn variant="ghost" size="sm" onClick={() => { setShowAttach((v) => !v); setShowEmoji(false); }} aria-label="Attach" title="Attach"><Paperclip size={14} /></Btn>
              {showAttach && <AttachMenu onPick={(k) => { if (k === 'location' || k === 'contacts') { setShowAttach(false); setAttachment({ kind: k, caption: '', progress: 0, uploading: false, location: k === 'location' ? { latitude: '', longitude: '', name: '', address: '' } : undefined, contact: k === 'contacts' ? { formatted: contact?.name || '', first: contact?.name || '', last: '', phone: `+${conversation.wa_id}` } : undefined }); } else pickFile(k as AttachmentKind); }} onClose={() => setShowAttach(false)} />}
            </div>
            <Btn variant="ghost" size="sm" onClick={() => setShowQuick((v) => !v)} aria-label="Quick replies" title="Quick replies"><Zap size={13} /></Btn>
            <Btn variant="ghost" size="sm" onClick={() => void askAi('suggest')} disabled={Boolean(aiBusy)} aria-label="AI suggested reply" title="AI suggested reply">
              <Sparkles size={13} className={aiBusy === 'suggest' ? 'animate-pulse' : ''} />
            </Btn>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void doSendText(); } }}
              rows={Math.min(4, Math.max(1, text.split('\n').length))}
              placeholder="Type a reply — Enter sends, Shift+Enter adds a line"
              className="min-h-[38px] flex-1 text-xs"
              aria-label="Message text"
            />
            <Btn variant="gold" size="sm" onClick={() => void doSendText()} disabled={sending || !text.trim()} aria-label="Send message">
              <Send size={13} />
              <span className="hidden sm:inline">{sending ? 'Sending…' : 'Send'}</span>
            </Btn>
          </div>
        </>
      )}

      {/* ---- location / contact modals ---- */}
      {attachment?.kind === 'location' && (
        <LocationModal
          initial={attachment.location || { latitude: '', longitude: '', name: '', address: '' }}
          onClose={() => setAttachment(null)}
          onSend={(loc) => { setAttachment({ ...attachment, location: loc }); void sendLocation(loc); }}
          sending={sending}
        />
      )}
      {attachment?.kind === 'contacts' && (
        <ContactModal
          initial={attachment.contact || { formatted: '', first: '', last: '', phone: '' }}
          onClose={() => setAttachment(null)}
          onSend={(c) => { setAttachment({ ...attachment, contact: c }); void sendContactCard(c); }}
          sending={sending}
        />
      )}

      {templateModal && (
        <TemplateSendModal
          conversation={conversation}
          contact={contact}
          replyToWamid={replyTo?.wa_message_id}
          onClose={() => setTemplateModal(false)}
          onSent={() => { setTemplateModal(false); onCancelReply(); onSent(); }}
        />
      )}
    </div>
  );
};

// ==============================================================================
const AttachMenu: React.FC<{ onPick: (kind: AttachmentKind | 'location' | 'contacts') => void; onClose: () => void }> = ({ onPick, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);
  const items: Array<{ kind: AttachmentKind | 'location' | 'contacts'; icon: React.ReactNode; label: string; hint: string }> = [
    { kind: 'image', icon: <ImageIcon size={14} />, label: 'Photo', hint: 'JPG · PNG · WEBP · ≤ 5 MB' },
    { kind: 'video', icon: <Video size={14} />, label: 'Video', hint: 'MP4 · 3GPP · ≤ 16 MB' },
    { kind: 'document', icon: <FileText size={14} />, label: 'Document', hint: 'PDF · DOCX · XLSX · PPTX · ZIP · ≤ 100 MB' },
    { kind: 'audio', icon: <Music size={14} />, label: 'Audio', hint: 'OGG · MP3 · M4A · AAC · ≤ 16 MB' },
    { kind: 'sticker', icon: <Sticker size={14} />, label: 'Sticker', hint: 'Static WEBP · ≤ 1 MB' },
    { kind: 'location', icon: <MapPin size={14} />, label: 'Location', hint: 'Share a pin with the customer' },
    { kind: 'contacts', icon: <UserRound size={14} />, label: 'Contact card', hint: 'Share a contact' },
  ];
  return (
    <div ref={ref} className="absolute bottom-full left-0 z-30 mb-2 w-[250px] rounded-xl border border-white/[0.1] bg-white p-1.5 shadow-2xl" role="menu" aria-label="Attachment options">
      {items.map((it) => (
        <button key={it.kind} onClick={() => onPick(it.kind)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-[#C9A45C]/12" role="menuitem">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A45C]/15 text-[#8F6B2D]">{it.icon}</span>
          <span className="min-w-0"><span className="block text-[11.5px] font-bold text-[#111827]">{it.label}</span><span className="block truncate text-[9.5px] text-[#7E8DA6]">{it.hint}</span></span>
        </button>
      ))}
    </div>
  );
};

// ==============================================================================
const LocationModal: React.FC<{ initial: { latitude: string; longitude: string; name: string; address: string }; onClose: () => void; onSend: (loc: { latitude: string; longitude: string; name: string; address: string }) => void; sending: boolean }> = ({ initial, onClose, onSend, sending }) => {
  const [v, setV] = useState(initial);
  const valid = /^-?\d{1,3}(\.\d+)?$/.test(v.latitude.trim()) && /^-?\d{1,3}(\.\d+)?$/.test(v.longitude.trim());
  return (
    <Modal open onClose={onClose} title="Send a location" className="max-w-sm">
      <div className="flex flex-col gap-2.5">
        <Field label="Latitude" hint="-90 … 90"><Input value={v.latitude} onChange={(e) => setV({ ...v, latitude: e.target.value })} placeholder="31.5204" className="h-8 text-xs" /></Field>
        <Field label="Longitude" hint="-180 … 180"><Input value={v.longitude} onChange={(e) => setV({ ...v, longitude: e.target.value })} placeholder="74.3587" className="h-8 text-xs" /></Field>
        <Field label="Place name (optional)"><Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="BRANIFY Studio" className="h-8 text-xs" /></Field>
        <Field label="Address (optional)"><Input value={v.address} onChange={(e) => setV({ ...v, address: e.target.value })} placeholder="Gulberg III, Lahore" className="h-8 text-xs" /></Field>
        <div className="flex justify-end gap-2">
          <Btn variant="outline" size="sm" onClick={onClose}>Cancel</Btn>
          <Btn variant="gold" size="sm" disabled={!valid || sending} onClick={() => onSend({ latitude: v.latitude.trim(), longitude: v.longitude.trim(), name: v.name.trim(), address: v.address.trim() })}>{sending ? 'Sending…' : 'Send location'}</Btn>
        </div>
      </div>
    </Modal>
  );
};

// ==============================================================================
const ContactModal: React.FC<{ initial: { formatted: string; first: string; last: string; phone: string }; onClose: () => void; onSend: (c: { formatted: string; first: string; last: string; phone: string }) => void; sending: boolean }> = ({ initial, onClose, onSend, sending }) => {
  const [v, setV] = useState(initial);
  const valid = v.formatted.trim().length > 0 && v.phone.replace(/[^\d]/g, '').length >= 8;
  return (
    <Modal open onClose={onClose} title="Send a contact card" className="max-w-sm">
      <div className="flex flex-col gap-2.5">
        <Field label="Full name"><Input value={v.formatted} onChange={(e) => setV({ ...v, formatted: e.target.value })} placeholder="Ali Raza" className="h-8 text-xs" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="First name"><Input value={v.first} onChange={(e) => setV({ ...v, first: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="Last name"><Input value={v.last} onChange={(e) => setV({ ...v, last: e.target.value })} className="h-8 text-xs" /></Field>
        </div>
        <Field label="WhatsApp phone" hint="Digits with country code"><Input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} placeholder="923321029333" className="h-8 font-mono text-xs" /></Field>
        <div className="flex justify-end gap-2">
          <Btn variant="outline" size="sm" onClick={onClose}>Cancel</Btn>
          <Btn variant="gold" size="sm" disabled={!valid || sending} onClick={() => onSend({ formatted: v.formatted.trim(), first: v.first.trim(), last: v.last.trim(), phone: v.phone.trim() })}>{sending ? 'Sending…' : 'Send card'}</Btn>
        </div>
      </div>
    </Modal>
  );
};

// ==============================================================================
// TEMPLATE SEND MODAL — approved templates only, body vars + optional header media
// ==============================================================================
export const TemplateSendModal: React.FC<{
  conversation: WaConversation;
  contact: WaContact | null;
  replyToWamid?: string;
  onClose: () => void;
  onSent: () => void;
}> = ({ conversation, contact, replyToWamid, onClose, onSent }) => {
  const { push } = useToast();
  const [templates, setTemplates] = useState<WaTemplate[] | null>(null);
  const [selected, setSelected] = useState<WaTemplate | null>(null);
  const [vars, setVars] = useState<string[]>([]);
  const [headerFile, setHeaderFile] = useState<{ file: File; path: string; progress: number; uploading: boolean; error?: string } | null>(null);
  const [sending, setSending] = useState(false);
  const headerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    wa.listTemplates().then((rows) => {
      const approved = rows.filter((t) => t.status === 'APPROVED');
      setTemplates(approved);
      if (!approved.length) push('info', 'No APPROVED templates yet — sync Templates after Meta approves them.');
    }).catch((e) => { setTemplates([]); push('error', e instanceof Error ? e.message : 'Could not load templates.'); });
  }, [push]);

  const headerComponent = (selected?.components as Array<{ type?: string; format?: string }> | null)?.find?.((c) => c.type === 'HEADER');
  const headerFormat = (headerComponent?.format || '').toUpperCase();

  const pick = (t: WaTemplate) => {
    setSelected(t);
    const body = (t.components as Array<{ type?: string; text?: string }> | null)?.find?.((c) => c.type === 'BODY');
    const matches = body?.text?.match(/\{\{\d+\}\}/g) || [];
    setVars(new Array(matches.length).fill(''));
    setHeaderFile(null);
  };

  const onHeaderFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selected) return;
    const kind = headerFormat === 'VIDEO' ? 'video' : headerFormat === 'DOCUMENT' ? 'document' : 'image';
    if (kind === 'image' && !file.type.startsWith('image/')) { push('error', 'This template header requires an image.'); return; }
    const path = wa.buildAttachmentPath(conversation.id, file);
    setHeaderFile({ file, path, progress: 0, uploading: true });
    try {
      await wa.uploadAttachment(path, file, (pct) => setHeaderFile((h) => (h ? { ...h, progress: pct } : h)));
      setHeaderFile((h) => (h ? { ...h, uploading: false } : h));
    } catch (err) {
      setHeaderFile((h) => (h ? { ...h, uploading: false, error: err instanceof Error ? err.message : 'Upload failed.' } : h));
    }
  };

  const send = async () => {
    if (!selected) return;
    if (vars.some((v) => !v.trim())) { push('error', 'Fill every template variable before sending.'); return; }
    if (headerComponent && !headerFile) { push('error', `This template requires a ${headerFormat.toLowerCase()} header — attach the file first.`); return; }
    if (headerFile?.uploading) { push('error', 'Header file is still uploading.'); return; }
    if (headerFile?.error) { push('error', headerFile.error); return; }
    setSending(true);
    try {
      await wa.sendTemplateMessage({
        conversation_id: conversation.id, template_name: selected.name,
        language: selected.language, category: selected.category, body_params: vars,
        header_media: headerFile && headerFormat !== 'TEXT' ? { kind: (headerFormat === 'VIDEO' ? 'video' : headerFormat === 'DOCUMENT' ? 'document' : 'image'), storage_path: headerFile.path, filename: headerFile.file.name, mime: headerFile.file.type } : undefined,
        reply_to: replyToWamid,
      });
      push('success', `Template “${selected.name}” sent — status updates arrive via webhook.`);
      onSent();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Template send failed.');
    } finally {
      setSending(false);
    }
  };

  const previewText = (t: WaTemplate): string => {
    const body = (t.components as Array<{ type?: string; text?: string }> | null)?.find?.((c) => c.type === 'BODY')?.text || '';
    return body.replace(/\{\{(\d+)\}\}/g, (_m, i) => `[${vars[Number(i) - 1] || `{{${i}}}`}]`);
  };

  return (
    <Modal open onClose={onClose} title="Send template (approved only)" className="max-w-lg">
      {templates === null ? <LoadingBlock label="Loading templates…" /> : templates.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] p-4 text-center">
          <p className="text-xs font-bold">No approved templates</p>
          <p className="mt-1 text-[11px] text-[#5B6B82]">Sync from the Templates tab once Meta approves your templates.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Field label="Template">
            <select value={selected?.template_id || ''} onChange={(e) => { const t = (templates || []).find((x) => x.template_id === e.target.value) || null; if (t) pick(t); }} aria-label="Template"
              className="h-8 w-full rounded-lg border border-[#0F172A]/10 bg-white px-2 text-xs">
              <option value="">Select…</option>
              {(templates || []).map((t) => <option key={t.template_id} value={t.template_id}>{t.name} · {t.language} · {t.category}</option>)}
            </select>
          </Field>
          {selected && (
            <>
              {vars.length > 0 && (
                <div className="flex flex-col gap-2">
                  {vars.map((v, i) => (
                    <Field key={i} label={`Variable {{${i + 1}}}`}>
                      <Input value={v} onChange={(e) => setVars((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                        placeholder={i === 0 && contact?.name ? contact.name : 'Value'} aria-label={`Variable ${i + 1}`} />
                    </Field>
                  ))}
                </div>
              )}
              {headerComponent && headerFormat !== 'TEXT' && (
                <Field label={`Header ${headerFormat.toLowerCase()} (required by this template)`}>
                  <div className="flex items-center gap-2">
                    <input ref={headerInputRef} type="file" className="hidden" accept={headerFormat === 'VIDEO' ? 'video/*' : headerFormat === 'DOCUMENT' ? '*/*' : 'image/*'} onChange={(e) => void onHeaderFile(e)} />
                    <Btn variant="outline" size="sm" onClick={() => headerInputRef.current?.click()}><Plus size={12} /> {headerFile ? 'Replace file' : 'Attach file'}</Btn>
                    {headerFile && (
                      <span className="min-w-0 flex-1 truncate text-[10.5px] text-[#5B6B82]">
                        {headerFile.uploading ? `Uploading… ${headerFile.progress}%` : headerFile.error ? headerFile.error : `${headerFile.file.name} ✓`}
                      </span>
                    )}
                  </div>
                </Field>
              )}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5">
                <p className="text-[9.5px] font-black uppercase tracking-[0.16em] text-[#7E8DA6]">Preview</p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-[#334155]">{previewText(selected)}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Btn variant="outline" size="sm" onClick={onClose}>Cancel</Btn>
                <Btn variant="gold" size="sm" onClick={() => void send()} disabled={sending || Boolean(headerFile?.uploading)}>{sending ? 'Sending…' : 'Send template'}</Btn>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};
