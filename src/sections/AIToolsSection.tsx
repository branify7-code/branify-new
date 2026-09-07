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
    <section id="ai-tools" className="relative py-28 sm:py-36 bg-gradient-to-b from-[#EEF2FF] to-white text-[#111827] overflow-hidden">
      {/* Soft indigo/purple atmosphere — NOT cyberpunk, just a light tinted sky */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[650px] h-[650px] bg-[#C7D2FE]/60 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[480px] h-[420px] bg-[#E9D5FF]/50 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-8 border-b border-[#E2E8F0] gap-6">
          <div className="space-y-4">
            <div className="eyebrow-label">
              <Cpu className="w-3.5 h-3.5" />
              <span>{'// Curated AI Directory'}</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.03em] text-[#111827]">
              AI Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B5FEF] to-[#8B5CF6]">Tools</span>
            </h2>
            <p className="text-base sm:text-lg text-[#64748B] max-w-xl leading-relaxed">
              Discover and explore {aiToolsDirectory.length}+ top-tier artificial intelligence tools for writing, coding, image generation, video creation, and automation.
            </p>
          </div>

          <div className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8] leading-relaxed">
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
                    ? 'bg-[#5B5FEF] text-white shadow-lg shadow-[#5B5FEF]/25'
                    : 'bg-white text-[#475569] border border-[#E2E8F0] hover:border-[#5B5FEF]/45 hover:text-[#5B5FEF]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* AI tool cards — white cards with gradient icon chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tool) => {
            const pricing = tool.pricing.toLowerCase();
            const pricingClass =
              pricing === 'free'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : pricing === 'freemium'
                  ? 'bg-[#C9A45C]/10 text-[#8F6B2D] border border-[#C9A45C]/30'
                  : 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]';
            return (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('ai_tool_click', { name: tool.name, url: tool.url })}
                className="group bg-white border border-[#E2E8F0] hover:border-[#5B5FEF]/40 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_14px_34px_-14px_rgba(15,23,42,0.14)] hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#5B5FEF]/0 group-hover:via-[#5B5FEF] to-transparent transition-all duration-500" />
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B5FEF] to-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-[0_8px_18px_-8px_rgba(91,95,239,0.55)]">
                        <Sparkles className="w-[18px] h-[18px]" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5B5FEF]">{tool.category}</span>
                        <h3 className="text-lg font-bold text-[#111827] group-hover:text-[#4F46E5] transition-colors flex items-center gap-2">
                          {tool.name}
                          <ExternalLink className="w-4 h-4 text-[#94A3B8] group-hover:text-[#5B5FEF] transition-colors opacity-0 group-hover:opacity-100" />
                        </h3>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider shrink-0 ${pricingClass}`}>
                      {tool.pricing}
                    </span>
                  </div>
                  <p className="text-[#64748B] text-xs sm:text-sm leading-relaxed">{tool.desc}</p>
                </div>
                <div className="pt-6 mt-6 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#334155] group-hover:text-[#111827] transition-colors">
                  <span className="font-mono text-[11px] text-[#94A3B8] truncate max-w-[200px]">{tool.url.replace('https://', '').replace('www.', '')}</span>
                  <span className="flex items-center gap-1 text-[#5B5FEF] font-extrabold text-xs">
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
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#94A3B8]">
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
