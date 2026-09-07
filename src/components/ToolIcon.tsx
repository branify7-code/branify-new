/* =========================================================
   ToolIcon — renders a tool's brand icon asset.
   · official assets live in /public/ai-icons (Simple Icons
     official marks or the tool's own published icon files)
   · neutral monogram tile fallback — never a fake brand mark
========================================================= */
import React, { useState } from 'react';

interface ToolIconProps {
  /** asset path from ai_tools.icon (e.g. /ai-icons/chatgpt.svg) — empty = neutral tile */
  icon: string;
  name: string;
  className?: string;
  rounded?: string;
}

/** Deterministic neutral tile color from the tool name. */
const TILE_STYLES = [
  'bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] text-[#4338CA]',
  'bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] text-[#0F766E]',
  'bg-gradient-to-br from-[#FFF7ED] to-[#FED7AA] text-[#C2410C]',
  'bg-gradient-to-br from-[#FAF5FF] to-[#E9D5FF] text-[#7C3AED]',
  'bg-gradient-to-br from-[#FEF2F2] to-[#FECACA] text-[#B91C1C]',
  'bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] text-[#334155]',
];

export const ToolIcon: React.FC<ToolIconProps> = ({ icon, name, className = 'w-10 h-10', rounded = 'rounded-xl' }) => {
  const [failed, setFailed] = useState(false);
  const showImage = icon && icon.startsWith('/') && !failed;

  if (showImage) {
    return (
      <div className={`${className} ${rounded} bg-white border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.06)] flex items-center justify-center overflow-hidden shrink-0`}>
        <img
          src={icon}
          alt={`${name} logo`}
          loading="lazy"
          decoding="async"
          className="w-[62%] h-[62%] object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  const style = TILE_STYLES[(name.charCodeAt(0) + name.length) % TILE_STYLES.length];
  return (
    <div
      className={`${className} ${rounded} ${style} flex items-center justify-center font-display font-extrabold shrink-0 border border-black/5 shadow-[0_2px_8px_rgba(15,23,42,0.06)]`}
      aria-hidden="true"
    >
      <span className="text-[45%] leading-none select-none">{(name || '?').charAt(0).toUpperCase()}</span>
    </div>
  );
};
