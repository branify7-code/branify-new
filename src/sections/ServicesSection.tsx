import React, { useState } from 'react';
import {
  Globe,
  Layout,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Search,
  Cpu,
  Zap,
  Terminal,
  Share2,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { servicesData } from '../data/services';
import { Service } from '../types';

interface ServicesSectionProps {
  onSelectService: (serviceId: string) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Layout,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Search,
  Cpu,
  Zap,
  Terminal,
  Share2,
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  const [hoveredServiceId, setHoveredServiceId] = useState<string | null>('web-dev');

  const activeService =
    servicesData.find((s) => s.id === hoveredServiceId) || servicesData[0];

  return (
    <section id="services" className="relative py-28 sm:py-36 bg-[#08090B] text-white">
      {/* Atmospheric Background glow */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-[#997A15]/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-white/[0.08] gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
              <span>// Capabilities Spectrum</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
              Specialized Digital Services
            </h2>
            <p className="text-base sm:text-lg text-white/60 font-light max-w-xl">
              Strategy, creativity and technology working together to construct category-defining platforms.
            </p>
          </div>

          <div className="text-right font-mono text-xs text-white/40 hidden md:block">
            01 — 10 DISCIPLINES<br />
            PRECISION ENGINEERING
          </div>
        </div>

        {/* Asymmetric Split Layout: Left Master List + Right Dynamic Live Capability Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Horizontal Editorial Rows (01 to 10) */}
          <div className="lg:col-span-7 space-y-1">
            {servicesData.map((service: Service) => {
              const isHovered = hoveredServiceId === service.id;
              const IconComponent = iconMap[service.iconName] || Sparkles;

              return (
                <div
                  key={service.id}
                  id={`service-row-${service.id}`}
                  onMouseEnter={() => setHoveredServiceId(service.id)}
                  onClick={() => onSelectService(service.id)}
                  className={`group relative p-5 sm:p-6 rounded-2xl transition-all duration-300 cursor-pointer border ${
                    isHovered
                      ? 'bg-gradient-to-r from-white/[0.04] to-white/[0.01] border-[#D4AF37]/40 shadow-[0_4px_30px_rgba(0,0,0,0.5)] translate-x-1 sm:translate-x-2'
                      : 'bg-transparent border-transparent hover:border-white/[0.08] hover:bg-white/[0.01]'
                  }`}
                >
                  {/* Subtle Gold Edge Indicator */}
                  <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full bg-[#D4AF37] transition-all duration-300 ${
                      isHovered ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
                    }`}
                  />

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                      {/* Service Number */}
                      <span
                        className={`font-mono text-xs sm:text-sm font-semibold transition-colors ${
                          isHovered ? 'text-[#D4AF37]' : 'text-white/30'
                        }`}
                      >
                        {service.number}
                      </span>

                      {/* Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          isHovered
                            ? 'bg-[#D4AF37]/20 text-[#FFF5DC] border border-[#D4AF37]/50'
                            : 'bg-white/[0.03] text-white/40 border border-white/[0.06]'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>

                      {/* Title & Subtitle */}
                      <div className="min-w-0">
                        <h3
                          className={`font-display text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-tight transition-colors truncate ${
                            isHovered ? 'text-[#FFF5DC]' : 'text-white/80'
                          }`}
                        >
                          {service.title}
                        </h3>
                        <p className="text-xs text-white/50 font-light truncate hidden sm:block">
                          {service.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Action Arrow */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                        isHovered
                          ? 'bg-[#D4AF37] text-[#08090B] translate-x-1 -translate-y-0.5'
                          : 'bg-white/[0.03] text-white/30'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Expanded description on mobile or when active */}
                  <div
                    className={`mt-4 pt-3 border-t border-white/[0.06] text-xs text-white/60 space-y-3 transition-all ${
                      isHovered ? 'block' : 'hidden lg:hidden'
                    }`}
                  >
                    <p>{service.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {service.technologies.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/70 font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Sticky Live Deep-Dive Preview Panel (Desktop) */}
          <div className="hidden lg:block lg:col-span-5 sticky top-28">
            <div className="p-8 rounded-2xl bg-[#0D0E13] border border-[#D4AF37]/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden space-y-6">
              
              {/* Top Accent Mesh */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#D4AF37]/15 to-transparent pointer-events-none" />

              {/* Service Meta Tag */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#D4AF37] font-semibold">{activeService.number} // DEEP DIVE</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] text-white/60 border border-white/10">
                  {activeService.featuredStat || 'Enterprise Ready'}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h4 className="font-display text-3xl font-black uppercase text-[#FFF5DC] tracking-tight">
                  {activeService.title}
                </h4>
                <p className="text-xs text-[#E5C378] font-mono">{activeService.subtitle}</p>
                <p className="text-sm text-white/70 font-light leading-relaxed pt-2">
                  {activeService.description}
                </p>
              </div>

              {/* Core Deliverables List */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-white/40 block">
                  Core Architectural Deliverables
                </span>
                <div className="space-y-2">
                  {activeService.deliverables.map((deliv, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-white/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span>{deliv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack Chips */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <span className="text-[11px] font-mono uppercase tracking-widest text-white/40 block">
                  Technologies Deployed
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeService.technologies.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono text-[#F3E5AB]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <button
                  id={`consult-service-${activeService.id}-btn`}
                  onClick={() => onSelectService(activeService.id)}
                  className="w-full py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C378] text-[#08090B] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] cursor-pointer"
                >
                  <span>Commission {activeService.title}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
