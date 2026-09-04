import React, { useEffect, useState, useRef } from 'react';
import { statsData } from '../data/stats';

export const StatsSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-28 bg-[#08090B] border-y border-white/[0.06] overflow-hidden"
    >
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-mesh-radial opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {statsData.map((stat, idx) => (
            <StatCounterItem
              key={idx}
              stat={stat}
              index={idx}
              triggerAnimation={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

interface StatCounterItemProps {
  stat: {
    value: number;
    suffix: string;
    label: string;
    description: string;
    sublabel: string;
  };
  index: number;
  triggerAnimation: boolean;
}

const StatCounterItem: React.FC<StatCounterItemProps> = ({
  stat,
  index,
  triggerAnimation,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!triggerAnimation) return;

    let start = 0;
    const end = stat.value;
    const duration = 1600; // ms
    const stepTime = 25;
    const totalSteps = duration / stepTime;
    const increment = end / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [triggerAnimation, stat.value]);

  return (
    <div
      id={`stat-strip-item-${index}`}
      className="space-y-2 p-6 rounded-2xl bg-white/[0.01] border border-white/[0.04] hover:border-[#D4AF37]/30 transition-colors"
    >
      <div className="flex items-baseline gap-1">
        <span className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-[#FFF5DC] tracking-tight">
          {count}
        </span>
        <span className="font-display text-3xl sm:text-4xl font-bold text-[#D4AF37]">
          {stat.suffix}
        </span>
      </div>

      <div className="font-mono text-xs uppercase tracking-widest text-[#E5C378] font-semibold">
        {stat.label}
      </div>

      <p className="text-xs text-white/50 font-light leading-relaxed">
        {stat.description}
      </p>

      <div className="text-[10px] font-mono text-white/30 pt-1">
        {stat.sublabel}
      </div>
    </div>
  );
};
