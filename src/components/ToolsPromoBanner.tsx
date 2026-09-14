import React, { useEffect, useState } from 'react';
import { Bot, BarChart2, PieChart, TrendingUp, MessageSquare, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/track';

/* =============================================================================
   BRANIFY — ToolsPromoBanner
   -----------------------------------------------------------------------------
   High-converting promo banner for the top of /tools (per supplied design):
   • Dark premium navy gradient + amber glow + subtle network mesh (pure CSS/SVG,
     zero image payload, zero JS animation libs)
   • Left: headline (white + gold accents), subheadline, dual CTA, micro-text
   • Right: glassmorphism app mockup (CSS-only browser card, chart + chatbot)
   • CTA 1 "Book a Free Strategy Call" → official WhatsApp (central admin
     setting settings.contact.whatsapp — same source of truth as the estimator)
   • CTA 2 "Get Project Estimate" → opens the existing 4-step estimator modal
     via onStartInquiry (App.handleOpenInquiry)
   • Responsive: stacks on mobile, 2-col grid from lg up
   ========================================================================== */

/** Fallback = current central contact setting (matches Footer + estimator). */
const WA_FALLBACK_DIGITS = '923321029333';

let cachedWaDigits: string | null = null;

/** Read the official WhatsApp number from the central contact setting. */
async function resolveWhatsAppDigits(): Promise<string> {
  if (cachedWaDigits) return cachedWaDigits;
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'contact')
      .single();
    const digits = String((data?.value as { whatsapp?: string } | null)?.whatsapp || '')
      .replace(/[^0-9]/g, '');
    cachedWaDigits = digits.length >= 8 ? digits : WA_FALLBACK_DIGITS;
  } catch {
    cachedWaDigits = WA_FALLBACK_DIGITS;
  }
  return cachedWaDigits;
}

const STRATEGY_CALL_MESSAGE =
  "Hi BRANIFY! I'd like to book a FREE strategy call to discuss a custom web app / AI chatbot for my business.";

interface ToolsPromoBannerProps {
  /** Opens the existing START A PROJECT estimator modal (App.handleOpenInquiry). */
  onStartInquiry?: () => void;
}

/* ------------------------------ tiny sub-parts ----------------------------- */

/** Subtle network mesh + node dots (decorative, pure SVG). */
const MeshDecor: React.FC = () => (
  <svg
    className="absolute inset-0 h-full w-full opacity-70 pointer-events-none"
    viewBox="0 0 800 420"
    fill="none"
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
  >
    <g stroke="rgba(148,180,255,0.10)" strokeWidth="1">
      <line x1="40" y1="60" x2="210" y2="140" />
      <line x1="210" y1="140" x2="120" y2="280" />
      <line x1="210" y1="140" x2="420" y2="80" />
      <line x1="420" y1="80" x2="560" y2="190" />
      <line x1="560" y1="190" x2="430" y2="300" />
      <line x1="430" y1="300" x2="250" y2="330" />
      <line x1="250" y1="330" x2="120" y2="280" />
      <line x1="560" y1="190" x2="700" y2="90" />
      <line x1="700" y1="90" x2="770" y2="240" />
      <line x1="770" y1="240" x2="560" y2="190" />
      <line x1="430" y1="300" x2="640" y2="380" />
    </g>
    <g fill="rgba(212,175,55,0.55)">
      <circle cx="210" cy="140" r="2.5" />
      <circle cx="560" cy="190" r="2.5" />
      <circle cx="700" cy="90" r="2" />
    </g>
    <g fill="rgba(255,255,255,0.25)">
      <circle cx="420" cy="80" r="2" />
      <circle cx="120" cy="280" r="2" />
      <circle cx="430" cy="300" r="2" />
      <circle cx="770" cy="240" r="2" />
      <circle cx="250" cy="330" r="1.6" />
    </g>
  </svg>
);

/** Glassmorphism browser-card mockup with chart skeleton + chatbot panel. */
const AppMockup: React.FC = () => (
  <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[400px] animate-brn-float motion-reduce:animate-none">
    {/* floating glass chips around the card */}
    <div className="absolute -top-4 -left-3 sm:-left-6 z-20 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-md shadow-lg animate-brn-float-slow motion-reduce:animate-none">
      <BarChart2 className="h-4 w-4 text-[#F6DF84]" aria-hidden="true" />
      <span className="block h-1.5 w-10 rounded-full bg-white/40" aria-hidden="true" />
    </div>
    <div className="absolute -bottom-5 -right-2 sm:-right-5 z-20 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-md shadow-lg animate-brn-float motion-reduce:animate-none" style={{ animationDelay: '1.2s' }}>
      <PieChart className="h-4 w-4 text-[#F6DF84]" aria-hidden="true" />
      <span className="block h-1.5 w-8 rounded-full bg-white/40" aria-hidden="true" />
    </div>

    {/* browser card */}
    <div className="relative z-10 rounded-2xl border border-white/20 bg-white/10 p-3 shadow-[0_30px_60px_-20px_rgba(2,8,23,0.7)] backdrop-blur-xl transition-transform duration-500 hover:-translate-y-1.5">
      {/* chrome bar */}
      <div className="flex items-center gap-2 px-1 pb-3">
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="ml-2 h-4 flex-1 rounded-md bg-white/10 border border-white/10" />
      </div>
      {/* body: sidebar + content */}
      <div className="grid grid-cols-[52px_1fr] sm:grid-cols-[60px_1fr] gap-2.5">
        {/* sidebar skeleton */}
        <div className="space-y-2 rounded-xl bg-white/5 border border-white/10 p-2.5" aria-hidden="true">
          <span className="block h-2 w-8 rounded-full bg-[#D4AF37]/70" />
          <span className="block h-2 w-6 rounded-full bg-white/25" />
          <span className="block h-2 w-7 rounded-full bg-white/25" />
          <span className="block h-2 w-5 rounded-full bg-white/25" />
          <span className="block h-2 w-7 rounded-full bg-white/25" />
        </div>
        {/* main panel: chart + chat */}
        <div className="space-y-2.5">
          {/* mini bar chart card */}
          <div className="rounded-xl bg-white/95 p-3 shadow-lg" aria-hidden="true">
            <span className="mb-2 block h-1.5 w-14 rounded-full bg-slate-300" />
            <div className="flex h-12 items-end gap-1.5">
              {[40, 70, 55, 90, 65, 100].map((h, i) => (
                <span
                  key={i}
                  className="w-full rounded-t bg-gradient-to-b from-[#F6DF84] to-[#D4AF37]"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          {/* chatbot thread */}
          <div className="rounded-xl bg-white/10 border border-white/15 p-2.5 space-y-2 backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/90 shadow">
                <Bot className="h-3.5 w-3.5 text-[#0D1F3C]" aria-hidden="true" />
              </span>
              <span className="rounded-lg rounded-tl-none bg-white/90 px-2.5 py-1.5" aria-hidden="true">
                <span className="block h-1.5 w-16 rounded-full bg-slate-300" />
                <span className="mt-1 block h-1.5 w-10 rounded-full bg-slate-200" />
              </span>
            </div>
            <div className="flex justify-end pl-8">
              <span className="rounded-lg rounded-tr-none bg-gradient-to-b from-[#F6DF84] to-[#D4AF37] px-2.5 py-1.5 shadow" aria-hidden="true">
                <span className="block h-1.5 w-16 rounded-full bg-[#1A1206]/30" />
                <span className="mt-1 block h-1.5 w-12 rounded-full bg-[#1A1206]/20" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* gold sparkle star + chatbot badge (bottom-right, like the design) */}
    <div
      className="absolute -bottom-6 -right-3 sm:-right-6 z-0 h-16 w-16 sm:h-20 sm:w-20 rotate-12 bg-gradient-to-br from-[#F6DF84] via-[#D4AF37] to-[#B3841F] opacity-90"
      style={{ clipPath: 'polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)' }}
      aria-hidden="true"
    />
    <div className="absolute -bottom-3 right-8 sm:right-14 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-[#0D1F3C]/80 backdrop-blur-md shadow-lg animate-brn-float-slow motion-reduce:animate-none">
      <MessageSquare className="h-4 w-4 text-[#F6DF84]" aria-hidden="true" />
    </div>
  </div>
);

/* --------------------------------- banner --------------------------------- */

const ToolsPromoBanner: React.FC<ToolsPromoBannerProps> = ({ onStartInquiry }) => {
  const [waHref, setWaHref] = useState<string>(
    `https://wa.me/${WA_FALLBACK_DIGITS}?text=${encodeURIComponent(STRATEGY_CALL_MESSAGE)}`
  );

  useEffect(() => {
    let alive = true;
    resolveWhatsAppDigits().then((digits) => {
      if (alive) setWaHref(`https://wa.me/${digits}?text=${encodeURIComponent(STRATEGY_CALL_MESSAGE)}`);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onStrategyCall = () => trackEvent('tools_banner_cta_click', { cta: 'strategy_call' });
  const onEstimate = () => {
    trackEvent('tools_banner_cta_click', { cta: 'estimate' });
    onStartInquiry?.();
  };

  return (
    <section
      aria-labelledby="tools-promo-heading"
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8"
    >
      <style>{`
        @keyframes brn-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes brn-float-slow { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-brn-float { animation: brn-float 5s ease-in-out infinite; }
        .animate-brn-float-slow { animation: brn-float-slow 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-brn-float, .animate-brn-float-slow { animation: none; }
        }
      `}</style>

      <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#0A1626_0%,#0D1F3C_48%,#17335F_100%)] shadow-[0_24px_70px_-24px_rgba(2,8,23,0.55)]">
        {/* ambient glows */}
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-[340px] w-[340px] rounded-full bg-[radial-gradient(closest-side,rgba(212,175,55,0.32),transparent)] blur-2xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-28 -left-20 h-[300px] w-[300px] rounded-full bg-[radial-gradient(closest-side,rgba(91,95,239,0.22),transparent)] blur-2xl" aria-hidden="true" />
        <MeshDecor />

        <div className="relative px-5 pt-6 pb-8 sm:px-8 sm:pt-7 sm:pb-10 lg:px-12 lg:py-12">
          {/* brand row */}
          <img
            src="/brand/branify-logo.png"
            alt="BRANIFY"
            width={1672}
            height={941}
            className="h-8 w-auto lg:h-9 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
            loading="eager"
          />

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-8">
            {/* left: copy + CTAs */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <h2
                id="tools-promo-heading"
                className="font-display text-[1.35rem] leading-[1.22] sm:text-3xl sm:leading-[1.2] lg:text-[2.35rem] lg:leading-[1.16] font-extrabold text-white tracking-[-0.01em]"
              >
                <span className="mr-1.5" aria-hidden="true">💡</span>
                NEED A CUSTOM{' '}
                <span className="bg-gradient-to-r from-[#F6DF84] via-[#D4AF37] to-[#E9CF79] bg-clip-text text-transparent">WEB APP</span>{' '}
                OR{' '}
                <span className="bg-gradient-to-r from-[#F6DF84] via-[#D4AF37] to-[#E9CF79] bg-clip-text text-transparent">AI CHATBOT</span>{' '}
                FOR YOUR BUSINESS?
              </h2>

              <p className="mt-4 text-[13px] sm:text-sm uppercase tracking-[0.14em] leading-relaxed text-[#A9B8D4] max-w-xl mx-auto lg:mx-0">
                We build tailored digital solutions that scale. Transform your vision into a high-performing product.
              </p>

              {/* CTAs */}
              <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3.5">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onStrategyCall}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#F6DF84] via-[#D4AF37] to-[#B3841F] px-7 py-3.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.14em] text-[#1A1206] shadow-lg shadow-[#D4AF37]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#D4AF37]/40 hover:brightness-[1.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F6DF84] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1F3C]"
                >
                  Book a Free Strategy Call
                  <TrendingUp className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={onEstimate}
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/[0.07] px-7 py-3.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.14em] text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/[0.14] hover:shadow-lg hover:shadow-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1F3C]"
                >
                  Get Project Estimate
                </button>
              </div>

              {/* micro-text */}
              <p className="mt-6 flex items-center justify-center lg:justify-start gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-white/45">
                <Zap className="h-3.5 w-3.5 text-[#F6DF84]" aria-hidden="true" />
                Powered by the team at{' '}
                <span className="font-extrabold text-white/85">BRANIFY</span>
              </p>
            </div>

            {/* right: glassmorphism mockup */}
            <div className="lg:col-span-5 pt-4 lg:pt-0 pb-6 lg:pb-0">
              <AppMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ToolsPromoBanner;
