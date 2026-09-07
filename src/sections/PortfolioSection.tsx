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

  const categories = ['All', 'E-Commerce Experience', 'Digital Marketplace'];

  const filteredProjects =
    activeCategory === 'All'
      ? projectsData
      : projectsData.filter((p) => p.category === activeCategory);

  const featuredProject = projectsData.find((p) => p.isFeatured) || projectsData[0];
  const secondaryProjects = projectsData.filter((p) => p.id !== featuredProject.id);

  return (
    <section id="work" className="relative py-28 sm:py-36 bg-gradient-to-b from-[#F0F6FF] to-white text-[#111827] overflow-hidden">
      {/* Ambient background tints */}
      <div className="absolute top-1/4 left-0 w-[560px] h-[560px] bg-[#DBEAFE]/70 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-[#E0E7FF]/60 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-8 border-b border-[#E2E8F0] gap-6">
          <div className="space-y-4">
            <div className="eyebrow-label">
              <Sparkles className="w-3.5 h-3.5" />
              <span>// Case Study Archives</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.03em] text-[#111827]">
              Selected Work
            </h2>
            <p className="text-base sm:text-lg text-[#64748B] max-w-xl leading-relaxed">
              Digital experiences built to perform — combining spatial aesthetics with quantitative commercial velocity.
            </p>
          </div>

          {/* Filter Categories Chips */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] font-mono mr-2 hidden sm:flex">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>
            {categories.slice(0, 4).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#3B82F6] text-white font-bold shadow-[0_6px_18px_-6px_rgba(59,130,246,0.5)]'
                    : 'bg-white text-[#475569] border border-[#E2E8F0] hover:border-[#3B82F6]/40 hover:text-[#3B82F6]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 1. Large Featured Showcase Hero Card — imagery left 60%, editorial content right */}
        {activeCategory === 'All' && (
          <div
            id="featured-project-card"
            onClick={() => onSelectProject(featuredProject)}
            className="group relative mb-16 rounded-3xl overflow-hidden border border-[#E2E8F0] bg-white transition-all duration-500 cursor-pointer shadow-[0_24px_70px_-30px_rgba(15,23,42,0.25)] hover:shadow-[0_34px_90px_-30px_rgba(15,23,42,0.32)] hover:border-[#C9A45C]/40"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px] sm:min-h-[480px]">

              {/* Visual Showcase Half */}
              <div className="lg:col-span-7 relative overflow-hidden min-h-[300px]">
                <div
                  className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{ background: featuredProject.heroImage }}
                />
                <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/85 via-[#0B1120]/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#0B1120]/70" />

                <div className="relative z-10 h-full p-8 sm:p-12 flex flex-col justify-between">
                  {/* Top Badge */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-white/10 backdrop-blur-md text-white">
                      Featured Landmark Project
                    </span>
                    <span className="text-white/70 font-mono text-xs">{featuredProject.year}</span>
                  </div>

                  {/* Subtle Interactive Center Graphic */}
                  <div className="my-8 py-8 flex items-center justify-center">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/10 backdrop-blur-md border border-[#C9A45C]/50 group-hover:scale-110 group-hover:border-[#C9A45C] transition-all duration-500 flex items-center justify-center">
                      <span className="font-display text-xs font-mono uppercase tracking-widest text-white text-center px-3">
                        {featuredProject.client}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Preview Strip */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#C9A45C]/30">
                    {featuredProject.impactMetrics.map((m, i) => (
                      <div key={i}>
                        <div className="font-display text-xl sm:text-2xl font-bold text-white">
                          {m.value}
                        </div>
                        <div className="text-[10px] uppercase font-mono text-white/60 truncate">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editorial Metadata Half */}
              <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between space-y-6 bg-white">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-[#3B82F6]">{featuredProject.category}</span>
                    <span className="text-[#CBD5E1]">•</span>
                    <span className="text-[#94A3B8]">{featuredProject.serviceType}</span>
                  </div>

                  <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#111827] tracking-[-0.02em] group-hover:text-[#8F6B2D] transition-colors">
                    {featuredProject.title}
                  </h3>

                  <p className="text-sm text-[#64748B] leading-relaxed">
                    {featuredProject.description}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
                  <div className="flex flex-wrap gap-1.5">
                    {featuredProject.deliverables.map((deliv, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-mono text-[#475569]"
                      >
                        {deliv}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#8F6B2D] group-hover:underline flex items-center gap-1.5">
                      Explore Full Case Study
                    </span>
                    <div className="w-10 h-10 rounded-full bg-[#111827] text-white flex items-center justify-center group-hover:bg-[#C9A45C] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. Asymmetric Case Studies Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(activeCategory === 'All' ? secondaryProjects : filteredProjects).map((project, idx) => (
            <div
              key={project.id}
              id={`portfolio-item-${project.id}`}
              onClick={() => onSelectProject(project)}
              className={`group relative rounded-2xl overflow-hidden border border-[#E2E8F0] bg-white transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_14px_34px_-14px_rgba(15,23,42,0.14)] hover:-translate-y-1 hover:border-[#C9A45C]/40 ${
                idx % 3 === 1 ? 'md:mt-10' : ''
              }`}
            >
              {/* Visual Preview Header */}
              <div className="h-56 sm:h-64 relative overflow-hidden">
                <div
                  className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{ background: project.heroImage }}
                />
                <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120]/40 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/85 via-[#0B1120]/15 to-transparent" />

                <div className="relative z-10 h-full p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-white/90 backdrop-blur-sm text-[#334155]">
                      {project.category}
                    </span>
                    <span className="text-xs font-mono text-white/70">{project.year}</span>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-xs font-mono text-white/60 block">{project.client}</span>
                      <h4 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-[#E7C978] transition-colors truncate">
                        {project.title}
                      </h4>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white/90 text-[#111827] group-hover:bg-[#C9A45C] group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex items-center justify-center transition-all shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata & Key Metrics */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                  {project.description}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E2E8F0]">
                  {project.impactMetrics.map((metric, i) => (
                    <div key={i} className="text-center p-2 rounded-lg bg-[#F8FAFC]">
                      <div className="font-display text-sm font-bold text-[#8F6B2D]">
                        {metric.value}
                      </div>
                      <div className="text-[9px] uppercase font-mono text-[#94A3B8] truncate">
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
            className="px-8 py-4 rounded-full border border-[#E2E8F0] bg-white text-[#334155] hover:border-[#3B82F6]/50 hover:text-[#3B82F6] font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_2px_10px_rgba(15,23,42,0.04)] cursor-pointer inline-flex items-center gap-2"
          >
            <span>View All Selected Case Studies</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
