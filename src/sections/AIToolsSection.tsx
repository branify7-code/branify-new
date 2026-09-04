import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  PenTool,
  Workflow,
  LineChart,
  Code2,
  ArrowRight,
  Cpu,
  CheckCircle,
} from 'lucide-react';
import { aiToolsData } from '../data/aiTools';

const aiIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  PenTool,
  Sparkles,
  Workflow,
  LineChart,
  Code2,
  Bot,
};

interface AIToolsSectionProps {
  onOpenInquiry: (category?: string) => void;
}

export const AIToolsSection: React.FC<AIToolsSectionProps> = ({ onOpenInquiry }) => {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(0);

  const activeTool = aiToolsData[activeCategoryIndex] || aiToolsData[0];
  const IconComponent = aiIconMap[activeTool.iconName] || Bot;

  return (
    <section id="ai-tools" className="relative py-28 sm:py-36 bg-[#0B0C10] text-white overflow-hidden border-t border-white/[0.06]">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[650px] h-[650px] bg-[#D4AF37]/5 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-8 border-b border-white/[0.08] gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
              <Cpu className="w-3.5 h-3.5" />
              <span>// Autonomous Systems</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
              AI Powered Tools
            </h2>
            <p className="text-base sm:text-lg text-white/60 font-light max-w-xl">
              Proprietary neural workflows, agentic automation, and generative copilot engines engineered for enterprise scale.
            </p>
          </div>

          <div className="text-xs font-mono text-white/40">
            ENTERPRISE NEURAL MODELS<br />
            ZERO-DATA RETENTION GUARANTEED
          </div>
        </div>

        {/* Category Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {aiToolsData.map((item, index) => {
            const isActive = activeCategoryIndex === index;
            return (
              <button
                key={item.id}
                id={`ai-tab-${item.id}`}
                onClick={() => setActiveCategoryIndex(index)}
                className={`px-5 py-3 rounded-full text-xs font-mono whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                  isActive
                    ? 'bg-[#D4AF37] text-[#08090B] font-bold border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                    : 'bg-white/[0.02] text-white/70 border-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                <span>{item.category}</span>
              </button>
            );
          })}
        </div>

        {/* Horizontal Interactive AI Showcase Stage */}
        <div className="relative rounded-3xl bg-[#0E0F14] border border-[#D4AF37]/30 p-8 sm:p-12 md:p-14 shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden">
          
          {/* Subtle Corner Holographic Grid */}
          <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-[#D4AF37]/10 to-transparent pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#FFF5DC] text-xs font-mono uppercase tracking-wider">
                  {activeTool.model}
                </span>
                <span className="text-xs font-mono text-white/50">{activeTool.badge}</span>
              </div>

              <h3 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-[#FFF5DC]">
                {activeTool.name}
              </h3>

              <p className="text-base sm:text-lg text-white/70 font-light leading-relaxed">
                {activeTool.description}
              </p>

              {/* Capabilities Grid */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono uppercase tracking-widest text-white/40 block">
                  Core Neural Capabilities
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeTool.capabilities.map((cap, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/80">
                      <CheckCircle className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  id="deploy-ai-model-btn"
                  onClick={() => onOpenInquiry(activeTool.name)}
                  className="px-8 py-4 rounded-full bg-[#D4AF37] hover:bg-[#E5C378] text-[#08090B] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(212,175,55,0.3)] cursor-pointer"
                >
                  <span>Integrate {activeTool.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Holographic Neural Terminal Stage */}
            <div className="lg:col-span-5 relative">
              <div className="p-6 sm:p-8 rounded-2xl bg-[#08090B] border border-white/10 shadow-2xl space-y-6">
                
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#FFF5DC]">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-[#FFF5DC] block">{activeTool.category}</span>
                      <span className="text-[10px] text-white/40 font-mono">STATUS: OPTIMAL</span>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                {/* Simulated Live Neural Stream */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white/70">
                    <span className="text-[#D4AF37] block mb-1">&gt; BENCHMARK METRIC</span>
                    <span className="text-sm font-semibold text-[#FFF5DC]">{activeTool.metrics}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white/60 space-y-1">
                    <span className="text-white/40 text-[10px] block">&gt; LATENCY MATRIX</span>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-[#D4AF37] to-[#E5C378] h-full w-[94%]" />
                    </div>
                    <div className="flex justify-between text-[10px] text-white/40 pt-0.5">
                      <span>Inference: 18ms</span>
                      <span>Confidence: 99.8%</span>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    Branify Autonomous Intelligence Core
                  </span>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
