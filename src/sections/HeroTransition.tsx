import React from 'react';
import { Sparkles } from 'lucide-react';

export const HeroTransition: React.FC = () => {
  return (
    <section className="relative py-28 sm:py-36 md:py-40 w-full bg-white overflow-hidden border-y border-[#E2E8F0]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-mesh-radial pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[340px] bg-[#EEF2FF] rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.04)] text-[11px] font-mono uppercase tracking-[0.25em] text-[#475569]">
          <Sparkles className="w-3 h-3 text-[#5B5FEF]" />
          <span>Our Vision & Philosophy</span>
        </div>

        {/* Large Editorial Statement */}
        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-[-0.03em] leading-[1.02] text-[#111827] max-w-5xl mx-auto">
          We Turn Ideas <br />
          <span className="text-gold-gradient">Into Digital Experiences.</span>
        </h2>

        {/* Narrative Subtitle */}
        <p className="text-base sm:text-xl text-[#64748B] max-w-2xl mx-auto leading-relaxed pt-2">
          From concept to code, we engineer digital ecosystems where high aesthetic standards converge with relentless computational power.
        </p>

        {/* Architectural Divider Line with Center Gold Node */}
        <div className="pt-8 flex items-center justify-center gap-3">
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent to-[#C9A45C]/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#C9A45C] shadow-[0_0_0_4px_rgba(201,164,92,0.15)]" />
          <div className="w-24 h-[1px] bg-gradient-to-l from-transparent to-[#C9A45C]/60" />
        </div>
      </div>
    </section>
  );
};
