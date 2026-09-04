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
    { id: 'ai', label: 'AI & Machine Learning' },
    { id: 'web', label: 'Web Applications' },
    { id: 'brand', label: 'Brand & Spatial 3D' },
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
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#D4AF37]/30 text-xs font-mono text-[#F3E5AB]">
          <button 
            onClick={onNavigateHome} 
            className="text-white/60 hover:text-[#FFF5DC] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="text-white/30">/</span>
          <span className="text-[#D4AF37]">Selected Work & Case Studies</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
          Engineered for <br />
          <span className="text-gold-gradient">Impact & Distinction</span>
        </h1>

        <p className="text-sm sm:text-base text-white/65 font-light leading-relaxed">
          A showcase of recent digital flagships, high-throughput web applications, generative AI orchestration platforms, and luxury interactive experiences.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0F1015] border border-white/10">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedFilter(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                selectedFilter === cat.id
                  ? 'bg-[#D4AF37] text-[#08090B] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                  : 'bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.06]'
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
            className="w-full px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project)}
            className="group rounded-2xl bg-[#0F1015] border border-white/10 hover:border-[#D4AF37]/50 overflow-hidden transition-all duration-300 flex flex-col cursor-pointer shadow-lg hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]"
          >
            {/* Visual Canvas Card Header */}
            <div
              className="relative h-56 w-full p-6 flex flex-col justify-between overflow-hidden border-b border-white/5"
              style={{ background: project.heroImage }}
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider">
                  {project.category}
                </span>
                <span className="text-xs font-mono text-white/50">{project.year}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/70">{project.client}</span>
                <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-[#08090B] text-white flex items-center justify-center transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="font-display text-xl font-bold text-[#FFF5DC] group-hover:text-[#F3E5AB] transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed font-light">
                  {project.description}
                </p>
              </div>

              {/* Impact Metrics Row */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                {project.impactMetrics.slice(0, 2).map((m, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-white/[0.02]">
                    <span className="block font-mono text-xs font-bold text-[#D4AF37]">
                      {m.value}
                    </span>
                    <span className="text-[10px] text-white/50 truncate block">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-sm text-white/60">No case studies matched your filter.</p>
          <button
            onClick={() => {
              setSelectedFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-full bg-white/5 text-xs text-[#D4AF37]"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Bottom CTA Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#12131A] via-[#1A1810] to-[#12131A] border border-[#D4AF37]/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-xs font-mono text-[#D4AF37]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Architecture</span>
        </div>
        <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#FFF5DC]">
          Ready to Build Your Flagship Product?
        </h2>
        <p className="text-xs sm:text-sm text-white/70 max-w-xl mx-auto leading-relaxed">
          From concept architecture to deployment, partner with our digital studio for unprecedented design fidelity and computational power.
        </p>
        <div>
          <button
            onClick={() => onStartInquiry('Portfolio')}
            className="px-8 py-4 rounded-full bg-[#D4AF37] hover:bg-[#E5C378] text-[#08090B] font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(212,175,55,0.4)] cursor-pointer"
          >
            Schedule a Discovery Session
          </button>
        </div>
      </div>
    </div>
  );
};
