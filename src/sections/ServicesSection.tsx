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

/* One strategic accent per service icon chip (presentation only) */
const ACCENTS = [
  { chip: 'bg-[#EEF2FF] text-[#5B5FEF] border border-[#5B5FEF]/20' },
  { chip: 'bg-[#EFF6FF] text-[#3B82F6] border border-[#3B82F6]/20' },
  { chip: 'bg-[#F5F3FF] text-[#8B5CF6] border border-[#8B5CF6]/20' },
  { chip: 'bg-[#F0FDFA] text-[#14B8A6] border border-[#14B8A6]/20' },
  { chip: 'bg-[#FDF2F8] text-[#EC4899] border border-[#EC4899]/20' },
  { chip: 'bg-[#FDFBF3] text-[#8F6B2D] border border-[#C9A45C]/30' },
];

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  const [hoveredServiceId, setHoveredServiceId] = useState<string | null>('web-dev');

  const activeService =
    servicesData.find((s) => s.id === hoveredServiceId) || servicesData[0];

  return (
    <section id="services" className="relative py-28 sm:py-36 bg-white text-[#111827] overflow-hidden">
      {/* Soft light atmosphere */}
      <div className="absolute top-1/3 right-0 w-[520px] h-[520px] bg-[#EEF2FF] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[460px] h-[460px] bg-[#FDF6E3] rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 pb-8 border-b border-[#E2E8F0] gap-6">
          <div className="space-y-4">
            <div className="eyebrow-label">
              <span>// Capabilities Spectrum</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.03em] text-[#111827]">
              Specialized Digital Services
            </h2>
            <p className="text-base sm:text-lg text-[#64748B] max-w-xl leading-relaxed">
              Strategy, creativity and technology working together to construct category-defining platforms.
            </p>
          </div>

          <div className="text-right font-mono text-[11px] uppercase tracking-widest text-[#94A3B8] hidden md:block leading-relaxed">
            01 — 10 DISCIPLINES<br />
            PRECISION ENGINEERING
          </div>
        </div>

        {/* Agency composition: 1 FEATURED service card (spans 2) + clean grid + sticky live deep-dive panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Featured Card + Remaining Services Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {servicesData.map((service: Service, idx) => {
              const isHovered = hoveredServiceId === service.id;
              const IconComponent = iconMap[service.iconName] || Sparkles;
              const accent = ACCENTS[idx % ACCENTS.length];
              const isFeatured = idx === 0;

              return (
                <div
                  key={service.id}
                  id={`service-row-${service.id}`}
                  onMouseEnter={() => setHoveredServiceId(service.id)}
                  onClick={() => onSelectService(service.id)}
                  className={`group relative rounded-2xl border bg-white transition-all duration-300 cursor-pointer ${
                    isFeatured ? 'sm:col-span-2 p-7 sm:p-8' : 'p-6'
                  } ${
                    isHovered
                      ? 'border-[#C9A45C]/45 shadow-[0_14px_34px_-14px_rgba(15,23,42,0.14)] -translate-y-0.5'
                      : 'border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-[#C9A45C]/40 hover:shadow-[0_14px_34px_-14px_rgba(15,23,42,0.10)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Service Number */}
                      <span className="font-mono text-xs font-semibold text-[#94A3B8] shrink-0">
                        {service.number}
                      </span>

                      {/* Icon — featured gets the gradient chip, others a tinted accent square */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                          isFeatured
                            ? 'bg-gradient-to-br from-[#5B5FEF] to-[#8B5CF6] text-white shadow-[0_8px_20px_-8px_rgba(91,95,239,0.55)]'
                            : accent.chip
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>

                      {/* Title & Subtitle */}
                      <div className="min-w-0">
                        <h3
                          className={`font-display font-bold tracking-tight transition-colors truncate ${
                            isFeatured ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
                          } ${isHovered ? 'text-[#111827]' : 'text-[#334155]'}`}
                        >
                          {service.title}
                        </h3>
                        <p className="text-xs text-[#94A3B8] font-light truncate hidden sm:block">
                          {service.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Action Arrow */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                        isHovered
                          ? 'bg-[#C9A45C] text-white translate-x-0.5 -translate-y-0.5'
                          : 'bg-[#F1F5F9] text-[#94A3B8] group-hover:bg-[#C9A45C] group-hover:text-white'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Expanded description on mobile or when active */}
                  <div
                    className={`mt-5 pt-4 border-t border-[#F1F5F9] text-xs text-[#475569] space-y-3 transition-all ${
                      isFeatured ? 'block' : isHovered ? 'block' : 'hidden lg:hidden'
                    }`}
                  >
                    <p className="leading-relaxed">{service.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {service.technologies.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] text-[#475569] font-mono"
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
            <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_30px_70px_-35px_rgba(15,23,42,0.25)] relative overflow-hidden space-y-6">

              {/* Soft accent washes */}
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#EEF2FF] rounded-full blur-[70px] pointer-events-none" />
              <div className="absolute -bottom-20 -left-12 w-56 h-56 bg-[#FDF6E3] rounded-full blur-[70px] pointer-events-none" />

              {/* Service Meta Tag */}
              <div className="relative flex items-center justify-between text-xs font-mono">
                <span className="text-[#8F6B2D] font-semibold">{activeService.number} // DEEP DIVE</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
                  {activeService.featuredStat || 'Enterprise Ready'}
                </span>
              </div>

              {/* Title & Description */}
              <div className="relative space-y-2">
                <h4 className="font-display text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-[-0.02em]">
                  {activeService.title}
                </h4>
                <p className="text-xs text-[#8F6B2D] font-mono">{activeService.subtitle}</p>
                <p className="text-sm text-[#475569] leading-relaxed pt-2">
                  {activeService.description}
                </p>
              </div>

              {/* Core Deliverables List */}
              <div className="relative space-y-3 pt-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8] block">
                  Core Architectural Deliverables
                </span>
                <div className="space-y-2">
                  {activeService.deliverables.map((deliv, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-[#334155]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#8F6B2D] shrink-0 mt-0.5" />
                      <span>{deliv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack Chips */}
              <div className="relative space-y-2 pt-2 border-t border-[#E2E8F0]">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8] block">
                  Technologies Deployed
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeService.technologies.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-mono text-[#475569]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="relative pt-4">
                <button
                  id={`consult-service-${activeService.id}-btn`}
                  onClick={() => onSelectService(activeService.id)}
                  className="btn-gold-primary w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
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
