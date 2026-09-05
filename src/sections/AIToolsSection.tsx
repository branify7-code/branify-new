/* =========================================================
   AIToolsSection — homepage showcase updated to mirror the
   /ai-tools page: the real curated AI directory (26 tools,
   9 categories) with category filters and external
   "Visit Tool" cards.
========================================================= */

import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Cpu, ExternalLink, Sparkles } from 'lucide-react';
import { trackEvent } from '../lib/track';
import { aiToolsDirectory, aiToolCategories } from '../data/aiToolsDirectory';

interface AIToolsSectionProps {
  onNavigate: (path: string) => void;
}

/** Homepage preview cap — the full directory lives on the /ai-tools page. */
const PREVIEW_LIMIT = 9;

export const AIToolsSection: React.FC<AIToolsSectionProps> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const filtered = useMemo(
    () =>
      aiToolsDirectory
        .filter((tool) => activeCategory === 'All' || tool.category === activeCategory)
        .slice(0, PREVIEW_LIMIT),
    [activeCategory]
  );

  const categoryCount = (cat: string) =>
    cat === 'All'
      ? aiToolsDirectory.length
      : aiToolsDirectory.filter((t) => t.category === cat).length;

  return (
    <section id="ai-tools" className="relative py-28 sm:py-36 bg-[#0B0C10] text-[#F1F2EE] overflow-hidden border-t border-white/[0.06]">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[650px] h-[650px] bg-[#C9A45C]/[0.05] rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-8 border-b border-white/[0.08] gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
              <Cpu className="w-3.5 h-3.5" />
              <span>{'// Curated AI Directory'}</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
              AI Powered <span className="text-[#D4AF37]">Tools</span>
            </h2>
            <p className="text-base sm:text-lg text-[#F1F2EE]/60 font-light max-w-xl">
              Discover and explore {aiToolsDirectory.length}+ top-tier artificial intelligence tools for writing, coding, image generation, video creation, and automation.
            </p>
          </div>

          <div className="text-xs font-mono text-[#F1F2EE]/40">
            {aiToolCategories.length - 1} HAND-PICKED CATEGORIES<br />
            UPDATED EVERY MONTH
          </div>
        </div>

        {/* Category filter pills — same set as the /ai-tools page */}
        <div className="flex flex-wrap items-center gap-2 pb-8" role="tablist" aria-label="AI tool categories">
          {aiToolCategories.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-b from-[#F6DF84] via-[#D4AF37] to-[#B3841F] text-[#1A1206] shadow-lg shadow-[#C9A45C]/25'
                    : 'bg-[#070A0F]/80 hover:bg-[#0C1118] text-[#A7AFBA] border border-white/10 hover:border-[#C9A45C]/45 hover:text-[#E9CF79]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* AI tool cards — same cards as the /ai-tools page */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tool) => {
            const pricing = tool.pricing.toLowerCase();
            const pricingClass =
              pricing === 'free'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : pricing === 'freemium'
                  ? 'bg-[#C9A45C]/20 text-[#D4AF37] border border-[#C9A45C]/30'
                  : 'bg-[#E7C978]/15 text-[#E7C978] border border-[#E7C978]/30';
            return (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('ai_tool_click', { name: tool.name, url: tool.url })}
                className="group bg-[#080C12] hover:bg-[#0C1118] border border-white/10 hover:border-[#C9A45C]/35 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C9A45C]/0 group-hover:via-[#C9A45C] to-transparent transition-all duration-500" />
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">{tool.category}</span>
                      <h3 className="text-xl font-bold text-[#F1F2EE] group-hover:text-[#E9CF79] transition-colors flex items-center gap-2">
                        {tool.name}
                        <ExternalLink className="w-4 h-4 text-[#727B87] group-hover:text-[#E9CF79] transition-colors opacity-0 group-hover:opacity-100" />
                      </h3>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider shrink-0 ${pricingClass}`}>
                      {tool.pricing}
                    </span>
                  </div>
                  <p className="text-[#A7AFBA] text-xs sm:text-sm leading-relaxed">{tool.desc}</p>
                </div>
                <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between text-xs font-bold text-[#A7AFBA] group-hover:text-[#F1F2EE] transition-colors">
                  <span className="font-mono text-[11px] text-[#727B87] truncate max-w-[200px]">{tool.url.replace('https://', '').replace('www.', '')}</span>
                  <span className="flex items-center gap-1 text-[#D4AF37] font-extrabold text-xs">
                    Visit Tool
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        {/* Footer note + full directory CTA */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#727B87]">
            Showing {filtered.length} of {categoryCount(activeCategory)} {activeCategory === 'All' ? 'curated AI tools' : `${activeCategory.toLowerCase()} tools`}
          </p>
          <button
            onClick={() => onNavigate('/ai-tools')}
            className="btn-metal shrink-0 px-8 py-4 font-extrabold text-xs uppercase tracking-widest rounded-full flex items-center gap-2"
          >
            <span>Explore All {aiToolsDirectory.length} AI Tools</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
