/* =========================================================
   FreeTemplatesView — 1:1 replica of branify.store's
   /free-templates directory page: gold hero, live search,
   category tab pills, template cards with preview lightbox
   and real download links.
   Exports FreeTemplateCard so the detail page can reuse the
   exact same card style for "Explore More" templates.
========================================================= */

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Eye, Gift, Search, X } from 'lucide-react';
import Seo from '../../components/Seo';
import { freeTemplates, templateCategories, FreeTemplate } from '../../data/freeTemplatesRegistry';
import { FREE_TEMPLATE_CATEGORY_SEO, FREE_TEMPLATES_HUB_SEO } from '../../data/seoMeta';

export interface FreeTemplatesViewProps {
  onNavigate: (path: string) => void;
  initialCategory?: string;
}

/* ------------------------------------------------------------------ */
/* Preview lightbox — fixed overlay portaled to <body> so card         */
/* overflow-hidden can never clip it. Backdrop click closes.           */
/* ------------------------------------------------------------------ */

interface TemplatePreviewLightboxProps {
  template: FreeTemplate;
  onClose: () => void;
}

const TemplatePreviewLightbox: React.FC<TemplatePreviewLightboxProps> = ({ template, onClose }) =>
  createPortal(
    <div
      className="fixed inset-0 bg-[#0B1120]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${template.title}`}
    >
      <div
        className="relative w-full max-w-4xl bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#475569] hover:text-[#111827] hover:border-[#C9A45C]/60 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        <img
          src={template.previewSvg}
          alt={`Preview of ${template.title}`}
          className="w-full max-h-[70vh] object-contain"
        />
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E2E8F0]">
          <div className="space-y-0.5">
            <p className="text-[#111827] font-extrabold text-sm leading-snug">{template.title}</p>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider">
              {template.fileFormat} · {template.fileSize}
            </p>
          </div>
          {template.downloadUrl ? (
            <a
              href={template.downloadUrl}
              download
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 btn-gold-primary rounded-full text-xs font-black uppercase tracking-wider shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-white border border-[#E2E8F0] text-xs font-black uppercase tracking-wider text-[#94A3B8] cursor-not-allowed shrink-0"
            >
              Coming Soon
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body
  );

/* ------------------------------------------------------------------ */
/* Template card — shared by the directory grid and the detail         */
/* page's "Explore More" section. Download is a real <a download>.     */
/* ------------------------------------------------------------------ */

export interface FreeTemplateCardProps {
  template: FreeTemplate;
  onNavigate: (path: string) => void;
}

export const FreeTemplateCard: React.FC<FreeTemplateCardProps> = ({ template, onNavigate }) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <article className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_14px_34px_-14px_rgba(15,23,42,0.14)] hover:-translate-y-1 hover:border-[#C9A45C]/40 transition-all duration-300 group flex flex-col">
      {/* Preview */}
      <div className="relative">
        <img
          src={template.previewSvg}
          alt={`Preview of ${template.title}`}
          loading="lazy"
          className="w-full aspect-[16/10] object-cover"
        />
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-full text-xs font-bold text-[#111827] shadow-[0_8px_24px_rgba(15,23,42,0.12)] hover:border-[#C9A45C]/50 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Quick Preview
          </button>
        </div>
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-emerald-700 border border-emerald-500/30 text-[10px] font-black rounded-full px-2.5 py-1 uppercase tracking-wider">
          100% FREE
        </span>
        <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur border border-[#E2E8F0] text-[#334155] text-[10px] rounded-md px-2 py-1">
          {template.fileFormat}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="uppercase text-[10px] font-black text-[#8F6B2D] tracking-wider">{template.category}</span>
          <span className="text-[10px] text-[#64748B] shrink-0">{template.fileSize}</span>
        </div>
        <h3
          onClick={() => onNavigate(`/free-templates/${template.slug}`)}
          className="font-display text-[#111827] font-extrabold leading-snug group-hover:text-[#8F6B2D] transition-colors cursor-pointer"
        >
          {template.title}
        </h3>
        <p className="text-xs text-[#64748B] leading-relaxed">{template.shortDescription}</p>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-[#64748B]">
          {template.features.slice(0, 2).map((feature, i) => (
            <li key={`${template.id}-feature-${i}`}>{feature}</li>
          ))}
        </ul>
        <div className="flex items-center gap-3 pt-1 mt-auto">
          <button
            type="button"
            onClick={() => onNavigate(`/free-templates/${template.slug}`)}
            className="px-4 py-2 rounded-full border border-[#E2E8F0] text-xs text-[#475569] hover:border-[#C9A45C]/50 hover:text-[#111827] transition cursor-pointer shrink-0"
          >
            Details
          </button>
          {template.downloadUrl ? (
            <a
              href={template.downloadUrl}
              download
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 btn-gold-primary rounded-full text-xs font-black uppercase tracking-wider"
              aria-label={`Download ${template.title}`}
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          ) : (
            <span
              aria-disabled="true"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-xs font-black uppercase tracking-wider text-[#94A3B8] cursor-not-allowed"
            >
              Coming Soon
            </span>
          )}
        </div>
      </div>

      {previewOpen && <TemplatePreviewLightbox template={template} onClose={() => setPreviewOpen(false)} />}
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* Directory page                                                      */
/* ------------------------------------------------------------------ */

export const FreeTemplatesView: React.FC<FreeTemplatesViewProps> = ({ onNavigate, initialCategory = '' }) => {
  const validInitial = templateCategories.some((c) => c.slug === initialCategory && c.slug !== '') ? initialCategory : '';
  const [activeCategory, setActiveCategory] = useState<string>(validInitial);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return freeTemplates
      .filter((t) => activeCategory === '' || t.categorySlug === activeCategory)
      .filter(
        (t) =>
          q === '' ||
          t.title.toLowerCase().includes(q) ||
          t.shortDescription.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [activeCategory, query]);

  const activeLabel =
    activeCategory === ''
      ? 'All Free Templates'
      : templateCategories.find((c) => c.slug === activeCategory)?.label ?? 'All Free Templates';

  const resetFilters = () => {
    setQuery('');
    setActiveCategory('');
  };

  // Route-scoped metadata: keyed off the URL segment (stable for crawlers),
  // not the mutable category-pill state. Unknown segments get hub meta.
  const seo = (initialCategory && FREE_TEMPLATE_CATEGORY_SEO[initialCategory]) || FREE_TEMPLATES_HUB_SEO;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#334155] py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      <Seo
        title={seo.title}
        description={seo.description}
        canonicalPath="/free-templates"
      />

      {/* Hero */}
      <div className="max-w-7xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A45C]/10 border border-[#C9A45C]/30 text-[#8F6B2D] text-xs font-extrabold uppercase tracking-widest">
          <Gift className="w-3.5 h-3.5" />
          <span>100% Free Assets &amp; Starters</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.02em] text-[#111827]">
          Free <span className="bg-gradient-to-r from-[#C9A45C] via-[#E9CF79] to-[#D4AF37] bg-clip-text text-transparent">Templates</span>
        </h1>
        <p className="text-[#475569] text-sm sm:text-base max-w-2xl mx-auto">
          Professional templates you can download, customize and use for free.
        </p>
        <div className="relative max-w-xl mx-auto pt-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search Free Templates"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search Free Templates"
            className="w-full rounded-full bg-white border border-[#E2E8F0] pl-11 pr-4 py-3 text-sm text-[#111827] placeholder-[#94A3B8] shadow-[0_2px_10px_rgba(15,23,42,0.04)] focus:outline-none focus:border-[#5B5FEF]/50 focus:shadow-[0_0_0_3px_rgba(91,95,239,0.12)] transition"
          />
        </div>
      </div>

      {/* Category tab pills */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2">
        {templateCategories.map((cat) => (
          <button
            key={cat.slug || 'all'}
            type="button"
            onClick={() => setActiveCategory(cat.slug)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              activeCategory === cat.slug
                ? 'bg-gradient-to-b from-[#F6DF84] via-[#D4AF37] to-[#B3841F] text-[#1A1206] shadow-lg shadow-[#C9A45C]/25'
                : 'bg-white border border-[#E2E8F0] text-[#475569] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:text-[#8F6B2D] hover:border-[#C9A45C]/45'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Section header + grid */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-[#111827]">{activeLabel}</h2>
            <p className="text-sm text-[#64748B]">
              Real downloads and verified resources for modern creators, developers, and founders.
            </p>
          </div>
          <span className="inline-flex items-center self-start sm:self-auto px-3 py-1 rounded-full bg-[#C9A45C]/10 border border-[#C9A45C]/30 text-[#8F6B2D] text-[10px] font-extrabold uppercase tracking-wider shrink-0">
            {filtered.length} templates
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((template) => (
            <FreeTemplateCard key={template.id} template={template} onNavigate={onNavigate} />
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center space-y-3 bg-white border border-[#E2E8F0] rounded-2xl">
              <Search className="w-8 h-8 text-[#94A3B8] mx-auto" />
              <p className="text-[#64748B] text-sm">No free templates found matching your search or filters.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 rounded-full border border-[#C9A45C]/40 text-[#8F6B2D] text-xs font-bold hover:bg-[#C9A45C]/10 transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreeTemplatesView;
