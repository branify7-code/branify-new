// =============================================================================
// BRANIFY WHATSAPP CRM — chat pane (spec §3/§21/§22)
// Paginated history (50/page) · date separators · UNREAD divider anchored at
// last_read_at · scroll position preserved when loading older pages · realtime
// INSERT/UPDATE via Supabase (polling fallback handled by the container).
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import { LoadingBlock, cx } from '../../ui';
import * as wa from '../waClient';
import type { WaConversation, WaMessage } from '../waTypes';
import { Bubble, dayKeyOf, dayLabelOf, timeLabel } from './Bubble';

const PAGE = 50;

export const ChatPane: React.FC<{
  conversation: WaConversation;
  onReply: (m: WaMessage) => void;
  refreshKey: number;
}> = ({ conversation, onReply, refreshKey }) => {
  const [messages, setMessages] = useState<WaMessage[] | null>(null);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickBottomRef = useRef(true);

  // ---- initial load (latest page) ----
  useEffect(() => {
    let alive = true;
    setMessages(null);
    setError('');
    setHasMore(false);
    stickBottomRef.current = true;
    wa.listMessages(conversation.id, { limit: PAGE }).then((rows) => {
      if (!alive) return;
      setMessages(rows);
      setHasMore(rows.length >= PAGE);
    }).catch((e) => {
      if (!alive) return;
      setError(e instanceof Error ? e.message : 'Could not load messages.');
      setMessages([]);
    });
    return () => { alive = false; };
  }, [conversation.id, refreshKey]);

  // ---- realtime INSERT/UPDATE for the open conversation ----
  useEffect(() => {
    const sub = wa.subscribeMessages(conversation.id, {
      onInsert: (row) => {
        setMessages((prev) => {
          if (!prev) return prev;
          if (prev.some((p) => p.id === row.id)) return prev;
          return [...prev, row];
        });
      },
      onUpdate: (row) => {
        setMessages((prev) => (prev || []).map((p) => (p.id === row.id ? row : p)));
      },
    });
    return () => sub.unsubscribe();
  }, [conversation.id]);

  // ---- autoscroll when near bottom ----
  useEffect(() => {
    if (stickBottomRef.current) bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages?.length]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  // ---- load older with scroll-position preservation (spec §3) ----
  const loadOlder = useCallback(async () => {
    const current = messages || [];
    if (!current.length || loadingOlder) return;
    setLoadingOlder(true);
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight || 0;
    const prevTop = el?.scrollTop || 0;
    try {
      const older = await wa.listMessages(conversation.id, { before: current[0]?.timestamp, limit: PAGE });
      setMessages([...older, ...current]);
      setHasMore(older.length >= PAGE);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight + prevTop;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load older messages.');
    } finally {
      setLoadingOlder(false);
    }
  }, [messages, loadingOlder, conversation.id]);

  // ---- unread divider anchor (first inbound newer than last_read_at) ----
  const unreadDividerIndex = (() => {
    if (!messages || !conversation.unread_count) return -1;
    const anchor = conversation.last_read_at ? new Date(conversation.last_read_at).getTime() : 0;
    if (anchor) {
      const idx = messages.findIndex((m) => m.direction === 'in' && new Date(m.timestamp).getTime() > anchor);
      if (idx >= 0 && idx <= messages.length - 1) return idx;
      return -1;
    }
    // No anchor known: mark the last N unread inbound messages.
    return Math.max(0, messages.length - conversation.unread_count);
  })();

  return (
    <div ref={scrollRef} onScroll={onScroll}
      className="adm-scroll relative min-h-[240px] flex-1 space-y-1.5 overflow-y-auto bg-[#ECE5DD]/40 p-3 xl:max-h-[480px]"
      aria-label="Messages">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-[11px] text-red-600">{error}</p>}
      {messages === null && <LoadingBlock label="Loading messages…" />}
      {messages !== null && messages.length === 0 && (
        <p className="py-10 text-center text-[11px] text-[#7E8DA6]">No messages in this conversation yet.</p>
      )}
      {hasMore && messages !== null && messages.length > 0 && (
        <div className="flex justify-center pb-1">
          <button onClick={() => void loadOlder()} disabled={loadingOlder}
            className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-white px-3 py-1 text-[10px] font-bold text-[#5B6B82] hover:border-[#C9A45C]/40 hover:text-[#8F6B2D]">
            <History size={11} /> {loadingOlder ? 'Loading…' : 'Load older messages'}
          </button>
        </div>
      )}
      {messages?.map((m, i) => (
        <React.Fragment key={m.id}>
          {(i === 0 || dayKeyOf(messages[i - 1].timestamp) !== dayKeyOf(m.timestamp)) && (
            <div className="sticky top-0 z-10 flex justify-center py-1.5">
              <span className="rounded-full bg-white/90 px-3 py-0.5 text-[9.5px] font-black uppercase tracking-[0.14em] text-[#7E8DA6] shadow-sm">
                {dayLabelOf(m.timestamp)}
              </span>
            </div>
          )}
          {i === unreadDividerIndex && (
            <div className="flex items-center gap-2 py-1">
              <span className="h-px flex-1 bg-[#C9A45C]/60" />
              <span className="rounded-full bg-[#C9A45C] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#1A1206]">Unread</span>
              <span className="h-px flex-1 bg-[#C9A45C]/60" />
            </div>
          )}
          <Bubble message={m} onReply={onReply} />
        </React.Fragment>
      ))}
      <div ref={bottomRef} />
      {messages !== null && messages.length > 0 && (
        <p className="pt-1 text-center text-[9px] text-[#94A3B8]">{messages.length} loaded · last {timeLabel(messages[messages.length - 1]?.timestamp || null)}</p>
      )}
    </div>
  );
};

export const ScrollToBottomButton: React.FC<{ onClick: () => void; visible: boolean }> = ({ onClick, visible }) => (
  <button onClick={onClick} aria-label="Scroll to latest"
    className={cx('absolute bottom-3 right-4 z-20 rounded-full border border-white/[0.12] bg-white p-2 text-[#5B6B82] shadow-lg transition-opacity hover:text-[#8F6B2D]',
      visible ? 'opacity-100' : 'pointer-events-none opacity-0')}>
    <ChevronDown size={14} />
  </button>
);
