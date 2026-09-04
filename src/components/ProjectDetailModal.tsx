import React from 'react';
import { X, ExternalLink, ArrowRight, Award } from 'lucide-react';
import { Project } from '../types';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onStartInquiry?: (category: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onStartInquiry,
}) => {
  if (!isOpen || !project) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/85 backdrop-blur-2xl animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
    >
      <div
        className="relative w-full max-w-4xl bg-[#0D0E13] border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 md:p-12 shadow-[0_25px_100px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="close-project-modal-btn"
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 rounded-full border border-white/15 hover:border-[#D4AF37]/60 text-white/70 hover:text-white transition-colors z-20"
          aria-label="Close project details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Project Header */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono tracking-wider bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#FFF5DC]">
              {project.category}
            </span>
            <span className="text-white/40 text-xs font-mono">•</span>
            <span className="text-white/60 text-xs font-mono">{project.client}</span>
            <span className="text-white/40 text-xs font-mono">•</span>
            <span className="text-white/60 text-xs font-mono">{project.year}</span>
          </div>

          <h2 id="modal-project-title" className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#FFF5DC] tracking-tight">
            {project.title}
          </h2>

          <p className="text-lg text-white/70 font-light leading-relaxed max-w-2xl">
            {project.description}
          </p>
        </div>

        {/* Abstract Cinematic Banner */}
        <div
          className="w-full h-64 sm:h-80 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col justify-end p-6 md:p-8 mb-8"
          style={{ background: project.heroImage }}
        >
          {/* Subtle Grid overlay */}
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E13] via-transparent to-transparent" />

          {/* Holographic Watermark */}
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#D4AF37] mb-1">
                <Award className="w-4 h-4" />
                <span>Branify Production Showcase</span>
              </div>
              <p className="font-display text-xl font-semibold text-white/90">{project.serviceType}</p>
            </div>
            <div className="w-12 h-12 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center text-white/80">
              <ExternalLink className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mb-10">
          <h3 className="text-xs uppercase tracking-widest text-white/50 mb-4 font-mono">
            Verified Business & Technical Impact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {project.impactMetrics.map((m, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-[#D4AF37]/30 transition-colors"
              >
                <div className="font-display text-3xl md:text-4xl font-bold text-[#FFF5DC] tracking-tight">
                  {m.value}
                </div>
                <div className="text-xs uppercase tracking-wider text-white/60 mt-1 font-mono">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables & Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 pb-8 border-b border-white/10">
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white/50 mb-3 font-mono">
              Key Deliverables & Systems
            </h4>
            <ul className="space-y-2.5">
              {project.deliverables.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest text-white/50 mb-3 font-mono">
              Architectural Craftsmanship
            </h4>
            <p className="text-sm text-white/60 leading-relaxed">
              Designed from first principles to balance uncompromising brand aesthetics with sub-100ms edge execution. Built using React, custom Three.js spatial viewports, and reactive cloud synchronization.
            </p>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-white/40 font-mono">
            Case Study Reference: BRF-{project.id.toUpperCase()}
          </div>
          <button
            id="inquire-similar-project-btn"
            onClick={() => {
              onClose();
              if (onStartInquiry) onStartInquiry(project.category);
            }}
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C378] text-[#08090B] font-semibold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(212,175,55,0.3)]"
          >
            <span>Commission Similar Experience</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
