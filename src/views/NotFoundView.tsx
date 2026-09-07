// =============================================================================
// BRANIFY — 404 view for unknown SPA routes (logged to the admin 404 monitor)
// =============================================================================
import React from 'react';
import { Compass } from 'lucide-react';

export const NotFoundView: React.FC<{ path: string; onNavigateHome: () => void; onExploreTools: () => void }> = ({
  path, onNavigateHome, onExploreTools,
}) => (
  <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
    <p className="font-display text-[64px] font-extrabold leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-[#5B5FEF] via-[#3B82F6] to-[#8B5CF6] sm:text-[88px]">404</p>
    <h1 className="mt-3 font-display text-xl font-bold text-[#111827] sm:text-2xl">This page doesn’t exist</h1>
    <p className="mt-2 max-w-md text-sm leading-relaxed text-[#64748B]">
      The path <span className="font-mono text-[#8F6B2D]">{path}</span> isn’t part of BRANIFY.
      It has been logged so our team can review it.
    </p>
    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
      <button
        onClick={onNavigateHome}
        className="btn-gold-primary rounded-full px-6 py-3 text-xs font-bold uppercase tracking-widest"
      >
        Back to Homepage
      </button>
      <button
        onClick={onExploreTools}
        className="rounded-full bg-white border border-[#E2E8F0] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#334155] shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-colors hover:border-[#5B5FEF]/50 hover:text-[#5B5FEF]"
      >
        Explore 100+ Free Tools
      </button>
    </div>
  </div>
);
