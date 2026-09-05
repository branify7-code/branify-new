import React, { useMemo, useState } from 'react';
import {
  AlignLeft, ArrowRight, ArrowRightLeft, ArrowUpDown, BookOpen, Bot, Calculator, Clock, Code,
  Combine, Cpu, CreditCard, Crop, Database, DollarSign, Download, EyeOff, FileCheck, FileCode,
  FileDigit, FileImage, FileText, Globe, Hash, HelpCircle, Home, Image as ImageIcon, Info, Key,
  Laptop, Layers, Layout, Lightbulb, Link as LinkIcon, List, ListFilter, ListOrdered, Lock,
  Mail, Map, Monitor, Moon, MousePointer, Network, Palette, Percent, PieChart, PiggyBank,
  QrCode, Receipt, RefreshCw, RotateCcw, RotateCw, Search, Shield, ShieldCheck, Shuffle,
  Sliders, Smartphone, Sparkles, Stamp, Star, Tag, Target, Terminal, TrendingUp, Type, User,
  Users,
} from 'lucide-react';
import { TiltCard } from '../components/TiltCard';
import { allTools } from '../tools';
import { TOOL_CATEGORIES } from '../data/toolsRegistry';

interface ToolsSectionProps {
  onNavigate: (path: string) => void;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  AlignLeft, ArrowRightLeft, ArrowUpDown, BookOpen, Bot, Calculator, Clock, Code, Combine, Cpu,
  CreditCard, Crop, Database, DollarSign, Download, EyeOff, FileCheck, FileCode, FileDigit,
  FileImage, FileText, Globe, Hash, HelpCircle, Home, Image: ImageIcon, Info, Key, Laptop,
  Layers, Layout, Lightbulb, Link: LinkIcon, List, ListFilter, ListOrdered, Lock, Mail, Map,
  Monitor, Moon, MousePointer, Network, Palette, Percent, PieChart, PiggyBank, QrCode, Receipt,
  RefreshCw, RotateCcw, RotateCw, Search, Shield, ShieldCheck, Shuffle, Sliders, Smartphone,
  Sparkles, Stamp, Star, Tag, Target, Terminal, TrendingUp, Type, User, Users,
};

const IconFor = ({ name, className }: { name: string; className?: string }) => {
  const Cmp = ICONS[name] || Sparkles;
  return <Cmp className={className} />;
};

/** Homepage preview cap — the full 136-tool catalog lives on the /tools page. */
const PREVIEW_LIMIT = 12;

export const ToolsSection: React.FC<ToolsSectionProps> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Popular tools first so the homepage preview leads with the strongest utilities.
  const orderedTools = useMemo(() => {
    const popular = allTools.filter((t) => t.popular);
    const rest = allTools.filter((t) => !t.popular);
    return [...popular, ...rest];
  }, []);

  const filtered = useMemo(
    () =>
      (activeCategory === 'All'
        ? orderedTools
        : allTools.filter((t) => t.category === activeCategory)
      ).slice(0, PREVIEW_LIMIT),
    [activeCategory, orderedTools]
  );

  const categoryCount = (cat: string) =>
    cat === 'All' ? allTools.length : allTools.filter((t) => t.category === cat).length;

  const openTool = (slug: string) => onNavigate(`/tools/${slug}`);

  const ctaHref =
    activeCategory === 'All'
      ? '/tools'
      : `/tools?category=${encodeURIComponent(activeCategory)}`;

  return (
    <section id="tools" className="relative py-28 sm:py-36 bg-[#05080D] text-[#F1F2EE] overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-mesh-radial pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-8 border-b border-white/[0.08] gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{'// Free Online Web Utilities'}</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
              Free Digital Tools
            </h2>
            <p className="text-base sm:text-lg text-[#F1F2EE]/60 font-light max-w-xl">
              {allTools.length}+ fast, privacy-first utilities running directly inside your browser. No registration or credit card required.
            </p>
          </div>

          <div className="font-mono text-xs text-[#D4AF37] px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 self-start md:self-auto">
            100% Client-Side Privacy
          </div>
        </div>

        {/* Category filter pills — same set as the /tools page */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Tool categories">
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
                    ? 'bg-gradient-to-b from-[#F6DF84] via-[#D4AF37] to-[#B3841F] text-[#1A1206] shadow-lg shadow-[#C9A45C]/25'
                    : 'bg-white/[0.04] text-[#A7AFBA] border border-white/10 hover:border-[#C9A45C]/45 hover:text-[#E9CF79]'
                }`}
              >
                {cat}
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${active ? 'bg-[#090A0C]/20 text-[#090A0C]' : 'bg-white/10 text-[#A7AFBA]'}`}>
                  {categoryCount(cat)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tools grid — same cards as the /tools page */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => (
            <TiltCard
              key={t.slug}
              onClick={() => openTool(t.slug)}
              className="group h-full"
              ariaLabel={`Open ${t.name}`}
            >
              <div id={`tool-card-${t.slug}`} className="h-full flex flex-col justify-between space-y-6 p-6 text-left">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold text-[#D4AF37] uppercase tracking-widest px-2.5 py-1 bg-white/10 rounded-md border border-white/10">
                      {t.category}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase whitespace-nowrap">
                      Instant Free
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center mt-0.5">
                      <IconFor name={t.iconName} className="w-[18px] h-[18px] text-[#A7AFBA] group-hover:text-[#E9CF79] transition-colors" />
                    </div>
                    <h3 className="text-base font-black text-[#F1F2EE] group-hover:text-[#E9CF79] transition-colors uppercase tracking-tight leading-snug">
                      {t.name}
                    </h3>
                  </div>
                  <p className="text-[#A7AFBA] text-xs leading-relaxed line-clamp-3">{t.description}</p>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#F1F2EE] group-hover:text-[#E9CF79] transition-colors">
                  <span className="uppercase tracking-wider">Run Tool Online</span>
                  <ArrowRight className="w-4 h-4 text-[#727B87] group-hover:text-[#E9CF79] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </TiltCard>
          ))}
        </div>

        {/* Footer note + full catalog CTA */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#727B87]">
            Showing {filtered.length} of {categoryCount(activeCategory)} {activeCategory === 'All' ? 'free tools' : `${activeCategory.toLowerCase()}`} — more added every month
          </p>
          <button
            onClick={() => onNavigate(ctaHref)}
            className="btn-metal shrink-0 px-8 py-4 font-extrabold text-xs uppercase tracking-widest rounded-full"
          >
            {activeCategory === 'All'
              ? `Browse All ${allTools.length} Free Tools`
              : `View All ${categoryCount(activeCategory)} ${activeCategory}${activeCategory.toLowerCase().endsWith('tools') ? '' : ' Tools'}`}
          </button>
        </div>

      </div>
    </section>
  );
};
