import React from 'react';
import { ArrowRight, Sparkles, ArrowUpRight } from 'lucide-react';

interface CTASectionProps {
  onStartProject: () => void;
  onViewWork: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onStartProject, onViewWork }) => {
  return (
    <section id="contact" className="relative py-32 sm:py-44 bg-[#08090B] text-white overflow-hidden">
      {/* Cinematic Continuation of the 3D Hero Atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-mesh-radial pointer-events-none" />
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-[#D4AF37]/8 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-[#997A15]/6 rounded-full blur-[150px] pointer-events-none" />

      {/* Decorative Metallic Ring Graphic in background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] rounded-full border border-[#D4AF37]/15 pointer-events-none opacity-40 animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] sm:w-[600px] h-[450px] sm:h-[600px] rounded-full border border-white/5 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-[#D4AF37]/30 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#F3E5AB]">
            Initiate Collaboration
          </span>
        </div>

        {/* Large Statement */}
        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-[-0.03em] leading-[0.92] text-[#FFF5DC] max-w-4xl mx-auto">
          Ready to Elevate <br />
          <span className="text-gold-gradient">Your Digital Presence?</span>
        </h2>

        {/* Supporting Copy */}
        <p className="text-base sm:text-xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed">
          Let's create something meaningful, beautiful and built for growth. Reach out directly to begin your project discovery.
        </p>

        {/* Dual Action Buttons */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="cta-start-project-btn"
            onClick={onStartProject}
            className="w-full sm:w-auto px-10 py-5 rounded-full bg-[#D4AF37] hover:bg-[#E5C378] text-[#08090B] font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Start a Project</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="cta-view-work-btn"
            onClick={onViewWork}
            className="w-full sm:w-auto px-10 py-5 rounded-full border border-white/15 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#D4AF37]/50 text-[#FFF5DC] font-semibold text-xs uppercase tracking-widest transition-all duration-300 backdrop-blur-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View Our Work</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Direct Channel Info */}
        <div className="pt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-white/40">
          <span>Direct Inquiries: <a href="mailto:hello@branify.agency" className="text-[#D4AF37] hover:underline">hello@branify.agency</a></span>
          <span>•</span>
          <span>Response SLA: &lt; 24 Hours</span>
          <span>•</span>
          <span>Global Partner Hubs: Tokyo • London • SF</span>
        </div>

      </div>
    </section>
  );
};
