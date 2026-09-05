/* =========================================================
   TemplatesSection — homepage showcase for the Template Library
   Featured templates from the central registry (never duplicated
   by hand) + category strip + CTA to /templates. Positioned on
   the homepage right after the Services section.
========================================================= */

import React, { useMemo } from 'react';
import { ArrowRight, LayoutTemplate, Sparkles } from 'lucide-react';
import TemplateCard from '../components/TemplateCard';
import {
  TEMPLATE_CATEGORIES, categoryCounts, categoryHref,
  featuredTemplates, templateCount,
} from '../data/templates';

interface TemplatesSectionProps {
  onNavigate: (path: string) => void;
}

export const TemplatesSection: React.FC<TemplatesSectionProps> = ({ onNavigate }) => {
  const featured = useMemo(() => featuredTemplates(8), []);
  const counts = useMemo(() => categoryCounts(), []);

  return (
    <section id="templates" className="relative py-28 sm:py-36 bg-[#0B0C10] text-[#F1F2EE] overflow-hidden border-t border-white/[0.06]">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[650px] h-[650px] bg-[#C9A45C]/[0.05] rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-8 border-b border-white/[0.08] gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>{'// BRANIFY Template Library'}</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
              Website Templates
            </h2>
            <p className="text-base sm:text-lg text-[#F1F2EE]/60 font-light max-w-xl">
              Launch faster with professionally designed website templates — {templateCount()} premium designs across {TEMPLATE_CATEGORIES.length} industries.
            </p>
          </div>

          <div className="font-mono text-xs text-[#F1F2EE]/40">
            RESPONSIVE · SEO-READY<br />
            CUSTOM-BUILT ON REQUEST
          </div>
        </div>

        {/* Featured grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((t) => (
            <TemplateCard key={t.slug} template={t} onNavigate={onNavigate} compact />
          ))}
        </div>

        {/* Category quick links */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {TEMPLATE_CATEGORIES.filter((c) => (counts[c.slug] || 0) > 0).map((c) => (
            <button
              key={c.slug}
              onClick={() => onNavigate(categoryHref(c.slug))}
              className="px-4 py-2 rounded-full text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap bg-white/[0.04] text-[#A7AFBA] border border-white/10 hover:border-[#C9A45C]/45 hover:text-[#E9CF79] transition-all cursor-pointer"
            >
              {c.name}
              <span className="ml-1.5 text-[9px] text-[#727B87]">{counts[c.slug]}</span>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#727B87]">
            Every template is customized to your brand and launched as your own website
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => onNavigate('/templates')}
              className="btn-metal shrink-0 px-8 py-4 font-extrabold text-xs uppercase tracking-widest rounded-full flex items-center gap-2"
            >
              <span>Explore All {templateCount()} Templates</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('/contact?source=templates-home')}
              className="px-8 py-4 rounded-full text-xs font-extrabold uppercase tracking-widest border border-[#C9A45C]/40 text-[#F1F2EE] hover:border-[#C9A45C] hover:text-[#E9CF79] transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Request Custom Design
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
