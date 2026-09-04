import React from 'react';
import {
  ShieldCheck,
  QrCode,
  Palette,
  FileJson,
  Code,
  Type,
  Image,
  AlignLeft,
  FileText,
  Sparkles,
  Play,
} from 'lucide-react';
import { digitalToolsData } from '../data/tools';
import { DigitalTool } from '../types';

interface ToolsSectionProps {
  onRunTool: (tool: DigitalTool) => void;
}

const toolIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck,
  QrCode,
  Palette,
  FileJson,
  Code,
  Type,
  Image,
  AlignLeft,
  FileText,
};

export const ToolsSection: React.FC<ToolsSectionProps> = ({ onRunTool }) => {
  return (
    <section id="tools" className="relative py-28 sm:py-36 bg-[#08090B] text-white">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-mesh-radial pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-white/[0.08] gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>// Digital Ecosystem</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
              Free Digital Tools
            </h2>
            <p className="text-base sm:text-lg text-white/60 font-light max-w-xl">
              Useful tools. No unnecessary barriers. High-performance browser utilities engineered with client-side privacy.
            </p>
          </div>

          <div className="font-mono text-xs text-[#D4AF37] px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 self-start md:self-auto">
            100% Client-Side Privacy
          </div>
        </div>

        {/* Compact Elegant Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {digitalToolsData.map((tool) => {
            const IconComp = toolIconMap[tool.iconName] || Sparkles;

            return (
              <div
                key={tool.id}
                id={`tool-card-${tool.id}`}
                onClick={() => onRunTool(tool)}
                className="group relative p-6 rounded-2xl bg-[#0E0F14] border border-white/[0.08] hover:border-[#D4AF37]/50 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.15)]"
              >
                {/* Top Badge & Category */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 group-hover:bg-[#D4AF37]/20 group-hover:border-[#D4AF37]/50 flex items-center justify-center text-white/70 group-hover:text-[#FFF5DC] transition-all">
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-2">
                      {tool.isPopular && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F3E5AB]">
                          Popular
                        </span>
                      )}
                      <span className="text-[10px] font-mono uppercase text-white/40">
                        {tool.category}
                      </span>
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#FFF5DC] group-hover:text-[#F3E5AB] transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-white/50 font-light mt-1 line-clamp-2">
                      {tool.tagline}
                    </p>
                  </div>
                </div>

                {/* Bottom Trigger & Feature Pills */}
                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#D4AF37] group-hover:underline flex items-center gap-1.5">
                    Launch Utility
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-[#D4AF37] group-hover:text-[#08090B] flex items-center justify-center transition-all">
                    <Play className="w-3 h-3 fill-current ml-0.5" />
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
