/* =========================================================
   TemplateCard — premium template library card (BRANIFY system)
   Light white surface, soft slate border + gold hover lift,
   image zoom on hover, responsive badge, View / Start actions.
   Used by the library, category pages and the homepage showcase.
========================================================= */

import React from 'react';
import { ArrowUpRight, LayoutTemplate } from 'lucide-react';
import { TiltCard } from './TiltCard';
import { trackEvent } from '../lib/track';
import type { TemplateRecord } from '../data/templates';
import { templateHref } from '../data/templates';

interface TemplateCardProps {
  template: TemplateRecord;
  /** navigate handler from the SPA router */
  onNavigate: (path: string) => void;
  /** hide the action row (compact contexts) */
  compact?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onNavigate, compact }) => {
  const open = () => {
    trackEvent('template_card_open', { template: template.slug, category: template.categorySlug });
    onNavigate(templateHref(template));
  };

  return (
    <TiltCard
      className="group h-full bg-white! border-[#E2E8F0]! shadow-[0_1px_2px_rgba(15,23,42,0.04)]! hover:shadow-[0_14px_34px_-14px_rgba(15,23,42,0.14)]! hover:border-[#C9A45C]/40! hover:bg-white! hover:-translate-y-1"
      ariaLabel={`View ${template.name} template`}
      onClick={compact ? open : undefined}
    >
      <div id={`template-card-${template.slug}`} className="h-full flex flex-col">
        {/* Preview image */}
        <button
          type="button"
          onClick={open}
          className="relative block w-full overflow-hidden rounded-t-2xl aspect-[4/3] bg-[#F8FAFC] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A45C]/60"
          aria-label={`View ${template.name} template`}
        >
          <img
            src={template.thumbnail}
            alt={`${template.name} website template preview`}
            loading="lazy"
            decoding="async"
            width={800}
            height={600}
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/25 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
          {template.featured && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest bg-white/85 backdrop-blur border border-[#C9A45C]/40 text-[#8F6B2D] shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
              Featured
            </span>
          )}
          {template.responsive && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest bg-white/80 border border-[#E2E8F0] text-[#475569] backdrop-blur-sm">
              <LayoutTemplate className="w-3 h-3" />
              Responsive
            </span>
          )}
        </button>

        {/* Body */}
        <div className="flex flex-col flex-1 p-5 space-y-3 text-left">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8F6B2D]">{template.category}</span>
            <h3 className="font-display text-base font-bold text-[#111827] tracking-tight leading-snug group-hover:text-[#8F6B2D] transition-colors">
              {template.name}
            </h3>
            <p className="text-[#475569] text-xs leading-relaxed line-clamp-2">{template.shortDescription}</p>
          </div>

          {!compact && (
            <div className="mt-auto pt-4 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={open}
                className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#8F6B2D] hover:text-[#8F6B2D] transition-colors cursor-pointer"
              >
                View Template
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => {
                  trackEvent('template_start_project', { template: template.slug, source: 'card' });
                  onNavigate(`/contact?template=${template.slug}`);
                }}
                className="px-3.5 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-[#C9A45C]/40 text-[#111827] hover:border-[#C9A45C] hover:text-[#8F6B2D] hover:bg-[#C9A45C]/10 transition-all cursor-pointer"
              >
                Start With This
              </button>
            </div>
          )}
        </div>
      </div>
    </TiltCard>
  );
};

export default TemplateCard;
