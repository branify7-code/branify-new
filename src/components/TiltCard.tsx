/* =========================================================
   TiltCard — 1:1 replica of branify.store's shared 3D tilt
   card (perspective wrapper + cursor-tracked rotate + gold
   radial glow + masked border glow). Respects reduced motion.
========================================================= */

import React, { useRef, useState, useEffect } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  maxTilt?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  onClick,
  maxTilt = 8,
  disabled = false,
  style = {},
  ariaLabel,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ rx: number; ry: number; isHovered: boolean }>({ rx: 0, ry: 0, isHovered: false });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (disabled || reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty('--x', `${x}px`);
    ref.current.style.setProperty('--y', `${y}px`);
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    const normalizeX = (x - halfW) / halfW;
    const rotateX = -((y - halfH) / halfH * maxTilt);
    const rotateY = normalizeX * maxTilt;
    setTilt({ rx: rotateX, ry: rotateY, isHovered: true });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, isHovered: false });
  };

  const transform =
    tilt.isHovered && !reducedMotion && !disabled
      ? `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) scale(1.02)`
      : 'rotateX(0deg) rotateY(0deg) scale(1)';

  return (
    <div className="perspective-1200 w-full">
      <div
        ref={ref}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ transform, transition: tilt.isHovered ? 'transform 0.15s ease-out' : 'transform 0.5s ease-out', ...style }}
        className={`tilt-card-wrapper preserve-3d relative rounded-2xl bg-[#080C12]/85 backdrop-blur-xl border border-white/[0.08] hover:border-[#C9A45C]/35 hover:bg-[#0C1118] shadow-xl shadow-black/60 overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
        aria-label={ariaLabel}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      >
        <div className="tilt-card-glow" />
        <div className="tilt-card-border-glow" />
        <div className="relative z-10 h-full preserve-3d">{children}</div>
      </div>
    </div>
  );
};

export default TiltCard;
