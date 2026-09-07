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
    <section id="templates" className="relative py-28 sm:py-36 bg-gradient-to-b from-[#F7F5FF] to-white text-[#111827] overflow-hidden">
      {/* Ambient lavender + faint gold glow — the flagship premium showcase */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[650px] h-[650px] bg-[#E9E5FF] rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[480px] h-[480px] bg-[#C9A45C]/[0.06] rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 pb-8 border-b border-[#E2E8F0] gap-6">
          <div className="space-y-4">
            <div className="eyebrow-label">
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>{'// BRANIFY Template Library'}</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.03em] text-[#111827]">
              Website Templates
            </h2>
            <p className="text-base sm:text-lg text-[#64748B] max-w-xl leading-relaxed">
              Launch faster with professionally designed website templates — {templateCount()} premium designs across {TEMPLATE_CATEGORIES.length} industries.
            </p>
          </div>

          <div className="font-mono text-[11px] uppercase tracking-widest text-[#94A3B8] leading-relaxed">
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
              className="px-4 py-2 rounded-full text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap bg-white text-[#475569] border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-[#C9A45C]/45 hover:text-[#8F6B2D] transition-all cursor-pointer"
            >
              {c.name}
              <span className="ml-1.5 text-[9px] text-[#94A3B8]">{counts[c.slug]}</span>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#94A3B8]">
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
              className="px-8 py-4 rounded-full text-xs font-extrabold uppercase tracking-widest bg-white border border-[#C9A45C]/40 text-[#334155] hover:border-[#C9A45C] hover:text-[#8F6B2D] transition-all shadow-[0_2px_10px_rgba(15,23,42,0.04)] inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Request Custom Design
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
