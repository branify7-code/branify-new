/* =========================================================
   AIToolDetailView — /ai-tools/{slug}
   -----------------------------------------------------
   Breadcrumb → tool header (official icon, pricing, official
   button) → About → What can you do → Best for → step-by-step
   beginner guide → example prompts (copy) → example outputs
   (real images only; clean text examples otherwise) → tips →
   pros/limitations → related tools → FAQ → official CTA.
   SEO: unique title/desc, breadcrumbs + FAQ structured data.
========================================================= */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight, ArrowUpRight, BookOpen, Check, ChevronRight, Copy,
  Home, Info, Lightbulb, ListChecks, MessageSquareText, Sparkles,
  Star, ThumbsDown, ThumbsUp,
} from 'lucide-react';
import Seo from '../../components/Seo';
import { trackEvent } from '../../lib/track';
import { ToolIcon } from '../../components/ToolIcon';
import {
  getAiToolBySlug, getRelatedAiTools, getToolSeo, groupPromptsByCategory,
} from '../../lib/aiToolsData';

interface AIToolDetailViewProps {
  slug: string;
  onNavigate?: (path: string) => void;
}

const CopyButton: React.FC<{ text: string; name: string }> = ({ text, name }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* noop */ }
      ta.remove();
    }
    setCopied(true);
    trackEvent('ai_tool_prompt_copy', { tool: name, prompt: text.slice(0, 60) });
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer shrink-0 ${
        copied
          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
          : 'bg-white text-[#4338CA] border-[#C7D2FE] hover:border-[#5B5FEF]/60 hover:bg-[#EEF2FF]'
      }`}
      aria-label={`Copy this example prompt${name ? ` for ${name}` : ''}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy prompt'}
    </button>
  );
};

export const AIToolDetailView: React.FC<AIToolDetailViewProps> = ({ slug }) => {
  const tool = useMemo(() => getAiToolBySlug(slug), [slug]);
  const [openFaq, setOpenFaq] = useState<number>(0);

  useEffect(() => {
    if (tool) trackEvent('ai_tool_view', { name: tool.name, slug: tool.slug });
  }, [tool]);

  if (!tool) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EEF2FF] to-white flex items-center justify-center px-4 py-24">
        <Seo title="AI tool not found" description="This AI tool guide is not in the BRANIFY directory." canonicalPath="/ai-tools" robots="noindex, nofollow" />
        <div className="text-center space-y-4 max-w-md bg-white border border-[#E2E8F0] rounded-3xl p-10">
          <Sparkles className="w-10 h-10 text-[#94A3B8] mx-auto" />
          <h1 className="font-display text-2xl font-extrabold text-[#111827]">Tool guide not found</h1>
          <p className="text-sm text-[#64748B]">This AI tool is not in the BRANIFY directory. Browse the full directory to find what you need.</p>
          <a href="/ai-tools" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B5FEF] text-white text-xs font-extrabold uppercase tracking-widest hover:bg-[#4C46E8] transition-colors">
            Browse all AI tools <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  const guide = tool.guide;
  const related = getRelatedAiTools(tool, 3);
  const toolSeo = getToolSeo(tool);
  const promptGroups = guide?.prompts?.length ? groupPromptsByCategory(guide.prompts) : [];
  const outputs = (tool.seo?.outputs || []).filter((o) => o.image);

  const breadcrumbs = [
    { name: 'Home', url: 'https://branify.store/' },
    { name: 'AI Tools', url: 'https://branify.store/ai-tools' },
    { name: tool.category, url: `https://branify.store/ai-tools?category=${encodeURIComponent(tool.category)}` },
    { name: tool.name, url: `https://branify.store/ai-tools/${tool.slug}` },
  ];

  const faqSchema = guide?.faqs?.length
    ? guide.faqs.map((f) => ({ question: f.question, answer: f.answer }))
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF2FF] via-white to-white text-[#334155]">
      <Seo
        title={toolSeo.title}
        description={toolSeo.description}
        canonicalPath={`/ai-tools/${tool.slug}`}
        keywords={[tool.name, `${tool.name} guide`, `how to use ${tool.name}`, `${tool.name} prompts`, tool.category, 'AI tools', 'BRANIFY']}
        ogType="article"
        ogImage={toolSeo.ogImage || `/og/ai-tools/${tool.slug}.png`}
        breadcrumbs={breadcrumbs}
        faqs={faqSchema}
        softwareSchema={{
          name: tool.name,
          description: toolSeo.description,
          applicationCategory: tool.category,
        }}
      />

      {/* ==================== BREADCRUMB ==================== */}
      <nav aria-label="Breadcrumb" className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[#94A3B8]">
          <li>
            <a href="/" className="inline-flex items-center gap-1 hover:text-[#4338CA] transition-colors">
              <Home className="w-3 h-3" /> Home
            </a>
          </li>
          <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
          <li><a href="/ai-tools" className="hover:text-[#4338CA] transition-colors">AI Tools</a></li>
          <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
          <li>{tool.category}</li>
          <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
          <li aria-current="page" className="text-[#475569]">{tool.name}</li>
        </ol>
      </nav>

      {/* ==================== TOOL HEADER ==================== */}
      <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_-18px_rgba(15,23,42,0.15)]">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <ToolIcon icon={tool.icon} name={tool.name} className="w-16 h-16 sm:w-20 sm:h-20" rounded="rounded-2xl" />
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#5B5FEF] bg-[#EEF2FF] border border-[#C7D2FE] px-2.5 py-1 rounded-full">{tool.category}</span>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  tool.pricing === 'Free'
                    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25'
                    : tool.pricing === 'Freemium'
                      ? 'bg-[#C9A45C]/10 text-[#8F6B2D] border-[#C9A45C]/30'
                      : 'bg-[#8B5CF6]/10 text-[#6D28D9] border-[#8B5CF6]/25'
                }`}>{tool.pricing}</span>
                {guide?.beginnerFriendly && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-teal-500/10 text-teal-700 border-teal-500/25">Beginner friendly</span>
                )}
                {tool.featured && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-[#C9A45C]/10 text-[#8F6B2D] border-[#C9A45C]/30 inline-flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-current" /> Featured
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-[-0.02em]">{tool.name}</h1>
              <p className="text-[#475569] text-sm sm:text-base leading-relaxed">{tool.desc}</p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { trackEvent('ai_tool_visit', { name: tool.name, url: tool.url }); trackEvent('ai_tool_click', { name: tool.name, url: tool.url }); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B5FEF] text-white text-xs font-extrabold uppercase tracking-widest shadow-lg shadow-[#5B5FEF]/25 hover:bg-[#4C46E8] transition-colors"
                >
                  Visit official website <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <span className="text-[11px] text-[#94A3B8] font-mono">{tool.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-10">
        {/* ==================== ABOUT ==================== */}
        {guide?.about && (
          <section aria-labelledby="about-heading" className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-4">
              <Info className="w-4.5 h-4.5 text-[#5B5FEF]" />
              <h2 id="about-heading" className="font-display text-xl sm:text-2xl font-extrabold text-[#111827] tracking-[-0.01em]">
                What is {tool.name}?
              </h2>
            </div>
            <p className="text-[#475569] text-sm sm:text-[15px] leading-relaxed">{guide.about}</p>
          </section>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* ==================== WHAT CAN YOU DO ==================== */}
          {guide?.useCases?.length ? (
            <section aria-labelledby="usecases-heading" className="lg:col-span-3 bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-2.5 mb-5">
                <ListChecks className="w-4.5 h-4.5 text-[#5B5FEF]" />
                <h2 id="usecases-heading" className="font-display text-xl sm:text-2xl font-extrabold text-[#111827] tracking-[-0.01em]">
                  What can you do with {tool.name}?
                </h2>
              </div>
              <ul className="space-y-4">
                {guide.useCases.map((u, i) => (
                  <li key={i} className="flex gap-3.5">
                    <span className="shrink-0 w-7 h-7 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] text-[#4338CA] text-xs font-extrabold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-[#111827] text-[15px]">{u.title}</h3>
                      <p className="text-[13px] text-[#64748B] leading-relaxed mt-0.5">{u.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* ==================== BEST FOR ==================== */}
          {guide?.bestFor?.length ? (
            <section aria-labelledby="bestfor-heading" className={`${guide?.useCases?.length ? 'lg:col-span-2' : ''} bg-gradient-to-br from-[#FFF9EC] to-white border border-[#C9A45C]/30 rounded-3xl p-6 sm:p-8`}>
              <div className="flex items-center gap-2.5 mb-5">
                <Star className="w-4.5 h-4.5 text-[#C9A45C]" />
                <h2 id="bestfor-heading" className="font-display text-xl font-extrabold text-[#111827] tracking-[-0.01em]">Best for</h2>
              </div>
              <ul className="flex flex-wrap gap-2">
                {guide.bestFor.map((b) => (
                  <li key={b} className="px-3.5 py-2 rounded-xl bg-white border border-[#C9A45C]/35 text-[12px] font-bold text-[#8F6B2D]">
                    {b}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* ==================== BEGINNER GUIDE ==================== */}
        {guide?.steps?.length ? (
          <section id="guide" aria-labelledby="guide-heading" className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 scroll-mt-20">
            <div className="flex items-center gap-2.5 mb-2">
              <BookOpen className="w-4.5 h-4.5 text-[#5B5FEF]" />
              <h2 id="guide-heading" className="font-display text-xl sm:text-2xl font-extrabold text-[#111827] tracking-[-0.01em]">
                How to use {tool.name} — step by step
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8] mb-6">Beginner guide · no technical knowledge needed</p>
            <ol className="relative space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-[#E2E8F0]" role="list">
              {guide.steps.map((step, i) => (
                <li key={i} className="relative flex gap-4">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-[#5B5FEF] text-white text-sm font-extrabold flex items-center justify-center shadow-[0_4px_12px_-4px_rgba(91,95,239,0.5)] z-10">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[#111827] text-[15px]">{step.title}</h3>
                    <p className="text-[13.5px] text-[#64748B] leading-relaxed mt-1">{step.text}</p>
                    {step.image && (
                      <figure className="mt-3 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC]">
                        <img
                          src={step.image}
                          alt={step.alt || step.title}
                          caption={undefined}
                          loading="lazy"
                          decoding="async"
                          className="w-full max-h-96 object-cover"
                        />
                        {step.caption && <figcaption className="px-4 py-2.5 text-[11px] text-[#64748B] bg-white border-t border-[#E2E8F0]">{step.caption}</figcaption>}
                      </figure>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* ==================== EXAMPLE PROMPTS ==================== */}
        {promptGroups.length > 0 && (
          <section aria-labelledby="prompts-heading" className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-2">
              <MessageSquareText className="w-4.5 h-4.5 text-[#5B5FEF]" />
              <h2 id="prompts-heading" className="font-display text-xl sm:text-2xl font-extrabold text-[#111827] tracking-[-0.01em]">
                Example prompts for {tool.name}
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8] mb-6">Copy a prompt, replace the [brackets] with your details, and try it in {tool.name}. Results vary — refine as you go.</p>
            <div className="space-y-7">
              {promptGroups.map((group) => (
                <div key={group.category}>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8] mb-3">{group.category}</h3>
                  <div className="space-y-3">
                    {group.prompts.map((p, i) => (
                      <div key={i} className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 hover:border-[#5B5FEF]/35 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <h4 className="font-bold text-[#111827] text-sm">{p.title}</h4>
                          <CopyButton text={p.content} name={tool.name} />
                        </div>
                        <pre className="text-[12.5px] leading-relaxed text-[#475569] whitespace-pre-wrap font-sans bg-white border border-[#E2E8F0] rounded-xl p-3.5">{p.content}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==================== EXAMPLE OUTPUTS ==================== */}
        {outputs.length > 0 && (
          <section aria-labelledby="outputs-heading" className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8">
            <h2 id="outputs-heading" className="font-display text-xl sm:text-2xl font-extrabold text-[#111827] tracking-[-0.01em] mb-6">Example results</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {outputs.map((o, i) => (
                <figure key={i} className="rounded-2xl overflow-hidden border border-[#E2E8F0]">
                  <img src={o.image} alt={o.alt || o.caption || `${tool.name} example output`} loading="lazy" decoding="async" className="w-full aspect-video object-cover" />
                  <figcaption className="p-4 bg-white">
                    {o.prompt && <p className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8] mb-1">Prompt used</p>}
                    {o.prompt && <p className="text-[12px] text-[#64748B] mb-2">{o.prompt}</p>}
                    {o.caption && <p className="text-[12.5px] font-semibold text-[#334155]">{o.caption}</p>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* ==================== TIPS + PROS/LIMITATIONS ==================== */}
        {(guide?.tips?.length || guide?.pros?.length) ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {guide?.tips?.length ? (
              <section aria-labelledby="tips-heading" className="bg-gradient-to-br from-[#F0FDFA] to-white border border-teal-500/25 rounded-3xl p-6 sm:p-8">
                <div className="flex items-center gap-2.5 mb-5">
                  <Lightbulb className="w-4.5 h-4.5 text-teal-600" />
                  <h2 id="tips-heading" className="font-display text-xl font-extrabold text-[#111827] tracking-[-0.01em]">Tips for better results</h2>
                </div>
                <ul className="space-y-3">
                  {guide.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2.5 text-[13.5px] text-[#475569] leading-relaxed">
                      <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {(guide?.pros?.length || guide?.limitations?.length) ? (
              <section aria-labelledby="pros-heading" className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8">
                <h2 id="pros-heading" className="font-display text-xl font-extrabold text-[#111827] tracking-[-0.01em] mb-5">Strengths & limitations</h2>
                {guide?.pros?.length ? (
                  <div className="mb-5">
                    <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mb-2.5 flex items-center gap-1.5"><ThumbsUp className="w-3.5 h-3.5" /> Strengths</p>
                    <ul className="space-y-2">
                      {guide.pros.map((p, i) => (
                        <li key={i} className="flex gap-2.5 text-[13.5px] text-[#475569]"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />{p}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {guide?.limitations?.length ? (
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-amber-600 mb-2.5 flex items-center gap-1.5"><ThumbsDown className="w-3.5 h-3.5" /> Keep in mind</p>
                    <ul className="space-y-2">
                      {guide.limitations.map((l, i) => (
                        <li key={i} className="flex gap-2.5 text-[13.5px] text-[#475569]"><span className="shrink-0 mt-0.5 w-4 text-center text-amber-600 font-bold">–</span>{l}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        ) : null}

        {/* ==================== FAQ ==================== */}
        {guide?.faqs?.length ? (
          <section aria-labelledby="faq-heading" className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8">
            <h2 id="faq-heading" className="font-display text-xl sm:text-2xl font-extrabold text-[#111827] tracking-[-0.01em] mb-6">
              Frequently asked questions about {tool.name}
            </h2>
            <div className="space-y-2.5">
              {guide.faqs.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} className={`rounded-2xl border transition-colors ${open ? 'border-[#5B5FEF]/40 bg-[#F8FAFF]' : 'border-[#E2E8F0] bg-white'}`}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? -1 : i)}
                      aria-expanded={open}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
                    >
                      <span className="font-bold text-[14px] text-[#111827]">{f.question}</span>
                      <ChevronRight className={`w-4 h-4 text-[#94A3B8] shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
                    </button>
                    {open && <p className="px-5 pb-4 text-[13.5px] text-[#64748B] leading-relaxed">{f.answer}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* ==================== RELATED ==================== */}
        {related.length > 0 && (
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="font-display text-xl sm:text-2xl font-extrabold text-[#111827] tracking-[-0.01em] mb-5">Related AI tools</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <a
                  key={r.slug}
                  href={`/ai-tools/${r.slug}`}
                  className="group bg-white border border-[#E2E8F0] hover:border-[#5B5FEF]/40 rounded-2xl p-5 transition-all hover:shadow-[0_12px_28px_-14px_rgba(15,23,42,0.18)] hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <ToolIcon icon={r.icon} name={r.name} className="w-9 h-9" rounded="rounded-lg" />
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-[#111827] text-sm truncate group-hover:text-[#4338CA] transition-colors">{r.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{r.category}</p>
                    </div>
                  </div>
                  <p className="text-[12px] text-[#64748B] mt-3 line-clamp-2">{r.desc}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ==================== FINAL CTA ==================== */}
        <section className="bg-gradient-to-br from-[#111827] to-[#1E293B] rounded-3xl p-8 sm:p-10 text-center space-y-4">
          <p className="text-[#94A3B8] text-[11px] font-black uppercase tracking-widest">Ready to try it?</p>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-[-0.02em]">
            Open {tool.name} and start with the examples above
          </h2>
          <p className="text-[#94A3B8] text-sm max-w-lg mx-auto">Pricing and features change often — check the official website for current plans and availability.</p>
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { trackEvent('ai_tool_visit', { name: tool.name, url: tool.url }); }}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#C9A45C] text-[#1A1206] text-xs font-extrabold uppercase tracking-widest shadow-lg hover:brightness-110 transition-all"
          >
            Visit {tool.name} <ArrowUpRight className="w-4 h-4" />
          </a>
        </section>
      </main>
    </div>
  );
};

export default AIToolDetailView;
