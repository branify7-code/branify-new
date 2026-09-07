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
    <div className="min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-24 sm:space-y-28">
      {/* Header Breadcrumbs & Hero Title */}
      <div className="space-y-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.04)] text-xs font-mono text-[#8F6B2D]">
          <button 
            onClick={onNavigateHome} 
            className="text-[#64748B] hover:text-[#111827] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="text-[#CBD5E1]">/</span>
          <span className="text-[#8F6B2D]">The Studio Ethos & Architecture</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] leading-[1.08] text-[#111827]">
          The Standard For <br />
          <span className="text-gold-gradient">Digital Sovereignty</span>
        </h1>

        <p className="text-sm sm:text-lg text-[#475569] font-light leading-relaxed">
          Branify operates at the intersection of haute couture aesthetic precision and deep-stack computational engineering. We build enduring technological advantages for the world&apos;s most ambitious brands.
        </p>
      </div>

      {/* The Manifesto Section */}
      <div id="manifesto" className="relative rounded-3xl bg-gradient-to-b from-[#F8FAFC] to-white border border-[#E2E8F0] p-8 sm:p-12 space-y-8 overflow-hidden">
        <div className="absolute -top-24 -right-16 w-[340px] h-[220px] bg-[#EEF2FF] blur-[100px] rounded-full pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] text-[#5B5FEF] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="eyebrow-label">
              Foundational Philosophy
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
              The Branify Manifesto
            </h2>
          </div>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 text-sm sm:text-base text-[#334155] leading-relaxed pt-2">
          <p>
            In an era of homogenized web templates and generic AI copy, distinction is the ultimate competitive moat. We reject digital compromise. Every interface we architect is mathematically tuned for emotional resonance, spatial depth, and frictionless performance.
          </p>
          <p>
            We do not just construct websites; we engineer high-throughput digital flagships, autonomous agent workflows, and sovereign digital assets that multiply our clients&apos; enterprise value year over year.
          </p>
        </div>
      </div>

      {/* Verified Stats Track Record */}
      <div id="stats" className="space-y-10">
        <div className="text-center space-y-2">
          <span className="eyebrow-label">
            Quantitative Precision
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827]">
            Verified Track Record
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 lg:divide-x lg:divide-[#E2E8F0]">
          {statsData.map((stat, idx) => (
            <div
              key={idx}
              className="px-4 sm:px-6 text-center space-y-2"
            >
              <span className="block font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111827]">
                {stat.value}{stat.suffix}
              </span>
              <span className="block text-xs font-bold text-[#64748B] uppercase tracking-wider">
                {stat.label}
              </span>
              <p className="text-[11px] text-[#94A3B8] font-light">
                {stat.sublabel}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5-Phase Methodology */}
      <div id="process" className="space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="eyebrow-label">
            Rigorous Delivery
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#111827]">
            Our 5-Phase Methodology
          </h2>
          <p className="text-sm text-[#64748B]">
            A deterministic engineering blueprint engineered to eliminate uncertainty and ship on schedule.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {processStepsData.map((step) => (
            <div
              key={step.number}
              className="p-6 rounded-2xl bg-white border border-[#E2E8F0] space-y-3 relative hover:border-[#5B5FEF]/40 hover:shadow-[0_14px_34px_-14px_rgba(15,23,42,0.14)] transition-all duration-300"
            >
              <span className="text-xs font-mono text-[#5B5FEF] font-bold tracking-widest">
                PHASE {step.number}
              </span>
              <h3 className="font-display text-base font-bold text-[#111827]">
                {step.title}
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {step.description}
              </p>
              <div className="pt-2 border-t border-[#E2E8F0] text-[11px] font-mono text-[#94A3B8]">
                Duration: {step.duration}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Branify Pillars */}
      <div id="why" className="space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="eyebrow-label">
            The Branify Standard
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#111827]">
            Why Industry Leaders Choose Branify
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyBranifyData.map((pillar) => (
            <div
              key={pillar.id}
              className="p-7 rounded-2xl bg-white border border-[#E2E8F0] space-y-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_14px_34px_-14px_rgba(15,23,42,0.14)] hover:border-[#5B5FEF]/40 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] text-[#5B5FEF] flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-display text-base font-bold text-[#111827]">
                {pillar.title}
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                {pillar.description}
              </p>
              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
                <span className="text-[#8F6B2D] font-bold">{pillar.metric}</span>
                <span className="text-[#94A3B8] text-[10px]">{pillar.metricLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Testimonials */}
      <div id="testimonials" className="space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="eyebrow-label">
            Executive Endorsements
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#111827]">
            What Founders & Leaders Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonialsData.map((review) => (
            <div
              key={review.id}
              className="p-7 rounded-2xl bg-white border border-[#E2E8F0] space-y-4 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_14px_34px_-14px_rgba(15,23,42,0.14)] hover:border-[#C9A45C]/40 transition-all duration-300"
            >
              <span className="font-serif text-5xl leading-none text-[#C9A45C]/40 select-none" aria-hidden="true">&ldquo;</span>
              <p className="text-sm text-[#334155] leading-relaxed -mt-4">
                &ldquo;{review.quote}&rdquo;
              </p>

              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#111827]">{review.author}</h4>
                  <span className="text-[10px] text-[#64748B]">{review.role}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C9A45C]/10 text-[#8F6B2D]">
                  {review.company}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion */}
      <div id="faq" className="space-y-8 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <span className="eyebrow-label">
            Transparency & Clarity
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#111827]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="divide-y divide-[#E2E8F0] border-y border-[#E2E8F0]">
          {faqsData.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.id || index}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full py-5 text-left flex items-center justify-between gap-4 font-display text-base sm:text-lg font-semibold text-[#111827] hover:text-[#8F6B2D] transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#5B5FEF] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8] shrink-0" />}
                </button>

                {isOpen && (
                  <div className="pb-6 pr-8 sm:pr-12 text-sm text-[#475569] leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#EEF2FF] to-white border border-[#E2E8F0] p-8 sm:p-14 text-center space-y-6 overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[440px] h-[220px] bg-[#C9A45C]/10 blur-[90px] rounded-full pointer-events-none" />
        <h2 className="relative font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-[#111827]">
          Ready to Elevate Your Digital Footprint?
        </h2>
        <div className="relative">
          <button
            onClick={onStartInquiry}
            className="btn-gold-primary px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
          >
            Start Your Project Consultation
          </button>
        </div>
      </div>
    </div>
  );
};
