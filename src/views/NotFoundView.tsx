// =============================================================================
// BRANIFY — 404 view for unknown SPA routes (logged to the admin 404 monitor)
// =============================================================================
import React from 'react';
import { Compass } from 'lucide-react';

export const NotFoundView: React.FC<{ path: string; onNavigateHome: () => void; onExploreTools: () => void }> = ({
  path, onNavigateHome, onExploreTools,
}) => (
  <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
    <p className="font-display text-[64px] font-extrabold leading-none text-gold-gradient sm:text-[88px]">404</p>
    <h1 className="mt-3 font-display text-xl font-bold text-white sm:text-2xl">This page doesn’t exist</h1>
    <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
      The path <span className="font-mono text-[#D4AF37]">{path}</span> isn’t part of BRANIFY.
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
        className="rounded-full border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-200 transition-colors hover:border-[#D4AF37]/50 hover:text-[#F3E5AB]"
      >
        Explore 100+ Free Tools
      </button>
    </div>
  </div>
);
