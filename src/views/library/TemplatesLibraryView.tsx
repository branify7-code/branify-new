/* =========================================================
   TemplatesLibraryView — /templates
   The BRANIFY Template Library: hero + live search + category
   filtering + premium template grid + category directory.
   Data: src/data/templates (single source of truth).
========================================================= */

import React, { useEffect, useMemo, useState } from 'react';
import { LayoutTemplate, Search, Sparkles, X } from 'lucide-react';
import Seo from '../../components/Seo';
import TemplateCard from '../../components/TemplateCard';
import { trackEvent } from '../../lib/track';
import {
  TEMPLATE_CATEGORIES, allTemplates, categoryCounts, getCategoryBySlug,
  searchTemplates, templateCount,
} from '../../data/templates';

interface TemplatesLibraryViewProps {
  onNavigate: (path: string) => void;
  initialCategory?: string | null;
  initialQuery?: string;
}

/** Progressive grid rendering — keeps the DOM light. */
const PAGE_SIZE = 24;

const TemplatesLibraryView: React.FC<TemplatesLibraryViewProps> = ({ onNavigate, initialCategory, initialQuery }) => {
  const validInitial = initialCategory && getCategoryBySlug(initialCategory) ? initialCategory : 'All';
  const [category, setCategory] = useState<string>(validInitial);
  const [query, setQuery] = useState(initialQuery || '');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    document.title = 'Website Templates for Modern Businesses | BRANIFY';
    return () => { document.title = 'Custom Web Development & Digital Agency | BRANIFY'; };
  }, []);

  useEffect(() => {
    if (initialCategory && getCategoryBySlug(initialCategory)) setCategory(initialCategory);
  }, [initialCategory]);

  // template_search — debounced, only real queries
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return;
    const t = setTimeout(() => trackEvent('template_search', { query: q }), 800);
    return () => clearTimeout(t);
  }, [query]);

  const counts = useMemo(() => categoryCounts(), []);

  const filtered = useMemo(() => {
    let list = category === 'All' ? allTemplates() : allTemplates().filter((t) => t.categorySlug === category);
    if (featuredOnly) list = list.filter((t) => t.featured);
    return searchTemplates(list, query);
  }, [category, featuredOnly, query]);

  useEffect(() => { setVisible(PAGE_SIZE); }, [category, featuredOnly, query]);

  const shown = filtered.slice(0, visible);
  const resetFilters = () => { setQuery(''); setCategory('All'); setFeaturedOnly(false); };
  const filtersActive = query.trim() !== '' || category !== 'All' || featuredOnly;

  return (
    <div className="min-h-screen bg-[#05080D]">
      <Seo
        title="Website Templates for Modern Businesses"
        description="Explore professionally designed, responsive website templates for restaurants, real estate, healthcare, technology, fashion, services and more — launch faster with BRANIFY."
        keywords={['website templates', 'business website templates', 'responsive templates', 'restaurant website template', 'real estate website template', 'BRANIFY templates']}
        canonicalPath="/templates"
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-[#C9A45C]/[0.07] blur-[120px] rounded-full" />
          <div className="absolute top-20 -left-40 w-[420px] h-[320px] bg-[#C9A45C]/[0.05] blur-[110px] rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37]">
            <LayoutTemplate className="w-3.5 h-3.5" />
            BRANIFY Template Library
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#F1F2EE] uppercase tracking-tight leading-[1.05]">
            Website Templates Built for
            <span className="block bg-gradient-to-r from-[#C9A45C] via-[#E9CF79] to-[#D4AF37] bg-clip-text text-transparent">
              Modern Businesses
            </span>
          </h1>
          <p className="text-[#A7AFBA] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Explore professionally designed, responsive website templates for restaurants, real estate, healthcare, technology, fashion, services and more.
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#727B87] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates by name, industry or style..."
              aria-label="Search templates"
              className="w-full pl-12 pr-24 py-3.5 bg-[#070A0F] border border-white/10 rounded-xl text-xs sm:text-sm text-[#E3E5E0] placeholder-[#727B87] focus:outline-none focus:border-[#C9A45C]/60 focus:shadow-[0_0_0_3px_rgba(201,164,92,0.08)] transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727B87] hover:text-[#F1F2EE] transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#727B87]">
            {templateCount()} templates · {TEMPLATE_CATEGORIES.length} industries · new designs monthly
          </p>
        </div>
      </section>

      {/* Category filter pills */}
      <section className="sticky top-[64px] z-30 bg-[#05080D]/90 backdrop-blur-xl border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Template categories">
            <button
              role="tab"
              aria-selected={category === 'All'}
              onClick={() => setCategory('All')}
              className={`px-4 py-2 rounded-full font-extrabold uppercase text-[11px] tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${category === 'All'
                ? 'bg-gradient-to-b from-[#F6DF84] via-[#D4AF37] to-[#B3841F] text-[#1A1206] shadow-lg shadow-[#C9A45C]/25'
                : 'bg-white/[0.04] text-[#A7AFBA] border border-white/10 hover:border-[#C9A45C]/45 hover:text-[#E9CF79]'}`}
            >
              All Templates
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${category === 'All' ? 'bg-[#090A0C]/20 text-[#090A0C]' : 'bg-white/10 text-[#A7AFBA]'}`}>
                {templateCount()}
              </span>
            </button>
            {TEMPLATE_CATEGORIES.map((c) => {
              const active = category === c.slug;
              return (
                <button
                  key={c.slug}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(active ? 'All' : c.slug)}
                  className={`px-4 py-2 rounded-full font-extrabold uppercase text-[11px] tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${active
                    ? 'bg-gradient-to-b from-[#F6DF84] via-[#D4AF37] to-[#B3841F] text-[#1A1206] shadow-lg shadow-[#C9A45C]/25'
                    : 'bg-white/[0.04] text-[#A7AFBA] border border-white/10 hover:border-[#C9A45C]/45 hover:text-[#E9CF79]'}`}
                >
                  {c.name}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${active ? 'bg-[#090A0C]/20 text-[#090A0C]' : 'bg-white/10 text-[#A7AFBA]'}`}>
                    {counts[c.slug] || 0}
                  </span>
                </button>
              );
            })}
            <button
              role="tab"
              aria-selected={featuredOnly}
              onClick={() => setFeaturedOnly((v) => !v)}
              className={`px-4 py-2 rounded-full font-extrabold uppercase text-[11px] tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${featuredOnly
                ? 'bg-gradient-to-b from-[#F6DF84] via-[#D4AF37] to-[#B3841F] text-[#1A1206] shadow-lg shadow-[#C9A45C]/25'
                : 'bg-white/[0.04] text-[#A7AFBA] border border-white/10 hover:border-[#C9A45C]/45 hover:text-[#E9CF79]'}`}
            >
              <Sparkles className="w-3 h-3" />
              Featured
            </button>
          </div>
        </div>
      </section>

      {/* Template grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {shown.length === 0 ? (
          <div className="text-center space-y-4 py-20">
            <Search className="w-12 h-12 text-[#727B87] mx-auto" />
            <p className="text-[#A7AFBA] text-sm">
              No templates found{query ? <span> for <span className="text-[#F1F2EE] font-bold">“{query}”</span></span> : null}
              {category !== 'All' ? <span> in <span className="text-[#F1F2EE] font-bold">{getCategoryBySlug(category)?.name}</span></span> : null}.
            </p>
            <p className="text-[#727B87] text-xs">Try another keyword or browse all categories.</p>
            {filtersActive && (
              <button onClick={resetFilters} className="btn-metal px-6 py-3 rounded-full text-xs font-extrabold uppercase tracking-widest">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shown.map((t) => (
                <TemplateCard key={t.slug} template={t} onNavigate={onNavigate} />
              ))}
            </div>
            {visible < filtered.length && (
              <div className="text-center">
                <button
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="btn-metal px-8 py-4 rounded-full text-xs font-extrabold uppercase tracking-widest"
                >
                  Load More Templates ({filtered.length - visible} remaining)
                </button>
              </div>
            )}
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#727B87]">
              Showing {shown.length} of {filtered.length} templates
            </p>
          </>
        )}
      </section>

      {/* Browse by category directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>{'// Browse by industry'}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#FFF5DC]">Template Categories</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEMPLATE_CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => { trackEvent('template_category_view', { category: c.slug, source: 'directory' }); onNavigate(`/templates/${c.slug}`); }}
              className="group text-left p-5 rounded-2xl bg-[#080C12] border border-white/[0.08] hover:border-[#C9A45C]/35 hover:bg-[#0C1118] transition-all duration-300 cursor-pointer focus:outline-none focus-visible:border-[#C9A45C]/60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black text-[#F1F2EE] uppercase tracking-tight group-hover:text-[#E9CF79] transition-colors">{c.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#A7AFBA] shrink-0">
                  {counts[c.slug] || 0}
                </span>
              </div>
              <p className="text-[#727B87] text-xs leading-relaxed mt-2 line-clamp-2">{c.tagline}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Custom template CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0A0C14] to-[#080808] p-8 sm:p-12">
          <div className="absolute -top-24 right-0 w-80 h-80 bg-[#C9A45C]/[0.08] blur-[100px] rounded-full pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37]">
                <Sparkles className="w-4 h-4" /> Need something unique?
              </div>
              <h2 className="text-2xl font-black text-[#F1F2EE] uppercase tracking-tight">We build custom versions of every template</h2>
              <p className="text-[#A7AFBA] text-sm leading-relaxed">
                Pick a template as your starting point — our team tailors branding, content and features into a conversion-ready website for your business.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/contact?source=template-library')}
              className="btn-metal shrink-0 px-8 py-4 font-extrabold text-xs uppercase tracking-widest rounded-full"
            >
              Start a Project
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TemplatesLibraryView;
