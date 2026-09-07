/* =========================================================
   AIToolsView — 1:1 replica of branify.store/ai-tools
   (AIToolsPage chunk): curated directory of 26 AI tools
   with live search, 9 category filters and external
   "Visit Tool" cards.
========================================================= */

import React, { useState, useMemo } from 'react';
import { Sparkles, Search, ExternalLink, ArrowUpRight } from 'lucide-react';
import Seo from '../../components/Seo';
import { trackEvent } from '../../lib/track';
import { aiToolsDirectory, aiToolCategories } from '../../data/aiToolsDirectory';

interface AIToolsViewProps {
  onNavigate?: (path: string) => void;
}

export const AIToolsView: React.FC<AIToolsViewProps> = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      aiToolsDirectory.filter((tool) => {
        const inCategory = activeCategory === 'All' || tool.category === activeCategory;
        const q = query.trim();
        const matchesQuery =
          q === '' ||
          tool.name.toLowerCase().includes(q.toLowerCase()) ||
          tool.desc.toLowerCase().includes(q.toLowerCase()) ||
          tool.category.toLowerCase().includes(q.toLowerCase());
        return inCategory && matchesQuery;
      }),
    [activeCategory, query]
  );

  const resetFilters = () => {
    setQuery('');
    setActiveCategory('All');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF2FF] to-white text-[#334155] py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      <Seo
        title="27+ AI Tools for Work & Productivity | BRANIFY"
        description="Discover useful AI tools for productivity, business, content, design and everyday workflows from BRANIFY."
        canonicalPath="/ai-tools"
      />

      {/* Hero */}
      <div className="max-w-7xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur border border-[#C7D2FE] text-xs font-extrabold uppercase tracking-widest text-[#4338CA] shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
          <Sparkles className="w-3.5 h-3.5 text-[#5B5FEF]" />
          <span>Curated AI Directory</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#111827] tracking-[-0.02em]">
          AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B5FEF] to-[#8B5CF6]">Tools</span>
        </h1>
        <p className="text-[#475569] text-sm sm:text-base max-w-2xl mx-auto">
          Discover and explore 27+ top-tier artificial intelligence tools for writing, coding, image generation, video creation, and
          automation.
        </p>
      </div>

      {/* Search + category filters */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search AI tools by name, feature, or keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-[#111827] placeholder-[#94A3B8] shadow-[0_2px_10px_rgba(15,23,42,0.04)] focus:outline-none focus:border-[#5B5FEF]/50 focus:shadow-[0_0_0_3px_rgba(91,95,239,0.12)] transition-all"
            aria-label="Search AI tools"
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {aiToolCategories.map((cat) => (
            <button
              key={cat}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-gradient-to-b from-[#F6DF84] via-[#D4AF37] to-[#B3841F] text-[#1A1206] shadow-lg shadow-[#C9A45C]/25'
                  : 'bg-white text-[#475569] border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-[#5B5FEF]/45 hover:text-[#5B5FEF]'
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tool cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((tool) => {
          const pricing = tool.pricing.toLowerCase();
          const pricingClass =
            pricing === 'free'
              ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25'
              : pricing === 'freemium'
                ? 'bg-[#C9A45C]/10 text-[#8F6B2D] border border-[#C9A45C]/30'
                : 'bg-[#8B5CF6]/10 text-[#6D28D9] border border-[#8B5CF6]/25';
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
                  <div className="flex items-start gap-3.5">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B5FEF] to-[#8B5CF6] flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(91,95,239,0.5)]">
                      <Sparkles className="w-[18px] h-[18px] text-white" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#5B5FEF]">{tool.category}</span>
                      <h3 className="font-display text-xl font-bold text-[#111827] group-hover:text-[#4338CA] transition-colors flex items-center gap-2">
                        {tool.name}
                        <ExternalLink className="w-4 h-4 text-[#94A3B8] group-hover:text-[#4338CA] transition-colors opacity-0 group-hover:opacity-100" />
                      </h3>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider shrink-0 ${pricingClass}`}>
                    {tool.pricing}
                  </span>
                </div>
                <p className="text-[#64748B] text-xs sm:text-sm leading-relaxed">{tool.desc}</p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#64748B] group-hover:text-[#111827] transition-colors">
                <span className="font-mono text-[11px] text-[#64748B] truncate max-w-[200px]">{tool.url.replace('https://', '')}</span>
                <span className="flex items-center gap-1 text-[#4338CA] font-extrabold text-xs">
                  Visit Tool
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            </a>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center space-y-3 bg-white border border-[#E2E8F0] rounded-2xl">
            <Sparkles className="w-8 h-8 text-[#94A3B8] mx-auto animate-pulse" />
            <p className="text-[#64748B] font-semibold text-sm">No AI tools found matching your search query.</p>
            <button
              onClick={resetFilters}
              className="btn-metal px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIToolsView;
