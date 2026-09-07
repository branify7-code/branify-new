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
    <section className="relative py-28 sm:py-36 bg-white text-[#111827] overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-0 w-[600px] h-[500px] bg-[#EEF2FF] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[480px] h-[420px] bg-[#FDF6E3] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Large statement header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-[#E2E8F0] gap-8">
          <div className="space-y-5 max-w-3xl">
            <div className="eyebrow-label">
              <Sparkles className="w-3.5 h-3.5" />
              <span>// Value Proposition</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] leading-[1.08] text-[#111827]">
              Why Choose Branify?
            </h2>
            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
              We do not build hollow digital facades. We engineer digital infrastructure that transforms category standing and fuels commercial growth.
            </p>
          </div>

          <div className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8] leading-relaxed shrink-0">
            RADICAL CLARITY<br />
            ZERO MEDIOCRITY TOLERANCE
          </div>
        </div>

        {/* Supporting benefits as a 2-col editorial checklist — no card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-12">
          {whyBranifyData.map((item, index) => {
            const Icon = whyIconMap[item.iconName] || Sparkles;

            return (
              <div
                key={item.id}
                id={`why-item-${item.id}`}
                className="group flex items-start gap-5"
              >
                {/* Icon in a tinted circle */}
                <div className="w-12 h-12 rounded-full bg-[#EEF2FF] border border-[#5B5FEF]/15 text-[#5B5FEF] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-[#5B5FEF]/35 transition-all">
                  <Icon className="w-5 h-5" />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#94A3B8]">
                    Pillar 0{index + 1} — {item.title}
                  </span>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#111827] tracking-tight">
                    {item.headline}
                  </h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">
                    {item.description}
                  </p>
                  <div className="pt-1.5 flex items-baseline gap-2">
                    <span className="font-display text-2xl font-extrabold text-[#8F6B2D] tracking-tight">
                      {item.metric}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8]">
                      {item.metricLabel}
                    </span>
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
