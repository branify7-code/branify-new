/* =========================================================
   TemplateDetailPage — /templates/:category/:slug
   Large preview, template info, configurable CTAs (View Live
   Demo → preview route · Start With This Template → existing
   contact/lead flow with template context), breadcrumbs,
   related templates. Unknown slug → site 404.
========================================================= */

import React, { useEffect } from 'react';
import { ArrowLeft, ArrowUpRight, Check, ChevronRight, ExternalLink, LayoutTemplate, Smartphone, Sparkles } from 'lucide-react';
import Seo from '../../components/Seo';
import TemplateCard from '../../components/TemplateCard';
import { trackEvent, trackNotFound } from '../../lib/track';
import {
  categoryHref, getCategoryBySlug, getTemplateBySlug, relatedTemplates,
  templateHref, templatePreviewHref,
} from '../../data/templates';
import { NotFoundView } from '../NotFoundView';

interface TemplateDetailPageProps {
  categorySlug: string;
  templateSlug: string;
  onNavigate: (path: string) => void;
}

const TemplateDetailPage: React.FC<TemplateDetailPageProps> = ({ categorySlug, templateSlug, onNavigate }) => {
  const template = getTemplateBySlug(templateSlug);

  useEffect(() => {
    if (template) {
      trackEvent('template_view', { template: template.slug, category: template.categorySlug });
      document.title = template.seo.title;
    }
    return () => { document.title = 'Custom Web Development & Digital Agency | BRANIFY'; };
  }, [template]);

  if (!template) return <NotFoundView path={`/templates/${categorySlug}/${templateSlug}`} onNavigateHome={() => onNavigate('/')} onExploreTools={() => onNavigate('/templates')} />;

  const category = getCategoryBySlug(template.categorySlug);
  const related = relatedTemplates(template, 3);
  const preview = templatePreviewHref(template);

  return (
    <div className="min-h-screen bg-[#05080D]">
      <Seo
        title={template.seo.title}
        description={template.seo.description}
        keywords={template.seo.keywords}
        canonicalPath={templateHref(template)}
        ogType="website"
        ogImage={template.seo.ogImage}
        breadcrumbs={[
          { name: 'Home', url: 'https://branify.store/' },
          { name: 'Templates', url: 'https://branify.store/templates' },
          ...(category ? [{ name: category.name, url: `https://branify.store/templates/${category.slug}` }] : []),
          { name: template.name, url: `https://branify.store${templateHref(template)}` },
        ]}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <ol className="flex items-center flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#727B87]">
          <li><button onClick={() => onNavigate('/')} className="hover:text-[#E9CF79] transition-colors cursor-pointer">Home</button></li>
          <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
          <li><button onClick={() => onNavigate('/templates')} className="hover:text-[#E9CF79] transition-colors cursor-pointer">Templates</button></li>
          {category && (
            <>
              <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
              <li><button onClick={() => onNavigate(categoryHref(category.slug))} className="hover:text-[#E9CF79] transition-colors cursor-pointer">{category.name}</button></li>
            </>
          )}
          <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
          <li aria-current="page" className="text-[#D4AF37]">{template.name}</li>
        </ol>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Preview */}
          <div className="lg:col-span-8 space-y-4">
            <button
              type="button"
              onClick={() => { trackEvent('template_demo_open', { template: template.slug, source: 'detail_hero' }); onNavigate(preview); }}
              className="group relative block w-full overflow-hidden rounded-3xl border border-white/10 bg-[#080C12] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A45C]/60"
              aria-label={`Open live preview of ${template.name}`}
            >
              <img
                src={template.previewImage}
                alt={`${template.name} website template — full homepage preview`}
                width={1200}
                height={900}
                decoding="async"
                className="w-full h-auto object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05080D]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C9A45C] text-[#090A0C] text-[11px] font-extrabold uppercase tracking-widest shadow-[0_10px_30px_rgba(201,164,92,0.35)]">
                  <ExternalLink className="w-3.5 h-3.5" /> Open Live Preview
                </span>
              </div>
            </button>
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#727B87]">
              Click the preview to inspect the full homepage design
            </p>
          </div>

          {/* Info panel */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/40 text-[#E9CF79] text-[10px] font-extrabold uppercase tracking-widest">
                  {template.category}
                </span>
                {template.featured && (
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#A7AFBA] text-[10px] font-extrabold uppercase tracking-widest">
                    Featured
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#FFF5DC] leading-[1.08]">
                {template.name}
                <span className="block text-[#D4AF37]">Website Template</span>
              </h1>
              <p className="text-[#A7AFBA] text-sm leading-relaxed">{template.description}</p>
            </div>

            {/* Facts */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#080C12] p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#727B87] font-bold uppercase tracking-widest text-[10px]">Industry</span>
                <span className="text-[#F1F2EE] font-bold">{template.industry}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#727B87] font-bold uppercase tracking-widest text-[10px]">Layout</span>
                <span className="inline-flex items-center gap-1.5 text-[#F1F2EE] font-bold">
                  {template.responsive ? (
                    <>
                      <Smartphone className="w-3.5 h-3.5 text-[#D4AF37]" /> Fully responsive
                    </>
                  ) : 'Fixed'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#727B87] font-bold uppercase tracking-widest text-[10px]">Delivery</span>
                <span className="text-[#F1F2EE] font-bold">Custom-built for you</span>
              </div>
              <div className="pt-2 space-y-2 border-t border-white/[0.06]">
                <span className="text-[#727B87] font-bold uppercase tracking-widest text-[10px] block">What's included</span>
                {['Homepage design matching this preview', 'Mobile & tablet responsive layouts', 'Brand, content & imagery customization', 'Launch support from the BRANIFY team'].map((f) => (
                  <div key={f} className="flex items-start gap-2 text-xs text-[#A7AFBA]">
                    <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions — configurable CTA architecture (lead flow, not payment) */}
            <div className="space-y-3">
              <button
                onClick={() => { trackEvent('template_demo_open', { template: template.slug, source: 'detail_panel' }); onNavigate(preview); }}
                className="btn-gold-primary w-full px-8 py-4 rounded-full text-xs font-extrabold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" /> View Live Demo
              </button>
              <button
                onClick={() => { trackEvent('template_start_project', { template: template.slug, source: 'detail_panel' }); onNavigate(`/contact?template=${template.slug}`); }}
                className="w-full px-8 py-4 rounded-full text-xs font-extrabold uppercase tracking-widest border border-[#C9A45C]/40 text-[#F1F2EE] hover:border-[#C9A45C] hover:text-[#E9CF79] hover:bg-[#C9A45C]/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Start With This Template
              </button>
              <p className="text-center text-[10px] text-[#727B87] leading-relaxed pt-1">
                Start with this design — we tailor it to your brand and launch it as your own website.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* Related templates */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>{'// You may also like'}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#FFF5DC]">Related Templates</h2>
            </div>
            {category && (
              <button
                onClick={() => onNavigate(categoryHref(category.slug))}
                className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#D4AF37] hover:text-[#E9CF79] transition-colors cursor-pointer"
              >
                All {category.name} templates <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((t) => (
              <TemplateCard key={t.slug} template={t} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}

      {/* Back */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <button
          onClick={() => onNavigate(category ? categoryHref(category.slug) : '/templates')}
          className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#D4AF37] hover:text-[#E9CF79] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {category ? category.name : 'Templates'}
        </button>
      </div>
    </div>
  );
};

export default TemplateDetailPage;
