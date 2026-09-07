import { Project } from '../types';

export const projectsData: Project[] = [
  {
    id: 'aethel-luxury',
    title: 'Aethel Luxury Timepieces',
    client: 'Aethel Horology Group',
    category: 'E-Commerce Experience',
    serviceType: 'Web Design & 3D Commerce',
    year: '2025',
    description: 'An interactive 3D virtual showroom and bespoke checkout experience engineered for a Swiss independent luxury horology maison.',
    impactMetrics: [
      { label: 'Conversion Uplift', value: '+54%' },
      { label: 'Avg Time on Site', value: '4m 18s' },
      { label: 'Annual Digital Volume', value: '$18.4M' }
    ],
    deliverables: ['Web 3D Interactive Viewer', 'Custom Shopify Plus Store', 'Global Multi-Currency Engine', 'VIP Private Client Portal'],
    heroImage: 'linear-gradient(135deg, #181920 0%, #2A261B 50%, #0F1014 100%)',
    accentColor: '#D4AF37',
    isFeatured: true
  },
  {
    id: 'synapse-ai',
    title: 'Synapse Cognitive Cloud',
    client: 'Synapse Systems Inc.',
    category: 'AI Platform',
    serviceType: 'Product Design & Web Engineering',
    year: '2025',
    description: 'Next-generation AI orchestration platform with real-time vector visualization, autonomous agent workflows, and sub-millisecond telemetry.',
    impactMetrics: [
      { label: 'Active Enterprise Nodes', value: '140,000+' },
      { label: 'Processing Latency', value: '<24ms' },
      { label: 'Series B Capital', value: '$45M' }
    ],
    deliverables: ['Design System Architecture', 'Full-Stack Web App', 'Interactive Node Graph UI', 'Developer Documentation Engine'],
    heroImage: 'linear-gradient(135deg, #10121A 0%, #1D1E2C 50%, #090A0E 100%)',
    accentColor: '#C5A059',
    isFeatured: true
  },
  {
    id: 'lumina-architects',
    title: 'Lumina Spatial Architecture',
    client: 'Lumina Studio Tokyo',
    category: 'Luxury Brand Website',
    serviceType: 'Brand Identity & Web Development',
    year: '2024',
    description: 'A minimalist spatial digital experience documenting international architectural monuments through smooth web transitions and architectural typography.',
    impactMetrics: [
      { label: 'Global Design Awards', value: '6 Won' },
      { label: 'Page Speed Benchmark', value: '100 / 100' },
      { label: 'Inquiry Lead Quality', value: '+78%' }
    ],
    deliverables: ['Brand Identity Guidelines', 'Bespoke Custom Headless CMS', 'High-Res Image Optimization', 'Editorial Editorial Layouts'],
    heroImage: 'linear-gradient(135deg, #141519 0%, #232220 50%, #0B0C0E 100%)',
    accentColor: '#E5C378',
    isFeatured: true
  },
  {
    id: 'nexus-exchange',
    title: 'Nexus Digital Marketplace',
    client: 'Nexus Global Protocols',
    category: 'Digital Marketplace',
    serviceType: 'Full-Stack Software Development',
    year: '2024',
    description: 'High-frequency asset marketplace engineered with instant orderbook execution, WebGL data depth charts, and institutional multi-sig security.',
    impactMetrics: [
      { label: 'Monthly Trading Vol', value: '$1.2B' },
      { label: 'Concurrent Users', value: '85,000+' },
      { label: 'Crash Rate', value: '0.000%' }
    ],
    deliverables: ['Real-Time WebSocket Engine', 'Dark-Mode Focused UI', 'Mobile Adaptive Web App', 'Institutional Security Audit'],
    heroImage: 'linear-gradient(135deg, #0C0F14 0%, #1A2129 50%, #08090C 100%)',
    accentColor: '#D4AF37',
    isFeatured: false
  },
  {
    id: 'quantis-analytics',
    title: 'Quantis Technology Dashboard',
    client: 'Quantis Financial Tech',
    category: 'Technology Dashboard',
    serviceType: 'Enterprise UI/UX & Cloud Architecture',
    year: '2024',
    description: 'Precision risk management and financial modeling platform delivering real-time portfolio simulations for tier-one hedge funds.',
    impactMetrics: [
      { label: 'Data Points / Sec', value: '2.5M' },
      { label: 'Decision Speedup', value: '6.2x' },
      { label: 'Enterprise Retention', value: '99.4%' }
    ],
    deliverables: ['WebGL Data Visualizations', 'Dynamic Formula Builder', 'Role-Based Access Control', 'Multi-Monitor Display Mode'],
    heroImage: 'linear-gradient(135deg, #121319 0%, #25221B 50%, #0A0B0E 100%)',
    accentColor: '#C5A059',
    isFeatured: false
  },
  {
    id: 'verve-ventures',
    title: 'Verve Innovation Lab',
    client: 'Verve Ventures Global',
    category: 'Creative Business Website',
    serviceType: 'Brand Strategy & Digital Experience',
    year: '2024',
    description: 'An evocative portfolio portal connecting deep-tech startups with forward-thinking sovereign wealth funds and venture syndicates.',
    impactMetrics: [
      { label: 'Syndicate Deal Flow', value: '$320M' },
      { label: 'Investor Engagement', value: '+88%' },
      { label: 'Mobile Traffic Share', value: '62%' }
    ],
    deliverables: ['Custom WebGL Backgrounds', 'Pitch Deck Dynamic Hub', 'Interactive Portfolio Directory', 'Fast Automated Form Routing'],
    heroImage: 'linear-gradient(135deg, #16171E 0%, #221D16 50%, #090A0D 100%)',
    accentColor: '#E5C378',
    isFeatured: false
  },
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
    isFeatured: false
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
  }
];
