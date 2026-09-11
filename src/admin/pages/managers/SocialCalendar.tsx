// =============================================================================
// BRANIFY ADMIN — Social Content Calendar
// -----------------------------------------------------------------------------
// Month / Week / Day views over social_posts. Drag a post chip onto another
// day to reschedule (keeps the time of day; logs social.schedule). Click a
// day to add a post on that date. Status-coloured chips give the pipeline
// view: draft / pending / approved / scheduled / published / failed.
// =============================================================================

import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, Btn, cx } from '../../ui';
import type { SocialPostRow, SocialStatus } from '../../lib/types';

export const STATUS_TONE: Record<SocialStatus, 'gold' | 'green' | 'amber' | 'red' | 'steel' | 'zinc' | 'violet'> = {
  draft: 'zinc',
  pending_approval: 'amber',
  approved: 'violet',
  scheduled: 'gold',
  publishing: 'steel',
  published: 'green',
  failed: 'red',
  cancelled: 'steel',
};

const DAY_LETTERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const shift = (x.getDay() + 6) % 7; // Monday-first
  x.setDate(x.getDate() - shift);
  return x;
}
function timeOf(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const Chip: React.FC<{ post: SocialPostRow; onOpen: (p: SocialPostRow) => void }> = ({ post, onOpen }) => (
  <button
    draggable
    onDragStart={(e) => e.dataTransfer.setData('text/social-post-id', post.id)}
    onClick={() => onOpen(post)}
    className="group w-full truncate rounded-md border px-1.5 py-0.5 text-left text-[10px] font-semibold leading-tight transition-colors hover:brightness-105"
    title={`${post.platform === 'facebook' ? 'Facebook' : 'Instagram'} · ${post.status} · ${post.title || post.caption.slice(0, 80)}`}
  >
    <span className={cx('mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle',
      post.status === 'published' ? 'bg-emerald-500' :
      post.status === 'failed' ? 'bg-red-500' :
      post.status === 'scheduled' ? 'bg-[#C9A45C]' :
      post.status === 'approved' ? 'bg-purple-500' :
      post.status === 'pending_approval' ? 'bg-amber-500' : 'bg-slate-400')} />
    <span className="align-middle">{timeOf(post.scheduled_at || post.published_at) || (post.platform === 'facebook' ? 'FB' : 'IG')}</span>
    <span className="ml-1 align-middle text-[#475569]">{post.title || post.caption.slice(0, 26)}</span>
  </button>
);

export const SocialCalendar: React.FC<{
  posts: SocialPostRow[];
  onOpenPost: (p: SocialPostRow) => void;
  onAddOnDay: (dateIso: string) => void;
  onReschedule: (p: SocialPostRow, dateIso: string) => void;
}> = ({ posts, onOpenPost, onAddOnDay, onReschedule }) => {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [cursor, setCursor] = useState(() => new Date());

  const postsByDay = useMemo(() => {
    const map = new Map<string, SocialPostRow[]>();
    for (const p of posts) {
      const iso = p.scheduled_at || p.published_at;
      if (!iso) continue;
      const d = new Date(iso);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) || [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [posts]);

  const cells = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(cursor);
      return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    }
    if (view === 'day') return [new Date(cursor)];
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }, [cursor, view]);

  const shift = (dir: number) => {
    const d = new Date(cursor);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'week') d.setDate(d.getDate() + 7 * dir);
    else d.setDate(d.getDate() + dir);
    setCursor(d);
  };

  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Btn size="sm" variant="ghost" onClick={() => shift(-1)} icon={ChevronLeft} aria-label="Previous" />
          <Btn size="sm" variant="ghost" onClick={() => setCursor(new Date())}>Today</Btn>
          <Btn size="sm" variant="ghost" onClick={() => shift(1)} icon={ChevronRight} aria-label="Next" />
          <span className="ml-1 text-sm font-bold capitalize text-[#111827]">{view === 'day' ? cursor.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) : monthLabel}</span>
        </div>
        <div className="flex gap-1">
          {(['day', 'week', 'month'] as const).map((v) => (
            <Btn key={v} size="sm" variant={view === v ? 'gold' : 'outline'} onClick={() => setView(v)}>{v[0].toUpperCase() + v.slice(1)}</Btn>
          ))}
        </div>
      </div>

      {view !== 'day' && (
        <div className="mb-1 grid grid-cols-7 gap-1">
          {DAY_LETTERS.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-[#8F6B2D]">{d}</div>
          ))}
        </div>
      )}

      <div className={cx('grid gap-1', view === 'day' ? 'grid-cols-1' : 'grid-cols-7')}>
        {cells.map((d, i) => {
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const dayPosts = postsByDay.get(key) || [];
          const isToday = sameDay(d, new Date());
          const dim = view === 'month' && d.getMonth() !== cursor.getMonth();
          return (
            <div
              key={key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('text/social-post-id');
                const p = posts.find((x) => x.id === id);
                if (p) onReschedule(p, d.toISOString());
              }}
              className={cx(
                'min-h-[86px] rounded-lg border p-1.5 transition-colors',
                dim ? 'border-[#E2E8F0]/60 bg-white/40 opacity-55' : 'border-[#E2E8F0] bg-white/70',
                isToday && 'border-[#C9A45C] ring-1 ring-[#C9A45C]/40',
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className={cx('text-[11px] font-bold', isToday ? 'text-[#8F6B2D]' : 'text-[#475569]')}>{d.getDate()}</span>
                <button
                  className="rounded px-1 text-[10px] text-[#8F6B2D] opacity-0 transition-opacity hover:bg-[#C9A45C]/10 hover:opacity-100 group-hover:opacity-100"
                  style={{ opacity: 0.55 }}
                  onClick={() => onAddOnDay(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0).toISOString())}
                  title="Add post on this day"
                >+</button>
              </div>
              <div className="space-y-1">
                {dayPosts.slice(0, 4).map((p) => <Chip key={p.id} post={p} onOpen={onOpenPost} />)}
                {dayPosts.length > 4 && (
                  <button className="w-full text-left text-[10px] font-semibold text-[#8F6B2D] hover:underline" onClick={() => setCursor(d) || setView('day')}>
                    +{dayPosts.length - 4} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-[#475569]">
        <CalendarIcon size={12} className="text-[#8F6B2D]" />
        <span>Drag a chip to reschedule · click a chip to open it ·</span>
        {(['draft', 'pending_approval', 'approved', 'scheduled', 'published', 'failed'] as SocialStatus[]).map((s) => (
          <Badge key={s} tone={STATUS_TONE[s]}>{s.replace('_', ' ')}</Badge>
        ))}
      </div>
    </div>
  );
};
