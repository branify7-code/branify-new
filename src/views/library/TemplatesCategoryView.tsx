/* =========================================================
   TemplatesCategoryView — /templates/:category
   SEO hero per category, live count, template grid, search,
   related categories, CTA. Graceful empty state for categories
   whose templates are landing soon.
========================================================= */

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, LayoutTemplate, Search, Sparkles } from 'lucide-react';
import Seo from '../../components/Seo';
import TemplateCard from '../../components/TemplateCard';
import { trackEvent, trackNotFound } from '../../lib/track';
import {
  TEMPLATE_CATEGORIES, categoryHref, getCategoryBySlug,
  getTemplatesByCategory, searchTemplates,
} from '../../data/templates';

interface TemplatesCategoryViewProps {
  categorySlug: string;
  onNavigate: (path: string) => void;
}

const TemplatesCategoryView: React.FC<TemplatesCategoryViewProps> = ({ categorySlug, onNavigate }) => {
  const category = getCategoryBySlug(categorySlug);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (category) {
      trackEvent('template_category_view', { category: category.slug, source: 'page' });
      document.title = `${category.name} Website Templates`;
    }
    return () => { document.title = 'Custom Web Development & Digital Agency | BRANIFY'; };
  }, [category]);

  const templates = useMemo(() => (category ? searchTemplates(getTemplatesByCategory(category.slug), query) : []), [category, query]);

  if (!category) {
    // Unknown category → existing 404 system
    return <CategoryNotFound categorySlug={categorySlug} onNavigate={onNavigate} />;
  }

  const related = TEMPLATE_CATEGORIES.filter((c) => c.slug !== category.slug && (getTemplatesByCategory(c.slug).length > 0)).slice(0, 6);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Seo
        title={`${category.name} Website Templates`}
        description={`Browse responsive ${category.name.toLowerCase()} website templates from BRANIFY. ${category.heroDescription}`}
        keywords={[`${category.name.toLowerCase()} website template`, 'website templates', ...templates.slice(0, 6).map((t) => `${t.slug.replace(/-/g, ' ')} template`)]}
        canonicalPath={`/templates/${category.slug}`}
        breadcrumbs={[
          { name: 'Home', url: 'https://branify.store/' },
          { name: 'Templates', url: 'https://branify.store/templates' },
          { name: category.name, url: `https://branify.store/templates/${category.slug}` },
        ]}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <ol className="flex items-center flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
          <li><button onClick={() => onNavigate('/')} className="hover:text-[#8F6B2D] transition-colors cursor-pointer">Home</button></li>
          <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
          <li><button onClick={() => onNavigate('/templates')} className="hover:text-[#8F6B2D] transition-colors cursor-pointer">Templates</button></li>
          <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
          <li aria-current="page" className="text-[#8F6B2D]">{category.name}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-[#C9A45C]/[0.07] blur-[120px] rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 space-y-5 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.04)] text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#8F6B2D]">
            <LayoutTemplate className="w-3.5 h-3.5" />
            {templates.length} {templates.length === 1 ? 'Template' : 'Templates'}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] tracking-[-0.02em] leading-[1.08]">
            {category.name}
            <span className="block bg-gradient-to-r from-[#C9A45C] via-[#E9CF79] to-[#D4AF37] bg-clip-text text-transparent">
              Website Templates
            </span>
          </h1>
          <p className="text-[#475569] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">{category.heroDescription}</p>

          <div className="relative max-w-xl mx-auto pt-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${category.name.toLowerCase()} templates...`}
              aria-label={`Search ${category.name} templates`}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#1E293B] placeholder-[#94A3B8] shadow-[0_2px_10px_rgba(15,23,42,0.04)] focus:outline-none focus:border-[#5B5FEF]/50 focus:shadow-[0_0_0_3px_rgba(91,95,239,0.12)] transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Grid / empty state */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-10">
        {templates.length === 0 ? (
          <div className="text-center space-y-4 py-16 rounded-3xl border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <Sparkles className="w-10 h-10 text-[#8F6B2D]/60 mx-auto" />
            <p className="font-display text-[#111827] font-extrabold tracking-tight text-lg">
              {query ? 'No templates match your search' : 'New templates are landing here soon'}
            </p>
            <p className="text-[#475569] text-sm max-w-md mx-auto">
              {query
                ? 'Try a different keyword or browse the full library.'
                : `Our design team is crafting ${category.name.toLowerCase()} templates right now — in the meantime, explore the rest of the library or start a custom project.`}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {query ? (
                <button onClick={() => setQuery('')} className="btn-metal px-6 py-3 rounded-full text-xs font-extrabold uppercase tracking-widest">
                  Clear Search
                </button>
              ) : (
                <button onClick={() => onNavigate('/templates')} className="btn-metal px-6 py-3 rounded-full text-xs font-extrabold uppercase tracking-widest">
                  Browse All Templates
                </button>
              )}
              <button
                onClick={() => onNavigate(`/contact?category=${category.slug}`)}
                className="px-6 py-3 rounded-full text-xs font-extrabold uppercase tracking-widest border border-[#C9A45C]/40 text-[#111827] hover:border-[#C9A45C] hover:text-[#8F6B2D] transition-all"
              >
                Request Custom Design
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((t) => (
              <TemplateCard key={t.slug} template={t} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </section>

      {/* Related categories */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
          <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#111827]">Related Categories</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {related.map((c) => (
              <button
                key={c.slug}
                onClick={() => onNavigate(categoryHref(c.slug))}
                className="group text-left p-4 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#C9A45C]/40 hover:shadow-[0_10px_26px_-12px_rgba(15,23,42,0.12)] transition-all cursor-pointer"
              >
                <span className="font-display text-xs font-bold text-[#111827] tracking-tight group-hover:text-[#8F6B2D] transition-colors">{c.name}</span>
                <p className="text-[#64748B] text-[11px] mt-1 line-clamp-1">{c.tagline}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Back to library */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <button
          onClick={() => onNavigate('/templates')}
          className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8F6B2D] hover:text-[#8F6B2D] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Templates
        </button>
      </div>
    </div>
  );
};

/** 404 fallback for unknown category slugs (reuses the site 404 system). */
const CategoryNotFound: React.FC<{ categorySlug: string; onNavigate: (path: string) => void }> = ({ categorySlug, onNavigate }) => {
  useEffect(() => {
    document.title = 'Category Not Found | BRANIFY';
    trackNotFound(`/templates/${categorySlug}`);
  }, [categorySlug]);
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-4 bg-white">
      <span className="font-display text-6xl font-black text-[#5B5FEF]/40">404</span>
      <h1 className="font-display text-xl font-extrabold text-[#111827] tracking-tight">Template category not found</h1>
      <p className="text-[#475569] text-sm">The category “{categorySlug}” doesn’t exist in the BRANIFY template library.</p>
      <button onClick={() => onNavigate('/templates')} className="btn-metal px-6 py-3 rounded-full text-xs font-extrabold uppercase tracking-widest mt-2">
        Browse All Templates
      </button>
    </div>
  );
};

export default TemplatesCategoryView;
