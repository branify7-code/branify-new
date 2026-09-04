import React, { useState } from 'react';
import { 
  Shield, Zap, Award, Sparkles, Layers, CheckCircle2, 
  ChevronDown, ChevronUp, ArrowRight, Clock, Target, Globe 
} from 'lucide-react';
import { processStepsData } from '../../data/process';
import { statsData } from '../../data/stats';
import { whyBranifyData } from '../../data/whyBranify';
import { testimonialsData } from '../../data/testimonials';
import { faqsData } from '../../data/faqs';

interface AboutViewProps {
  onStartInquiry: () => void;
  onNavigateHome: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({
  onStartInquiry,
  onNavigateHome,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-20">
      {/* Header Breadcrumbs & Hero Title */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#D4AF37]/30 text-xs font-mono text-[#F3E5AB]">
          <button 
            onClick={onNavigateHome} 
            className="text-white/60 hover:text-[#FFF5DC] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="text-white/30">/</span>
          <span className="text-[#D4AF37]">The Studio Ethos & Architecture</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
          The Standard For <br />
          <span className="text-gold-gradient">Digital Sovereignty</span>
        </h1>

        <p className="text-sm sm:text-base text-white/65 font-light leading-relaxed">
          Branify operates at the intersection of haute couture aesthetic precision and deep-stack computational engineering. We build enduring technological advantages for the world&apos;s most ambitious brands.
        </p>
      </div>

      {/* The Manifesto Section */}
      <div id="manifesto" className="rounded-3xl bg-[#0F1015] border border-[#D4AF37]/25 p-8 sm:p-12 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase text-[#D4AF37] tracking-widest">
              Foundational Philosophy
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#FFF5DC]">
              The Branify Manifesto
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-white/75 font-light leading-relaxed pt-2">
          <p>
            In an era of homogenized web templates and generic AI copy, distinction is the ultimate competitive moat. We reject digital compromise. Every interface we architect is mathematically tuned for emotional resonance, spatial depth, and frictionless performance.
          </p>
          <p>
            We do not just construct websites; we engineer high-throughput digital flagships, autonomous agent workflows, and sovereign digital assets that multiply our clients&apos; enterprise value year over year.
          </p>
        </div>
      </div>

      {/* Verified Stats Track Record */}
      <div id="stats" className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase text-[#D4AF37] tracking-widest">
            Quantitative Precision
          </span>
          <h2 className="font-display text-3xl font-bold text-[#FFF5DC]">
            Verified Track Record
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#0F1015] border border-white/10 text-center space-y-2"
            >
              <span className="block font-display text-3xl sm:text-4xl font-extrabold text-[#D4AF37]">
                {stat.value}{stat.suffix}
              </span>
              <span className="block text-xs font-bold text-[#FFF5DC] uppercase tracking-wider">
                {stat.label}
              </span>
              <p className="text-[11px] text-white/50 font-light">
                {stat.sublabel}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5-Phase Methodology */}
      <div id="process" className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase text-[#D4AF37] tracking-widest">
            Rigorous Delivery
          </span>
          <h2 className="font-display text-3xl font-bold text-[#FFF5DC]">
            Our 5-Phase Methodology
          </h2>
          <p className="text-xs text-white/60">
            A deterministic engineering blueprint engineered to eliminate uncertainty and ship on schedule.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {processStepsData.map((step) => (
            <div
              key={step.number}
              className="p-6 rounded-2xl bg-[#0F1015] border border-white/10 space-y-3 relative hover:border-[#D4AF37]/40 transition-colors"
            >
              <span className="text-xs font-mono text-[#D4AF37] font-bold">
                PHASE {step.number}
              </span>
              <h3 className="font-display text-base font-bold text-[#FFF5DC]">
                {step.title}
              </h3>
              <p className="text-xs text-white/60 font-light leading-relaxed">
                {step.description}
              </p>
              <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-white/40">
                Duration: {step.duration}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Branify Pillars */}
      <div id="why" className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase text-[#D4AF37] tracking-widest">
            The Branify Standard
          </span>
          <h2 className="font-display text-3xl font-bold text-[#FFF5DC]">
            Why Industry Leaders Choose Branify
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyBranifyData.map((pillar) => (
            <div
              key={pillar.id}
              className="p-6 rounded-2xl bg-[#0F1015] border border-white/10 space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-[#D4AF37] flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-display text-base font-bold text-[#FFF5DC]">
                {pillar.title}
              </h3>
              <p className="text-xs text-white/60 font-light leading-relaxed">
                {pillar.description}
              </p>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-[#D4AF37] font-bold">{pillar.metric}</span>
                <span className="text-white/40 text-[10px]">{pillar.metricLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Testimonials */}
      <div id="testimonials" className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase text-[#D4AF37] tracking-widest">
            Executive Endorsements
          </span>
          <h2 className="font-display text-3xl font-bold text-[#FFF5DC]">
            What Founders & Leaders Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonialsData.map((review) => (
            <div
              key={review.id}
              className="p-6 rounded-2xl bg-[#0F1015] border border-white/10 space-y-4 flex flex-col justify-between"
            >
              <p className="text-xs text-white/80 leading-relaxed font-light italic">
                &ldquo;{review.quote}&rdquo;
              </p>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#FFF5DC]">{review.author}</h4>
                  <span className="text-[10px] text-white/50">{review.role}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37]">
                  {review.company}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion */}
      <div id="faq" className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase text-[#D4AF37] tracking-widest">
            Transparency & Clarity
          </span>
          <h2 className="font-display text-3xl font-bold text-[#FFF5DC]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqsData.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.id || index}
                className="rounded-2xl bg-[#0F1015] border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 text-sm font-semibold text-[#FFF5DC] hover:text-[#D4AF37] transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#D4AF37]" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
                </button>

                {isOpen && (
                  <div className="p-5 pt-0 text-xs text-white/70 font-light leading-relaxed border-t border-white/5">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="rounded-3xl bg-gradient-to-r from-[#12131A] via-[#1A1810] to-[#12131A] border border-[#D4AF37]/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
        <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#FFF5DC]">
          Ready to Elevate Your Digital Footprint?
        </h2>
        <div>
          <button
            onClick={onStartInquiry}
            className="px-8 py-4 rounded-full bg-[#D4AF37] hover:bg-[#E5C378] text-[#08090B] font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(212,175,55,0.4)] cursor-pointer"
          >
            Start Your Project Consultation
          </button>
        </div>
      </div>
    </div>
  );
};
