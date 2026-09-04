import React, { useState, useEffect } from 'react';
import { 
  Globe, Layout, ShoppingBag, Sparkles, TrendingUp, Cpu, 
  Smartphone, Cloud, ShieldCheck, ArrowRight, CheckCircle2, 
  Zap, Clock, Award, HelpCircle
} from 'lucide-react';
import { servicesData } from '../../data/services';
import { Service } from '../../types';

interface ServicesViewProps {
  onStartInquiry: (serviceId?: string) => void;
  onNavigateHome: () => void;
  initialCategory?: string | null;
}

const iconMap: Record<string, React.ReactNode> = {
  Globe: <Globe className="w-5 h-5" />,
  Layout: <Layout className="w-5 h-5" />,
  ShoppingBag: <ShoppingBag className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  Cpu: <Cpu className="w-5 h-5" />,
  Smartphone: <Smartphone className="w-5 h-5" />,
  Cloud: <Cloud className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
};

export const ServicesView: React.FC<ServicesViewProps> = ({
  onStartInquiry,
  onNavigateHome,
  initialCategory,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    initialCategory || servicesData[0]?.id || 'web-dev'
  );

  useEffect(() => {
    if (initialCategory) {
      setSelectedServiceId(initialCategory);
    }
  }, [initialCategory]);

  const activeService = servicesData.find((s) => s.id === selectedServiceId) || servicesData[0];

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header Breadcrumbs & Hero Title */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#D4AF37]/30 text-xs font-mono text-[#F3E5AB]">
          <button 
            onClick={onNavigateHome} 
            className="text-white/60 hover:text-[#FFF5DC] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="text-white/30">/</span>
          <span className="text-[#D4AF37]">Specialized Services</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
          Category-Defining <br />
          <span className="text-gold-gradient">Digital Capabilities</span>
        </h1>

        <p className="text-sm sm:text-base text-white/65 font-light leading-relaxed">
          From high-velocity full-stack web applications and AI autonomous agents to luxury spatial design and conversion flagships, explore our full spectrum of specialized engineering solutions.
        </p>
      </div>

      {/* Interactive Service Selector Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-5xl mx-auto">
        {servicesData.map((service) => {
          const isSelected = selectedServiceId === service.id;
          return (
            <button
              key={service.id}
              onClick={() => setSelectedServiceId(service.id)}
              className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border ${
                isSelected
                  ? 'bg-[#D4AF37] text-[#08090B] font-bold border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.35)]'
                  : 'bg-white/[0.03] text-white/70 border-white/10 hover:border-[#D4AF37]/50 hover:text-white'
              }`}
            >
              <span className="text-[10px] opacity-60 font-mono">{service.number}</span>
              <span>{service.title}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Service Detailed Showcase Card */}
      {activeService && (
        <div className="rounded-3xl bg-[#0F1015] border border-[#D4AF37]/25 p-6 sm:p-10 lg:p-12 shadow-[0_0_50px_rgba(0,0,0,0.6)] space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Service Overview & Metrics */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center">
                  {iconMap[activeService.iconName] || <Sparkles className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-xs font-mono text-[#D4AF37] uppercase tracking-widest">
                    Service {activeService.number}
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#FFF5DC]">
                    {activeService.title}
                  </h2>
                </div>
              </div>

              <p className="text-base text-white/80 font-light leading-relaxed">
                {activeService.description}
              </p>

              {activeService.featuredStat && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#D4AF37]/20 flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#D4AF37] shrink-0" />
                  <span className="text-xs sm:text-sm font-mono text-[#FFF5DC]">
                    Benchmark: <strong className="text-[#D4AF37]">{activeService.featuredStat}</strong>
                  </span>
                </div>
              )}

              {/* Deliverables Checklist */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                  What We Deliver:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeService.deliverables.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-white/75">
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack Badges */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                  Technologies & Frameworks:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeService.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-white/70"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Quick Scope & Proposal Action Card */}
            <div className="lg:col-span-5 rounded-2xl bg-black/40 border border-white/10 p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/40">
                  Engagement Framework
                </span>
                <h3 className="text-lg font-bold text-[#FFF5DC]">Deploy This Capability</h3>
              </div>

              <div className="space-y-3 text-xs text-white/70">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Average Sprint Timeline</span>
                  </span>
                  <span className="font-mono text-white font-semibold">2 – 6 Weeks</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Engineering Hand-off</span>
                  </span>
                  <span className="font-mono text-white font-semibold">100% IP & Source</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Quality Guarantee</span>
                  </span>
                  <span className="font-mono text-white font-semibold">Production SLA</span>
                </div>
              </div>

              <button
                onClick={() => onStartInquiry(activeService.id)}
                className="w-full py-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#08090B] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(212,175,55,0.35)] cursor-pointer"
              >
                <span>Request {activeService.title} Proposal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-white/40 text-center font-light">
                Consult with our senior architects in a 30-minute discovery session.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3-Tier Enterprise Engagement Overview */}
      <div className="space-y-8 pt-8 border-t border-white/10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase text-[#D4AF37] tracking-widest">
            Flexible Collaboration
          </span>
          <h2 className="font-display text-3xl font-bold text-[#FFF5DC]">
            How We Partner With Brands
          </h2>
          <p className="text-xs text-white/60">
            Tailored engagement models structured around your engineering velocity and strategic roadmap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6 space-y-4 hover:border-[#D4AF37]/40 transition-colors">
            <span className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider">01 • Fixed-Scope Sprint</span>
            <h3 className="text-lg font-bold text-[#FFF5DC]">Flagship Project</h3>
            <p className="text-xs text-white/60 leading-relaxed font-light">
              Ideal for discrete, high-impact deliverables: bespoke web applications, e-commerce redesigns, or complete brand launches.
            </p>
            <ul className="text-xs text-white/70 space-y-2 pt-2 border-t border-white/5">
              <li>✓ Guaranteed Delivery Milestones</li>
              <li>✓ Dedicated Tech Lead & Designer</li>
              <li>✓ Full Architecture Documentation</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-[#0F1015] border border-[#D4AF37]/50 p-6 space-y-4 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative">
            <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#08090B] text-[10px] font-mono uppercase font-bold">
              Most Popular
            </span>
            <span className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider">02 • Dedicated Pod</span>
            <h3 className="text-lg font-bold text-[#FFF5DC]">Studio Retainer</h3>
            <p className="text-xs text-white/60 leading-relaxed font-light">
              An embedded team of senior designers and fullstack engineers dedicated to your ongoing roadmap, sprints, and continuous growth.
            </p>
            <ul className="text-xs text-white/70 space-y-2 pt-2 border-t border-white/5">
              <li>✓ Continuous Sprint Velocity</li>
              <li>✓ Weekly Executive Syncs</li>
              <li>✓ Priority AI & Feature R&D</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6 space-y-4 hover:border-[#D4AF37]/40 transition-colors">
            <span className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider">03 • AI Advisory</span>
            <h3 className="text-lg font-bold text-[#FFF5DC]">Custom AI Lab</h3>
            <p className="text-xs text-white/60 leading-relaxed font-light">
              Proprietary AI model fine-tuning, autonomous workflow automation, and custom neural search implementation.
            </p>
            <ul className="text-xs text-white/70 space-y-2 pt-2 border-t border-white/5">
              <li>✓ Private LLM Deployments</li>
              <li>✓ Automated Multi-Agent Mesh</li>
              <li>✓ Enterprise Security Hardening</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
