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
      className="relative min-h-screen w-full flex flex-col justify-between bg-[#020407] text-[#E7E8E3] pt-6 sm:pt-8 md:pt-10 pb-12 sm:pb-16 overflow-hidden select-none"
    >
      {/* Ambient Cosmic Background Lighting (Deep Navy + Subtle Metallic Gold Specular) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Deep navy cosmic atmosphere */}
        <div className="absolute top-[36%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] sm:w-[1300px] h-[400px] sm:h-[500px] bg-gradient-to-t from-[#07101A] via-[#080D14]/70 to-transparent blur-[140px] rounded-full" />
        {/* Subtle metallic gold ambient glint behind 3D centerpiece */}
        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[600px] h-[140px] bg-[#D4AF37]/[0.08] blur-[100px] rounded-full" />
        {/* Celestial starfield */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />
      </div>

      {/* TOP SECTION: Editorial Statement with Preferred Hierarchy */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2.5 sm:space-y-3.5 pt-1 sm:pt-2">
        
        {/* Eyebrow / Kicker: MORE THAN AN AGENCY */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E7E8E3]/[0.03] border border-[#D4AF37]/25">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.28em] text-[#C9A45C] font-semibold">
            MORE THAN AN AGENCY
          </span>
        </div>

        {/* Primary Impact Headline with Metallic Gold Accent */}
        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-black tracking-[-0.02em] leading-[1.08] text-[#E7E8E3] max-w-4xl mx-auto">
          Your{' '}
          <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#C9A45C] via-[#F3D27A] to-[#D4AF37] drop-shadow-[0_0_25px_rgba(212,175,55,0.3)]">
            Long-Term Growth
          </span>{' '}
          Partner
        </h1>

        {/* Center Subtitle */}
        <div className="pt-1 text-[#B9BEC6] text-sm sm:text-base md:text-lg font-normal leading-relaxed max-w-2xl mx-auto tracking-wide">
          <p>We Put You At The Center &amp;</p>
          <p className="font-medium text-[#E7E8E3]">Transform Challenges Into Opportunities</p>
        </div>
      </div>

      {/* CENTER SECTION: 3D BRANIFY Centerpiece + Celestial Particle Dome */}
      <div className="relative z-10 w-full my-[-15px] sm:my-[-25px] flex items-center justify-center min-h-[400px] sm:min-h-[480px] md:min-h-[540px]">
        
        {/* 3D Interactive Centerpiece (Obsidian Glass, Metallic Gold B Monogram & Orbital Rings) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <HeroScene className="w-full h-full max-w-6xl mx-auto" />
        </div>

        {/* The Glowing Planetary Horizon Arc (Strictly Metallic Gold Palette) */}
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
                  <stop offset="20%" stopColor="#C9A45C" stopOpacity="0.25" />
                  <stop offset="38%" stopColor="#D4AF37" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#F3D27A" stopOpacity="0.95" />
                  <stop offset="62%" stopColor="#D4AF37" stopOpacity="0.8" />
                  <stop offset="80%" stopColor="#C9A45C" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#C9A45C" stopOpacity="0" />
                </linearGradient>

                {/* Diffuse Metallic Gold Atmospheric Glow */}
                <linearGradient id="horizonAtmoGold" x1="0%" y1="100%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#07101A" stopOpacity="0" />
                  <stop offset="25%" stopColor="#C9A45C" stopOpacity="0.12" />
                  <stop offset="50%" stopColor="#F3D27A" stopOpacity="0.4" />
                  <stop offset="75%" stopColor="#C9A45C" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#07101A" stopOpacity="0" />
                </linearGradient>

                {/* Deep Void Body Gradient Fill */}
                <linearGradient id="planetBodyDeepFade" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#07101A" stopOpacity="0.75" />
                  <stop offset="18%" stopColor="#080D14" stopOpacity="0.92" />
                  <stop offset="55%" stopColor="#020407" stopOpacity="0.99" />
                  <stop offset="100%" stopColor="#020407" stopOpacity="1" />
                </linearGradient>

                {/* Atmospheric Glow Filters */}
                <filter id="goldGlowWide" x="-20%" y="-100%" width="140%" height="300%">
                  <feGaussianBlur stdDeviation="20" result="blurWide" />
                  <feMerge>
                    <feMergeNode in="blurWide" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="goldGlowTight" x="-10%" y="-50%" width="120%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="blurTight" />
                  <feMerge>
                    <feMergeNode in="blurTight" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Underlying Deep Navy / Void Planet Body */}
              <path
                d="M 0,220 Q 720,24 1440,220 L 1440,260 L 0,260 Z"
                fill="url(#planetBodyDeepFade)"
              />

              {/* Layer 1: Wide Diffuse Metallic Gold Atmospheric Beam */}
              <path
                d="M 0,220 Q 720,24 1440,220"
                stroke="url(#horizonAtmoGold)"
                strokeWidth="24"
                strokeLinecap="round"
                filter="url(#goldGlowWide)"
                className="opacity-65"
              />

              {/* Layer 2: Medium Metallic Glow Beam */}
              <path
                d="M 0,220 Q 720,24 1440,220"
                stroke="url(#horizonAtmoGold)"
                strokeWidth="8"
                strokeLinecap="round"
                filter="url(#goldGlowTight)"
                className="opacity-85"
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
          <div className="absolute top-[32%] w-[360px] h-[26px] bg-[#F3D27A] rounded-full blur-[24px] opacity-50" />
        </div>
      </div>

      {/* BOTTOM SECTION: Who We Are & Mission Statement with Clear Conversion CTAs */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3 sm:space-y-4 pb-2">
        
        {/* "Who We Are" Header */}
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#E7E8E3] tracking-tight">
          Who We Are
        </h2>

        {/* Subheader: Turning Challenges into Digital Success */}
        <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#C9A45C] via-[#F3D27A] to-[#D4AF37] drop-shadow-[0_0_20px_rgba(212,175,55,0.25)]">
          Turning Challenges into Digital Success
        </p>

        {/* Detailed Narrative Paragraph */}
        <p className="text-xs sm:text-sm md:text-base text-[#B9BEC6] font-light leading-relaxed max-w-2xl mx-auto tracking-normal">
          We&apos;re An Expert Team In Implementing Innovative Solutions Using Cutting-Edge Technology. From Customer Acquisition To Retention, We Transform The Digital Experience With Responsible AI And Measurable Strategies.
        </p>

        {/* Seamless Actions Row with Requested Conversion CTAs */}
        <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            id="hero-inquiry-cta"
            onClick={onStartProject}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#C9A45C] via-[#D4AF37] to-[#F3D27A] hover:from-[#D4AF37] hover:to-[#FFF0C2] text-[#080D14] font-bold text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(201,164,92,0.3)] hover:shadow-[0_0_35px_rgba(243,210,122,0.45)] transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#080D14]" />
            <span>START A PROJECT</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#080D14]" />
          </button>

          <button
            id="hero-explore-services-cta"
            onClick={scrollToServices}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-[#E7E8E3]/20 bg-[#080D14]/80 hover:bg-[#07101A] hover:border-[#C9A45C]/50 text-[#E7E8E3] font-medium text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <span>EXPLORE OUR WORK</span>
            <ArrowDown className="w-3.5 h-3.5 text-[#F3D27A]" />
          </button>
        </div>

      </div>

      {/* Subtle Scroll Hint */}
      <div className="relative z-20 pt-2 flex justify-center pointer-events-none opacity-50">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-[#B9BEC6]/65">
            Scroll to Specialized Services
          </span>
          <div className="w-[1px] h-4 bg-gradient-to-b from-[#D4AF37] to-transparent animate-pulse" />
        </div>
      </div>

    </section>
  );
};
