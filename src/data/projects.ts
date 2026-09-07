import { Project } from '../types';

export const projectsData: Project[] = [
  {
    id: 'taqder-jts',
    title: 'Premium Fashion Clothing Storefront',
    client: 'TAQDER BY JTS',
    category: 'E-Commerce Experience',
    serviceType: 'E-Commerce Design & PWA Development',
    year: '2026',
    description: 'A premium fashion commerce experience for TAQDER BY JTS — contemporary Bangladeshi couture & pret for women, with curated seasonal edits, an installable app-grade storefront, WhatsApp ordering and cash-on-delivery flow.',
    impactMetrics: [
      { label: 'Curated Collection Edits', value: '5' },
      { label: 'App-Grade PWA Storefront', value: 'Offline-Ready' },
      { label: 'Ordering Channels', value: 'Web + WhatsApp' }
    ],
    deliverables: ['Premium Fashion Storefront UI', 'Curated Collections Architecture', 'Installable PWA + WhatsApp Orders', 'Ordering Guide & Client Reviews'],
    heroImage: 'url(/portfolio/taqder-cover.jpg) left center / cover no-repeat',
    accentColor: '#E0446B',
    isFeatured: true
  },
  {
    id: 'tatka-bazar',
    title: 'Express Grocery Home Delivery Platform',
    client: 'Tatka Bazar Supermarket',
    category: 'E-Commerce Experience',
    serviceType: 'E-Commerce Design & Development',
    year: '2026',
    description: 'A full-catalog online supermarket for Tatka Bazar — a Dubai grocery store in International City (Warsan 1) — with 19 shoppable departments, bilingual English/Arabic product listings, weekly offer pricing, free delivery over 50 AED and one-tap WhatsApp ordering alongside a smart cart.',
    impactMetrics: [
      { label: 'Grocery Departments', value: '19' },
      { label: 'Ordering Channels', value: 'Cart + WhatsApp' },
      { label: 'Open Daily', value: '7 AM – 1 AM' }
    ],
    deliverables: ['Bilingual EN/AR Storefront UI', '19-Department Catalog Architecture', 'Weekly Offers & Discount Engine', 'WhatsApp Ordering + Installable App'],
    heroImage: 'url(/portfolio/tatka-bazar-cover.jpg) left center / cover no-repeat',
    accentColor: '#007A55',
    isFeatured: false
  },
  {
    id: 'playbeat-digital',
    title: 'Premium Digital Marketplace & Smart Projectors',
    client: 'PlayBeat Digital',
    category: 'Digital Marketplace',
    serviceType: 'Full-Stack Marketplace Web Development',
    year: '2026',
    description: "Pakistan's premium digital marketplace — gaming top-ups, streaming subscriptions, software & AI tools, gift cards and smart projectors in one dark-premium storefront with 68+ stocked products, instant digital code delivery, PKR pricing and a QR-installed companion app.",
    impactMetrics: [
      { label: 'Products In Stock', value: '68+' },
      { label: 'Curated Categories', value: '6' },
      { label: 'Digital Code Delivery', value: '24/7 Instant' }
    ],
    deliverables: ['Dark-Premium Marketplace UI', '68-Item Catalog with Sort & Filters', 'Instant Key Delivery + Order Tracking', 'Android APK + QR Companion App'],
    heroImage: 'url(/portfolio/playbeat-cover.jpg) left center / cover no-repeat',
    accentColor: '#F8B808',
    isFeatured: false
  },
  {
    id: 'blockexchange',
    title: 'Institutional AI-Powered Crypto Trading Platform',
    client: 'BLOCKEXCHANGE',
    category: 'AI Trading Platform',
    serviceType: 'AI-Powered Trading Platform Web Development',
    year: '2026',
    description: 'BLOCKEXCHANGE is an institutional binary trading desk for crypto — pick BUY UP or BUY DOWN, set a 30s/60s/120s expiry and let real-time pricing settle the trade instantly. 18 live market pairs with sparkline trends, segregated wallets, invitation-only sub-agent onboarding and a full staff portal with audited operations.',
    impactMetrics: [
      { label: 'Registered Traders', value: '184,000+' },
      { label: 'Trades Settled', value: '58M+' },
      { label: 'Avg Execution', value: '2.4s' }
    ],
    deliverables: ['Binary Trading Engine — 30s/60s/120s Expiries', 'Live Markets Dashboard · 18 Pairs', 'Segregated Wallets + Sub-Agent Network', 'Staff Portal with Audited Operations'],
    heroImage: 'url(/portfolio/blockexchange-cover.jpg) left center / cover no-repeat',
    liveUrl: 'https://blockexchange.buzz/',
    accentColor: '#18A8F8',
    isFeatured: false
  }
];
