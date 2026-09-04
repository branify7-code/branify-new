/* =========================================================
   FreeTemplateDetailPage — 1:1 replica of branify.store's
   /free-templates/<slug> page: breadcrumb, preview + tags +
   share link, sticky download sidebar with license and
   customization CTA, key features / what's included /
   full description sections and "Explore More" cards.
========================================================= */

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Share2,
} from 'lucide-react';
import Seo from '../../components/Seo';
import { freeTemplates, templateCategories, FreeTemplate } from '../../data/freeTemplatesRegistry';
import { FreeTemplateCard } from './FreeTemplatesView';

export interface FreeTemplateDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

/* ------------------------------------------------------------------ */
/* Not found — friendly fallback for unknown slugs                     */
/* ------------------------------------------------------------------ */

const TemplateNotFound: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => (
  <div className="min-h-screen bg-[#0A0A0D] text-white py-24 px-4 flex items-center justify-center">
    <Seo
      title="Free Template Not Found | BRANIFY"
      description="The free template you are looking for does not exist. Browse all free BRANIFY templates."
      canonicalPath="/free-templates"
    />
    <div className="text-center space-y-4 max-w-md">
      <FileText className="w-10 h-10 text-zinc-600 mx-auto" />
      <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Template not found</h1>
      <p className="text-sm text-zinc-400">
        The template you are looking for may have been moved or is no longer available. Browse the full library instead.
      </p>
      <button
        type="button"
        onClick={() => onNavigate('/free-templates')}
        className="inline-flex items-center gap-2 px-6 py-2.5 btn-gold-primary rounded-full text-xs font-black uppercase tracking-wider cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to All Free Templates
      </button>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Detail page                                                         */
/* ------------------------------------------------------------------ */

export const FreeTemplateDetailPage: React.FC<FreeTemplateDetailPageProps> = ({ slug, onNavigate }) => {
  const tpl: FreeTemplate | undefined = freeTemplates.find((t) => t.slug === slug);
  const [linkCopied, setLinkCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    },
    []
  );

  if (!tpl) return <TemplateNotFound onNavigate={onNavigate} />;

  const categoryLabel = templateCategories.find((c) => c.slug === tpl.categorySlug)?.label ?? tpl.category;

  const related = freeTemplates
    .filter((t) => t.slug !== tpl.slug)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 3);

  const handleShare = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      }
      setLinkCopied(true);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0D] text-white py-12 px-4 sm:px-6 lg:px-8">
      <Seo title={tpl.seoTitle} description={tpl.metaDescription} canonicalPath={`/free-templates/${tpl.slug}`} />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
          <button type="button" onClick={() => onNavigate('/')} className="hover:text-[#E2C27B] transition cursor-pointer">
            Home
          </button>
          <ChevronRight className="w-3 h-3 text-zinc-600" />
          <button
            type="button"
            onClick={() => onNavigate('/free-templates')}
            className="hover:text-[#E2C27B] transition cursor-pointer"
          >
            Free Templates
          </button>
          <ChevronRight className="w-3 h-3 text-zinc-600" />
          <button
            type="button"
            onClick={() => onNavigate(`/free-templates/${tpl.categorySlug}`)}
            className="hover:text-[#E2C27B] transition cursor-pointer"
          >
            {categoryLabel}
          </button>
        </nav>

        {/* Back link */}
        <button
          type="button"
          onClick={() => onNavigate('/free-templates')}
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-[#E2C27B] transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to All Free Templates
        </button>

        {/* Title */}
        <div className="space-y-2">
          <span className="uppercase text-[10px] font-black text-[#E2C27B] tracking-wider">{tpl.category}</span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight leading-tight">{tpl.title}</h1>
          <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">{tpl.shortDescription}</p>
        </div>

        {/* Two-column: preview + sticky sidebar */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: preview, tags, share */}
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#080B14]">
              <img src={tpl.previewSvg} alt={`Preview of ${tpl.title}`} className="w-full aspect-[16/10] object-cover" />
            </div>

            <div className="flex flex-wrap gap-2">
              {tpl.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-white/[0.04] border border-white/10 rounded-full px-3 py-1 text-[10px] text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={handleShare}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs transition cursor-pointer ${
                linkCopied
                  ? 'border-emerald-500/40 text-emerald-400'
                  : 'border-white/15 text-zinc-300 hover:border-[#C9A45C]/50 hover:text-white'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              {linkCopied ? 'Link copied!' : 'Share template link'}
            </button>
          </div>

          {/* Right: sticky download card */}
          <aside className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 self-start bg-[#080B14] border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="bg-emerald-500/90 text-[#052e1b] text-[10px] font-black rounded-full px-2.5 py-1 uppercase tracking-wider">
                  100% FREE
                </span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider text-right">{tpl.fileFormat}</span>
              </div>

              <div className="space-y-1 text-[11px] text-zinc-500">
                <p>File size: {tpl.fileSize}</p>
                <p>License: {tpl.license}</p>
              </div>

              {tpl.downloadUrl ? (
                <a
                  href={tpl.downloadUrl}
                  download
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 btn-gold-primary rounded-full font-black uppercase tracking-wider text-xs"
                >
                  <Download className="w-4 h-4" />
                  Download 100% FREE
                </a>
              ) : (
                <span
                  aria-disabled="true"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/[0.04] border border-white/10 font-black uppercase tracking-wider text-xs text-zinc-500 cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Coming Soon
                </span>
              )}

              {tpl.disclaimer && (
                <p className="text-[10px] text-zinc-500 italic leading-relaxed">{tpl.disclaimer}</p>
              )}

              <div className="rounded-xl border border-[#C9A45C]/25 bg-[#C9A45C]/5 p-4 space-y-2">
                <h3 className="text-sm font-extrabold text-white">Need this customized for your business?</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Our team can tailor any template into a full production system for your brand.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/contact')}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-[#C9A45C]/50 text-[#E2C27B] text-xs font-bold hover:bg-[#C9A45C]/10 transition cursor-pointer"
                >
                  Request Customization
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* Key features */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xs font-black uppercase tracking-widest text-white">Key Features</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {tpl.features.map((feature, i) => (
              <div key={`feature-${i}`} className="flex items-center gap-2.5 text-xs text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What's included */}
        {tpl.whatsIncluded.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-white">What&apos;s Included</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {tpl.whatsIncluded.map((item, i) => (
                <div key={`included-${i}`} className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <FileText className="w-4 h-4 text-[#E2C27B] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full description */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-white">Full Description</h2>
          <div className="space-y-3">
            {tpl.fullDescription.split('\n\n').map((paragraph, i) => (
              <p key={`desc-${i}`} className="text-sm text-zinc-400 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Explore more */}
        <div className="space-y-5 pt-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Explore More Free Templates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((template) => (
              <FreeTemplateCard key={template.id} template={template} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeTemplateDetailPage;
