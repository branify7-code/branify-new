// =============================================================================
// BRANIFY WHATSAPP CRM — Inbox v2 container (spec §1-§33)
// 3-pane professional workspace. Server-side search (debounced 350 ms + trigram
// message-text match) · realtime conversation/message updates with graceful
// polling fallback · unread badges + divider + official read receipts · pinned
// /muted state · honest inbound health next to the API connection state.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ChevronLeft, SignalHigh, SignalLow, SignalZero, UserRound } from 'lucide-react';
import { Badge, Btn, EmptyState, cx } from '../../ui';
import { useAdminAuth } from '../../lib/auth';
import { useToast } from '../../ui';
import * as wa from '../waClient';
import type { WaContact, WaConversation, WaHealth, WaMessage } from '../waTypes';
import { ConversationList, type Filter } from './ConversationList';
import { Avatar, listTimeLabel } from './ConversationList';
import { ChatPane } from './ChatPane';
import { Composer } from './Composer';
import { ProfilePane } from './ProfilePane';

const SEARCH_DEBOUNCE = 350;

export const InboxSection: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { user } = useAdminAuth();
  const { push } = useToast();
  const [conversations, setConversations] = useState<WaConversation[] | null>(null);
  const [contacts, setContacts] = useState<Record<string, WaContact>>({});
  const [activeId, setActiveId] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [showDetails, setShowDetails] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [replyTo, setReplyTo] = useState<WaMessage | null>(null);
  const [health, setHealth] = useState<WaHealth | null>(null);
  const searchTimer = useRef<number | null>(null);

  // ---- debounced search (spec §28) ----
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE);
    return () => { if (searchTimer.current) window.clearTimeout(searchTimer.current); };
  }, [searchInput]);

  // ---- load conversations (server-side search) ----
  const load = useCallback(async () => {
    try {
      let rows = await wa.listConversations({ search });
      if (search) {
        // Message-text matches via trigram index — merge conversations whose
        // previews/names didn't match but whose message bodies did.
        const ids = await wa.searchConversationIdsByText(search);
        const missing = ids.filter((id) => !rows.some((r) => r.id === id));
        if (missing.length) {
          const extra = await wa.listConversations({});
          rows = [...rows, ...extra.filter((r) => missing.includes(r.id))];
        }
      }
      setConversations(rows);
      const contactIds = Array.from(new Set(rows.map((r) => r.contact_id)));
      if (contactIds.length) {
        wa.listContacts().then((cts) => {
          setContacts(Object.fromEntries(cts.filter((c) => contactIds.includes(c.id)).map((c) => [c.id, c])));
        }).catch(() => undefined);
      }
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not load conversations.');
      setConversations([]);
    }
  }, [search, push]);
  useEffect(() => { void load(); }, [load, reloadKey]);

  // ---- honest inbound health (spec §30) ----
  useEffect(() => {
    const fetchHealth = () => wa.health().then((r) => setHealth(r.health)).catch(() => undefined);
    void fetchHealth();
    const t = window.setInterval(fetchHealth, 60000);
    return () => window.clearInterval(t);
  }, []);

  // ---- realtime conversation upserts (spec §22) ----
  useEffect(() => {
    const sub = wa.subscribeConversations({
      onUpsert: (row) => {
        setConversations((prev) => {
          const list = prev || [];
          const idx = list.findIndex((c) => c.id === row.id);
          const merged: WaConversation = { ...list[idx], ...row };
          if (idx >= 0) { const next = list.slice(); next[idx] = merged; return next; }
          return [merged, ...list];
        });
      },
      onError: () => undefined, // container keeps a manual refresh button
    });
    return () => sub.unsubscribe();
  }, []);

  // ---- filters + pinned-first sort (client-side on the server-filtered page) ----
  const filtered = useMemo(() => {
    let rows = conversations || [];
    rows = rows.filter((c) => {
      if (filter === 'unread') return c.unread_count > 0;
      if (filter === 'unassigned') return !c.assigned_to;
      if (filter === 'mine') return c.assigned_to === user.email;
      if (filter !== 'all') return c.status === filter;
      return true;
    });
    return rows.slice().sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return new Date(b.last_message_at || b.created_at || 0).getTime() - new Date(a.last_message_at || a.created_at || 0).getTime();
    });
  }, [conversations, filter, user.email]);

  const active = filtered.find((c) => c.id === activeId) || (conversations || []).find((c) => c.id === activeId) || null;
  const activeContact: WaContact | null = (() => {
    if (!active) return null;
    if (contacts[active.contact_id]) return contacts[active.contact_id];
    if (active.contact) {
      // Hydrate a provisional profile from the embedded contact (full row loads async).
      return {
        id: active.contact_id,
        wa_id: active.wa_id,
        name: active.contact.name || '',
        email: active.contact.email || '',
        company: active.contact.company || '',
        tags: active.contact.tags || [],
        lead_status: active.contact.lead_status || 'new',
        assigned_to: active.assigned_to || '',
        source: 'WhatsApp',
        opt_out: Boolean(active.contact.opt_out),
        customer_user_id: null,
        last_message_at: null,
        created_at: '',
      } as WaContact;
    }
    return null;
  })();

  const openConversation = (id: string) => {
    setActiveId(id);
    setMobileView('chat');
    setShowDetails(false);
    setReplyTo(null);
    const conv = (conversations || []).find((c) => c.id === id);
    if (conv && conv.unread_count > 0) {
      wa.markRead(id).then(() => {
        setConversations((prev) => (prev || []).map((c) => (c.id === id ? { ...c, unread_count: 0, last_read_at: new Date().toISOString() } : c)));
      }).catch(() => { /* badge reset only; server state reconciles on next load */ });
    }
  };

  const healthBadge = (() => {
    if (!health) return null;
    const last = health.last_inbound_message_at ? new Date(health.last_inbound_message_at).getTime() : 0;
    const freshInbound = last > Date.now() - 7 * 86400000;
    return (
      <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-[#7E8DA6]" title={`Last inbound message: ${health.last_inbound_message_at ? new Date(health.last_inbound_message_at).toLocaleString() : 'never'} · inbound (24h): ${health.inbound_messages_24h}`}>
        {freshInbound ? <SignalHigh size={11} className="text-emerald-500" /> : health.inbound_messages_24h > 0 || last ? <SignalLow size={11} className="text-amber-500" /> : <SignalZero size={11} className="text-[#94A3B8]" />}
        Inbound: {health.last_inbound_message_at ? listTimeLabel(health.last_inbound_message_at) : 'none yet'}
      </span>
    );
  })();

  return (
    <div className="grid min-h-[560px] grid-cols-1 gap-3 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_340px]">
      {/* ---- LEFT ---- */}
      <div className={cx('flex min-h-0 flex-col gap-2', mobileView === 'chat' && 'hidden lg:flex')}>
        <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#7E8DA6]"><Activity size={11} /> Webhook health</p>
          {healthBadge}
        </div>
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          filter={filter}
          search={searchInput}
          myEmail={user.email}
          onFilter={setFilter}
          onSearch={setSearchInput}
          onOpen={openConversation}
          onRefresh={() => setReloadKey((k) => k + 1)}
          searching={Boolean(search)}
        />
      </div>

      {/* ---- CENTER ---- */}
      <section className={cx('relative flex min-h-0 min-w-0 flex-col rounded-xl border border-white/[0.07] bg-white/[0.02]', mobileView === 'list' && 'hidden lg:flex')}>
        {active ? (
          <>
            <header className="flex items-center gap-2.5 border-b border-white/[0.06] p-3">
              <button className="rounded-lg p-1.5 text-[#5B6B82] hover:bg-white/[0.06] lg:hidden" onClick={() => setMobileView('list')} aria-label="Back to conversations">
                <ChevronLeft size={16} />
              </button>
              <Avatar name={active.contact?.name || `+${active.wa_id}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-[#111827]">{active.contact?.name || `+${active.wa_id}`}</p>
                <p className="truncate text-[10.5px] text-[#7E8DA6]">
                  +{active.wa_id}{active.contact?.company ? ` · ${active.contact.company}` : ''}{active.assigned_to ? ` · → ${active.assigned_to === user.email ? 'me' : active.assigned_to.split('@')[0]}` : ' · Unassigned'}
                </p>
              </div>
              <WindowBadge conv={active} />
              <a href={`https://wa.me/${active.wa_id}`} target="_blank" rel="noopener noreferrer"
                className="hidden items-center gap-1 rounded-lg border border-[#0F172A]/10 px-2.5 py-1.5 text-[11px] font-bold text-[#334155] hover:border-[#C9A45C]/40 sm:inline-flex">
                <UserRound size={12} /> Contact
              </a>
              <Btn variant="ghost" size="sm" onClick={() => setShowDetails((v) => !v)} aria-label="Toggle customer details" className="xl:hidden">
                Details
              </Btn>
            </header>
            <ChatPane conversation={active} onReply={setReplyTo} refreshKey={reloadKey} />
            <Composer
              conversation={active}
              contact={activeContact}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              onSent={() => setReloadKey((k) => k + 1)}
              onOpenSettings={onOpenSettings}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState title="Select a conversation" hint="Pick a chat on the left — they appear here the moment customers message your official WhatsApp number." />
          </div>
        )}
      </section>

      {/* ---- RIGHT ---- */}
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
  const open = Boolean(conv.window_expires_at && new Date(conv.window_expires_at).getTime() > Date.now());
  return open
    ? <Badge tone="green" className="shrink-0">Window OPEN</Badge>
    : <Badge tone="amber" className="shrink-0" title="24h customer service window closed — template message required">Window CLOSED</Badge>;
};
