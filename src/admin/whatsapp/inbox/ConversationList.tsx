// =============================================================================
// BRANIFY WHATSAPP CRM — conversation list (spec §2)
// Server-side search (name/phone/preview + trigram message-text match) · 8
// filters · pinned-first ordering · unread badges · assignment + status chips.
// =============================================================================
import React from 'react';
import { BellOff, CheckCheck, Pin, RefreshCw } from 'lucide-react';
import { Badge, EmptyState, Input, LoadingBlock, cx } from '../../ui';
import type { WaConversation } from '../waTypes';
import { CONVERSATION_STATUS_LABELS, LEAD_STATUS_LABELS } from '../waTypes';

export type Filter = 'all' | 'unread' | 'unassigned' | 'mine' | 'open' | 'waiting' | 'closed' | 'archived';
export const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' }, { id: 'unread', label: 'Unread' }, { id: 'unassigned', label: 'Unassigned' },
  { id: 'mine', label: 'Mine' }, { id: 'open', label: 'Open' }, { id: 'waiting', label: 'Waiting' },
  { id: 'closed', label: 'Closed' }, { id: 'archived', label: 'Archived' },
];

export const listTimeLabel = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yest = new Date(Date.now() - 86400000);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

export const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 34 }) => {
  const letter = (name || '#').trim().charAt(0).toUpperCase() || '#';
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A45C] to-[#8F6B2D] font-black text-[#1A1206]"
      style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">
      {letter}
    </span>
  );
};

export const ConversationList: React.FC<{
  conversations: WaConversation[] | null;
  activeId: string;
  filter: Filter;
  search: string;
  myEmail: string;
  onFilter: (f: Filter) => void;
  onSearch: (s: string) => void;
  onOpen: (id: string) => void;
  onRefresh: () => void;
  searching: boolean;
}> = ({ conversations, activeId, filter, search, myEmail, onFilter, onSearch, onOpen, onRefresh, searching }) => {
  const unreadTotal = (conversations || []).reduce((n, c) => n + ((c.muted || c.unread_count <= 0) ? 0 : 1), 0);
  return (
    <aside className="flex min-h-0 flex-col gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5" aria-label="Conversations">
      <div className="flex items-center gap-2">
        <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search name, phone, text…" aria-label="Search conversations" className="h-8 text-xs" />
        <button onClick={onRefresh} className="rounded-lg p-1.5 text-[#5B6B82] hover:bg-white/[0.06]" aria-label="Refresh conversations"><RefreshCw size={13} /></button>
      </div>
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => onFilter(f.id)}
            className={cx('rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors',
              filter === f.id ? 'bg-[#C9A45C]/20 text-[#8F6B2D]' : 'bg-white/[0.05] text-[#5B6B82] hover:text-[#111827]')}>
            {f.label}{f.id === 'unread' && unreadTotal > 0 ? ` · ${unreadTotal}` : ''}
          </button>
        ))}
      </div>
      <div className="adm-scroll flex max-h-[58vh] min-h-0 flex-1 flex-col gap-1 overflow-y-auto xl:max-h-[620px]">
        {conversations === null && <LoadingBlock label="Loading conversations…" />}
        {conversations !== null && conversations.length === 0 && (
          <EmptyState title={searching ? 'No matches' : 'No conversations here yet'}
            hint={searching ? 'Try a different name, phone or message text.' : 'Incoming WhatsApp messages appear instantly once the webhook is connected.'} />
        )}
        {(conversations || []).map((c) => {
          const contact = c.contact;
          const name = contact?.name || `+${c.wa_id}`;
          const unread = c.unread_count > 0;
          return (
            <button key={c.id} onClick={() => onOpen(c.id)}
              className={cx('flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-colors',
                c.id === activeId ? 'border-[#C9A45C]/45 bg-[#C9A45C]/[0.08]' : 'border-transparent hover:bg-white/[0.05]',
                c.muted && 'opacity-80')}>
              <Avatar name={name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className={cx('min-w-0 flex-1 truncate text-xs', unread ? 'font-extrabold text-[#111827]' : 'font-semibold text-[#334155]')}>{name}</p>
                  {c.pinned && <Pin size={10} className="shrink-0 text-[#8F6B2D]" aria-label="Pinned" />}
                  {c.muted && <BellOff size={10} className="shrink-0 text-[#7E8DA6]" aria-label="Muted" />}
                  <span className={cx('shrink-0 text-[9.5px]', unread ? 'font-bold text-[#8F6B2D]' : 'text-[#7E8DA6]')}>{listTimeLabel(c.last_message_at)}</span>
                </div>
                <p className={cx('mt-0.5 truncate text-[11px]', unread ? 'font-semibold text-[#334155]' : 'text-[#5B6B82]')}>
                  {c.last_message_preview || `+${c.wa_id}`}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {c.status !== 'open' && <Badge tone="steel">{CONVERSATION_STATUS_LABELS[c.status]}</Badge>}
                  {contact && contact.lead_status !== 'new' && <Badge tone={contact.lead_status === 'won' ? 'green' : contact.lead_status === 'lost' ? 'red' : 'violet'}>{LEAD_STATUS_LABELS[contact.lead_status]}</Badge>}
                  {c.assigned_to && <span className="truncate text-[9.5px] text-[#7E8DA6]">→ {c.assigned_to === myEmail ? 'me' : c.assigned_to.split('@')[0]}</span>}
                  {unread && <span className={cx('ml-auto rounded-full px-1.5 text-[9.5px] font-black', c.muted ? 'bg-[#94A3B8] text-white' : 'bg-[#C9A45C] text-[#1A1206]')}>{c.unread_count}</span>}
                  {c.unread_count === 0 && c.last_message_preview && c.assigned_to === myEmail && <CheckCheck size={10} className="ml-auto text-[#94A3B8]" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
