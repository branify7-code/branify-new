import { StatItem } from '../types';

// All figures below are verifiable on branify.store itself:
// 118 template-library entries, 136 free-tool registry entries,
// 26 AI tool guides, 11 agency services with 4 package tiers each.
export const statsData: StatItem[] = [
  {
    value: 118,
    suffix: '+',
    label: 'WEBSITE TEMPLATES',
    description: 'Professionally designed, responsive templates across 15 industries — restaurants, real estate, healthcare, tech, fashion and more.',
    sublabel: 'New designs added monthly'
  },
  {
    value: 136,
    suffix: '',
    label: 'FREE ONLINE TOOLS',
    description: 'Privacy-first browser utilities — PDF tools, image converter, text utilities, developer, SEO, business and finance tools. No signup.',
    sublabel: '100% free, running directly in your browser'
  },
  {
    value: 26,
    suffix: '',
    label: 'AI TOOL GUIDES',
    description: 'Step-by-step beginner guides for the best AI tools — with copy-ready prompts, FAQs, comparisons and practical tips.',
    sublabel: 'Updated with hands-on prompts & examples'
  },
  {
    value: 11,
    suffix: '',
    label: 'SPECIALIZED SERVICES',
    description: 'Web development, branding, SEO, AI solutions and more — each with 4 transparent package tiers from Basic to On-Demand.',
    sublabel: 'One studio for build, brand & growth'
  }
];
