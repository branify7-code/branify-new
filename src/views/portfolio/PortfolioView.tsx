import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, Sparkles, Filter, Layers, 
  ExternalLink, CheckCircle2, TrendingUp, Calendar, ChevronRight 
} from 'lucide-react';
import { projectsData } from '../../data/projects';
import { Project } from '../../types';

interface PortfolioViewProps {
  onSelectProject: (project: Project) => void;
  onStartInquiry: (category?: string) => void;
  onNavigateHome: () => void;
  initialProjectId?: string | null;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  onSelectProject,
  onStartInquiry,
  onNavigateHome,
  initialProjectId,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (initialProjectId) {
      const match = projectsData.find((p) => p.id === initialProjectId);
      if (match) {
        onSelectProject(match);
      }
    }
  }, [initialProjectId, onSelectProject]);

  const categories = [
    { id: 'all', label: 'All Deployments' },
    { id: 'e-commerce', label: 'E-Commerce' },
    { id: 'web', label: 'Web Applications' },
  ];

  const filteredProjects = projectsData.filter((project) => {
    const matchesCategory =
      selectedFilter === 'all' ||
      project.category.toLowerCase().includes(selectedFilter) ||
      project.serviceType.toLowerCase().includes(selectedFilter);

    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header Breadcrumbs & Hero Title */}
      <div className="space-y-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.04)] text-xs font-mono text-[#8F6B2D]">
          <button 
            onClick={onNavigateHome} 
            className="text-[#64748B] hover:text-[#111827] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="text-[#CBD5E1]">/</span>
          <span className="text-[#8F6B2D]">Selected Work & Case Studies</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] leading-[1.08] text-[#111827]">
          Engineered for <br />
          <span className="text-gold-gradient">Impact & Distinction</span>
        </h1>

        <p className="text-sm sm:text-lg text-[#475569] font-light leading-relaxed">
          A showcase of recent digital flagships, high-throughput web applications, generative AI orchestration platforms, and luxury interactive experiences.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedFilter(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                selectedFilter === cat.id
                  ? 'bg-[#5B5FEF] text-white font-semibold shadow-[0_8px_20px_-8px_rgba(91,95,239,0.55)]'
                  : 'bg-[#F8FAFC] text-[#475569] hover:text-[#111827] hover:bg-[#F1F5F9]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Search projects or tech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-xl input-light text-xs placeholder-[#94A3B8]"
          />
        </div>
      </div>

      {/* Projects Grid — featured case study + asymmetric grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project, idx) => {
          const isFeatured = idx === 0;
          if (isFeatured) {
            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="group md:col-span-2 lg:col-span-3 lg:grid lg:grid-cols-5 rounded-2xl bg-white border border-[#E2E8F0] overflow-hidden transition-all duration-300 cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_24px_54px_-20px_rgba(15,23,42,0.18)] hover:border-[#C9A45C]/40"
              >
                {/* Featured Visual — 60% */}
                <div className="relative h-64 sm:h-80 lg:h-auto lg:min-h-[400px] lg:col-span-3 overflow-hidden">
                  <div
                    className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{ background: project.heroImage }}
                  />
                  <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-white/85 backdrop-blur border border-[#E2E8F0] text-[10px] font-mono text-[#334155] uppercase tracking-wider">
                      {project.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white/85 backdrop-blur border border-[#E2E8F0] text-[10px] font-mono text-[#475569]">
                      {project.year}
                    </span>
                  </div>
                </div>

                {/* Featured Content — 40% */}
                <div className="lg:col-span-2 p-7 sm:p-9 flex flex-col justify-center space-y-5">
                  <span className="text-xs font-mono text-[#64748B]">{project.client}</span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827] group-hover:text-[#8F6B2D] transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-[#475569] leading-relaxed line-clamp-3">
                    {project.description}
                  </p>

                  {/* Impact Metrics Row */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E2E8F0]">
                    {project.impactMetrics.slice(0, 2).map((m, mi) => (
                      <div key={mi}>
                        <span className="block font-display text-lg font-extrabold text-[#111827]">
                          {m.value}
                        </span>
                        <span className="text-[10px] text-[#64748B] truncate block">
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-mono text-[#94A3B8]">{project.serviceType}</span>
                    <div className="w-10 h-10 rounded-full bg-white border border-[#E2E8F0] text-[#111827] flex items-center justify-center transition-all duration-300 group-hover:bg-[#5B5FEF] group-hover:border-[#5B5FEF] group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[0_10px_24px_-8px_rgba(91,95,239,0.55)]">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="group rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#C9A45C]/40 overflow-hidden transition-all duration-300 flex flex-col cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.16)] hover:-translate-y-1"
            >
              {/* Visual Canvas Card Header */}
              <div className="relative h-56 w-full overflow-hidden">
                <div
                  className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{ background: project.heroImage }}
                />
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-white/85 backdrop-blur border border-[#E2E8F0] text-[10px] font-mono text-[#334155] uppercase tracking-wider">
                    {project.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/85 backdrop-blur border border-[#E2E8F0] text-[10px] font-mono text-[#475569]">
                    {project.year}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-white/85 backdrop-blur border border-[#E2E8F0] text-[11px] font-mono text-[#334155]">
                    {project.client}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur border border-[#E2E8F0] text-[#111827] flex items-center justify-center transition-all duration-300 group-hover:bg-[#5B5FEF] group-hover:border-[#5B5FEF] group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Content Details */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-2.5">
                  <h3 className="font-display text-xl font-bold text-[#111827] group-hover:text-[#8F6B2D] transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                {/* Impact Metrics Row */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E2E8F0]">
                  {project.impactMetrics.slice(0, 2).map((m, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-[#F8FAFC]">
                      <span className="block font-mono text-xs font-bold text-[#8F6B2D]">
                        {m.value}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] truncate block">
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-sm text-[#64748B]">No case studies matched your filter.</p>
          <button
            onClick={() => {
              setSelectedFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-xs font-semibold text-[#5B5FEF] hover:border-[#5B5FEF]/50 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Bottom CTA Card */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#F0F6FF] to-white border border-[#E2E8F0] p-8 sm:p-12 text-center space-y-6 overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[440px] h-[220px] bg-[#5B5FEF]/[0.08] blur-[90px] rounded-full pointer-events-none" />
        <div className="relative inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B5FEF]/10 border border-[#5B5FEF]/25 text-xs font-mono text-[#5B5FEF]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Architecture</span>
        </div>
        <h2 className="relative font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-[#111827]">
          Ready to Build Your Flagship Product?
        </h2>
        <p className="relative text-xs sm:text-sm text-[#475569] max-w-xl mx-auto leading-relaxed">
          From concept architecture to deployment, partner with our digital studio for unprecedented design fidelity and computational power.
        </p>
        <div className="relative">
          <button
            onClick={() => onStartInquiry('Portfolio')}
            className="btn-gold-primary px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
          >
            Schedule a Discovery Session
          </button>
        </div>
      </div>
    </div>
  );
};
