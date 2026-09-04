import React from 'react';
import { Star, Quote, Sparkles } from 'lucide-react';
import { testimonialsData } from '../data/testimonials';

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="relative py-28 sm:py-36 bg-[#08090B] text-white overflow-hidden">
      {/* Ambient background lighting */}
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-[#D4AF37]/4 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-white/[0.08] gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>// Executive Endorsements</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
              Client Feedback
            </h2>
            <p className="text-base sm:text-lg text-white/60 font-light max-w-xl">
              Authentic perspectives from founders, CTOs, and brand directors who trusted Branify with their flagship digital platforms.
            </p>
          </div>

          <div className="text-xs font-mono text-white/40">
            100% VERIFIED PARTNERS<br />
            CONFIDENTIAL CASE STUDIES AVAILABLE
          </div>
        </div>

        {/* Testimonials Grid (2x2 Editorial Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonialsData.map((t, idx) => (
            <div
              key={t.id}
              id={`testimonial-card-${t.id}`}
              className="group relative p-8 sm:p-10 rounded-3xl bg-[#0E0F14] border border-white/[0.08] hover:border-[#D4AF37]/40 transition-all duration-300 flex flex-col justify-between space-y-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            >
              {/* Quote icon & Rating stars */}
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <Quote className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  ))}
                </div>
              </div>

              {/* Quote Content */}
              <p className="text-base sm:text-lg text-white/80 font-light leading-relaxed italic">
                "{t.quote}"
              </p>

              {/* Author & Project info */}
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E5C378] to-[#997A15] p-[1px]">
                    <div className="w-full h-full bg-[#08090B] rounded-full flex items-center justify-center font-mono text-xs font-bold text-[#FFF5DC]">
                      {t.avatarText}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#FFF5DC]">{t.author}</h3>
                    <p className="text-xs text-white/50">{t.role}, <span className="text-[#E5C378]">{t.company}</span></p>
                  </div>
                </div>

                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 hidden sm:block">
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
