import React from 'react';
import { ArrowRight, Sparkles, ArrowDown } from 'lucide-react';
import { HeroScene } from '../components/HeroScene';

interface HeroProps {
  onStartProject: () => void;
  onExploreWork: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartProject, onExploreWork }) => {
  const scrollToServices = () => {
    const servicesEl = document.getElementById('services');
    if (servicesEl) {
      servicesEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      onExploreWork();
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-screen w-full flex flex-col bg-white text-[#334155] pt-8 sm:pt-10 pb-10 sm:pb-12 overflow-hidden select-none"
    >
      {/* Ambient Light Atmosphere (Soft Indigo / Lavender / Warm Gold Specular) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Soft indigo sky wash */}
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] sm:w-[1300px] h-[420px] sm:h-[520px] bg-gradient-to-b from-[#EEF2FF] via-[#F5F3FF]/70 to-transparent blur-[120px] rounded-full" />
        {/* Cool blue side glow */}
        <div className="absolute top-[22%] -left-40 w-[480px] h-[360px] bg-[#DBEAFE]/70 blur-[130px] rounded-full" />
        {/* Warm gold ambient glint behind 3D centerpiece (shifted right) */}
        <div className="absolute top-[46%] left-[68%] -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[620px] h-[150px] bg-[#D4AF37]/[0.10] blur-[110px] rounded-full" />
        {/* Fine slate dot texture */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.055)_1px,transparent_1px)] [background-size:24px_24px] opacity-45" />
      </div>

      {/* ============ MAIN SPLIT: Editorial Copy (Left) + 3D Gold Monogram (Right) ============ */}
      <div className="relative z-20 flex-1 w-full max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 grid lg:grid-cols-[1.04fr_0.96fr] gap-6 lg:gap-2 items-center">
        {/* ---------- LEFT: Editorial Statement ---------- */}
        <div className="text-left pt-1 lg:pt-0">
          {/* Eyebrow: agency line + availability */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="hidden sm:block h-px w-12 bg-[#C9A45C]/80" aria-hidden="true" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.24em] text-[#111827]">
              High-End Digital Agency
            </span>
            <span className="text-slate-300 text-xs" aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#B8923E]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Accepting Q3/Q4 Projects</span>
            </span>
          </div>

          {/* Headline: Digital Excellence Redefined. */}
          <h1 className="mt-5 font-display text-[2.55rem] leading-[1.06] sm:text-5xl sm:leading-[1.05] lg:text-[3.5rem] xl:text-[4.1rem] 2xl:text-[4.5rem] font-extrabold tracking-[-0.035em] text-[#111827]">
            Digital{' '}
            <span className="italic text-transparent bg-clip-text bg-gradient-to-br from-[#6A6EF5] via-[#5B5FEF] to-[#4F46E5]">
              Excellence
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#141C2C] from-30% via-[#64748B] via-62% to-[#C9A45C]">
              Redefined
            </span>
            <span className="text-[#C9A45C]">.</span>
          </h1>

          {/* Supporting statement */}
          <p className="mt-5 sm:mt-6 max-w-xl text-slate-500 text-base sm:text-lg leading-relaxed">
            We architect premium digital experiences that combine innovative
            technology, deterministic engineering, and luxury aesthetic
            precision for visionary brands.
          </p>

          {/* Conversion CTAs */}
          <div className="mt-8 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            <button
              id="hero-inquiry-cta"
              onClick={onStartProject}
              className="btn-gold-primary w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#1A1206]" />
              <span>Start a Project</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#1A1206]" />
            </button>

            <button
              id="hero-explore-services-cta"
              onClick={scrollToServices}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-[#E2E8F0] bg-white/80 backdrop-blur hover:bg-white hover:border-[#5B5FEF]/50 hover:text-[#5B5FEF] text-[#334155] font-medium text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
            >
              <span>Explore Our Work</span>
              <ArrowDown className="w-3.5 h-3.5 text-[#5B5FEF]" />
            </button>
          </div>
        </div>

        {/* ---------- RIGHT: 3D BRANIFY Gold Monogram Centerpiece ---------- */}
        <div className="relative h-[340px] sm:h-[440px] lg:h-[540px] xl:h-[580px] -mx-2 sm:mx-0">
          <HeroScene className="w-full h-full" />

          {/* Official brand asset plate (desktop only, per design) */}
          <div className="absolute bottom-3 right-2 hidden xl:inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-white/85 backdrop-blur border border-[#E2E8F0] shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
            <span className="w-1.5 h-1.5 bg-[#C9A45C]" aria-hidden="true" />
            <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.22em] text-[#64748B]">
              Official Brand Asset · 3D Gold Monogram
            </span>
          </div>
        </div>
      </div>

      {/* ============ BOTTOM: Who We Are & Mission Statement ============ */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2 sm:space-y-3 pt-6 sm:pt-8 pb-1">
        {/* "Who We Are" Header */}
        <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
          Who We Are
        </h2>

        {/* Subheader: Turning Challenges into Digital Success */}
        <p className="font-display text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-gold-gradient">
          Turning Challenges into Digital Success
        </p>

        {/* Detailed Narrative Paragraph */}
        <p className="text-xs sm:text-sm md:text-base text-[#475569] font-normal leading-relaxed max-w-2xl mx-auto tracking-normal">
          We&apos;re An Expert Team In Implementing Innovative Solutions Using Cutting-Edge Technology. From Customer Acquisition To Retention, We Transform The Digital Experience With Responsible AI And Measurable Strategies.
        </p>
      </div>

      {/* Subtle Scroll Hint */}
      <div className="relative z-20 pt-2 flex justify-center pointer-events-none opacity-60">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-[#94A3B8]">
            Scroll to Specialized Services
          </span>
          <div className="w-[1px] h-4 bg-gradient-to-b from-[#5B5FEF] to-transparent animate-pulse" />
        </div>
      </div>

    </section>
  );
};
