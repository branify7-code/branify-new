import React from 'react';
import { Compass, Layers, Cpu, Zap, ShieldCheck, Users, Sparkles } from 'lucide-react';
import { whyBranifyData } from '../data/whyBranify';

const whyIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  Layers,
  Cpu,
  Zap,
  ShieldCheck,
  Users,
};

export const WhyBranifySection: React.FC = () => {
  return (
    <section className="relative py-28 sm:py-36 bg-[#0B0C10] text-white overflow-hidden border-t border-white/[0.06]">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-[#D4AF37]/4 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-white/[0.08] gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>// Value Proposition</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
              Why Choose Branify?
            </h2>
            <p className="text-base sm:text-lg text-white/60 font-light max-w-xl">
              We do not build hollow digital facades. We engineer digital infrastructure that transforms category standing and fuels commercial growth.
            </p>
          </div>

          <div className="text-xs font-mono text-white/40">
            RADICAL CLARITY<br />
            ZERO MEDIOCRITY TOLERANCE
          </div>
        </div>

        {/* Editorial Non-Card Layout: Alternating Staggered Rows with Visual Anchors */}
        <div className="space-y-12">
          {whyBranifyData.map((item, index) => {
            const Icon = whyIconMap[item.iconName] || Sparkles;
            const isEven = index % 2 === 0;

            return (
              <div
                key={item.id}
                id={`why-item-${item.id}`}
                className="group relative p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-white/[0.02] to-transparent border border-white/[0.06] hover:border-[#D4AF37]/40 transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Left Column: Metric & Icon */}
                  <div className={`lg:col-span-4 flex items-center gap-6 ${isEven ? 'order-1' : 'lg:order-2'}`}>
                    <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#FFF5DC] shrink-0 group-hover:bg-[#D4AF37] group-hover:text-[#08090B] transition-all">
                      <Icon className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="font-display text-3xl sm:text-4xl font-black text-[#FFF5DC] tracking-tight">
                        {item.metric}
                      </div>
                      <div className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider">
                        {item.metricLabel}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Editorial Headline & Copy */}
                  <div className={`lg:col-span-8 space-y-2 ${isEven ? 'order-2' : 'lg:order-1'}`}>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-white/40">
                      Pillar 0{index + 1} — {item.title}
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-bold uppercase text-[#FFF5DC] tracking-tight">
                      {item.headline}
                    </h3>
                    <p className="text-sm sm:text-base text-white/60 font-light leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
