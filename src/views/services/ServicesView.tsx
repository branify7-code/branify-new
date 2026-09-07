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

/* Icon system: color inherited from the accent chip of each card */
const iconCls = 'w-6 h-6';

/* Strategic accent rotation — one chip color per card (indigo / blue / purple / teal / pink) */
const accentChips: string[] = [
  'bg-[#EEF2FF] text-[#5B5FEF] border border-[#E0E7FF]',
  'bg-[#EFF6FF] text-[#3B82F6] border border-[#DBEAFE]',
  'bg-[#F5F3FF] text-[#8B5CF6] border border-[#EDE9FE]',
  'bg-[#F0FDFA] text-[#14B8A6] border border-[#CCFBF1]',
  'bg-[#FDF2F8] text-[#EC4899] border border-[#FCE7F3]',
];

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
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-80 bg-gradient-to-r from-[#EEF2FF] via-[#F0F6FF]/70 to-transparent blur-[120px] pointer-events-none" />

      {/* Hero */}
      <div className="text-center space-y-4 max-w-2xl mx-auto relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.04)] text-[#475569] text-[10px] font-extrabold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-[#8F6B2D]" />
          Primary Agency Capabilities
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-[#111827] tracking-[-0.03em] leading-[1.05]">
          DIGITAL AGENCY{' '}
          <span className="text-gold-gradient">SERVICES</span>
        </h1>
        <p className="text-[#64748B] text-xs sm:text-sm leading-relaxed">
          {servicesRegistry.length} specialized, high-impact digital services designed to help ambitious companies build, brand, and scale
          worldwide. Each service includes 4 transparent package tiers.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-full text-xs text-[#475569] shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
          <span>{currencyInfo.flag}</span>
          <span>
            Displaying live prices in{' '}
            <strong className="text-[#111827]">
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
                ? 'btn-gradient-primary text-[#111827] shadow-lg shadow-[#C9A45C]/25'
                : 'bg-white border border-[#E2E8F0] text-[#475569] hover:text-[#5B5FEF] hover:border-[#5B5FEF]/50 shadow-[0_2px_10px_rgba(15,23,42,0.04)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {filtered.map((service, idx) => {
          const isFeatured = idx === 0;
          const prices = (service.packages || []).map((p) => p.priceUSD).filter((p) => p > 0);
          const startingFrom = prices.length > 0 ? Math.min(...prices) : 0;
          return (
            <TiltCard
              key={service.id}
              onClick={() => onNavigate(`/services/${service.slug}`)}
              className={`${isFeatured ? 'md:col-span-2 border-l-4 border-l-[#5B5FEF] sm:p-8' : ''} p-6 h-full flex flex-col justify-between space-y-6 group`}
              ariaLabel={`View ${service.name} packages`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${accentChips[idx % accentChips.length]} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    {iconMap[service.iconName] || <Globe className={iconCls} />}
                  </div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
                    <Layers className="w-3 h-3 text-[#5B5FEF]" />
                    4 Packages
                  </div>
                </div>
                <div style={{ transform: 'translateZ(25px)' }}>
                  <h2 className={`font-display text-lg font-extrabold text-[#111827] tracking-tight group-hover:text-[#8F6B2D] transition-colors ${isFeatured ? 'sm:text-xl' : ''}`}>
                    {service.name}
                  </h2>
                  <p className="text-[#64748B] text-xs mt-1.5 leading-relaxed line-clamp-2">{service.shortDescription}</p>
                </div>
                <div
                  className="space-y-2 pt-3 border-t border-[#E2E8F0] text-xs text-[#475569]"
                  style={{ transform: 'translateZ(20px)' }}
                >
                  <div className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Package Tiers:</div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold text-[#475569]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                      Basic
                    </div>
                    <div className="flex items-center gap-1.5 text-[#5B5FEF]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5B5FEF]" />
                      Professional
                    </div>
                    <div className="flex items-center gap-1.5 text-[#475569]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C9A45C]" />
                      Premium
                    </div>
                    <div className="flex items-center gap-1.5 text-[#475569]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]" />
                      On-Demand
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs" style={{ transform: 'translateZ(30px)' }}>
                <div>
                  <span className="text-[#64748B] text-[11px]">Starting from </span>
                  <span className="font-extrabold text-[#8F6B2D]">{startingFrom > 0 ? format(startingFrom) : 'Quote on Request'}</span>
                </div>
                <div className="text-[#8F6B2D] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1 uppercase tracking-wider text-[11px]">
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
