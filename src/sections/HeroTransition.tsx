import React from 'react';
import { Sparkles } from 'lucide-react';

export const HeroTransition: React.FC = () => {
  return (
    <section className="relative py-28 sm:py-36 md:py-44 w-full bg-[#08090B] overflow-hidden border-y border-white/[0.05]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-mesh-radial pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.03] border border-[#D4AF37]/25 text-[#D4AF37] text-[11px] font-mono uppercase tracking-[0.25em]">
          <Sparkles className="w-3 h-3" />
          <span>Our Vision & Philosophy</span>
        </div>

        {/* Cinematic Large Statement */}
        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-[-0.03em] leading-[0.95] text-[#FFF5DC] max-w-5xl mx-auto">
          We Turn Ideas <br />
          <span className="text-gold-gradient">Into Digital Experiences.</span>
        </h2>

        {/* Narrative Subtitle */}
        <p className="text-base sm:text-xl text-white/60 font-light max-w-2xl mx-auto leading-relaxed pt-2">
          From concept to code, we engineer digital ecosystems where high aesthetic standards converge with relentless computational power.
        </p>

        {/* Architectural Divider Line with Center Gold Node */}
        <div className="pt-8 flex items-center justify-center gap-3">
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent to-[#D4AF37]/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]" />
          <div className="w-24 h-[1px] bg-gradient-to-l from-transparent to-[#D4AF37]/50" />
        </div>
      </div>
    </section>
  );
};
