// =============================================================================
// BRANIFY WHATSAPP CRM — Emoji picker (spec §12)
// Standard Unicode emoji · category tabs · keyword search · recents.
// Zero external dependencies; data lives locally (no CDN, branding untouched).
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cx } from '../../ui';

type Item = [string, string]; // [emoji, search keywords]

interface Category { id: string; label: string; icon: string; items: Item[] }

const DATA: Category[] = [
  { id: 'smileys', label: 'Smileys', icon: '😀', items: [
    ['😀', 'grin happy'], ['😃', 'smile happy'], ['😄', 'laugh happy'], ['😁', 'beam grin'], ['😆', 'lol laugh squint'],
    ['😅', 'sweat laugh'], ['🤣', 'rofl laugh'], ['😂', 'joy tears laugh'], ['🙂', 'slight smile'], ['🙃', 'upside down'],
    ['😉', 'wink'], ['😊', 'blush smile'], ['😇', 'angel halo'], ['🥰', 'love hearts'], ['😍', 'heart eyes love'],
    ['🤩', 'star struck wow'], ['😘', 'kiss'], ['🥲', 'tear grateful'], ['😋', 'yum tasty'], ['😜', 'wink tongue'],
    ['🤪', 'zany crazy'], ['🤗', 'hug'], ['🤔', 'thinking hmm'], ['😏', 'smirk'], ['😒', 'unamused meh'],
    ['🙄', 'eyeroll'], ['😬', 'grimace awkward'], ['😌', 'relieved calm'], ['😔', 'pensive sad'], ['😴', 'sleep zzz'],
    ['😷', 'mask sick'], ['🤢', 'nauseated sick'], ['🥵', 'hot heat'], ['🥶', 'cold freeze'], ['🥴', 'woozy dizzy'],
    ['🤯', 'mind blown'], ['🥳', 'party celebrate'], ['😎', 'cool sunglasses'], ['🤓', 'nerd glasses'], ['😕', 'confused'],
    ['😲', 'astonished shock'], ['😳', 'flushed embarrassed'], ['🥺', 'pleading puppy'], ['😢', 'cry tear'], ['😭', 'sob cry loud'],
    ['😱', 'scream fear'], ['😞', 'disappointed sad'], ['😩', 'weary tired'], ['🥱', 'yawn bored'], ['😤', 'triumph steam'],
    ['😡', 'rage angry'], ['😠', 'angry'], ['😈', 'devil imp'], ['💀', 'skull dead'], ['💩', 'poop'],
    ['🤡', 'clown'], ['👋', 'wave hello bye'], ['✋', 'raised hand stop'], ['👌', 'ok perfect'], ['✌️', 'victory peace'],
    ['🤞', 'fingers crossed luck'], ['🤟', 'love you'], ['🤘', 'rock horns'], ['👍', 'thumbs up like good'], ['👎', 'thumbs down dislike'],
    ['👏', 'clap applause'], ['🙌', 'raised hands celebrate'], ['🤝', 'handshake deal'], ['🙏', 'pray thanks please'], ['💪', 'muscle strong flex'],
    ['👀', 'eyes look watch'], ['🧠', 'brain smart'],
  ]},
  { id: 'hearts', label: 'Hearts', icon: '❤️', items: [
    ['❤️', 'red heart love'], ['🧡', 'orange heart'], ['💛', 'yellow heart'], ['💚', 'green heart'], ['💙', 'blue heart'],
    ['💜', 'purple heart'], ['🖤', 'black heart'], ['🤍', 'white heart'], ['🤎', 'brown heart'], ['💔', 'broken heart'],
    ['💕', 'two hearts love'], ['💞', 'revolving hearts'], ['💓', 'beating heart'], ['💗', 'growing heart'], ['💖', 'sparkling heart'],
    ['💘', 'heart arrow cupid'], ['💝', 'heart gift'], ['✨', 'sparkles shine'], ['⭐', 'star'], ['🌟', 'glowing star'],
    ['💫', 'dizzy stars'], ['🔥', 'fire hot lit'], ['💥', 'collision boom'], ['💯', 'hundred perfect'], ['🎉', 'party popper celebrate'],
    ['🎊', 'confetti'], ['🎈', 'balloon'],
  ]},
  { id: 'work', label: 'Work', icon: '💼', items: [
    ['💼', 'briefcase work business'], ['📈', 'chart growth up'], ['📉', 'chart down'], ['📊', 'bar chart report'], ['📝', 'memo note write'],
    ['📄', 'page document'], ['📑', 'bookmark tabs'], ['📋', 'clipboard checklist'], ['📌', 'pushpin pin'], ['📎', 'paperclip attach'],
    ['📁', 'folder'], ['🗓️', 'calendar date'], ['📅', 'calendar'], ['⏰', 'alarm clock'], ['⏳', 'hourglass wait'],
    ['💰', 'money bag'], ['💳', 'credit card payment'], ['🧾', 'receipt invoice'], ['📦', 'package delivery'], ['🚚', 'truck delivery'],
    ['⚙️', 'gear settings'], ['🔧', 'wrench fix'], ['🔨', 'hammer'], ['🛠️', 'tools'], ['💻', 'laptop computer'],
    ['📱', 'phone mobile'], ['📞', 'telephone call'], ['📧', 'email'], ['✉️', 'envelope mail'], ['📤', 'outbox send'],
    ['📥', 'inbox receive'], ['🔍', 'magnify search'], ['🔒', 'locked secure'], ['🔑', 'key'], ['🛡️', 'shield security'],
    ['🌐', 'globe web'], ['🚀', 'rocket launch ship'], ['🤖', 'robot ai bot'], ['🧩', 'puzzle piece'], ['🎯', 'target goal bullseye'],
    ['🏆', 'trophy win'], ['👑', 'crown premium'], ['💎', 'gem diamond premium'], ['⚡', 'lightning fast zap'],
  ]},
  { id: 'travel', label: 'Travel', icon: '🌍', items: [
    ['🌍', 'globe earth world'], ['🗺️', 'world map'], ['🧭', 'compass'], ['✈️', 'plane travel'], ['🛫', 'takeoff depart'],
    ['🚗', 'car'], ['🚌', 'bus'], ['🚂', 'train'], ['🛳️', 'ship cruise'], ['🏝️', 'island'],
    ['🏖️', 'beach'], ['🏔️', 'mountain'], ['🏨', 'hotel'], ['🏠', 'house home'], ['🏢', 'office building'],
    ['📍', 'pin location'], ['🧳', 'luggage trip'], ['🌴', 'palm tree'], ['☀️', 'sun sunny'], ['☁️', 'cloud'],
    ['🌧️', 'rain'], ['❄️', 'snow cold'], ['🌈', 'rainbow'],
  ]},
  { id: 'food', label: 'Food', icon: '☕', items: [
    ['☕', 'coffee cafe'], ['🍵', 'tea'], ['🧋', 'boba bubble tea'], ['🥤', 'soda drink'], ['🍽️', 'plate dining'],
    ['🍕', 'pizza'], ['🍔', 'burger'], ['🌮', 'taco'], ['🍣', 'sushi'], ['🍜', 'ramen noodles'],
    ['🍝', 'pasta'], ['🍗', 'chicken'], ['🥗', 'salad healthy'], ['🍰', 'cake slice'], ['🎂', 'birthday cake'],
    ['🍫', 'chocolate'], ['🍩', 'donut'], ['🍪', 'cookie'], ['🍎', 'apple'], ['🍌', 'banana'],
    ['🥭', 'mango'], ['🍇', 'grapes'], ['🥑', 'avocado'], ['🍞', 'bread'], ['🧁', 'cupcake'], ['🍯', 'honey'],
  ]},
  { id: 'objects', label: 'Objects', icon: '📱', items: [
    ['🔔', 'bell notification'], ['🔕', 'bell off mute'], ['🎵', 'music note'], ['🎶', 'music notes'], ['🎤', 'microphone'],
    ['🎧', 'headphones'], ['📷', 'camera photo'], ['📹', 'video camera'], ['🎬', 'clapper film'], ['🖼️', 'picture frame'],
    ['💬', 'speech chat'], ['💭', 'thought bubble'], ['📣', 'megaphone announce'], ['🎁', 'gift present'], ['🛒', 'cart shop'],
    ['🛍️', 'shopping bags'], ['🏷️', 'label tag price'], ['🪄', 'magic wand'], ['🔮', 'crystal ball'],
  ]},
  { id: 'symbols', label: 'Symbols', icon: '✅', items: [
    ['✅', 'check done yes'], ['☑️', 'checkbox checked'], ['✔️', 'check'], ['❌', 'cross no wrong'], ['⛔', 'no entry stop'],
    ['⚠️', 'warning caution'], ['❓', 'question'], ['❗', 'exclamation'], ['‼️', 'double exclamation'], ['🆗', 'ok'],
    ['🆕', 'new'], ['🟢', 'green circle'], ['🔴', 'red circle'], ['🟡', 'yellow circle'], ['🔵', 'blue circle'],
    ['➡️', 'right arrow'], ['⬅️', 'left arrow'], ['⬆️', 'up arrow'], ['⬇️', 'down arrow'], ['🔗', 'link'],
    ['➕', 'plus add'], ['✖️', 'multiply'], ['♾️', 'infinity'], ['™️', 'trademark'], ['©️', 'copyright'],
  ]},
];

const RECENT_KEY = 'branify.wa.emoji.recents';

function loadRecents(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[]; } catch { return []; }
}

export const EmojiPicker: React.FC<{ onPick: (emoji: string) => void; onClose: () => void }> = ({ onPick, onClose }) => {
  const [tab, setTab] = useState('recent');
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>(loadRecents);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const out: string[] = [];
    for (const cat of DATA) for (const [e, kw] of cat.items) {
      if (kw.includes(q) || e === q) out.push(e);
      if (out.length >= 64) return out;
    }
    return out;
  }, [query]);

  const pick = (emoji: string) => {
    const next = [emoji, ...recents.filter((r) => r !== emoji)].slice(0, 24);
    setRecents(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* private mode */ }
    onPick(emoji);
  };

  const active = DATA.find((d) => d.id === tab);

  return (
    <div ref={ref} className="absolute bottom-full left-0 z-30 mb-2 w-[300px] rounded-xl border border-white/[0.1] bg-white p-2 shadow-2xl"
      role="dialog" aria-label="Emoji picker">
      <div className="mb-1.5 flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#7E8DA6]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search emoji…"
            className="h-7 w-full rounded-lg border border-[#0F172A]/10 bg-white/[0.04] pl-6 pr-2 text-[11px] text-[#111827] placeholder:text-[#7E8DA6]"
            aria-label="Search emoji" />
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-[#7E8DA6] hover:bg-white/[0.06]" aria-label="Close emoji picker"><X size={12} /></button>
      </div>
      <div className="mb-1.5 flex gap-0.5 overflow-x-auto">
        <button onClick={() => { setTab('recent'); setQuery(''); }}
          className={cx('shrink-0 rounded-md px-1.5 py-1 text-[12px]', tab === 'recent' && !query ? 'bg-[#C9A45C]/25' : 'hover:bg-white/[0.06]')}
          title="Recent">🕘</button>
        {DATA.map((d) => (
          <button key={d.id} onClick={() => { setTab(d.id); setQuery(''); }} title={d.label}
            className={cx('shrink-0 rounded-md px-1.5 py-1 text-[12px]', tab === d.id && !query ? 'bg-[#C9A45C]/25' : 'hover:bg-white/[0.06]')}>
            {d.icon}
          </button>
        ))}
      </div>
      <div className="adm-scroll grid max-h-[190px] grid-cols-8 gap-0.5 overflow-y-auto">
        {query ? (searchResults || []).map((e, i) => (
          <button key={`${e}-${i}`} onClick={() => pick(e)} className="rounded-md py-1 text-[16px] hover:bg-[#C9A45C]/15" title={`Search: ${query}`}>{e}</button>
        )) : tab === 'recent' ? (
          recents.length ? recents.map((e, i) => (
            <button key={`${e}-${i}`} onClick={() => pick(e)} className="rounded-md py-1 text-[16px] hover:bg-[#C9A45C]/15" title="Recent">{e}</button>
          )) : <p className="col-span-8 px-1 py-4 text-center text-[10.5px] text-[#7E8DA6]">Your recently used emoji appear here.</p>
        ) : (active?.items || []).map(([e], i) => (
          <button key={`${e}-${i}`} onClick={() => pick(e)} className="rounded-md py-1 text-[16px] hover:bg-[#C9A45C]/15" title={active?.items[i]?.[1]}>{e}</button>
        ))}
      </div>
    </div>
  );
};
