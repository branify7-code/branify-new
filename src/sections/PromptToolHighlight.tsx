/* =========================================================
   PromptToolHighlight — homepage highlight for the BRANIFY-owned
   "Free AI Prompt Generator" (/ai-tools/free-ai-prompt-generator).
   ---------------------------------------------------------
   · Uses the CURRENT BRANIFY light design system (white / warm
     gray cards, gold + indigo/purple accents, existing type and
     spacing scale). Noticeable but smaller than the Hero.
   · Placement: after the AI Tools showcase (section 7), before
     the Process timeline — no disruption to the existing journey.
   · Right side: a STATIC, clearly-labelled "Example" mini
     preview of the generator flow (input → generate → prompt).
     Nothing here pretends to be a live AI output.
========================================================= */
import React from 'react';
import { ArrowRight, Check, Sparkles, Wand2 } from 'lucide-react';
import { trackEvent } from '../lib/track';

interface PromptToolHighlightProps {
  onNavigate: (path: string) => void;
}

export const PromptToolHighlight: React.FC<PromptToolHighlightProps> = ({ onNavigate }) => {
  const onTry = () => trackEvent('home_prompt_tool_cta', { cta: 'try_tool' });
  const onExplore = () => trackEvent('home_prompt_tool_cta', { cta: 'explore_ai_tools' });

  return (
    <section aria-labelledby="prompt-tool-heading" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl border border-[#E2E8F0] bg-gradient-to-br from-white via-[#F8FAFF] to-[#EEF2FF] p-7 sm:p-10 lg:p-12 shadow-[0_10px_40px_-18px_rgba(15,23,42,0.12)]">
        {/* soft glows (light system) */}
        <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 bg-[#8B5CF6]/[0.08] blur-[100px] rounded-full" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-80 h-80 bg-[#C9A45C]/[0.10] blur-[100px] rounded-full" aria-hidden="true" />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* left — copy + CTAs */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#4338CA]">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Free AI Tool · BRANIFY Original
            </div>
            <h2
              id="prompt-tool-heading"
              className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-[-0.02em] leading-[1.12] mt-5"
            >
              Create Better{' '}
              <span className="bg-gradient-to-r from-[#5B5FEF] via-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
                AI Prompts
              </span>{' '}
              in Seconds
            </h2>
            <p className="text-[#475569] text-sm sm:text-base leading-relaxed mt-4 max-w-lg mx-auto lg:mx-0">
              Write what you want in simple words.
              <span className="font-semibold text-[#111827]"> BRANIFY turns your idea into a ready-to-use AI prompt</span> — for
              images, blogs, social media, marketing, coding and more. Free, no sign-up needed.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 mt-7">
              <button
                type="button"
                onClick={() => { onTry(); onNavigate('/ai-tools/free-ai-prompt-generator'); }}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-b from-[#F6DF84] via-[#D4AF37] to-[#B3841F] text-[#1A1206] text-[11px] font-extrabold uppercase tracking-[0.14em] shadow-lg shadow-[#C9A45C]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#C9A45C]/35 hover:brightness-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A45C] focus-visible:ring-offset-2"
              >
                Try the Free AI Tool
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => { onExplore(); onNavigate('/ai-tools'); }}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-[#E2E8F0] bg-white text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#475569] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5B5FEF]/40 hover:text-[#4338CA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B5FEF]/50 focus-visible:ring-offset-2"
              >
                Explore All AI Tools
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* right — static labelled example preview */}
          <div className="relative max-w-md w-full mx-auto lg:mx-0 lg:justify-self-end">
            <span className="absolute -top-3 right-4 z-10 text-[9px] font-black uppercase tracking-[0.25em] text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] rounded-full px-3 py-1">
              Example
            </span>
            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-[0_16px_50px_-20px_rgba(15,23,42,0.18)] space-y-4">
              {/* step 1: idea */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#94A3B8] mb-1">Your idea</p>
                <p className="text-[13px] text-[#334155] leading-relaxed">"Create a luxury restaurant campaign…"</p>
              </div>
              {/* arrow */}
              <div className="flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-gradient-to-r from-[#C7D2FE] to-transparent" />
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] rounded-full px-3 py-1.5">
                  <Wand2 className="w-3 h-3" /> Generate Prompt
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-[#C7D2FE] to-transparent" />
              </div>
              {/* step 2: prompt */}
              <div className="rounded-2xl border border-[#C7D2FE] bg-gradient-to-b from-[#F8FAFF] to-white px-4 py-3">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#5B5FEF] mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" aria-hidden="true" /> Your AI prompt
                </p>
                <p className="text-[12px] text-[#475569] leading-relaxed line-clamp-4">
                  Act as a social media creative director. Create a 3-post Instagram campaign for a
                  premium fine-dining restaurant… include hook, caption, visual direction and hashtags.
                  Tone: elegant, warm, exclusive.
                </p>
                <p className="mt-2.5 flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                  <Check className="w-3 h-3" aria-hidden="true" /> Ready to paste into ChatGPT, Claude, Gemini, Midjourney…
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromptToolHighlight;
