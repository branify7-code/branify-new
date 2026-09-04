import { Service } from '../types';

export const servicesData: Service[] = [
  {
    id: 'web-dev',
    number: '01',
    title: 'WEB DEVELOPMENT',
    subtitle: 'Next-Generation Full-Stack Architectures',
    description: 'Bespoke web applications built for extreme speed, search visibility, and frictionless interactions. We leverage modern frameworks, edge computing, and fluid design systems.',
    iconName: 'Globe',
    deliverables: ['Custom Next.js & React Applications', 'Headless CMS Architecture', 'API Integrations & Webhooks', 'Performance Optimization <100ms'],
    technologies: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Tailwind CSS', 'GraphQL'],
    gradient: 'from-[#D4AF37]/20 via-[#997A15]/10 to-transparent',
    featuredStat: '99.9% Uptime & 98+ PageSpeed score'
  },
  {
    id: 'ui-ux',
    number: '02',
    title: 'UI / UX DESIGN',
    subtitle: 'Human-Centered Digital Craftsmanship',
    description: 'We construct immersive digital interfaces that merge emotional aesthetics with mathematical precision. Every interaction, transition, and micro-gesture is deliberately calculated.',
    iconName: 'Layout',
    deliverables: ['Interactive Prototyping', 'Design Systems & Component Libraries', 'User Journey Mapping', 'Motion & Micro-Interaction Design'],
    technologies: ['Figma', 'Design Tokens', 'Motion', 'Spatial UI', 'Accessibility Standards'],
    gradient: 'from-[#C5A059]/20 via-[#7E6530]/10 to-transparent',
    featuredStat: '3.4x Higher User Engagement'
  },
  {
    id: 'ecommerce',
    number: '03',
    title: 'E-COMMERCE',
    subtitle: 'High-Converting Digital Flagships',
    description: 'Engineered storefronts with sub-second page loads, custom checkout flows, and predictive merchandising designed for luxury and high-volume retail brands.',
    iconName: 'ShoppingBag',
    deliverables: ['Headless Shopify & Custom Stores', 'Custom Checkout Optimization', 'ERP & Inventory Synchronization', 'Omnichannel Payment Infrastructure'],
    technologies: ['Shopify Plus', 'Stripe', 'Hydrogen', 'Algolia', 'Tailwind'],
    gradient: 'from-[#E5C378]/20 via-[#997A15]/10 to-transparent',
    featuredStat: '+42% Average Order Value uplift'
  },
  {
    id: 'branding',
    number: '04',
    title: 'BRANDING',
    subtitle: 'Identities That Define Categories',
    description: 'Strategic visual identities built for the digital-first era. We formulate distinct typography, color palettes, sound signatures, and narrative guidelines that command respect.',
    iconName: 'Sparkles',
    deliverables: ['Brand Strategy & Positioning', 'Logomark & Typographic Systems', 'Brand Guidelines & Digital Assets', '3D Brand Collateral & Motion Toolkits'],
    technologies: ['Identity Systems', '3D Direction', 'Typography', 'Creative Guidelines'],
    gradient: 'from-[#D4AF37]/20 via-[#5A4512]/10 to-transparent',
    featuredStat: 'Global brand recognition benchmarks'
  },
  {
    id: 'digital-marketing',
    number: '05',
    title: 'DIGITAL MARKETING',
    subtitle: 'Data-Driven Growth & Acquisition',
    description: 'Performance-engineered acquisition campaigns that scale high-intent audiences. We combine creative storytelling with quantitative attribution to maximize ROAS.',
    iconName: 'TrendingUp',
    deliverables: ['Multi-Channel Paid Acquisition', 'Creative Asset Production', 'Funnel Optimization & A/B Testing', 'Attribution Modeling & Real-Time Analytics'],
    technologies: ['Google Ads', 'Meta Ads', 'Omnichannel Retargeting', 'Custom Analytics'],
    gradient: 'from-[#E5C378]/20 via-[#7E6530]/10 to-transparent',
    featuredStat: '4.8x Average Return on Ad Spend'
  },
  {
    id: 'seo',
    number: '06',
    title: 'SEO',
    subtitle: 'Organic Dominance & Semantic Authority',
    description: 'Technical and architectural search engine optimization designed to establish uncontested organic dominance in competitive global markets.',
    iconName: 'Search',
    deliverables: ['Technical Core Web Vitals Audits', 'Semantic Search & Entity Optimization', 'High-Intent Content Strategy', 'International & Local SEO Systems'],
    technologies: ['Structured Data', 'Semantic HTML', 'Schema.org', 'Speed Tuning'],
    gradient: 'from-[#C5A059]/20 via-[#5A4512]/10 to-transparent',
    featuredStat: '+240% Organic Traffic Growth YoY'
  },
  {
    id: 'ai-solutions',
    number: '07',
    title: 'AI SOLUTIONS',
    subtitle: 'Autonomous Intelligence & Custom Models',
    description: 'Custom AI agents, LLM integrations, predictive analytics, and computer vision pipelines that automate core operations and transform user experiences.',
    iconName: 'Cpu',
    deliverables: ['Custom AI Agents & Copilots', 'LLM Fine-Tuning & RAG Pipelines', 'Automated Semantic Processing', 'Predictive Business Intelligence'],
    technologies: ['Gemini API', 'OpenAI', 'LangChain', 'Vector Databases', 'Python', 'FastAPI'],
    gradient: 'from-[#D4AF37]/25 via-[#997A15]/15 to-transparent',
    featuredStat: '85% Reduction in Manual Processing'
  },
  {
    id: 'automation',
    number: '08',
    title: 'AUTOMATION',
    subtitle: 'Frictionless Enterprise Workflows',
    description: 'End-to-end business process orchestration that connects disparate platforms, eliminates manual data entry, and accelerates operational velocity.',
    iconName: 'Zap',
    deliverables: ['Cross-Platform Webhook Pipelines', 'CRM & ERP Synchronization', 'Automated Lead Qualification', 'Event-Driven Cloud Workflows'],
    technologies: ['Make', 'Zapier Enterprise', 'Serverless Lambdas', 'Kafka', 'Custom APIs'],
    gradient: 'from-[#E5C378]/20 via-[#5A4512]/10 to-transparent',
    featuredStat: '12,000+ Hours Saved Annually'
  },
  {
    id: 'software-dev',
    number: '09',
    title: 'SOFTWARE DEVELOPMENT',
    subtitle: 'Scalable Cloud & SaaS Engineering',
    description: 'Robust custom SaaS platforms, enterprise dashboards, and internal tooling engineered with resilient microservices and secure cloud infrastructure.',
    iconName: 'Terminal',
    deliverables: ['Cloud-Native Architecture', 'Multi-Tenant SaaS Engineering', 'Real-Time Telemetry & Dashboards', 'Security & SOC-2 Compliance Ready'],
    technologies: ['PostgreSQL', 'Docker', 'Kubernetes', 'Redis', 'TypeScript', 'Go'],
    gradient: 'from-[#C5A059]/20 via-[#7E6530]/10 to-transparent',
    featuredStat: 'Zero-downtime auto-scaling infrastructure'
  },
  {
    id: 'social-media',
    number: '10',
    title: 'SOCIAL MEDIA',
    subtitle: 'High-Impact Brand Presence & Community',
    description: 'Cohesive visual storytelling and viral creative distribution engineered to cultivate loyal brand advocates and market authority.',
    iconName: 'Share2',
    deliverables: ['Motion Content & 3D Video Production', 'Editorial Grid Curation', 'Influencer & Creator Partnerships', 'Community Engagement Protocols'],
    technologies: ['Motion Graphics', 'Short-Form Cinema', 'Community Ops', 'Social Analytics'],
    gradient: 'from-[#D4AF37]/20 via-[#5A4512]/10 to-transparent',
    featuredStat: '10M+ Global Impressions Generated'
  }
];
