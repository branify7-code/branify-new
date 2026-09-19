// =============================================================================
// BRANIFY WHATSAPP CRM — Inbox (3-pane: conversations · chat · CRM profile)
// -----------------------------------------------------------------------------
// LEFT   conversation list (All/Unread/Unassigned/Assigned to me/Open/Waiting/
//        Closed/Archived filters + search) sorted by most recent activity.
// CENTER real WhatsApp messages (text/image/document/audio/video) with the
//        ACTUAL API delivery state — never faked. Free-form sending respects
//        the 24-hour customer service window; when closed the composer shows
//        TEMPLATE REQUIRED and offers approved templates only.
// RIGHT  CRM profile (customer fields, lead status, tags, assignment, source,
//        INTERNAL NOTES — clearly labelled, never sendable) + quick actions
//        + AI assistant (human approval required; AI never sends).
// Mobile: panes stack as Conversation List → Chat → Details with no overflow.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check, CheckCheck, ChevronLeft, Clock, Clock3, Download, FileText, Image as ImageIcon,
  Mail, Paperclip, Plus, RefreshCw, Send, Sparkles, Tag, TriangleAlert, UserPlus, X,
} from 'lucide-react';
import { Badge, Btn, ChipsInput, Field, Input, Modal, Select, Textarea, LoadingBlock, EmptyState, useToast, cx } from '../ui';
import { useAdminAuth } from '../lib/auth';
import * as wa from './waClient';
import type { WaConversation, WaContact, WaMessage, WaTemplate, WaQuickReply, WaNote } from './waTypes';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, CONVERSATION_STATUSES, CONVERSATION_STATUS_LABELS } from './waTypes';

type Filter = 'all' | 'unread' | 'unassigned' | 'mine' | 'open' | 'waiting' | 'closed' | 'archived';
const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' }, { id: 'unread', label: 'Unread' }, { id: 'unassigned', label: 'Unassigned' },
  { id: 'mine', label: 'Assigned to me' }, { id: 'open', label: 'Open' }, { id: 'waiting', label: 'Waiting' },
  { id: 'closed', label: 'Closed' }, { id: 'archived', label: 'Archived' },
];

const timeLabel = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const windowStateOf = (conv: WaConversation): { open: boolean; expires: string | null } => ({
  open: Boolean(conv.window_expires_at && new Date(conv.window_expires_at).getTime() > Date.now()),
  expires: conv.window_expires_at,
});

// ==============================================================================
export const InboxSection: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { user } = useAdminAuth();
  const { push } = useToast();
  const [conversations, setConversations] = useState<WaConversation[] | null>(null);
  const [contacts, setContacts] = useState<Record<string, WaContact>>({});
  const [activeId, setActiveId] = useState<string>('');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [showDetails, setShowDetails] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    try {
      const [convs, cts] = await Promise.all([wa.listConversations(), wa.listContacts()]);
      setConversations(convs);
      setContacts(Object.fromEntries(cts.map((c) => [c.id, c])));
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not load conversations.');
      setConversations([]);
    }
  }, [push]);
  useEffect(() => { void load(); }, [load, reloadKey]);

  const filtered = useMemo(() => {
    let rows = conversations || [];
    const q = search.trim().toLowerCase();
    rows = rows.filter((c) => {
      if (filter === 'unread') return c.unread_count > 0;
      if (filter === 'unassigned') return !c.assigned_to;
      if (filter === 'mine') return c.assigned_to === user.email;
      if (filter !== 'all') return c.status === filter;
      return true;
    });
    if (q) {
      rows = rows.filter((c) => {
        const contact = contacts[c.contact_id];
        return [contact?.name, contact?.email, contact?.company, c.wa_id, c.last_message_preview, (contact?.tags || []).join(' ')]
          .join(' ').toLowerCase().includes(q);
      });
    }
    return rows.slice().sort((a, b) => new Date(b.last_message_at || b.created_at || 0).getTime() - new Date(a.last_message_at || a.created_at || 0).getTime());
  }, [conversations, contacts, filter, search, user.email]);

  const active = filtered.find((c) => c.id === activeId) || (conversations || []).find((c) => c.id === activeId) || null;
  const activeContact = active ? contacts[active.contact_id] : null;

  const openConversation = (id: string) => {
    setActiveId(id);
    setMobileView('chat');
    setShowDetails(false);
    const conv = (conversations || []).find((c) => c.id === id);
    if (conv && conv.unread_count > 0) {
      wa.markRead(id).then(() => {
        setConversations((prev) => (prev || []).map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)));
      }).catch(() => { /* badge reset only */ });
    }
  };

  return (
    <div className="grid min-h-[540px] grid-cols-1 gap-3 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_320px]">
      {/* ---- LEFT: conversation list ---- */}
      <aside className={cx('flex min-h-0 flex-col gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5', mobileView === 'chat' && 'hidden lg:flex')}>
        <div className="flex items-center gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, text…" aria-label="Search conversations" className="h-8 text-xs" />
          <Btn variant="ghost" size="sm" onClick={() => setReloadKey((k) => k + 1)} aria-label="Refresh list"><RefreshCw size={13} /></Btn>
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={cx('rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors',
                filter === f.id ? 'bg-[#C9A45C]/20 text-[#8F6B2D]' : 'bg-white/[0.05] text-[#5B6B82] hover:text-[#111827]')}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="adm-scroll flex max-h-[62vh] min-h-0 flex-1 flex-col gap-1 overflow-y-auto xl:max-h-[640px]">
          {conversations === null && <LoadingBlock label="Loading conversations…" />}
          {conversations !== null && filtered.length === 0 && (
            <EmptyState title="No conversations here yet" hint="Incoming WhatsApp messages appear instantly once the webhook is connected." />
          )}
          {filtered.map((c) => {
            const contact = contacts[c.contact_id];
            const unread = c.unread_count > 0;
            return (
              <button key={c.id} onClick={() => openConversation(c.id)}
                className={cx('rounded-xl border p-2.5 text-left transition-colors',
                  c.id === activeId ? 'border-[#C9A45C]/45 bg-[#C9A45C]/[0.08]' : 'border-transparent hover:bg-white/[0.05]')}>
                <div className="flex items-center justify-between gap-2">
                  <p className={cx('truncate text-xs', unread ? 'font-extrabold text-[#111827]' : 'font-semibold text-[#334155]')}>
                    {contact?.name || `+${c.wa_id}`}
                  </p>
                  <span className="shrink-0 text-[9.5px] text-[#7E8DA6]">{timeLabel(c.last_message_at)}</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-[#5B6B82]">+{c.wa_id} · {c.last_message_preview || 'No messages yet'}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {c.status !== 'open' && <Badge tone="steel">{CONVERSATION_STATUS_LABELS[c.status]}</Badge>}
                  {contact && contact.lead_status !== 'new' && <Badge tone={contact.lead_status === 'won' ? 'green' : contact.lead_status === 'lost' ? 'red' : 'violet'}>{LEAD_STATUS_LABELS[contact.lead_status]}</Badge>}
                  {c.assigned_to && <span className="truncate text-[9.5px] text-[#7E8DA6]">→ {c.assigned_to.split('@')[0]}</span>}
                  {unread && <span className="ml-auto rounded-full bg-[#C9A45C] px-1.5 text-[9.5px] font-black text-[#1A1206]">{c.unread_count}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ---- CENTER: chat ---- */}
      <section className={cx('flex min-h-0 min-w-0 flex-col rounded-xl border border-white/[0.07] bg-white/[0.02]', mobileView === 'list' && 'hidden lg:flex')}>
        {active ? (
          <>
            <header className="flex items-center gap-2 border-b border-white/[0.06] p-3">
              <button className="rounded-lg p-1.5 text-[#5B6B82] hover:bg-white/[0.06] lg:hidden" onClick={() => setMobileView('list')} aria-label="Back to conversations">
                <ChevronLeft size={16} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-[#111827]">{activeContact?.name || `+${active.wa_id}`}</p>
                <p className="truncate text-[10.5px] text-[#7E8DA6]">+{active.wa_id}{activeContact?.company ? ` · ${activeContact.company}` : ''}</p>
              </div>
              <WindowBadge conv={active} />
              <Btn variant="ghost" size="sm" onClick={() => setShowDetails((v) => !v)} aria-label="Toggle customer details" className="xl:hidden">
                <UserPlus size={13} /> Details
              </Btn>
            </header>
            <ChatPane conversation={active} contact={activeContact} onSent={() => setReloadKey((k) => k + 1)} />
            <Composer conversation={active} contact={activeContact} onSent={() => setReloadKey((k) => k + 1)} onOpenSettings={onOpenSettings} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState title="Select a conversation" hint="Pick a chat on the left — or they will appear here as soon as customers message your official number." />
          </div>
        )}
      </section>

      {/* ---- RIGHT: CRM profile ---- */}
      {active && activeContact && (
        <ProfilePane
          key={activeContact.id}
          className={cx('min-h-0', showDetails ? 'block lg:hidden xl:block' : 'hidden xl:block')}
          contact={activeContact}
          conversation={active}
          onMutate={() => setReloadKey((k) => k + 1)}
        />
      )}
    </div>
  );
};

// ==============================================================================
const WindowBadge: React.FC<{ conv: WaConversation }> = ({ conv }) => {
  const { open } = windowStateOf(conv);
  return open
    ? <Badge tone="green" className="shrink-0">Window OPEN</Badge>
    : <Badge tone="amber" className="shrink-0" title="24h customer service window closed — template message required">Window CLOSED</Badge>;
};

// ==============================================================================
const ChatPane: React.FC<{ conversation: WaConversation; contact: WaContact | null; onSent: () => void }> = ({ conversation }) => {
  const [messages, setMessages] = useState<WaMessage[] | null>(null);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      setMessages(await wa.listMessages(conversation.id));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load messages.');
      setMessages([]);
    }
  }, [conversation.id]);
  useEffect(() => { setMessages(null); void loadMessages(); }, [loadMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); }, [messages?.length]);

  return (
    <div className="adm-scroll min-h-[240px] flex-1 space-y-2 overflow-y-auto p-3 xl:max-h-[440px]">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-[11px] text-red-300">{error}</p>}
      {messages === null && <LoadingBlock label="Loading messages…" />}
      {messages !== null && messages.length === 0 && (
        <p className="py-8 text-center text-[11px] text-[#7E8DA6]">No messages in this conversation yet.</p>
      )}
      {messages?.map((m) => <Bubble key={m.id} message={m} />)}
      <div ref={bottomRef} />
    </div>
  );
};

// ==============================================================================
const Bubble: React.FC<{ message: WaMessage }> = ({ message: m }) => {
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFailed, setMediaFailed] = useState(false);
  const isMedia = ['image', 'document', 'audio', 'video'].includes(m.type) && Boolean(m.media?.media_id);
  useEffect(() => {
    if (!isMedia) return;
    let alive = true;
    wa.mediaBlobUrl(m.media.media_id as string)
      .then((url) => { if (alive) setMediaUrl(url); })
      .catch(() => { if (alive) setMediaFailed(true); });
    return () => { alive = false; };
  }, [isMedia, m.media.media_id]);

  const out = m.direction === 'out';
  return (
    <div className={cx('flex', out ? 'justify-end' : 'justify-start')}>
      <div className={cx('max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-sm sm:max-w-[70%]',
        out ? 'rounded-br-sm bg-[#C9A45C]/[0.18] text-[#1A1206]' : 'rounded-bl-sm bg-white text-[#111827] border border-[#0F172A]/[0.08]')}>
        {m.type === 'template' && (
          <p className="mb-1 inline-flex rounded-full bg-[#8F6B2D]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#8F6B2D]">
            Template{m.template_name ? ` · ${m.template_name}` : ''}
          </p>
        )}
        {m.type === 'image' && (mediaUrl
          ? <img src={mediaUrl} alt={m.media?.caption || 'WhatsApp image'} className="mb-1 max-h-48 rounded-lg" />
          : mediaFailed
            ? <p className="mb-1 flex items-center gap-1 text-[10.5px] text-[#7E8DA6]"><ImageIcon size={12} /> Photo unavailable</p>
            : <p className="mb-1 text-[10.5px] text-[#7E8DA6]">Loading photo…</p>)}
        {m.type === 'document' && (
          <p className="mb-1 flex items-center gap-1.5">
            <FileText size={14} className="shrink-0 text-[#8F6B2D]" />
            {mediaUrl
              ? <a href={mediaUrl} download={m.media?.filename || 'document'} className="truncate underline">{m.media?.filename || 'Document'}</a>
              : <span className="text-[10.5px] text-[#7E8DA6]">{mediaFailed ? 'Document unavailable' : 'Loading document…'}</span>}
          </p>
        )}
        {m.type === 'audio' && (mediaUrl
          ? <audio controls src={mediaUrl} className="mb-1 max-w-[220px]" />
          : <p className="mb-1 text-[10.5px] text-[#7E8DA6]">{mediaFailed ? 'Voice note unavailable' : 'Loading voice note…'}</p>)}
        {m.type === 'video' && (mediaUrl
          ? <video controls src={mediaUrl} className="mb-1 max-h-48 rounded-lg" />
          : <p className="mb-1 text-[10.5px] text-[#7E8DA6]">{mediaFailed ? 'Video unavailable' : 'Loading video…'}</p>)}
        {m.body && <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>}
        <p className={cx('mt-1 flex items-center justify-end gap-1 text-[9px]', out ? 'text-[#8F6B2D]' : 'text-[#94A3B8]')}>
          {timeLabel(m.timestamp)}
          {out && <StatusTicks status={m.status} error={m.error} />}
        </p>
        {m.status === 'failed' && m.error?.message && (
          <p className="mt-1 flex items-start gap-1 rounded-md bg-red-500/10 px-1.5 py-1 text-[9.5px] text-red-300">
            <TriangleAlert size={11} className="mt-px shrink-0" /> {m.error.message}
          </p>
        )}
      </div>
    </div>
  );
};

/** ONLY the real API state is shown: queued/sent/delivered/read/failed. */
const StatusTicks: React.FC<{ status: string; error?: { message?: string } | null }> = ({ status }) => {
  if (status === 'queued') return <Clock size={11} aria-label="Queued" />;
  if (status === 'sent') return <Check size={11} aria-label="Sent" />;
  if (status === 'delivered') return <CheckCheck size={11} aria-label="Delivered" />;
  if (status === 'read') return <CheckCheck size={11} className="text-emerald-500" aria-label="Read" />;
  if (status === 'failed') return <TriangleAlert size={11} className="text-red-400" aria-label="Failed" />;
  return null;
};

// ==============================================================================
// COMPOSER — free-form replies (window OPEN) · TEMPLATE REQUIRED (window CLOSED)
// + Quick Replies (internal) + AI Suggested Reply (human approval, never auto-send)
// ==============================================================================
const Composer: React.FC<{ conversation: WaConversation; contact: WaContact | null; onSent: () => void; onOpenSettings: () => void }> = ({ conversation, contact, onSent }) => {
  const { push } = useToast();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [quickReplies, setQuickReplies] = useState<WaQuickReply[]>([]);
  const [showQuick, setShowQuick] = useState(false);
  const [templateModal, setTemplateModal] = useState(false);
  const [aiBusy, setAiBusy] = useState<string>('');
  const [aiReply, setAiReply] = useState('');
  const [editingAi, setEditingAi] = useState(false);

  const winOpen = windowStateOf(conversation).open;

  useEffect(() => {
    if (winOpen) wa.listQuickReplies().then(setQuickReplies).catch(() => setQuickReplies([]));
  }, [winOpen]);

  const doSend = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await wa.sendMessage({ conversation_id: conversation.id, kind: 'text', text: body });
      setText('');
      setAiReply('');
      setEditingAi(false);
      onSent();
      push('success', 'Message sent — delivery status updates automatically from the API.');
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

  return (
    <div className="border-t border-white/[0.06] p-3">
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
            <Btn variant="ghost" size="sm" onClick={() => void askAi('suggest')} disabled={Boolean(aiBusy)}><RefreshCw size={12} className={aiBusy === 'suggest' ? 'animate-spin' : ''} /> Regenerate</Btn>
          </div>
        </div>
      )}

      {!winOpen ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/[0.08] p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-700">
            <Clock3 size={13} /> TEMPLATE REQUIRED
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#5B6B82]">
            The 24-hour customer service window is CLOSED. WhatsApp only allows approved template messages to this customer right now — free-form replies are blocked by policy.
          </p>
          <div className="mt-2 flex gap-2">
            <Btn variant="gold" size="sm" onClick={() => setTemplateModal(true)}>Choose template</Btn>
            <Btn variant="ghost" size="sm" onClick={() => void askAi('suggest')} disabled={Boolean(aiBusy)}>
              <Sparkles size={12} /> {aiBusy === 'suggest' ? 'Drafting…' : 'AI draft (for the next open window)'}
            </Btn>
          </div>
        </div>
      ) : (
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
          <div className="flex items-end gap-1.5">
            <Btn variant="ghost" size="sm" onClick={() => setShowQuick((v) => !v)} aria-label="Quick replies" title="Quick replies"><ZapLike /></Btn>
            <Btn variant="ghost" size="sm" onClick={() => void askAi('suggest')} disabled={Boolean(aiBusy)} aria-label="AI suggested reply" title="AI suggested reply">
              <Sparkles size={13} className={aiBusy === 'suggest' ? 'animate-pulse' : ''} />
            </Btn>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void doSend(); } }}
              rows={Math.min(4, Math.max(1, text.split('\n').length))}
              placeholder="Type a reply — Enter sends, Shift+Enter adds a line"
              className="min-h-[38px] flex-1 text-xs"
              aria-label="Message text"
            />
            <Btn variant="gold" size="sm" onClick={() => void doSend()} disabled={sending || !text.trim()} aria-label="Send message">
              <Send size={13} />
              <span className="hidden sm:inline">{sending ? 'Sending…' : 'Send'}</span>
            </Btn>
          </div>
        </>
      )}

      {templateModal && (
        <TemplateSendModal
          conversation={conversation}
          contact={contact}
          onClose={() => setTemplateModal(false)}
          onSent={() => { setTemplateModal(false); onSent(); }}
        />
      )}
    </div>
  );
};

function ZapLike() {
  return <Paperclip size={13} />;
}

// ==============================================================================
// TEMPLATE SEND MODAL — approved templates only, variables validated
// ==============================================================================
export const TemplateSendModal: React.FC<{
  conversation: WaConversation;
  contact: WaContact | null;
  onClose: () => void;
  onSent: () => void;
}> = ({ conversation, contact, onClose, onSent }) => {
  const { push } = useToast();
  const [templates, setTemplates] = useState<WaTemplate[] | null>(null);
  const [selected, setSelected] = useState<WaTemplate | null>(null);
  const [vars, setVars] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    wa.listTemplates().then((rows) => {
      const approved = rows.filter((t) => t.status === 'APPROVED');
      setTemplates(approved);
      if (!approved.length) push('info', 'No APPROVED templates yet — sync Templates after Meta approves them.');
    }).catch((e) => { setTemplates([]); push('error', e instanceof Error ? e.message : 'Could not load templates.'); });
  }, [push]);

  const pick = (t: WaTemplate) => {
    setSelected(t);
    const body = (t.components as unknown[] | null)?.find?.((c) => (c as { type?: string })?.type === 'body') as { text?: string } | undefined;
    const matches = body?.text?.match(/\{\{\d+\}\}/g) || [];
    setVars(new Array(matches.length).fill(''));
  };

  const send = async () => {
    if (!selected) return;
    if (vars.some((v) => !v.trim())) {
      push('error', 'Fill every template variable before sending.');
      return;
    }
    setSending(true);
    try {
      await wa.sendTemplateMessage({
        conversation_id: conversation.id, template_name: selected.name,
        language: selected.language, category: selected.category, body_params: vars,
      });
      push('success', `Template “${selected.name}” sent.`);
      onSent();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Template send failed.');
    } finally {
      setSending(false);
    }
  };

  const previewText = (t: WaTemplate): string => {
    const body = (t.components as Array<{ type?: string; text?: string }> | null)?.find?.((c) => c.type === 'body')?.text || '';
    return body.replace(/\{\{(\d+)\}\}/g, (_m, i) => `[${vars[Number(i) - 1] || `{{${i}}}`}]`);
  };

  return (
    <Modal open onClose={onClose} title="Send template (approved only)" className="max-w-lg">
      {templates === null ? <LoadingBlock label="Loading templates…" /> : templates.length === 0 ? (
        <EmptyState title="No approved templates" hint="Sync from the Templates tab once Meta approves your templates." action={<Btn variant="outline" size="sm" onClick={onClose}>Close</Btn>} />
      ) : (
        <div className="flex flex-col gap-3">
          <Field label="Template">
            <Select value={selected?.template_id || ''} onChange={(e) => { const t = (templates || []).find((x) => x.template_id === e.target.value) || null; if (t) pick(t); }} aria-label="Template">
              <option value="">Select…</option>
              {(templates || []).map((t) => <option key={t.template_id} value={t.template_id}>{t.name} · {t.language} · {t.category}</option>)}
            </Select>
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
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5">
                <p className="text-[9.5px] font-black uppercase tracking-[0.16em] text-[#7E8DA6]">Preview</p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-[#334155]">{previewText(selected)}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Btn variant="outline" size="sm" onClick={onClose}>Cancel</Btn>
                <Btn variant="gold" size="sm" onClick={() => void send()} disabled={sending}>{sending ? 'Sending…' : 'Send template'}</Btn>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

// ==============================================================================
// PROFILE PANE — CRM details · INTERNAL NOTES (never sent) · quick actions · AI
// ==============================================================================
const ProfilePane: React.FC<{ className?: string; contact: WaContact; conversation: WaConversation; onMutate: () => void }> = ({ className, contact, conversation, onMutate }) => {
  const { user } = useAdminAuth();
  const { push } = useToast();
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email);
  const [company, setCompany] = useState(contact.company);
  const [tags, setTags] = useState<string[]>(contact.tags || []);
  const [leadStatus, setLeadStatus] = useState(contact.lead_status);
  const [assigned, setAssigned] = useState(contact.assigned_to);
  const [agents, setAgents] = useState<Array<{ email: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<WaNote[] | null>(null);
  const [noteText, setNoteText] = useState('');
  const [aiBusy, setAiBusy] = useState('');
  const [lastAiAction, setLastAiAction] = useState('summarize');
  const [aiOutput, setAiOutput] = useState<{ title: string; text: string } | null>(null);

  useEffect(() => { setName(contact.name); setEmail(contact.email); setCompany(contact.company); setTags(contact.tags || []); setLeadStatus(contact.lead_status); setAssigned(contact.assigned_to); }, [contact]);
  useEffect(() => { wa.listAgents().then(setAgents).catch(() => setAgents([])); }, []);
  useEffect(() => { setNotes(null); wa.listNotes(contact.id).then(setNotes).catch(() => setNotes([])); }, [contact.id]);

  const save = async () => {
    setSaving(true);
    try {
      const changed: Partial<WaContact> = {};
      if (name !== contact.name) changed.name = name;
      if (email !== contact.email) changed.email = email;
      if (company !== contact.company) changed.company = company;
      if (JSON.stringify(tags) !== JSON.stringify(contact.tags)) changed.tags = tags;
      if (leadStatus !== contact.lead_status) changed.lead_status = leadStatus;
      if (assigned !== contact.assigned_to) changed.assigned_to = assigned;
      if (Object.keys(changed).length) {
        await wa.updateContact(contact.id, changed);
        if (changed.assigned_to !== undefined) await wa.updateConversation(conversation.id, { assigned_to: assigned });
        push('success', 'Contact updated.');
        onMutate();
      }
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not update the contact.');
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    const body = noteText.trim();
    if (!body) return;
    try {
      await wa.createNote(contact.id, body, user.email);
      setNoteText('');
      setNotes(await wa.listNotes(contact.id));
      push('success', 'Internal note saved — never sent to the customer.');
      onMutate();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not save the note.');
    }
  };

  const createLead = async () => {
    // Direct, honest lead creation in the EXISTING leads system (inquiries).
    try {
      const { supabase } = await import('../../lib/supabase');
      const { error } = await supabase.from('inquiries').insert({
        name: contact.name || `WhatsApp +${contact.wa_id}`,
        email: contact.email || 'not-provided@whatsapp.local',
        company: contact.company || 'Not specified',
        services: [], budget: '', timeline: '',
        details: `Lead created from WhatsApp conversation (+${contact.wa_id}) in the WhatsApp CRM.`,
        status: 'new',
      });
      if (error) throw error;
      push('success', 'Lead created in the existing Leads CRM.');
      onMutate();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not create the lead.');
    }
  };

  const scheduleFollowup = async (preset: string) => {
    const base = new Date();
    switch (preset) {
      case 'today': base.setHours(base.getHours() + 4); break;
      case 'tomorrow': base.setDate(base.getDate() + 1); break;
      case '3d': base.setDate(base.getDate() + 3); break;
      case 'week': base.setDate(base.getDate() + 7); break;
      default: break;
    }
    try {
      await wa.updateConversation(conversation.id, {
        followup_due_at: base.toISOString(),
        followup_note: `Follow up with ${contact.name || `+${contact.wa_id}`}`,
      });
      push('success', `Follow-up due ${base.toLocaleString()} — shown on the conversation. Nothing is auto-sent.`);
      onMutate();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not schedule the follow-up.');
    }
  };

  const runAi = async (action: string, title: string, extra: Record<string, unknown> = {}) => {
    setAiBusy(action);
    setLastAiAction(action);
    setAiOutput(null);
    try {
      const res = await wa.aiAction({ action, conversation_id: conversation.id, ...extra });
      const data = res.result as Record<string, unknown>;
      if (action === 'extract') {
        const fields = (data.fields || {}) as Record<string, string | null>;
        const lines = Object.entries(fields).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v ?? '— not stated —'}`);
        setAiOutput({ title, text: lines.join('\n') });
      } else if (action === 'classify') {
        setAiOutput({ title, text: String(data.category || 'Other') });
      } else {
        setAiOutput({ title, text: String(data.text || '') });
      }
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'AI request failed.');
    } finally {
      setAiBusy('');
    }
  };

  return (
    <aside className={cx('adm-scroll flex max-h-[640px] min-h-0 flex-col gap-3 overflow-y-auto rounded-xl border border-white/[0.07] bg-white/[0.02] p-3', className)} aria-label="Customer details">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7E8DA6]">Customer</p>
        <p className="mt-0.5 text-sm font-extrabold text-[#111827]">{contact.name || 'Unnamed'} </p>
        <p className="text-[11px] text-[#5B6B82]">+{contact.wa_id}</p>
        {contact.opt_out && <Badge tone="red" className="mt-1">Marketing opt-out</Badge>}
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" /></Field>
        <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 text-xs" placeholder="—" /></Field>
        <Field label="Company"><Input value={company} onChange={(e) => setCompany(e.target.value)} className="h-8 text-xs" placeholder="—" /></Field>
        <Field label="Lead status">
          <Select value={leadStatus} onChange={(e) => setLeadStatus(e.target.value as typeof leadStatus)} className="h-8 text-xs" aria-label="Lead status">
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
          </Select>
        </Field>
        <Field label="Assigned to">
          <Select value={assigned} onChange={(e) => setAssigned(e.target.value)} className="h-8 text-xs" aria-label="Assigned agent">
            <option value="">Unassigned</option>
            {agents.map((a) => <option key={a.email} value={a.email}>{a.name || a.email}</option>)}
          </Select>
        </Field>
        <Field label="Tags" hint="Website · Ecommerce · AI · SEO · Branding · Hot Lead …">
          <ChipsInput value={tags} onChange={setTags} placeholder="Add tag" />
        </Field>
        <p className="text-[10px] text-[#7E8DA6]">Source: {contact.source || 'WhatsApp'} · Created {new Date(contact.created_at).toLocaleDateString()}</p>
        <Btn variant="gold" size="sm" onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Btn>
      </div>

      <div className="border-t border-white/[0.06] pt-2">
        <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#7E8DA6]">Quick actions</p>
        <div className="flex flex-wrap gap-1.5">
          <Btn variant="outline" size="sm" onClick={() => void createLead()}><Plus size={12} /> Create Lead</Btn>
          {contact.customer_user_id && (
            <Btn variant="outline" size="sm" onClick={() => { window.history.pushState({}, '', '/admin/customers'); window.dispatchEvent(new Event('branify:admin-nav')); }}><Mail size={12} /> Open Customer</Btn>
          )}
          <Btn variant="outline" size="sm" onClick={() => { if (!tags.includes('Hot Lead')) { setTags([...tags, 'Hot Lead']); push('info', 'Tag added — press Save changes to persist.'); } }}><Tag size={12} /> Add Hot Lead</Btn>
        </div>
      </div>

      <div className="border-t border-white/[0.06] pt-2">
        <p className="mb-1.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#7E8DA6]"><Sparkles size={11} /> AI assistant (internal)</p>
        <div className="flex flex-wrap gap-1.5">
          <Btn variant="outline" size="sm" onClick={() => void runAi('summarize', 'Summary')} disabled={Boolean(aiBusy)}>{aiBusy === 'summarize' ? '…' : 'Summarize'}</Btn>
          <Btn variant="outline" size="sm" onClick={() => void runAi('extract', 'Lead information')} disabled={Boolean(aiBusy)}>{aiBusy === 'extract' ? '…' : 'Extract info'}</Btn>
          <Btn variant="outline" size="sm" onClick={() => void runAi('classify', 'Intent')} disabled={Boolean(aiBusy)}>{aiBusy === 'classify' ? '…' : 'Classify'}</Btn>
          <Btn variant="outline" size="sm" onClick={() => void runAi('followup', 'Follow-up reminder')} disabled={Boolean(aiBusy)}>{aiBusy === 'followup' ? '…' : 'Follow-up text'}</Btn>
        </div>
        {aiOutput && (
          <div className="mt-2 rounded-xl border border-[#C9A45C]/30 bg-[#C9A45C]/[0.07] p-2.5">
            <p className="text-[9.5px] font-black uppercase tracking-[0.16em] text-[#8F6B2D]">{aiOutput.title} — internal, review before use</p>
            <p className="mt-1 whitespace-pre-wrap text-[11px] text-[#334155]">{aiOutput.text}</p>
            <div className="mt-1.5 flex gap-1.5">
              <Btn variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(aiOutput.text).then(() => push('success', 'Copied.')); }}>Copy</Btn>
              <Btn variant="ghost" size="sm" onClick={() => { void runAi(lastAiAction, aiOutput.title); }}>Regenerate</Btn>
              <Btn variant="gold" size="sm" onClick={() => { void navigator.clipboard.writeText(aiOutput.text); void wa.createNote(contact.id, `[AI · ${aiOutput.title}]\n${aiOutput.text}`, user.email).then(() => { setNotes(null); wa.listNotes(contact.id).then(setNotes).catch(() => setNotes([])); push('success', 'Saved as an internal note.'); }); }} disabled={aiBusy !== ''}>Save as note</Btn>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] pt-2">
        <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-red-700">Internal notes — NEVER sent to the customer</p>
        {notes === null && <LoadingBlock label="Loading notes…" />}
        {notes !== null && notes.length === 0 && <p className="text-[10.5px] text-[#7E8DA6]">No internal notes yet.</p>}
        {notes?.map((n) => (
          <div key={n.id} className="mb-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-2">
            <p className="whitespace-pre-wrap text-[11px] text-[#334155]">{n.body}</p>
            <p className="mt-0.5 text-[9px] text-[#94A3B8]">{n.author_email} · {timeLabel(n.created_at)}</p>
          </div>
        ))}
        <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} placeholder="Add an internal note…" className="mt-1 text-xs" aria-label="New internal note" />
        <Btn variant="outline" size="sm" className="mt-1" onClick={() => void addNote()} disabled={!noteText.trim()}><Plus size={12} /> Add note</Btn>
      </div>

      {conversation.followup_due_at ? (
        <div className="rounded-lg border border-[#C9A45C]/30 bg-[#C9A45C]/[0.07] p-2">
          <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#8F6B2D]"><Clock size={11} /> Follow-up due {new Date(conversation.followup_due_at).toLocaleString()}</p>
          {conversation.followup_note && <p className="mt-0.5 text-[10.5px] text-[#5B6B82]">{conversation.followup_note}</p>}
          <Btn variant="ghost" size="sm" className="mt-1" onClick={() => { void wa.updateConversation(conversation.id, { followup_due_at: null, followup_note: '' }).then(() => { push('success', 'Follow-up cleared.'); onMutate(); }); }}>Clear follow-up</Btn>
        </div>
      ) : (
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#7E8DA6]">Schedule follow-up (internal reminder — nothing auto-sends)</p>
          <div className="flex flex-wrap gap-1.5">
            {['today', 'tomorrow', '3d', 'week'].map((p) => (
              <Btn key={p} variant="outline" size="sm" onClick={() => void scheduleFollowup(p)}>
                {p === 'today' ? 'Today' : p === 'tomorrow' ? 'Tomorrow' : p === '3d' ? 'In 3 days' : 'Next week'}
              </Btn>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

