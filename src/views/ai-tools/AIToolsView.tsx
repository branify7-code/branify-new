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
    <div className="min-h-screen bg-[#0A0A0D] text-[#F1F2EE] py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      <Seo
        title="27+ AI Tools for Work & Productivity | BRANIFY"
        description="Discover useful AI tools for productivity, business, content, design and everyday workflows from BRANIFY."
        canonicalPath="/ai-tools"
      />

      {/* Hero */}
      <div className="max-w-7xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-extrabold uppercase tracking-widest text-zinc-300 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Curated AI Directory</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#F1F2EE] tracking-tight uppercase">
          AI <span className="text-[#D4AF37]">Tools</span>
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
          Discover and explore 27+ top-tier artificial intelligence tools for writing, coding, image generation, video creation, and
          automation.
        </p>
      </div>

      {/* Search + category filters */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search AI tools by name, feature, or keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-[#F1F2EE] placeholder-[#727B87] focus:outline-none focus:border-[#C9A45C]/60 transition-all shadow-xl"
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
                  : 'bg-[#070A0F]/80 hover:bg-zinc-900 text-zinc-300 border border-white/10 hover:border-white/20'
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
                      <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-[#E9CF79] transition-colors opacity-0 group-hover:opacity-100" />
                    </h3>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider shrink-0 ${pricingClass}`}>
                    {tool.pricing}
                  </span>
                </div>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">{tool.desc}</p>
              </div>
              <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between text-xs font-bold text-zinc-400 group-hover:text-[#F1F2EE] transition-colors">
                <span className="font-mono text-[11px] text-zinc-500 truncate max-w-[200px]">{tool.url.replace('https://', '')}</span>
                <span className="flex items-center gap-1 text-[#D4AF37] font-extrabold text-xs">
                  Visit Tool
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            </a>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center space-y-3 bg-[#070A0F]/40 border border-white/10 rounded-2xl">
            <Sparkles className="w-8 h-8 text-zinc-600 mx-auto animate-pulse" />
            <p className="text-zinc-400 font-semibold text-sm">No AI tools found matching your search query.</p>
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
