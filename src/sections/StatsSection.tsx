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
      className="relative py-20 sm:py-28 bg-[#F8FAFC] border-y border-[#E2E8F0] overflow-hidden"
    >
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-mesh-radial opacity-70 pointer-events-none" />
      <div className="absolute -top-24 right-1/4 w-[420px] h-[280px] bg-[#EEF2FF] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 lg:gap-0 lg:divide-x lg:divide-[#E2E8F0]">
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
      className="relative space-y-3 lg:px-10 lg:first:pl-2 lg:last:pr-2"
    >
      {/* Small gold→indigo tick above each number */}
      <div className="w-8 h-0.5 rounded-full bg-gradient-to-r from-[#C9A45C] to-[#5B5FEF]" />

      <div className="flex items-baseline gap-1">
        <span className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#111827] tracking-tight">
          {count}
        </span>
        <span className="font-display text-2xl sm:text-3xl font-bold text-[#8F6B2D]">
          {stat.suffix}
        </span>
      </div>

      <div className="font-mono text-[11px] uppercase tracking-widest text-[#64748B] font-semibold">
        {stat.label}
      </div>

      <p className="text-sm text-[#475569] leading-relaxed">
        {stat.description}
      </p>

      <div className="text-[10px] font-mono text-[#94A3B8] pt-1">
        {stat.sublabel}
      </div>
    </div>
  );
};
