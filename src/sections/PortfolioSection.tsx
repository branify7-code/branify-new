import React, { useState } from 'react';
import { ArrowUpRight, Sparkles, Filter } from 'lucide-react';
import { projectsData } from '../data/projects';
import { Project } from '../types';

interface PortfolioSectionProps {
  onSelectProject: (project: Project) => void;
  onViewAllWork?: () => void;
}

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  onSelectProject,
  onViewAllWork,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'E-Commerce Experience', 'AI Platform', 'Luxury Brand Website', 'Digital Marketplace', 'Technology Dashboard'];

  const filteredProjects =
    activeCategory === 'All'
      ? projectsData
      : projectsData.filter((p) => p.category === activeCategory);

  const featuredProject = projectsData.find((p) => p.isFeatured) || projectsData[0];
  const secondaryProjects = projectsData.filter((p) => p.id !== featuredProject.id);

  return (
    <section id="work" className="relative py-28 sm:py-36 bg-[#08090B] text-white overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-[#C5A059]/4 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-8 border-b border-white/[0.08] gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>// Case Study Archives</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
              Selected Work
            </h2>
            <p className="text-base sm:text-lg text-white/60 font-light max-w-xl">
              Digital experiences built to perform — combining spatial aesthetics with quantitative commercial velocity.
            </p>
          </div>

          {/* Filter Categories Chips */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs text-white/40 font-mono mr-2 hidden sm:flex">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>
            {categories.slice(0, 4).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#D4AF37] text-[#08090B] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                    : 'bg-white/[0.03] text-white/60 border border-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 1. Large Featured Showcase Hero Card */}
        {activeCategory === 'All' && (
          <div
            id="featured-project-card"
            onClick={() => onSelectProject(featuredProject)}
            className="group relative mb-16 rounded-3xl overflow-hidden border border-white/10 hover:border-[#D4AF37]/50 bg-[#0E0F14] transition-all duration-500 cursor-pointer shadow-[0_20px_70px_rgba(0,0,0,0.6)]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px] sm:min-h-[480px]">
              
              {/* Visual Showcase Half */}
              <div
                className="lg:col-span-7 relative p-8 sm:p-12 flex flex-col justify-between overflow-hidden"
                style={{ background: featuredProject.heroImage }}
              >
                <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0F14] lg:bg-gradient-to-r lg:from-transparent lg:to-[#0E0F14] opacity-80" />

                {/* Top Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FFF5DC]">
                    Featured Landmark Project
                  </span>
                  <span className="text-white/60 font-mono text-xs">{featuredProject.year}</span>
                </div>

                {/* Subtle Interactive Center Graphic */}
                <div className="relative z-10 my-8 py-8 flex items-center justify-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-[#D4AF37]/40 group-hover:scale-110 group-hover:border-[#D4AF37] transition-all duration-500 flex items-center justify-center bg-radial from-[#D4AF37]/10 to-transparent">
                    <span className="font-display text-xs font-mono uppercase tracking-widest text-[#F3E5AB]">
                      {featuredProject.client}
                    </span>
                  </div>
                </div>

                {/* Metrics Preview Strip */}
                <div className="relative z-10 grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  {featuredProject.impactMetrics.map((m, i) => (
                    <div key={i}>
                      <div className="font-display text-xl sm:text-2xl font-bold text-[#FFF5DC]">
                        {m.value}
                      </div>
                      <div className="text-[10px] uppercase font-mono text-white/50 truncate">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editorial Metadata Half */}
              <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37]">
                    <span>{featuredProject.category}</span>
                    <span>•</span>
                    <span className="text-white/50">{featuredProject.serviceType}</span>
                  </div>

                  <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-black uppercase text-[#FFF5DC] tracking-tight group-hover:text-[#F3E5AB] transition-colors">
                    {featuredProject.title}
                  </h3>

                  <p className="text-sm text-white/60 font-light leading-relaxed">
                    {featuredProject.description}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                  <div className="flex flex-wrap gap-1.5">
                    {featuredProject.deliverables.map((deliv, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono text-white/70"
                      >
                        {deliv}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37] group-hover:underline flex items-center gap-1.5">
                      Explore Full Case Study
                    </span>
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-[#08090B] flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. Alternating Case Studies Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(activeCategory === 'All' ? secondaryProjects : filteredProjects).map((project, idx) => (
            <div
              key={project.id}
              id={`portfolio-item-${project.id}`}
              onClick={() => onSelectProject(project)}
              className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-[#D4AF37]/50 bg-[#0E0F14] transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            >
              {/* Visual Preview Header */}
              <div
                className="h-56 sm:h-64 relative p-6 flex flex-col justify-between overflow-hidden"
                style={{ background: project.heroImage }}
              >
                <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0F14] via-transparent to-transparent" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-black/60 border border-white/10 text-white/80">
                    {project.category}
                  </span>
                  <span className="text-xs font-mono text-white/60">{project.year}</span>
                </div>

                <div className="relative z-10 flex items-end justify-between">
                  <div>
                    <span className="text-xs font-mono text-white/50 block">{project.client}</span>
                    <h4 className="font-display text-xl sm:text-2xl font-bold uppercase text-[#FFF5DC] tracking-tight group-hover:text-[#F3E5AB] transition-colors">
                      {project.title}
                    </h4>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 group-hover:bg-[#D4AF37] group-hover:text-[#08090B] flex items-center justify-center transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Metadata & Key Metrics */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-white/60 font-light leading-relaxed line-clamp-2">
                  {project.description}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06]">
                  {project.impactMetrics.map((metric, i) => (
                    <div key={i} className="text-center p-2 rounded bg-white/[0.02]">
                      <div className="font-display text-sm font-bold text-[#E5C378]">
                        {metric.value}
                      </div>
                      <div className="text-[9px] uppercase font-mono text-white/40 truncate">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Work Button */}
        <div className="mt-16 text-center">
          <button
            id="view-all-work-btn"
            onClick={onViewAllWork || (() => window.scrollTo({ top: 0, behavior: 'smooth' }))}
            className="px-8 py-4 rounded-full border border-[#D4AF37]/40 bg-white/[0.02] hover:bg-[#D4AF37] hover:text-[#08090B] text-[#FFF5DC] font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.15)] cursor-pointer inline-flex items-center gap-2"
          >
            <span>View All Selected Case Studies</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
