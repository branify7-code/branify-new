import React, { lazy, Suspense } from 'react';
import { ArrowRight, Sparkles, ArrowDown } from 'lucide-react';

// Three.js scene is heavy - load it async so first paint never waits for WebGL.
const HeroScene = lazy(() =>
  import('../components/HeroScene').then((m) => ({ default: m.HeroScene }))
);

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
      className="relative min-h-screen w-full flex flex-col justify-between bg-white text-[#334155] pt-6 sm:pt-8 md:pt-10 pb-12 sm:pb-16 overflow-hidden select-none"
    >
      {/* Ambient Light Atmosphere (Soft Indigo / Lavender / Warm Gold Specular) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Soft indigo sky wash */}
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] sm:w-[1300px] h-[420px] sm:h-[520px] bg-gradient-to-b from-[#EEF2FF] via-[#F5F3FF]/70 to-transparent blur-[120px] rounded-full" />
        {/* Cool blue side glow */}
        <div className="absolute top-[22%] -left-40 w-[480px] h-[360px] bg-[#DBEAFE]/70 blur-[130px] rounded-full" />
        {/* Warm gold ambient glint behind 3D centerpiece */}
        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[620px] h-[150px] bg-[#D4AF37]/[0.10] blur-[110px] rounded-full" />
        {/* Fine slate dot texture */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.055)_1px,transparent_1px)] [background-size:24px_24px] opacity-45" />
      </div>

      {/* TOP SECTION: Editorial Statement with Preferred Hierarchy */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2.5 sm:space-y-3.5 pt-1 sm:pt-2">

        {/* Eyebrow / Kicker: HIGH-END DIGITAL AGENCY + availability */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B5FEF]" />
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.28em] text-[#475569] font-semibold">
              HIGH-END DIGITAL AGENCY
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
            <Sparkles className="w-3 h-3 text-[#B8923E]" />
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.28em] text-[#B8923E] font-semibold">
              Accepting Q3/Q4 Projects
            </span>
          </div>
        </div>

        {/* Primary Impact Headline with Indigo→Blue Editorial Accent */}
        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold tracking-[-0.03em] leading-[1.06] text-[#111827] max-w-4xl mx-auto">
          Digital{' '}
          <span className="relative inline-block italic text-transparent bg-clip-text bg-gradient-to-r from-[#5B5FEF] via-[#3B82F6] to-[#8B5CF6]">
            Excellence
          </span>{' '}
          Redefined<span className="text-[#C9A45C]">.</span>
        </h1>

        {/* Center Subtitle */}
        <div className="pt-1 text-[#64748B] text-sm sm:text-base md:text-lg font-normal leading-relaxed max-w-2xl mx-auto tracking-wide">
          <p>
            We architect premium digital experiences that combine innovative technology,{' '}
            <span className="font-medium text-[#334155]">
              deterministic engineering, and luxury aesthetic precision for visionary brands.
            </span>
          </p>
        </div>
      </div>

      {/* CENTER SECTION: 3D BRANIFY Centerpiece + Light Horizon Composition */}
      <div className="relative z-10 w-full my-[-15px] sm:my-[-25px] flex items-center justify-center min-h-[400px] sm:min-h-[480px] md:min-h-[540px]">

        {/* 3D Interactive Centerpiece (Glass, Metallic Gold B Monogram & Orbital Rings) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <Suspense fallback={<div className="w-full h-full max-w-6xl mx-auto" aria-hidden="true" />}>
            <HeroScene className="w-full h-full max-w-6xl mx-auto" />
          </Suspense>
        </div>

        {/* The Luminous Horizon Arc (Gold Rim on Light Atmosphere) */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center justify-center w-full overflow-visible">

          <div className="w-full max-w-7xl px-2 sm:px-4">
            <svg
              viewBox="0 0 1440 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Core Metallic Gold Horizon Beam */}
                <linearGradient id="horizonCoreGold" x1="0%" y1="100%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C9A45C" stopOpacity="0" />
                  <stop offset="20%" stopColor="#C9A45C" stopOpacity="0.30" />
                  <stop offset="38%" stopColor="#D4AF37" stopOpacity="0.75" />
                  <stop offset="50%" stopColor="#B8860B" stopOpacity="0.9" />
                  <stop offset="62%" stopColor="#D4AF37" stopOpacity="0.75" />
                  <stop offset="80%" stopColor="#C9A45C" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#C9A45C" stopOpacity="0" />
                </linearGradient>

                {/* Diffuse Indigo Atmospheric Glow */}
                <linearGradient id="horizonAtmoIndigo" x1="0%" y1="100%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EEF2FF" stopOpacity="0" />
                  <stop offset="25%" stopColor="#5B5FEF" stopOpacity="0.10" />
                  <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.22" />
                  <stop offset="75%" stopColor="#5B5FEF" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#EEF2FF" stopOpacity="0" />
                </linearGradient>

                {/* Soft Light Horizon Body Fill (fades into page white) */}
                <linearGradient id="horizonBodyLight" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.55" />
                  <stop offset="30%" stopColor="#EEF2FF" stopOpacity="0.35" />
                  <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
                </linearGradient>

                {/* Atmospheric Glow Filters */}
                <filter id="horizonGlowWide" x="-20%" y="-100%" width="140%" height="300%">
                  <feGaussianBlur stdDeviation="20" result="blurWide" />
                  <feMerge>
                    <feMergeNode in="blurWide" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="horizonGlowTight" x="-10%" y="-50%" width="120%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="blurTight" />
                  <feMerge>
                    <feMergeNode in="blurTight" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Soft Light Horizon Body */}
              <path
                d="M 0,220 Q 720,24 1440,220 L 1440,260 L 0,260 Z"
                fill="url(#horizonBodyLight)"
              />

              {/* Layer 1: Wide Diffuse Indigo Atmospheric Beam */}
              <path
                d="M 0,220 Q 720,24 1440,220"
                stroke="url(#horizonAtmoIndigo)"
                strokeWidth="24"
                strokeLinecap="round"
                filter="url(#horizonGlowWide)"
                className="opacity-70"
              />

              {/* Layer 2: Medium Glow Beam */}
              <path
                d="M 0,220 Q 720,24 1440,220"
                stroke="url(#horizonAtmoIndigo)"
                strokeWidth="8"
                strokeLinecap="round"
                filter="url(#horizonGlowTight)"
                className="opacity-80"
              />

              {/* Layer 3: Razor Sharp Champagne Gold Rim Light */}
              <path
                d="M 0,220 Q 720,24 1440,220"
                stroke="url(#horizonCoreGold)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Central Refined Gold Corona Glint (Subtle & Elegant) */}
          <div className="absolute top-[32%] w-[360px] h-[26px] bg-[#D4AF37] rounded-full blur-[26px] opacity-30" />
        </div>
      </div>

      {/* BOTTOM SECTION: Who We Are & Mission Statement with Clear Conversion CTAs */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3 sm:space-y-4 pb-2">

        {/* "Who We Are" Header */}
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#111827] tracking-tight">
          Who We Are
        </h2>

        {/* Subheader: Turning Challenges into Digital Success */}
        <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-gold-gradient">
          Turning Challenges into Digital Success
        </p>

        {/* Detailed Narrative Paragraph */}
        <p className="text-xs sm:text-sm md:text-base text-[#475569] font-normal leading-relaxed max-w-2xl mx-auto tracking-normal">
          We&apos;re An Expert Team In Implementing Innovative Solutions Using Cutting-Edge Technology. From Customer Acquisition To Retention, We Transform The Digital Experience With Responsible AI And Measurable Strategies.
        </p>

        {/* Seamless Actions Row with Requested Conversion CTAs */}
        <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            id="hero-inquiry-cta"
            onClick={onStartProject}
            className="btn-gold-primary w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#1A1206]" />
            <span>START A PROJECT</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#1A1206]" />
          </button>

          <button
            id="hero-explore-services-cta"
            onClick={scrollToServices}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-[#E2E8F0] bg-white/80 backdrop-blur hover:bg-white hover:border-[#5B5FEF]/50 hover:text-[#5B5FEF] text-[#334155] font-medium text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
          >
            <span>EXPLORE OUR WORK</span>
            <ArrowDown className="w-3.5 h-3.5 text-[#5B5FEF]" />
          </button>
        </div>

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
