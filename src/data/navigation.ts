export interface DropdownItem {
  id: string;
  title: string;
  desc: string;
  href: string;
  route: string;
  badge?: string;
  iconName?: string;
}

export interface NavCategory {
  id: string;
  label: string;
  href: string;
  route: string;
  badge?: string;
  items?: DropdownItem[];
}

export const navItemsWithDropdowns: NavCategory[] = [
  {
    id: 'services',
    label: 'Services',
    href: '#services',
    route: '/services',
    items: [
      {
        id: 'web-dev',
        title: 'Web Development',
        desc: 'Next-Gen React, Next.js & Full-Stack Architectures',
        href: '#services',
        route: '/services?category=web-dev',
        badge: 'Popular',
        iconName: 'Globe'
      },
      {
        id: 'ui-ux',
        title: 'UI / UX Design',
        desc: 'Spatial & Human-Centered Design Systems',
        href: '#services',
        route: '/services?category=ui-ux',
        iconName: 'Layout'
      },
      {
        id: 'ecommerce',
        title: 'E-Commerce Stores',
        desc: 'Headless Shopify & Luxury Conversion Flagships',
        href: '#services',
        route: '/services?category=ecommerce',
        iconName: 'ShoppingBag'
      },
      {
        id: 'branding',
        title: 'Branding & Identity',
        desc: 'Category-defining typography, 3D & visual identity',
        href: '#services',
        route: '/services?category=branding',
        iconName: 'Sparkles'
      },
      {
        id: 'digital-marketing',
        title: 'Digital Marketing & Growth',
        desc: 'Performance advertising, SEO & ROAS optimization',
        href: '#services',
        route: '/services?category=digital-marketing',
        iconName: 'TrendingUp'
      },
      {
        id: 'ai-solutions',
        title: 'AI Solutions & Agents',
        desc: 'Autonomous LLM workflows, custom AI integrations',
        href: '#services',
        route: '/services?category=ai-solutions',
        badge: 'Enterprise',
        iconName: 'Cpu'
      },
      {
        id: 'mobile-apps',
        title: 'Mobile App Engineering',
        desc: 'Cross-platform iOS & Android flagship applications',
        href: '#services',
        route: '/services?category=mobile-apps',
        iconName: 'Smartphone'
      },
      {
        id: 'cloud-devops',
        title: 'Cloud, API & DevOps',
        desc: 'High-availability serverless & multi-region systems',
        href: '#services',
        route: '/services?category=cloud-devops',
        iconName: 'Cloud'
      }
    ]
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    href: '#work',
    route: '/portfolio',
    items: [
      {
        id: 'nexus-ai',
        title: 'Nexus AI Platform',
        desc: 'Enterprise machine learning orchestration engine',
        href: '#work',
        route: '/portfolio?project=nexus-ai',
        badge: '+340% Ops',
        iconName: 'Cpu'
      },
      {
        id: 'aurum-fintech',
        title: 'Aurum Capital',
        desc: 'High-frequency algorithmic trading workstation',
        href: '#work',
        route: '/portfolio?project=aurum-fintech',
        badge: '$4.2B Traded',
        iconName: 'LineChart'
      },
      {
        id: 'aetheria-3d',
        title: 'Aetheria Spatial 3D',
        desc: 'Interactive WebGL luxury fragrance experience',
        href: '#work',
        route: '/portfolio?project=aetheria-3d',
        badge: 'Awwwards SOTD',
        iconName: 'Box'
      },
      {
        id: 'kinetix-store',
        title: 'Kinetix Athletics',
        desc: 'Sub-second headless e-commerce store with 3D fitting',
        href: '#work',
        route: '/portfolio?project=kinetix-store',
        badge: '+42% AOV',
        iconName: 'ShoppingBag'
      },
      {
        id: 'solis-cloud',
        title: 'Solis Multi-Cloud',
        desc: 'Edge deployment & microservice visualizer',
        href: '#work',
        route: '/portfolio?project=solis-cloud',
        badge: 'Zero Downtime',
        iconName: 'Cloud'
      },
      {
        id: 'velox-mobility',
        title: 'Velox Autonomous EV',
        desc: 'Live telemetry & connected vehicle mobile dashboard',
        href: '#work',
        route: '/portfolio?project=velox-mobility',
        badge: '120k Users',
        iconName: 'Gauge'
      }
    ]
  },
  {
    id: 'free-tools',
    label: 'Free Tools',
    href: '#tools',
    route: '/free-tools',
    badge: '100+',
    items: [
      {
        id: 'password-gen',
        title: 'Entropy Password Generator',
        desc: 'Cryptographic browser credential generator with zero server transmission',
        href: '#tools',
        route: '/free-tools?tool=password-gen',
        badge: 'Instant',
        iconName: 'ShieldCheck'
      },
      {
        id: 'qr-gen',
        title: 'Vector QR Code Generator',
        desc: 'High-res branded QR codes with SVG export & custom colors',
        href: '#tools',
        route: '/free-tools?tool=qr-gen',
        iconName: 'QrCode'
      },
      {
        id: 'color-converter',
        title: 'Harmonic Color Converter',
        desc: 'HEX, RGB, HSL, OKLCH conversion & WCAG AA/AAA contrast check',
        href: '#tools',
        route: '/free-tools?tool=color-converter',
        iconName: 'Palette'
      },
      {
        id: 'json-formatter',
        title: 'JSON Formatter & Validator',
        desc: 'Syntax checker, tree viewer, beautifier & TypeScript types generator',
        href: '#tools',
        route: '/free-tools?tool=json-formatter',
        badge: 'Popular',
        iconName: 'FileJson'
      },
      {
        id: 'meta-generator',
        title: 'Social Meta Tag Generator',
        desc: 'Open Graph & Twitter card preview with copy-ready HTML tags',
        href: '#tools',
        route: '/free-tools?tool=meta-generator',
        iconName: 'Code'
      },
      {
        id: 'word-counter',
        title: 'Pro Word & Reading Metrics',
        desc: 'Character counter, reading time estimator, and keyword density tester',
        href: '#tools',
        route: '/free-tools?tool=word-counter',
        iconName: 'FileText'
      }
    ]
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    href: '#ai-tools',
    route: '/ai-tools',
    badge: '27+',
    items: [
      {
        id: 'ai-copy-architect',
        title: 'Neural Copywriter',
        desc: 'Calibrated brand-voice marketing copy & landing page prose',
        href: '#ai-tools',
        route: '/ai-tools?tool=ai-copy-architect',
        badge: 'Pro',
        iconName: 'PenTool'
      },
      {
        id: 'ai-visual-synthesizer',
        title: 'Spatial Texture & Asset Gen',
        desc: 'Prompt-guided 3D textures, PBR maps & metallic backdrops',
        href: '#ai-tools',
        route: '/ai-tools?tool=ai-visual-synthesizer',
        iconName: 'Sparkles'
      },
      {
        id: 'ai-workflow-orchestrator',
        title: 'Autonomous Task Mesh',
        desc: 'Self-healing workflow pipelines connecting Slack, Jira & GitHub',
        href: '#ai-tools',
        route: '/ai-tools?tool=ai-workflow-orchestrator',
        iconName: 'Workflow'
      },
      {
        id: 'ai-growth-intelligence',
        title: 'Predictive Audience Engine',
        desc: 'Forecasts CAC, creative decay & LTV before ad spend',
        href: '#ai-tools',
        route: '/ai-tools?tool=ai-growth-intelligence',
        iconName: 'LineChart'
      },
      {
        id: 'ai-code-auditor',
        title: 'Syntactic Security & AST Sentinel',
        desc: 'Memory leak detection, vulnerability audit & AST optimization',
        href: '#ai-tools',
        route: '/ai-tools?tool=ai-code-auditor',
        iconName: 'Code2'
      }
    ]
  },
  {
    id: 'about',
    label: 'About',
    href: '#about',
    route: '/about',
    items: [
      {
        id: 'about-story',
        title: 'The Branify Manifesto',
        desc: 'Our design philosophy, heritage, and technological standards',
        href: '#about',
        route: '/about#manifesto',
        iconName: 'Compass'
      },
      {
        id: 'about-process',
        title: '5-Phase Process',
        desc: 'Discovery, architecture, engineering, audit & launch',
        href: '#process',
        route: '/about#process',
        iconName: 'Layers'
      },
      {
        id: 'about-why',
        title: 'Why Choose Branify',
        desc: 'Speed, security, luxury craft, and verified client outcomes',
        href: '#why-branify',
        route: '/about#why',
        iconName: 'ShieldCheck'
      },
      {
        id: 'about-stats',
        title: 'Verified Track Record',
        desc: '50+ deployments, 99.8% precision, and $40M+ client revenue',
        href: '#stats',
        route: '/about#stats',
        iconName: 'TrendingUp'
      },
      {
        id: 'about-faq',
        title: 'Frequently Asked Questions',
        desc: 'Project pricing, timelines, tech stack, and onboarding process',
        href: '#faq',
        route: '/about#faq',
        iconName: 'HelpCircle'
      }
    ]
  },
  {
    id: 'contact',
    label: 'Contact',
    href: '#contact',
    route: '/contact'
  }
];

export const footerColumns = {
  services: [
    { label: 'Web Development', href: '#services', route: '/services?category=web-dev' },
    { label: 'UI/UX Design', href: '#services', route: '/services?category=ui-ux' },
    { label: 'E-Commerce Flagships', href: '#services', route: '/services?category=ecommerce' },
    { label: 'Branding & Identity', href: '#services', route: '/services?category=branding' },
    { label: 'Digital Marketing', href: '#services', route: '/services?category=digital-marketing' },
    { label: 'AI Solutions & Agents', href: '#services', route: '/services?category=ai-solutions' },
    { label: 'Mobile Apps', href: '#services', route: '/services?category=mobile-apps' },
    { label: 'Cloud & DevOps', href: '#services', route: '/services?category=cloud-devops' }
  ],
  company: [
    { label: 'About Branify', href: '#about', route: '/about' },
    { label: 'Selected Work', href: '#work', route: '/portfolio' },
    { label: '5-Phase Process', href: '#process', route: '/about#process' },
    { label: 'Why Branify', href: '#why-branify', route: '/about#why' },
    { label: 'Contact & Inquiries', href: '#contact', route: '/contact' },
    { label: 'Client Reviews', href: '#testimonials', route: '/about#testimonials' }
  ],
  resources: [
    { label: 'Free Developer Tools', href: '#tools', route: '/free-tools' },
    { label: 'AI Tools Studio', href: '#ai-tools', route: '/ai-tools' },
    { label: 'Password Generator', href: '#tools', route: '/free-tools?tool=password-gen' },
    { label: 'Vector QR Maker', href: '#tools', route: '/free-tools?tool=qr-gen' },
    { label: 'Color Converter', href: '#tools', route: '/free-tools?tool=color-converter' },
    { label: 'Frequently Asked Questions', href: '#faq', route: '/about#faq' }
  ],
  legal: [
    { label: 'Privacy Policy', href: '#legal', route: '/privacy' },
    { label: 'Terms of Service', href: '#legal', route: '/terms' },
    { label: 'Refund Policy', href: '#legal', route: '/refund' },
    { label: 'Cookie Policy', href: '#legal', route: '/cookies' },
    { label: 'Disclaimer & IP', href: '#legal', route: '/disclaimer' }
  ]
};

export const heroCapabilities = [
  { name: 'WEB', label: 'Web Systems', desc: 'Next-Gen Fullstack' },
  { name: 'AI', label: 'AI Solutions', desc: 'Autonomous Intelligence' },
  { name: 'BRANDING', label: 'Branding', desc: 'Category-Defining' },
  { name: 'E-COMMERCE', label: 'E-Commerce', desc: 'High-Converting Flagships' },
  { name: 'MARKETING', label: 'Marketing', desc: 'Data-Driven Scale' },
  { name: 'AUTOMATION', label: 'Automation', desc: 'Frictionless Workflows' },
  { name: 'DIGITAL PRODUCTS', label: 'Digital Products', desc: 'SaaS & Enterprise Tools' }
];
