import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  AlignLeft, ArrowRightLeft, ArrowUpDown, BarChart2, BookOpen, Bot, Calculator, Clock, Code,
  Combine, Cpu, CreditCard, Crop, Database, DollarSign, Download, EyeOff, FileCheck, FileCode,
  FileDigit, FileImage, FileText, Globe, Hash, HelpCircle, Home, Image as ImageIcon, Info, Key,
  Laptop, Layers, Layout, Lightbulb, Link as LinkIcon, Link2, List, ListFilter, ListOrdered, Lock,
  Mail, Map, Maximize2, Minimize2, Monitor, Moon, MousePointer, Network, Palette, Percent, PieChart,
  PiggyBank, QrCode, Receipt, RefreshCw, RotateCcw, RotateCw, Search, Share2, Shield, ShieldCheck,
  Shuffle, Sliders, Smartphone, Sparkles, Stamp, Star, Tag, Target, Terminal, TrendingUp, Type,
  User, Users, Volume2, ArrowRight, Search as SearchIcon, Smartphone as SmartphoneIcon,
} from 'lucide-react';
import { TOOL_CATEGORIES } from '../../data/toolsRegistry';
import { allTools } from '../../tools';

interface FreeToolsViewProps {
  onNavigate: (path: string) => void;
  initialCategory?: string | null;
  onOpenPWA?: () => void;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  AlignLeft, ArrowRightLeft, ArrowUpDown, BarChart2, BookOpen, Bot, Calculator, Clock, Code,
  Combine, Cpu, CreditCard, Crop, Database, DollarSign, Download, EyeOff, FileCheck, FileCode,
  FileDigit, FileImage, FileText, Globe, Hash, HelpCircle, Home, Image: ImageIcon, Info, Key,
  Laptop, Layers, Layout, Lightbulb, Link: LinkIcon, Link2, List, ListFilter, ListOrdered, Lock,
  Mail, Map, Maximize2, Minimize2, Monitor, Moon, MousePointer, Network, Palette, Percent, PieChart,
  PiggyBank, QrCode, Receipt, RefreshCw, RotateCcw, RotateCw, Search, Share2, Shield, ShieldCheck,
  Shuffle, Sliders, Smartphone, Sparkles, Stamp, Star, Tag, Target, Terminal, TrendingUp, Type,
  User, Users, Volume2,
};

const IconFor = ({ name, className }: { name: string; className?: string }) => {
  const Cmp = ICONS[name] || Sparkles;
  return <Cmp className={className} />;
};

/* ---------- 3D tilt card (mirrors live tilt-card-wrapper behavior) ---------- */

interface TiltCardProps {
  children: React.ReactNode;
  onClick: () => void;
}

const TiltCard: React.FC<TiltCardProps> = ({ children, onClick }) => {
  const [transform, setTransform] = useState('rotateX(0deg) rotateY(0deg) scale(1)');
  const [glow, setGlow] = useState({ x: 50, y: 50, o: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * 8;
    const ry = (px - 0.5) * 8;
    setTransform(`rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(1.02)`);
    setGlow({ x: px * 100, y: py * 100, o: 1 });
  }, []);

  const onLeave = useCallback(() => {
    setTransform('rotateX(0deg) rotateY(0deg) scale(1)');
    setGlow((g) => ({ ...g, o: 0 }));
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      aria-label="Run tool online"
      className="tilt-card-wrapper relative rounded-2xl bg-[#080B14]/85 backdrop-blur-xl border border-white/[0.08] hover:border-violet-500/40 shadow-xl shadow-black/60 overflow-hidden transition-all duration-300 cursor-pointer p-6 h-full flex flex-col justify-between space-y-6 group focus:outline-none focus-visible:border-[#F27D26]/60"
      style={{ transform, transition: 'transform 0.35s ease-out', willChange: 'transform' }}
    >
      {/* mouse-following glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: glow.o,
          background: `radial-gradient(420px circle at ${glow.x}% ${glow.y}%, rgba(139,92,246,0.14), transparent 45%)`,
        }}
      />
      <div className="relative z-10 h-full flex flex-col justify-between space-y-6">{children}</div>
    </div>
  );
};

/* ------------------------------ directory view ------------------------------ */

const FreeToolsView: React.FC<FreeToolsViewProps> = ({ onNavigate, initialCategory, onOpenPWA }) => {
  const validInitial = initialCategory && TOOL_CATEGORIES.includes(initialCategory as never) ? initialCategory : 'All';
  const [activeCategory, setActiveCategory] = useState<string>(validInitial);
  const [query, setQuery] = useState('');

  React.useEffect(() => {
    document.title = '100+ Free Online Tools | Browser Utilities | BRANIFY';
    return () => {
      document.title = 'Custom Web Development & Digital Agency | BRANIFY';
    };
  }, []);

  React.useEffect(() => {
    if (initialCategory && TOOL_CATEGORIES.includes(initialCategory as never)) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTools.filter((t) => {
      const inCategory = activeCategory === 'All' || t.category === activeCategory;
      if (!inCategory) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.keywords || []).some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [activeCategory, query]);

  const openTool = (slug: string) => onNavigate(`/tools/${slug}`);

  const categoryCount = (cat: string) =>
    cat === 'All' ? allTools.length : allTools.filter((t) => t.category === cat).length;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-[#F27D26]/[0.07] blur-[120px] rounded-full" />
          <div className="absolute top-20 -left-40 w-[420px] h-[320px] bg-violet-500/[0.05] blur-[110px] rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#F27D26]">
            <Sparkles className="w-3.5 h-3.5" />
            100% Free Online Web Utilities
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-[1.05]">
            100+ Free Online
            <span className="block bg-gradient-to-r from-[#F27D26] via-amber-400 to-[#F27D26] bg-clip-text text-transparent">
              Developer &amp; Marketing Tools
            </span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Fast, privacy-first web utilities running directly inside your browser. No registration or credit card required.
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto pt-2">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search PDF merge, background remover, password generator, UTM builder, invoice generator..."
              aria-label="Search tools"
              className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#F27D26]/60 transition-colors"
            />
            {query && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500 uppercase">
                {filtered.length} match{filtered.length === 1 ? '' : 'es'}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Category filter pills */}
      <section className="sticky top-[64px] z-30 bg-[#050505]/90 backdrop-blur-xl border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Tool categories">
            {TOOL_CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full font-extrabold uppercase text-[11px] tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-gradient-to-r from-[#F27D26] to-orange-600 text-black shadow-lg shadow-[#F27D26]/25'
                      : 'bg-white/[0.04] text-zinc-400 border border-white/10 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {cat}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${active ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'}`}>
                    {categoryCount(cat)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {filtered.length === 0 ? (
          <div className="text-center space-y-4 py-20">
            <SearchIcon className="w-12 h-12 text-zinc-700 mx-auto" />
            <p className="text-zinc-400 text-sm">
              No tools match <span className="text-white font-bold">"{query}"</span> in {activeCategory}.
            </p>
            <button
              onClick={() => { setQuery(''); setActiveCategory('All'); }}
              className="text-[#F27D26] text-xs font-extrabold uppercase tracking-widest hover:underline"
            >
              Clear filters &amp; browse all 136 tools
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((t) => (
                <TiltCard key={t.slug} onClick={() => openTool(t.slug)}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold text-[#F27D26] uppercase tracking-widest px-2.5 py-1 bg-white/10 rounded-md border border-white/10">
                        {t.category}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase whitespace-nowrap">
                        Instant Free
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center mt-0.5">
                        <IconFor name={t.iconName} className="w-4.5 h-4.5 w-[18px] h-[18px] text-[#F27D26]" />
                      </div>
                      <h3 className="text-base font-black text-white group-hover:text-[#F27D26] transition-colors uppercase tracking-tight leading-snug">
                        {t.name}
                      </h3>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">{t.description}</p>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-white group-hover:text-[#F27D26] transition-colors">
                    <span className="uppercase tracking-wider">Run Tool Online</span>
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-[#F27D26] group-hover:translate-x-1 transition-all" />
                  </div>
                </TiltCard>
              ))}
            </div>
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">
              Showing {filtered.length} of {allTools.length} free tools — more added every month
            </p>
          </>
        )}
      </section>

      {/* PWA CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0A0C14] to-[#080808] p-8 sm:p-12">
          <div className="absolute -top-24 right-0 w-80 h-80 bg-[#F27D26]/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#F27D26]">
                <SmartphoneIcon className="w-4 h-4" /> Progressive Web App
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Get Branify on your Mobile &amp; Desktop device</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Install the official BRANIFY app for instant offline access to 100+ free online tools, service quotes, and digital templates.
              </p>
            </div>
            <button
              onClick={() => (onOpenPWA ? onOpenPWA() : openTool('password-generator'))}
              className="shrink-0 px-8 py-4 bg-[#F27D26] hover:bg-orange-500 text-black font-extrabold text-xs uppercase tracking-widest rounded-full shadow-lg shadow-[#F27D26]/25 transition-colors"
            >
              Install App
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FreeToolsView;
