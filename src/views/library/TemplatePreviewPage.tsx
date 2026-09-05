/* =========================================================
   TemplatePreviewPage — /templates/:category/:slug/preview
   Full preview surface for a template mockup with a
   professional toolbar: back, name, fit/zoom toggle,
   open full screen, start CTA. The supplied templates are
   static Flow AI mockups (single high-res image), so the
   preview renders the artwork itself — no iframe isolation
   needed (nothing to leak into BRANIFY's CSS/JS).
========================================================= */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import Seo from '../../components/Seo';
import { trackEvent } from '../../lib/track';
import { categoryHref, getCategoryBySlug, getTemplateBySlug, templateHref } from '../../data/templates';
import { NotFoundView } from '../NotFoundView';

interface TemplatePreviewPageProps {
  categorySlug: string;
  templateSlug: string;
  onNavigate: (path: string) => void;
}

const TemplatePreviewPage: React.FC<TemplatePreviewPageProps> = ({ categorySlug, templateSlug, onNavigate }) => {
  const template = getTemplateBySlug(templateSlug);
  const [actualSize, setActualSize] = useState(false);

  useEffect(() => {
    if (template) {
      trackEvent('template_demo_open', { template: template.slug, source: 'preview_page' });
      document.title = `${template.name} Template — Live Preview`;
    }
    return () => { document.title = 'Custom Web Development & Digital Agency | BRANIFY'; };
  }, [template]);

  if (!template) return <NotFoundView path={`/templates/${categorySlug}/${templateSlug}/preview`} onNavigateHome={() => onNavigate('/')} onExploreTools={() => onNavigate('/templates')} />;

  const category = getCategoryBySlug(template.categorySlug);

  return (
    <div className="min-h-screen bg-[#020305] flex flex-col">
      <Seo
        title={`${template.name} Template — Live Preview`}
        description={`Live preview of the ${template.name} website template from BRANIFY.`}
        canonicalPath={`${templateHref(template)}/preview`}
        ogImage={template.seo.ogImage}
      />

      {/* Toolbar */}
      <div className="sticky top-0 z-40 bg-[#05080D]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => onNavigate(templateHref(template))}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/[0.04] border border-white/10 text-[#A7AFBA] hover:border-[#C9A45C]/45 hover:text-[#E9CF79] transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Back to Template</span><span className="sm:hidden">Back</span>
            </button>
            <div className="min-w-0 hidden md:block">
              <p className="text-xs font-black text-[#F1F2EE] uppercase tracking-tight truncate">{template.name}</p>
              <p className="text-[10px] font-mono text-[#727B87] truncate">BRANIFY Template Library{category ? ` · ${category.name}` : ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActualSize((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/[0.04] border border-white/10 text-[#A7AFBA] hover:border-[#C9A45C]/45 hover:text-[#E9CF79] transition-all cursor-pointer"
              aria-pressed={actualSize}
              title={actualSize ? 'Fit to width' : 'Actual size'}
            >
              {actualSize ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline">{actualSize ? 'Fit Width' : 'Actual Size'}</span>
            </button>
            <a
              href={template.previewImage}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('template_demo_open', { template: template.slug, source: 'fullscreen' })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/[0.04] border border-white/10 text-[#A7AFBA] hover:border-[#C9A45C]/45 hover:text-[#E9CF79] transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Open Full Screen</span><span className="lg:hidden">Full</span>
            </a>
            <button
              onClick={() => { trackEvent('template_start_project', { template: template.slug, source: 'preview_toolbar' }); onNavigate(`/contact?template=${template.slug}`); }}
              className="btn-metal px-5 py-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest inline-flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Start With This Template</span><span className="sm:hidden">Start</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview surface */}
      <div className="flex-1 overflow-auto">
        <div className={`mx-auto py-6 px-4 ${actualSize ? 'w-max' : 'max-w-[1400px]'}`}>
          <img
            src={template.previewImage}
            alt={`${template.name} website template — full preview`}
            width={1200}
            height={900}
            decoding="async"
            className={`rounded-2xl border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)] ${actualSize ? 'w-[1200px] max-w-none' : 'w-full h-auto'}`}
          />
          <div className="h-6" />
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#727B87] pb-6">
            {template.name} — {template.category} website template · Designed by Flow AI, built by BRANIFY
          </p>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewPage;
