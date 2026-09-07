import React from 'react';
import { Star, Quote, Sparkles } from 'lucide-react';
import { testimonialsData } from '../data/testimonials';

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="relative py-28 sm:py-36 bg-[#F8FAFC] text-[#111827] overflow-hidden">
      {/* Ambient background lighting */}
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-[#EDE9FE] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-[420px] h-[360px] bg-[#FDF6E3] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-[#E2E8F0] gap-6">
          <div className="space-y-4">
            <div className="eyebrow-label">
              <Sparkles className="w-3.5 h-3.5" />
              <span>// Executive Endorsements</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.03em] text-[#111827]">
              Client Feedback
            </h2>
            <p className="text-base sm:text-lg text-[#64748B] max-w-xl leading-relaxed">
              Authentic perspectives from founders, CTOs, and brand directors who trusted Branify with their flagship digital platforms.
            </p>
          </div>

          <div className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8] leading-relaxed">
            100% VERIFIED PARTNERS<br />
            CONFIDENTIAL CASE STUDIES AVAILABLE
          </div>
        </div>

        {/* Testimonials Grid (2x2 Editorial Layout) — large quote typography */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonialsData.map((t, idx) => (
            <div
              key={t.id}
              id={`testimonial-card-${t.id}`}
              className="group relative p-8 sm:p-10 rounded-3xl bg-white border border-[#E2E8F0] hover:border-[#C9A45C]/40 hover:-translate-y-1 hover:shadow-[0_20px_50px_-24px_rgba(15,23,42,0.18)] transition-all duration-300 flex flex-col justify-between space-y-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden"
            >
              {/* Decorative serif quote mark */}
              <span
                aria-hidden="true"
                className="absolute top-6 right-8 font-serif text-7xl leading-none text-[#C9A45C]/20 select-none pointer-events-none"
              >
                &rdquo;
              </span>

              {/* Quote icon & Rating stars */}
              <div className="relative flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#C9A45C]/10 border border-[#C9A45C]/25 flex items-center justify-center text-[#8F6B2D]">
                  <Quote className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#C9A45C] text-[#C9A45C]" />
                  ))}
                </div>
              </div>

              {/* Quote Content */}
              <p className="relative font-display text-lg sm:text-xl text-[#1E293B] leading-relaxed">
                "{t.quote}"
              </p>

              {/* Author & Project info */}
              <div className="relative pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A45C] to-[#8F6B2D] p-[2px]">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-mono text-xs font-bold text-[#334155]">
                      {t.avatarText}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#111827]">{t.author}</h3>
                    <p className="text-xs text-[#64748B]">{t.role}, <span className="text-[#8F6B2D]">{t.company}</span></p>
                  </div>
                </div>

                <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] hidden sm:block">
                  {t.projectType}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
