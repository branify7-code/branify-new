import React, { useState } from 'react';
import { Sparkles, Check, ChevronRight } from 'lucide-react';
import { processStepsData } from '../data/process';

export const ProcessSection: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const activeStep = processStepsData[activeStepIndex];

  return (
    <section id="about" className="relative py-28 sm:py-36 bg-white text-[#111827] overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-mesh-radial pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[460px] h-[380px] bg-[#F5F3FF] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-[#E2E8F0] gap-6">
          <div className="space-y-4">
            <div className="eyebrow-label">
              <Sparkles className="w-3.5 h-3.5" />
              <span>// Execution Methodology</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.03em] text-[#111827]">
              Our Process
            </h2>
            <p className="text-base sm:text-lg text-[#64748B] max-w-xl leading-relaxed">
              From first idea to final experience. A synchronized 5-phase delivery model crafted for zero ambiguity and maximum velocity.
            </p>
          </div>

          <div className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8] leading-relaxed">
            5-PHASE LINEAR PIPELINE<br />
            ZERO SURPRISES GUARANTEED
          </div>
        </div>

        {/* Horizontal Journey Timeline — numbered steps 01→05 connected by a gradient line (desktop),
            vertical stacked line variant on mobile */}
        <div className="relative mb-14">
          {/* Desktop connecting line (gold → indigo → purple) */}
          <div className="absolute top-6 left-0 right-0 h-px -translate-y-1/2 z-0 hidden md:block bg-gradient-to-r from-[#C9A45C] via-[#5B5FEF] to-[#8B5CF6] opacity-30" />

          {/* Dynamic progress line */}
          <div
            className="absolute top-6 -translate-y-1/2 h-[2px] rounded-full z-0 hidden md:block bg-gradient-to-r from-[#C9A45C] to-[#5B5FEF] shadow-[0_0_12px_rgba(91,95,239,0.35)] transition-all duration-500"
            style={{
              width: `${(activeStepIndex / (processStepsData.length - 1)) * 100}%`,
            }}
          />

          {/* Mobile vertical stacked line */}
          <div className="absolute left-[36px] top-4 bottom-4 w-px z-0 md:hidden bg-gradient-to-b from-[#C9A45C] via-[#5B5FEF] to-[#8B5CF6] opacity-30" />

          {/* Timeline Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 relative z-10">
            {processStepsData.map((step, idx) => {
              const isActive = activeStepIndex === idx;
              const isPast = idx < activeStepIndex;

              return (
                <button
                  key={step.number}
                  id={`process-step-node-${step.number}`}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`flex flex-row md:flex-col items-center md:items-center text-left md:text-center gap-4 md:gap-3 p-3 md:p-2 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-white border-[#E2E8F0] shadow-[0_14px_34px_-18px_rgba(15,23,42,0.2)]'
                      : 'border-transparent hover:border-[#E2E8F0] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {/* Step number in a white circle on the line + status dot */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full bg-white border-2 flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? 'border-[#5B5FEF] text-[#5B5FEF] shadow-[0_0_0_5px_rgba(91,95,239,0.12)]'
                          : isPast
                          ? 'border-[#C9A45C] text-[#8F6B2D]'
                          : 'border-[#E2E8F0] text-[#94A3B8]'
                      }`}
                    >
                      <span className="font-mono text-xs font-bold">{step.number}</span>
                    </div>
                    <span
                      className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                        isActive
                          ? 'bg-[#5B5FEF] shadow-[0_0_0_3px_rgba(91,95,239,0.15)] animate-pulse'
                          : isPast
                          ? 'bg-[#C9A45C]'
                          : 'bg-[#E2E8F0]'
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <span
                      className={`font-display text-sm sm:text-base font-bold tracking-tight block ${
                        isActive ? 'text-[#111827]' : 'text-[#475569]'
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#94A3B8] block mt-0.5">
                      {step.duration}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Step Deep-Dive Stage */}
        <div className="rounded-3xl bg-white border border-[#E2E8F0] p-8 sm:p-12 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.25)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#EEF2FF] rounded-full blur-[110px] opacity-70 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#FDF6E3] rounded-full blur-[100px] opacity-60 pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#5B5FEF]/25 text-[#5B5FEF] font-semibold">
                  PHASE {activeStep.number}
                </span>
                <span className="text-[#CBD5E1]">•</span>
                <span className="text-[#8F6B2D]">{activeStep.duration}</span>
              </div>

              <h3 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111827] tracking-[-0.02em]">
                {activeStep.title}: {activeStep.subtitle}
              </h3>

              <p className="text-base sm:text-lg text-[#475569] leading-relaxed">
                {activeStep.description}
              </p>

              {/* Quote */}
              <blockquote className="p-4 rounded-xl bg-[#F8FAFC] border-l-2 border-[#C9A45C] text-sm text-[#334155] italic">
                {activeStep.quote}
              </blockquote>
            </div>

            {/* Right Key Deliverables Panel */}
            <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#64748B] block">
                Guaranteed Milestone Outputs
              </span>
              <div className="space-y-3">
                {activeStep.keyOutputs.map((out, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#334155]">
                    <div className="w-5 h-5 rounded-full bg-white border border-[#C9A45C]/40 flex items-center justify-center text-[#8F6B2D] shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{out}</span>
                  </div>
                ))}
              </div>

              {/* Step Forward Button */}
              {activeStepIndex < processStepsData.length - 1 && (
                <div className="pt-4 border-t border-[#E2E8F0]">
                  <button
                    id="next-process-step-btn"
                    onClick={() => setActiveStepIndex((prev) => Math.min(prev + 1, processStepsData.length - 1))}
                    className="w-full py-2.5 rounded-full bg-white border border-[#E2E8F0] hover:border-[#5B5FEF]/50 hover:text-[#5B5FEF] text-[#334155] text-xs font-mono flex items-center justify-center gap-2 transition-all shadow-[0_2px_10px_rgba(15,23,42,0.04)] cursor-pointer"
                  >
                    <span>Inspect Next: {processStepsData[activeStepIndex + 1].title}</span>
                    <ChevronRight className="w-4 h-4 text-[#5B5FEF]" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
