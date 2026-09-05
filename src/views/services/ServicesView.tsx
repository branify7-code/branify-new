/* =========================================================
   ServicesView — 1:1 replica of branify.store/services
   (ServicesPage chunk): hero, currency badge, 4 filter
   tabs, 11 tilt service cards -> /services/<slug>.
========================================================= */

import React, { useMemo, useState, useEffect } from 'react';
import {
  Globe, LayoutGrid, ShoppingBag, ShoppingCart, MousePointerClick,
  Figma, Palette, Sparkles, Share2, Presentation, Search, Bot,
  TrendingUp, Layers, ArrowRight,
} from 'lucide-react';
import TiltCard from '../../components/TiltCard';
import Seo from '../../components/Seo';
import { servicesRegistry } from '../../data/servicesRegistry';
import { useCurrency } from '../../lib/currency';

interface ServicesViewProps {
  onNavigate: (path: string) => void;
  initialCategory?: string | null;
}

/* Icon system: steel default, gold on hover (global design system — no rainbow accents) */
const iconCls = 'w-6 h-6 text-[#A7AFBA] transition-colors duration-300 group-hover:text-[#E9CF79]';

const iconMap: Record<string, React.ReactNode> = {
  Globe: <Globe className={iconCls} />,
  LayoutGrid: <LayoutGrid className={iconCls} />,
  ShoppingBag: <ShoppingBag className={iconCls} />,
  ShoppingCart: <ShoppingCart className={iconCls} />,
  MousePointerClick: <MousePointerClick className={iconCls} />,
  Figma: <Figma className={iconCls} />,
  Palette: <Palette className={iconCls} />,
  Sparkles: <Sparkles className={iconCls} />,
  Share2: <Share2 className={iconCls} />,
  Presentation: <Presentation className={iconCls} />,
  Search: <Search className={iconCls} />,
  Bot: <Bot className={iconCls} />,
  TrendingUp: <TrendingUp className={iconCls} />,
};

/* Map legacy header/footer ?category= ids to live filter tabs */
const categoryToFilter: Record<string, string> = {
  web: 'web',
  'web-dev': 'web',
  'website-development': 'web',
  'wordpress-development': 'web',
  'landing-pages': 'web',
  'mobile-apps': 'web',
  'cloud-devops': 'web',
  ecommerce: 'web',
  branding: 'branding',
  design: 'branding',
  'ui-ux': 'branding',
  'ui-ux-design': 'branding',
  'logo-design': 'branding',
  'brand-identity': 'branding',
  'business-presentation': 'branding',
  'digital-marketing': 'growth',
  marketing: 'growth',
  seo: 'growth',
  ai: 'growth',
  'ai-solutions': 'growth',
  consulting: 'growth',
  'business-consultation': 'growth',
};

const filterTabs = [
  { id: 'all', label: 'All 11 Services' },
  { id: 'web', label: 'Website & Development' },
  { id: 'branding', label: 'Design & Branding' },
  { id: 'growth', label: 'Growth & Technology' },
];

export const ServicesView: React.FC<ServicesViewProps> = ({ onNavigate, initialCategory }) => {
  const { currency, currencyInfo, format } = useCurrency();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    if (initialCategory) {
      setActiveFilter(categoryToFilter[initialCategory.toLowerCase().trim()] || 'all');
    }
  }, [initialCategory]);

  useEffect(() => {
    document.title = 'Digital Agency Services | Web, Branding, AI & SEO | BRANIFY';
    return () => {
      document.title = 'Custom Web Development & Digital Agency | BRANIFY';
    };
  }, []);

  const filtered = useMemo(
    () =>
      servicesRegistry.filter((s) =>
        activeFilter === 'all'
          ? true
          : activeFilter === 'web'
            ? s.category === 'web'
            : activeFilter === 'branding'
              ? s.category === 'branding' || s.category === 'design'
              : activeFilter === 'growth'
                ? s.category === 'marketing' || s.category === 'ai' || s.category === 'consulting'
                : true
      ),
    [activeFilter]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 relative">
      <Seo
        title="Digital Agency Services | Web, Branding, AI & SEO | BRANIFY"
        description="Explore BRANIFY's digital services including web development, branding, AI solutions, e-commerce, SEO, UI/UX and digital growth."
        canonicalPath="/services"
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'Services', url: '/services' }]}
      />

      {/* Ambient glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-80 bg-gradient-to-r from-[#C9A45C]/[0.10] via-[#D4AF37]/[0.06] to-transparent blur-[120px] pointer-events-none" />

      {/* Hero */}
      <div className="text-center space-y-4 max-w-2xl mx-auto relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.12] text-zinc-300 text-[10px] font-extrabold uppercase tracking-widest backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          Primary Agency Capabilities
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-[#F1F2EE] uppercase tracking-tighter">
          DIGITAL AGENCY{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A45C] via-[#E9CF79] to-[#D4AF37]">SERVICES</span>
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
          {servicesRegistry.length} specialized, high-impact digital services designed to help ambitious companies build, brand, and scale
          worldwide. Each service includes 4 transparent package tiers.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-full text-xs text-zinc-300 backdrop-blur-md">
          <span>{currencyInfo.flag}</span>
          <span>
            Displaying live prices in{' '}
            <strong className="text-[#F1F2EE]">
              {currency} ({currencyInfo.symbol.trim()})
            </strong>
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-center gap-2 flex-wrap text-xs relative z-10">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-5 py-2.5 rounded-full transition-all text-xs uppercase tracking-wider font-extrabold cursor-pointer ${
              activeFilter === tab.id
                ? 'btn-gradient-primary text-[#F1F2EE] shadow-lg shadow-[#C9A45C]/25'
                : 'bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-[#F1F2EE] hover:border-white/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {filtered.map((service) => {
          const prices = (service.packages || []).map((p) => p.priceUSD).filter((p) => p > 0);
          const startingFrom = prices.length > 0 ? Math.min(...prices) : 0;
          return (
            <TiltCard
              key={service.id}
              onClick={() => onNavigate(`/services/${service.slug}`)}
              className="p-6 h-full flex flex-col justify-between space-y-6 group"
              ariaLabel={`View ${service.name} packages`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.12] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {iconMap[service.iconName] || <Globe className={iconCls} />}
                  </div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/[0.04] border border-white/[0.08] rounded-full text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                    <Layers className="w-3 h-3 text-[#D4AF37]" />
                    4 Packages
                  </div>
                </div>
                <div style={{ transform: 'translateZ(25px)' }}>
                  <h2 className="text-lg font-black text-[#F1F2EE] uppercase tracking-tight group-hover:text-[#E9CF79] transition-colors">
                    {service.name}
                  </h2>
                  <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed line-clamp-2">{service.shortDescription}</p>
                </div>
                <div
                  className="space-y-2 pt-3 border-t border-white/[0.08] text-xs text-zinc-300"
                  style={{ transform: 'translateZ(20px)' }}
                >
                  <div className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">Package Tiers:</div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                      Basic
                    </div>
                    <div className="flex items-center gap-1.5 text-[#D4AF37]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A7AFBA]" />
                      Professional
                    </div>
                    <div className="flex items-center gap-1.5 text-[#A7AFBA]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A7AFBA]" />
                      Premium
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      On-Demand
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs" style={{ transform: 'translateZ(30px)' }}>
                <div>
                  <span className="text-zinc-500 text-[11px]">Starting from </span>
                  <span className="font-extrabold text-[#D4AF37]">{startingFrom > 0 ? format(startingFrom) : 'Quote on Request'}</span>
                </div>
                <div className="text-[#D4AF37] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1 uppercase tracking-wider text-[11px]">
                  View Packages
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </TiltCard>
          );
        })}
      </div>
    </div>
  );
};

export default ServicesView;
