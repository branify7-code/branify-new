import React, { useState } from 'react';
import { Sparkles, Check, ChevronRight } from 'lucide-react';
import { processStepsData } from '../data/process';

export const ProcessSection: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const activeStep = processStepsData[activeStepIndex];

  return (
    <section id="about" className="relative py-28 sm:py-36 bg-[#08090B] text-white overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-mesh-radial pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-white/[0.08] gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>// Execution Methodology</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
              Our Process
            </h2>
            <p className="text-base sm:text-lg text-white/60 font-light max-w-xl">
              From first idea to final experience. A synchronized 5-phase delivery model crafted for zero ambiguity and maximum velocity.
            </p>
          </div>

          <div className="text-xs font-mono text-white/40">
            5-PHASE LINEAR PIPELINE<br />
            ZERO SURPRISES GUARANTEED
          </div>
        </div>

        {/* Cinematic Horizontal Timeline Bar */}
        <div className="relative mb-12">
          {/* Background Connecting Line */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/10 -translate-y-1/2 z-0 hidden md:block" />
          
          {/* Dynamic Gold Progress Line */}
          <div
            className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#E5C378] -translate-y-1/2 z-0 transition-all duration-500 hidden md:block shadow-[0_0_15px_#D4AF37]"
            style={{
              width: `${(activeStepIndex / (processStepsData.length - 1)) * 100}%`,
            }}
          />

          {/* Timeline Nodes */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative z-10">
            {processStepsData.map((step, idx) => {
              const isActive = activeStepIndex === idx;
              const isPast = idx < activeStepIndex;

              return (
                <button
                  key={step.number}
                  id={`process-step-node-${step.number}`}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between h-32 md:h-36 ${
                    isActive
                      ? 'bg-[#0E0F14] border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.25)] scale-105'
                      : isPast
                      ? 'bg-[#0E0F14]/70 border-[#D4AF37]/40 text-white/80'
                      : 'bg-[#0E0F14]/40 border-white/10 text-white/50 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-xs font-bold ${
                        isActive ? 'text-[#D4AF37]' : isPast ? 'text-[#E5C378]' : 'text-white/40'
                      }`}
                    >
                      {step.number}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isActive
                          ? 'bg-[#D4AF37] shadow-[0_0_10px_#D4AF37] animate-pulse'
                          : isPast
                          ? 'bg-[#E5C378]'
                          : 'bg-white/20'
                      }`}
                    />
                  </div>

                  <div>
                    <span
                      className={`font-display text-sm sm:text-base font-bold uppercase tracking-tight block ${
                        isActive ? 'text-[#FFF5DC]' : 'text-white/70'
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="text-[10px] font-mono text-white/40 block mt-0.5">
                      {step.duration}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Step Deep-Dive Stage */}
        <div className="rounded-3xl bg-[#0E0F14] border border-[#D4AF37]/30 p-8 sm:p-12 shadow-[0_20px_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-[#D4AF37]/10 to-transparent pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#FFF5DC]">
                  PHASE {activeStep.number}
                </span>
                <span className="text-white/40">•</span>
                <span className="text-[#E5C378]">{activeStep.duration}</span>
              </div>

              <h3 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase text-[#FFF5DC] tracking-tight">
                {activeStep.title}: {activeStep.subtitle}
              </h3>

              <p className="text-base sm:text-lg text-white/70 font-light leading-relaxed">
                {activeStep.description}
              </p>

              {/* Quote */}
              <blockquote className="p-4 rounded-xl bg-white/[0.02] border-l-2 border-[#D4AF37] text-sm text-white/80 italic">
                {activeStep.quote}
              </blockquote>
            </div>

            {/* Right Key Deliverables Panel */}
            <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-[#08090B] border border-white/10 space-y-4">
              <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37] block">
                Guaranteed Milestone Outputs
              </span>
              <div className="space-y-3">
                {activeStep.keyOutputs.map((out, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-white/80">
                    <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{out}</span>
                  </div>
                ))}
              </div>

              {/* Step Forward Button */}
              {activeStepIndex < processStepsData.length - 1 && (
                <div className="pt-4 border-t border-white/[0.08]">
                  <button
                    id="next-process-step-btn"
                    onClick={() => setActiveStepIndex((prev) => Math.min(prev + 1, processStepsData.length - 1))}
                    className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white text-xs font-mono flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Inspect Next: {processStepsData[activeStepIndex + 1].title}</span>
                    <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
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
