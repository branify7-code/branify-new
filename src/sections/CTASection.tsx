import React from 'react';
import { ArrowRight, Sparkles, ArrowUpRight } from 'lucide-react';

interface CTASectionProps {
  onStartProject: () => void;
  onViewWork: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onStartProject, onViewWork }) => {
  return (
    <section id="contact" className="relative py-28 sm:py-40 overflow-hidden">
      {/* Indigo → Blue → Purple gradient atmosphere — the memorable closing section */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#4338CA] via-[#4F6BF6] to-[#7C3AED]" />
      {/* Soft decorative shapes */}
      <div className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-white/10 blur-[110px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-16 w-[480px] h-[480px] rounded-full bg-[#EC4899]/20 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[280px] h-[280px] rounded-full border border-white/15 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] sm:w-[900px] h-[720px] sm:h-[900px] rounded-full border border-white/10 pointer-events-none opacity-60" />
      {/* fine dot texture */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:26px_26px] opacity-30 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/12 border border-white/25 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#FFE9A8]" />
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-white/85">
            Initiate Collaboration
          </span>
        </div>

        {/* Large Statement */}
        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.03em] leading-[1.02] text-white max-w-4xl mx-auto">
          Ready to Elevate <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFE9A8] via-white to-[#C7D2FE]">
            Your Digital Presence?
          </span>
        </h2>

        {/* Supporting Copy */}
        <p className="text-base sm:text-xl text-white/75 font-light max-w-2xl mx-auto leading-relaxed">
          Let's create something meaningful, beautiful and built for growth. Reach out directly to begin your project discovery.
        </p>

        {/* Dual Action Buttons */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="cta-start-project-btn"
            onClick={onStartProject}
            className="w-full sm:w-auto px-10 py-5 rounded-full bg-white text-[#3730A3] hover:bg-[#FFFBEB] font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_18px_44px_-12px_rgba(0,0,0,0.45)] hover:shadow-[0_22px_54px_-12px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Start a Project</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="cta-view-work-btn"
            onClick={onViewWork}
            className="w-full sm:w-auto px-10 py-5 rounded-full border border-white/40 bg-white/10 hover:bg-white/20 hover:border-white/70 text-white font-semibold text-xs uppercase tracking-widest transition-all duration-300 backdrop-blur-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View Our Work</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Direct Channel Info */}
        <div className="pt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-white/60">
          <span>Direct Inquiries: <a href="mailto:admin@branify.store" className="text-[#FFE9A8] hover:underline">admin@branify.store</a></span>
          <span>•</span>
          <span>Response SLA: &lt; 24 Hours</span>
          <span>•</span>
          <span>Global Partner Hubs: Tokyo • London • SF</span>
        </div>

      </div>
    </section>
  );
};
