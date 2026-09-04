/* =========================================================
   BRANIFY SERVICES REGISTRY — full copy of branify.store
   11 services x 4 packages, benefits, process steps,
   FAQs, deliverables and tech stacks (1:1 live data).
   Generated from the live site's data registry.
========================================================= */

export interface ServicePackage {
  id: string;
  name: string;
  tier: 'basic' | 'professional' | 'premium' | 'on_demand';
  priceUSD: number;
  deliveryTime: string;
  revisions: string;
  description: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ServiceProcessStep {
  step: string;
  title: string;
  desc: string;
}

export interface ServiceFAQ {
  question: string;
  answer: string;
}

export type ServiceCategory = 'web' | 'design' | 'branding' | 'marketing' | 'ai' | 'consulting';

export interface AgencyService {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: ServiceCategory;
  startingPriceUSD: number;
  deliveryTimeline: string;
  iconName: string;
  shortDescription: string;
  fullDescription: string;
  packages: ServicePackage[];
  features: string[];
  benefits: string[];
  processSteps: ServiceProcessStep[];
  faqs: ServiceFAQ[];
  deliverables: string[];
  techStack: string[];
}

export const servicesRegistry: AgencyService[] = [
  {
    "id": "website-development",
    "slug": "website-development",
    "name": "Website Development",
    "tagline": "High-performance React, Next.js & modern full-stack web applications.",
    "category": "web",
    "startingPriceUSD": 0,
    "deliveryTimeline": "5–14 Days",
    "iconName": "Globe",
    "shortDescription": "Custom, blazing-fast, responsive web applications engineered for conversions, SEO, and international scalability.",
    "fullDescription": "We craft high-converting, modern web applications built on cutting-edge technologies like React, TypeScript, Next.js, Node.js, and Express. Whether you need an elite corporate web platform, a modern SaaS product, or a custom full-stack web portal, BRANIFY delivers pixel-perfect, secure, and lightning-fast solutions.",
    "packages": [
      {
        "id": "website-dev-basic",
        "name": "Basic",
        "tier": "basic",
        "priceUSD": 0,
        "deliveryTime": "5–7 Days",
        "revisions": "2 Revisions",
        "description": "Essential modern responsive website designed for clean branding and reliable online presence.",
        "features": [
          "Professional responsive website",
          "Modern homepage",
          "Up to 3 pages",
          "Mobile responsive design",
          "Desktop / tablet / mobile optimization",
          "Basic contact form",
          "Basic animations",
          "Basic SEO setup",
          "Social media links",
          "Google Maps integration if required",
          "Basic performance optimization",
          "Basic security configuration",
          "Website deployment",
          "Domain / hosting connection assistance",
          "Basic post-launch support"
        ],
        "isActive": true,
        "sortOrder": 1
      },
      {
        "id": "website-dev-professional",
        "name": "Professional",
        "tier": "professional",
        "priceUSD": 0,
        "deliveryTime": "10–14 Days",
        "revisions": "5 Revisions",
        "highlight": true,
        "badge": "Most Popular",
        "description": "Full-stack dynamic web solution with backend integrations, database, and conversion-optimized UX.",
        "features": [
          "Full-stack website",
          "Up to 7–10 pages",
          "Custom UI design",
          "Frontend development",
          "Backend development",
          "Database integration",
          "Authentication / login system if required",
          "Contact / lead management",
          "API integrations",
          "Admin functionality where required",
          "Advanced animations / interactions",
          "Advanced SEO setup",
          "Performance optimization",
          "Image optimization",
          "Security best practices",
          "Analytics integration",
          "Deployment & production setup",
          "Post-launch support"
        ],
        "isActive": true,
        "sortOrder": 2
      },
      {
        "id": "website-dev-premium",
        "name": "Premium",
        "tier": "premium",
        "priceUSD": 0,
        "deliveryTime": "3–4 Weeks",
        "revisions": "Unlimited Revisions",
        "badge": "Enterprise Ready",
        "description": "Complete enterprise custom web application architecture with role-based access and automated workflows.",
        "features": [
          "Complete custom full-stack web application",
          "Unlimited / large-scale page structure based on project scope",
          "Advanced custom UI/UX",
          "Frontend + backend architecture",
          "Database architecture",
          "User authentication",
          "User dashboards",
          "Admin dashboard",
          "Payment gateway integration where required",
          "Third-party API integrations",
          "Advanced automation",
          "Advanced forms / workflows",
          "Advanced search / filtering",
          "Role-based access where required",
          "Advanced SEO",
          "High-performance optimization",
          "Security hardening",
          "Scalable architecture",
          "Production deployment & monitoring setup",
          "Comprehensive testing",
          "Priority post-launch technical support"
        ],
        "isActive": true,
        "sortOrder": 3
      },
      {
        "id": "website-dev-on-demand",
        "name": "Client On-Demand",
        "tier": "on_demand",
        "priceUSD": 0,
        "deliveryTime": "Custom Scope",
        "revisions": "Custom Scope",
        "badge": "Tailored Architecture",
        "description": "Have a unique website requirement? Tell us exactly what you need and we will build a custom package around your project.",
        "features": [
          "Custom functionality & business logic",
          "Custom number of pages",
          "SaaS applications & web apps",
          "Interactive portals & dashboards",
          "Custom e-commerce systems",
          "Membership & booking platforms",
          "Custom API development & integration",
          "Advanced workflows & automation",
          "AI model & agent integrations",
          "Custom database architecture",
          "Custom authentication & SSO",
          "Enterprise security & SLA support"
        ],
        "isActive": true,
        "sortOrder": 4
      }
    ],
    "features": [
      "Custom React/Next.js frontend engineering",
      "Full API & backend database integrations",
      "Ultra-responsive desktop, tablet & mobile experience",
      "Core Web Vitals & speed optimization (Score 95+)",
      "Custom CMS & headless options",
      "International multi-language & multi-currency readiness",
      "Bank-grade security protocols & SSL readiness"
    ],
    "benefits": [
      "Boost visitor conversion rates by up to 40%",
      "Lightning-fast page loads under 1.5 seconds",
      "Scale seamlessly to millions of monthly visitors",
      "100% full intellectual property & source code ownership"
    ],
    "processSteps": [
      {
        "step": "01",
        "title": "Discovery & Architecture",
        "desc": "Analyzing requirements, user flows, database models, and technology stack."
      },
      {
        "step": "02",
        "title": "UI/UX & Prototyping",
        "desc": "Crafting responsive visual layouts focused on branding, ergonomics, and conversion."
      },
      {
        "step": "03",
        "title": "Clean Code Engineering",
        "desc": "Developing clean, type-safe TypeScript code with modular architecture."
      },
      {
        "step": "04",
        "title": "Testing & Core Web Vitals",
        "desc": "Cross-browser testing, accessibility audits, security checks, and speed tuning."
      },
      {
        "step": "05",
        "title": "Production Launch & Handover",
        "desc": "Deployment to high-availability servers, SSL mapping, DNS, and staff training."
      }
    ],
    "faqs": [
      {
        "question": "What tech stack do you use for custom web development?",
        "answer": "We specialize in React, TypeScript, Next.js, Node.js/Express, Tailwind CSS, PostgreSQL, Supabase, and cloud container deployments."
      },
      {
        "question": "Will my website be mobile friendly?",
        "answer": "Yes, 100%. Every website we build follows rigorous mobile-first responsive design standards and is tested across iOS, Android, tablets, and desktop displays."
      },
      {
        "question": "Do you provide complete source code ownership?",
        "answer": "Yes. Full source code, deployment scripts, and all intellectual property rights belong entirely to you upon project sign-off."
      },
      {
        "question": "Can I request additional custom features not in the standard packages?",
        "answer": "Absolutely! Our Client On-Demand tier is tailored specifically to unique requirements, custom APIs, third-party integrations, and enterprise architectures."
      }
    ],
    "deliverables": [
      "Production Web Application Build",
      "Full Source Code Repository",
      "Admin Setup & Config",
      "SEO Configuration",
      "User Guide & Documentation Video"
    ],
    "techStack": [
      "React",
      "TypeScript",
      "Next.js",
      "Tailwind CSS",
      "Node.js",
      "Vite",
      "PostgreSQL"
    ]
  },
  {
    "id": "wordpress-development",
    "slug": "wordpress-development",
    "name": "WordPress Development",
    "tagline": "Custom Elementor, WooCommerce & headless WordPress solutions.",
    "category": "web",
    "startingPriceUSD": 0,
    "deliveryTimeline": "4–14 Days",
    "iconName": "LayoutGrid",
    "shortDescription": "Scalable, secure, and user-friendly WordPress websites with custom themes, Elementor Pro, WooCommerce, and speed optimization.",
    "fullDescription": "Power your business with the world’s most versatile CMS. We build ultra-fast, tailored WordPress & WooCommerce stores that are easy for your team to manage, fully secured against vulnerabilities, and optimized for search engine rankings.",
    "packages": [
      {
        "id": "wp-dev-basic",
        "name": "Basic",
        "tier": "basic",
        "priceUSD": 0,
        "deliveryTime": "4–6 Days",
        "revisions": "2 Revisions",
        "description": "Professional WordPress setup with clean responsive theme, essential plugins, and core security.",
        "features": [
          "WordPress core installation",
          "Professional theme setup",
          "Up to 5 pages",
          "Responsive mobile design",
          "Elementor / Gutenberg builder setup",
          "Contact form integration",
          "Basic essential plugins",
          "Basic SEO configuration",
          "Basic security & spam protection",
          "Speed optimization",
          "Production deployment",
          "Post-launch support"
        ],
        "isActive": true,
        "sortOrder": 1
      },
      {
        "id": "wp-dev-professional",
        "name": "Professional",
        "tier": "professional",
        "priceUSD": 0,
        "deliveryTime": "7–10 Days",
        "revisions": "4 Revisions",
        "highlight": true,
        "badge": "Most Popular",
        "description": "Custom-built WordPress website with tailored layout, WooCommerce readiness, and high-speed optimization.",
        "features": [
          "Custom WordPress website build",
          "Up to 10 pages",
          "Custom Elementor / Gutenberg visual design",
          "WooCommerce store setup if required",
          "Custom forms & lead capture",
          "Advanced plugin configuration",
          "Payment gateway integration",
          "On-page SEO setup",
          "Advanced speed optimization (Caching / WebP)",
          "Security hardening & firewall",
          "Google Analytics & Search Console",
          "Custom sections & animations",
          "Live deployment & domain connection",
          "30-day post-launch support"
        ],
        "isActive": true,
        "sortOrder": 2
      },
      {
        "id": "wp-dev-premium",
        "name": "Premium",
        "tier": "premium",
        "priceUSD": 0,
        "deliveryTime": "2–3 Weeks",
        "revisions": "Unlimited Revisions",
        "badge": "High Performance",
        "description": "Advanced enterprise WordPress & WooCommerce ecosystem with custom plugins, member systems, and API sync.",
        "features": [
          "Advanced custom WordPress architecture",
          "Tailored design system & component library",
          "Full WooCommerce development & product workflows",
          "Advanced payment gateways (Stripe, PayPal, Local)",
          "Membership / LMS / Booking functionality",
          "Custom WordPress PHP functionality",
          "Custom plugin integrations & webhooks",
          "Advanced multi-step forms & calculators",
          "Third-party API integrations",
          "Advanced technical & schema SEO",
          "Extreme performance & server-level caching",
          "Enterprise security hardening",
          "Automated cloud backup configuration",
          "Advanced analytics & conversion tracking",
          "Full staging & production deployment",
          "Priority technical maintenance"
        ],
        "isActive": true,
        "sortOrder": 3
      },
      {
        "id": "wp-dev-on-demand",
        "name": "Client On-Demand",
        "tier": "on_demand",
        "priceUSD": 0,
        "deliveryTime": "Custom Scope",
        "revisions": "Custom Scope",
        "badge": "Custom Solutions",
        "description": "Have a unique WordPress requirement? We engineer custom themes, plugins, high-scale stores, and complex workflows.",
        "features": [
          "Custom WordPress plugin development",
          "High-volume WooCommerce customization",
          "Large-scale multi-vendor stores",
          "Custom membership & community platforms",
          "Custom Learning Management Systems (LMS)",
          "Advanced booking & appointment portals",
          "Headless WordPress with React / Next.js",
          "Custom REST API / GraphQL integration",
          "Advanced CRM & marketing automation",
          "Custom database optimization & migration"
        ],
        "isActive": true,
        "sortOrder": 4
      }
    ],
    "features": [
      "Custom Elementor Pro & Gutenberg block engineering",
      "WooCommerce store setup & multi-currency payment gateways",
      "Custom theme styling & zero-bloat plugin configuration",
      "Advanced speed optimization (Rocket, NitroPack, Redis caching)",
      "Enterprise WordPress security hardening & firewall",
      "Seamless database migration & automated cloud backups",
      "Ongoing maintenance & care plan options"
    ],
    "benefits": [
      "Manage content easily without any coding knowledge",
      "Accept credit cards, PayPal, Stripe, and local gateways",
      "Optimized database for sub-second page response times",
      "Search engine friendly structure out of the box"
    ],
    "processSteps": [
      {
        "step": "01",
        "title": "Strategy & Wireframing",
        "desc": "Determining site architecture, required plugins, and WooCommerce flows."
      },
      {
        "step": "02",
        "title": "Theme & Page Construction",
        "desc": "Building responsive visual layouts using Elementor or modern block editor."
      },
      {
        "step": "03",
        "title": "E-commerce & Gateway Wiring",
        "desc": "Configuring payment gateways, shipping rules, tax settings, and automated emails."
      },
      {
        "step": "04",
        "title": "Security & Speed Hardening",
        "desc": "Applying caching, image WebP compression, and security firewalls."
      },
      {
        "step": "05",
        "title": "Handoff & Admin Training",
        "desc": "Client admin walkthrough session and full administrator credential transfer."
      }
    ],
    "faqs": [
      {
        "question": "Can I edit products, images, and text myself later?",
        "answer": "Yes! We provide complete administrative access and a recorded video training session so you and your team can update content anytime."
      },
      {
        "question": "How do you ensure the WordPress site is fast?",
        "answer": "We avoid bloated themes, use clean lightweight builders, optimize all media to WebP, minimize database overhead, and configure server-level caching."
      }
    ],
    "deliverables": [
      "Custom WordPress Build",
      "WooCommerce Setup",
      "Licensed Plugin Setup",
      "Speed Optimization Audit Report",
      "Admin Training Video"
    ],
    "techStack": [
      "WordPress",
      "PHP",
      "WooCommerce",
      "Elementor Pro",
      "MySQL",
      "Redis"
    ]
  },
  {
    "id": "landing-pages",
    "slug": "landing-pages",
    "name": "Landing Pages",
    "tagline": "High-converting lead generation & product launch pages.",
    "category": "web",
    "startingPriceUSD": 0,
    "deliveryTimeline": "3–7 Days",
    "iconName": "MousePointerClick",
    "shortDescription": "Psychology-driven, fast-loading landing pages designed to turn ad traffic into paying customers and qualified leads.",
    "fullDescription": "Stop wasting ad spend on low-converting pages. BRANIFY crafts hyper-focused landing pages engineered around direct-response design principles, clear calls-to-action, mobile ergonomics, and instant loading speeds.",
    "packages": [
      {
        "id": "landing-basic",
        "name": "Basic",
        "tier": "basic",
        "priceUSD": 0,
        "deliveryTime": "3–4 Days",
        "revisions": "2 Revisions",
        "description": "Clean, conversion-focused single landing page designed to capture leads and drive action.",
        "features": [
          "1 conversion-focused landing page",
          "Mobile-first responsive design",
          "High-impact hero section",
          "Strategic CTA placement",
          "Contact / lead capture form",
          "Basic smooth animations",
          "Basic meta SEO setup",
          "Fast CDN deployment"
        ],
        "isActive": true,
        "sortOrder": 1
      },
      {
        "id": "landing-professional",
        "name": "Professional",
        "tier": "professional",
        "priceUSD": 0,
        "deliveryTime": "5–7 Days",
        "revisions": "4 Revisions",
        "highlight": true,
        "badge": "Most Popular",
        "description": "High-converting custom landing page with psychology-driven copy structure, animations, and CRM sync.",
        "features": [
          "High-converting custom landing page",
          "Custom tailored UI/UX design",
          "Multiple structured content sections",
          "Advanced lead capture system",
          "Persuasive CTA strategy & sticky headers",
          "Direct form integration (Mailchimp, HubSpot, Webhooks)",
          "Conversion & pixel tracking analytics",
          "Advanced micro-interactions & animations",
          "Speed & Core Web Vitals optimization",
          "A/B testing-ready architecture"
        ],
        "isActive": true,
        "sortOrder": 2
      },
      {
        "id": "landing-premium",
        "name": "Premium",
        "tier": "premium",
        "priceUSD": 0,
        "deliveryTime": "10–14 Days",
        "revisions": "Unlimited Revisions",
        "badge": "Max Conversions",
        "description": "Comprehensive conversion funnel and multi-variant landing page ecosystem with automated nurturing.",
        "features": [
          "Complete conversion funnel architecture",
          "Multiple landing page variants & split test views",
          "Advanced direct-response UI/UX layout",
          "Lead generation & segmentation strategy",
          "Full CRM & email automation sync",
          "Meta, Google & TikTok conversion tracking",
          "Advanced A/B testing setup",
          "Premium 3D & interactive animations",
          "Technical SEO & schema markup",
          "Sub-second page load performance",
          "Dedicated conversion rate optimization (CRO)"
        ],
        "isActive": true,
        "sortOrder": 3
      },
      {
        "id": "landing-on-demand",
        "name": "Client On-Demand",
        "tier": "on_demand",
        "priceUSD": 0,
        "deliveryTime": "Custom Scope",
        "revisions": "Custom Scope",
        "badge": "Custom Campaigns",
        "description": "Need a multi-product launch funnel, webinar engine, or bespoke interactive campaign? We engineer it.",
        "features": [
          "Multi-step quiz & interactive calculators",
          "High-ticket sales funnel ecosystems",
          "Product launch & crowdfunding pages",
          "Event & webinar registration funnels",
          "Custom webhook & backend lead processing",
          "Dynamic localization & multi-currency offers",
          "Custom checkout & one-click upsells",
          "Enterprise ad campaign integration"
        ],
        "isActive": true,
        "sortOrder": 4
      }
    ],
    "features": [
      "Direct-response copywriting & persuasive headline structuring",
      "Mobile-first ergonomic conversion layouts",
      "A/B split-testing ready infrastructure",
      "Form & webhook integration (HubSpot, Mailchimp, Zapier, Google Sheets)",
      "Sub-second loading speeds on global CDN",
      "Interactive social proof popups & counter badges"
    ],
    "benefits": [
      "Increase paid ad campaign ROAS by 2x to 4x",
      "Eliminate friction points in your customer journey",
      "Automate instant lead routing directly to your CRM or WhatsApp"
    ],
    "processSteps": [
      {
        "step": "01",
        "title": "Audience & Offer Research",
        "desc": "Analyzing customer pain points, competitors, and unique value proposition."
      },
      {
        "step": "02",
        "title": "Copywriting & Wireframe",
        "desc": "Crafting persuasive headlines, benefit bullets, and call-to-action flow."
      },
      {
        "step": "03",
        "title": "High-Impact Design & Code",
        "desc": "Building responsive high-end visuals with smooth micro-interactions."
      },
      {
        "step": "04",
        "title": "Analytics & Webhooks",
        "desc": "Connecting pixel tags, CRM webhooks, and conversion tracking."
      }
    ],
    "faqs": [
      {
        "question": "Can you integrate my CRM or email marketing tool?",
        "answer": "Yes, we integrate with Mailchimp, HubSpot, Klaviyo, ActiveCampaign, Zapier, Webhooks, and Google Sheets."
      }
    ],
    "deliverables": [
      "High-Converting Landing Page Build",
      "Persuasive Copywriting Outline",
      "CRM & Webhook Integration",
      "Pixel & Analytics Setup"
    ],
    "techStack": [
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Figma",
      "Webhooks"
    ]
  },
  {
    "id": "ui-ux-design",
    "slug": "ui-ux-design",
    "name": "UI/UX Design",
    "tagline": "User-centric research, wireframes & high-fidelity Figma design systems.",
    "category": "design",
    "startingPriceUSD": 0,
    "deliveryTimeline": "4–14 Days",
    "iconName": "Figma",
    "shortDescription": "Elevate your web or mobile product with intuitive user experience mapping, sleek visual design systems, and Figma prototypes.",
    "fullDescription": "Great software starts with exceptional user experience. We combine user research, wireframing, interactive prototyping, and reusable Figma design systems to turn complex workflows into delightful, effortless digital products.",
    "packages": [
      {
        "id": "uiux-basic",
        "name": "Basic",
        "tier": "basic",
        "priceUSD": 0,
        "deliveryTime": "4–6 Days",
        "revisions": "2 Revisions",
        "description": "Essential UI/UX mapping for small websites or key application views.",
        "features": [
          "Basic user research",
          "User flow diagrams",
          "Low-fidelity wireframes",
          "Basic UI design (up to 3 screens)",
          "Responsive layouts (Desktop & Mobile)",
          "Figma source files"
        ],
        "isActive": true,
        "sortOrder": 1
      },
      {
        "id": "uiux-professional",
        "name": "Professional",
        "tier": "professional",
        "priceUSD": 0,
        "deliveryTime": "8–12 Days",
        "revisions": "4 Revisions",
        "highlight": true,
        "badge": "Most Popular",
        "description": "Complete UI/UX design suite with research, interactive prototype, and component tokens.",
        "features": [
          "Complete UI/UX design",
          "User research & persona mapping",
          "User journeys & information architecture",
          "Wireframes & structural wireflows",
          "High-fidelity UI (up to 8 screens)",
          "Responsive designs (Desktop & Mobile)",
          "Interactive clickable prototype",
          "Design system & component library",
          "Organized Figma source files"
        ],
        "isActive": true,
        "sortOrder": 2
      },
      {
        "id": "uiux-premium",
        "name": "Premium",
        "tier": "premium",
        "priceUSD": 0,
        "deliveryTime": "2–3 Weeks",
        "revisions": "Unlimited Revisions",
        "badge": "Design System",
        "description": "Comprehensive product UX strategy, advanced design system, tokens, and developer specs.",
        "features": [
          "Complete UX product strategy",
          "Advanced user research & competitor analysis",
          "Information architecture & edge case mapping",
          "Complete user flows",
          "High-fidelity UI (unlimited core views)",
          "Advanced interactive prototype",
          "Design system with tokens & variants",
          "Comprehensive component library",
          "Developer handoff documentation",
          "UX documentation & asset exports"
        ],
        "isActive": true,
        "sortOrder": 3
      },
      {
        "id": "uiux-on-demand",
        "name": "Client On-Demand",
        "tier": "on_demand",
        "priceUSD": 0,
        "deliveryTime": "Custom Scope",
        "revisions": "Custom Scope",
        "badge": "Bespoke UI/UX",
        "description": "Custom UI/UX project based on client specifications, enterprise software, or multi-platform apps.",
        "features": [
          "Custom SaaS platform UI/UX",
          "Mobile iOS & Android application design",
          "Enterprise admin dashboards & portals",
          "Complete product redesigns & usability audits",
          "Multi-tenant web applications",
          "Custom interactive design systems",
          "Developer handoff & design QA support"
        ],
        "isActive": true,
        "sortOrder": 4
      }
    ],
    "features": [
      "User journey mapping & flow diagrams",
      "Low-fidelity wireframes to high-fidelity UI",
      "Comprehensive Figma Design Systems (Tokens, Components, Auto-Layout)",
      "Interactive clickable prototypes",
      "Mobile & desktop responsive layouts",
      "Developer handoff documentation ready for engineering"
    ],
    "benefits": [
      "Reduce developer rewrite time by up to 50%",
      "Create an unforgettable, modern brand aesthetic",
      "Validate ideas with stakeholders before writing a single line of code"
    ],
    "processSteps": [
      {
        "step": "01",
        "title": "User Research",
        "desc": "Defining personas, feature requirements, and competitive benchmarking."
      },
      {
        "step": "02",
        "title": "Wireframing",
        "desc": "Mapping user journeys and low-fidelity structural layouts."
      },
      {
        "step": "03",
        "title": "High-Fidelity UI",
        "desc": "Applying brand colors, typography, spacing, and micro-interactions."
      },
      {
        "step": "04",
        "title": "Design System & Export",
        "desc": "Structuring component libraries and developer handoff assets."
      }
    ],
    "faqs": [
      {
        "question": "What software do you deliver designs in?",
        "answer": "All design source files are delivered in clean, structured Figma files with Auto-Layout, Components, and Design Tokens enabled."
      }
    ],
    "deliverables": [
      "Figma Source File",
      "Interactive Prototype Link",
      "Design System Library",
      "Asset Exports (SVG/PNG)"
    ],
    "techStack": [
      "Figma",
      "FigJam",
      "Design Tokens",
      "Auto-Layout"
    ]
  },
  {
    "id": "logo-design",
    "slug": "logo-design",
    "name": "Logo Design",
    "tagline": "Memorable, modern, and vector-perfect brand logos.",
    "category": "branding",
    "startingPriceUSD": 0,
    "deliveryTimeline": "2–5 Days",
    "iconName": "Palette",
    "shortDescription": "Distill your business essence into an iconic, timeless, and versatile vector logo that stands out across print and digital media.",
    "fullDescription": "Your logo is the visual cornerstone of your brand. Our designers craft unique, conceptual logo marks that communicate authority, trust, and distinction across digital screens, business cards, merchandise, and billboards.",
    "packages": [
      {
        "id": "logo-basic",
        "name": "Basic",
        "tier": "basic",
        "priceUSD": 0,
        "deliveryTime": "2–3 Days",
        "revisions": "2 Revisions",
        "description": "Clean vector logo concept for startups and new ventures.",
        "features": [
          "Logo concept",
          "Professional logo design",
          "Basic revisions",
          "PNG & JPG formats",
          "Transparent background version"
        ],
        "isActive": true,
        "sortOrder": 1
      },
      {
        "id": "logo-professional",
        "name": "Professional",
        "tier": "professional",
        "priceUSD": 0,
        "deliveryTime": "4–5 Days",
        "revisions": "4 Revisions",
        "highlight": true,
        "badge": "Most Popular",
        "description": "Multiple conceptual avenues with complete vector master file kit and color variants.",
        "features": [
          "Multiple logo concepts (3–4)",
          "Professional logo design",
          "Multiple revisions",
          "Primary logo",
          "Secondary logo / Sub-mark",
          "Icon / brand mark",
          "Light and dark mode versions",
          "PNG, JPG, SVG, and PDF master vector files"
        ],
        "isActive": true,
        "sortOrder": 2
      },
      {
        "id": "logo-premium",
        "name": "Premium",
        "tier": "premium",
        "priceUSD": 0,
        "deliveryTime": "7–10 Days",
        "revisions": "Unlimited Revisions",
        "badge": "Complete Suite",
        "description": "Full iconic logo suite with typography pairing, color palette, and usage guidelines.",
        "features": [
          "Complete logo identity suite",
          "Multiple premium concepts (5+)",
          "Primary logo",
          "Secondary logo",
          "Brand mark & monogram",
          "Typography selection & font pairings",
          "Brand color palette (HEX, RGB, CMYK, Pantone)",
          "Usage guidelines & clear space rules",
          "Multiple vector file formats (AI, EPS, SVG, PDF)",
          "Brand presentation & 3D realistic mockups"
        ],
        "isActive": true,
        "sortOrder": 3
      },
      {
        "id": "logo-on-demand",
        "name": "Client On-Demand",
        "tier": "on_demand",
        "priceUSD": 0,
        "deliveryTime": "Custom Scope",
        "revisions": "Custom Scope",
        "badge": "Custom Identity",
        "description": "Custom logo and identity requirements, corporate rebrands, or multi-brand architecture.",
        "features": [
          "Corporate rebrand & logo evolution",
          "3D animated logo motion graphics",
          "Custom hand-crafted typography & letterforms",
          "Mascot & emblem illustrations",
          "Multi-subbrand hierarchy systems",
          "Trademark & legal copyright clearance support"
        ],
        "isActive": true,
        "sortOrder": 4
      }
    ],
    "features": [
      "Unique conceptual logo marks crafted from scratch (Zero stock icons)",
      "Unlimited revisions on selected creative direction",
      "100% scalable vector artwork",
      "Full brand colors & black/white monochrome variants",
      "Favicon & app icon adaptations",
      "Vector master files (AI, EPS, SVG, PDF, High-Res PNG)"
    ],
    "benefits": [
      "Instant brand recognition, credibility, and authority",
      "Scalable vector formats for any size from 16px favicons to billboard prints",
      "100% full legal commercial copyright ownership transfer"
    ],
    "processSteps": [
      {
        "step": "01",
        "title": "Brief & Moodboard",
        "desc": "Understanding your business values, industry, and aesthetic preferences."
      },
      {
        "step": "02",
        "title": "Conceptual Sketching",
        "desc": "Drafting vector concepts with geometric precision."
      },
      {
        "step": "03",
        "title": "Refinement & Typography",
        "desc": "Pairing typography, weights, and color palettes."
      },
      {
        "step": "04",
        "title": "Final Asset Export",
        "desc": "Exporting vector master files, transparent PNGs, and usage guidelines."
      }
    ],
    "faqs": [
      {
        "question": "Do I get full commercial copyright ownership?",
        "answer": "Yes! Full intellectual property, commercial usage rights, and vector master source files are transferred to you upon final delivery."
      }
    ],
    "deliverables": [
      "Vector Master Files (AI, EPS, SVG, PDF)",
      "High-Res PNG & JPG Packs",
      "Favicon & App Icon Formats",
      "Commercial Copyright Transfer"
    ],
    "techStack": [
      "Adobe Illustrator",
      "Figma",
      "Vector Engine"
    ]
  },
  {
    "id": "brand-identity",
    "slug": "brand-identity",
    "name": "Brand Identity",
    "tagline": "Complete visual branding: guidelines, typography & social kits.",
    "category": "branding",
    "startingPriceUSD": 0,
    "deliveryTimeline": "4–14 Days",
    "iconName": "Sparkles",
    "shortDescription": "Transform your business into a cohesive, premium international brand with full style guidelines, stationery, and social kits.",
    "fullDescription": "In today’s crowded marketplace, visual consistency builds trust. BRANIFY constructs holistic brand identity systems including logo usage rules, color swatches, font pairings, business stationery, social media templates, and comprehensive brand books.",
    "packages": [
      {
        "id": "brand-basic",
        "name": "Basic",
        "tier": "basic",
        "priceUSD": 0,
        "deliveryTime": "4–6 Days",
        "revisions": "2 Revisions",
        "description": "Core brand assets for emerging startups and new business launches.",
        "features": [
          "Logo design",
          "Brand color palette",
          "Typography selection",
          "Basic brand direction sheet (PDF)"
        ],
        "isActive": true,
        "sortOrder": 1
      },
      {
        "id": "brand-professional",
        "name": "Professional",
        "tier": "professional",
        "priceUSD": 0,
        "deliveryTime": "8–12 Days",
        "revisions": "4 Revisions",
        "highlight": true,
        "badge": "Most Popular",
        "description": "Holistic brand system with guidelines manual, stationery, and social direction.",
        "features": [
          "Logo system (Primary, Secondary, Sub-mark)",
          "Comprehensive color system & hierarchy rules",
          "Typography system with licensed font pairings",
          "Brand guidelines manual (15+ pages PDF)",
          "Social media profile & banner direction",
          "Business card design",
          "Basic corporate stationery templates"
        ],
        "isActive": true,
        "sortOrder": 2
      },
      {
        "id": "brand-premium",
        "name": "Premium",
        "tier": "premium",
        "priceUSD": 0,
        "deliveryTime": "2–3 Weeks",
        "revisions": "Unlimited Revisions",
        "badge": "Enterprise Brand Book",
        "description": "Complete enterprise brand manual, corporate stationery suite, and marketing kits.",
        "features": [
          "Complete brand identity system",
          "Full logo suite with clear space & violation rules",
          "Color system with digital & print specifications",
          "Typography hierarchy & font pairings",
          "Comprehensive Brand Guidelines Book (30+ pages)",
          "Full stationery suite (Cards, Letterhead, Envelopes, Folders)",
          "Social media post & story template kit",
          "Marketing collateral templates",
          "Brand assets & vector source archive",
          "3D realistic brand & merchandise mockups"
        ],
        "isActive": true,
        "sortOrder": 3
      },
      {
        "id": "brand-on-demand",
        "name": "Client On-Demand",
        "tier": "on_demand",
        "priceUSD": 0,
        "deliveryTime": "Custom Scope",
        "revisions": "Custom Scope",
        "badge": "Global Rebranding",
        "description": "Custom branding and comprehensive rebranding projects for established companies.",
        "features": [
          "Global corporate rebranding programs",
          "Multi-brand architecture & sub-brand systems",
          "Retail packaging & product merchandise systems",
          "Signage & environmental branding",
          "Custom brand illustration libraries",
          "Brand voice & editorial guidelines manual"
        ],
        "isActive": true,
        "sortOrder": 4
      }
    ],
    "features": [
      "Primary & secondary logo variations with clear space rules",
      "Color palette hierarchy (HEX, RGB, CMYK, Pantone codes)",
      "Typography pairing rules & licensed web font links",
      "Comprehensive Brand Guidelines PDF (20–30+ pages)",
      "Business card, letterhead & email signature designs",
      "Social media avatar & banner kit",
      "3D realistic brand mockups"
    ],
    "benefits": [
      "Look like an established, international enterprise",
      "Maintain 100% visual consistency across all team members and media",
      "Attract premium high-ticket clients who value elevated aesthetics"
    ],
    "processSteps": [
      {
        "step": "01",
        "title": "Brand Strategy",
        "desc": "Defining brand tone of voice, values, target audience, and positioning."
      },
      {
        "step": "02",
        "title": "Visual Explorations",
        "desc": "Creating moodboards, logo suite, and color concepts."
      },
      {
        "step": "03",
        "title": "Stationery & Collateral",
        "desc": "Designing business cards, letterheads, and social media kits."
      },
      {
        "step": "04",
        "title": "Brand Guidelines Manual",
        "desc": "Compiling a comprehensive brand book for future internal and external use."
      }
    ],
    "faqs": [
      {
        "question": "What is included in the Brand Guidelines PDF?",
        "answer": "Logo clear space, color codes (HEX/RGB/CMYK), font hierarchy, imagery tone, incorrect usage rules, and print specifications."
      }
    ],
    "deliverables": [
      "Brand Guidelines PDF",
      "Logo Master Suite",
      "Color & Typography Kit",
      "Stationery Designs",
      "Social Media Templates"
    ],
    "techStack": [
      "Adobe Illustrator",
      "InDesign",
      "Figma"
    ]
  },
  {
    "id": "social-media-design",
    "slug": "social-media-design",
    "name": "Social Media Design",
    "tagline": "Engaging Instagram, LinkedIn, Facebook & YouTube ad creatives.",
    "category": "marketing",
    "startingPriceUSD": 0,
    "deliveryTimeline": "3–7 Days",
    "iconName": "Share2",
    "shortDescription": "Eye-catching social media posts, story templates, carousel graphics, reel covers, and ad creatives that stop the scroll.",
    "fullDescription": "Stand out on feed algorithms with high-impact, custom social media designs tailored for Instagram, Facebook, LinkedIn, Twitter/X, and YouTube. We combine bold typography, custom graphics, and brand consistency to boost your engagement.",
    "packages": [
      {
        "id": "social-basic",
        "name": "Basic",
        "tier": "basic",
        "priceUSD": 0,
        "deliveryTime": "3–4 Days",
        "revisions": "2 Revisions",
        "description": "Starter set of branded posts and profile graphics for daily consistency.",
        "features": [
          "Social media post designs (6 custom posts)",
          "Basic branded templates",
          "Profile avatar & banner design",
          "High-resolution PNG / JPG exports"
        ],
        "isActive": true,
        "sortOrder": 1
      },
      {
        "id": "social-professional",
        "name": "Professional",
        "tier": "professional",
        "priceUSD": 0,
        "deliveryTime": "5–7 Days",
        "revisions": "4 Revisions",
        "highlight": true,
        "badge": "Most Popular",
        "description": "Comprehensive feed and story visual system for rapid community growth.",
        "features": [
          "Social media visual system",
          "Multiple post designs (15 custom posts)",
          "Story designs & Reel cover graphics",
          "Carousel designs (3 multi-slide decks)",
          "Branded editable templates (Canva or Figma)",
          "Platform-specific layouts (Instagram, LinkedIn, X)"
        ],
        "isActive": true,
        "sortOrder": 2
      },
      {
        "id": "social-premium",
        "name": "Premium",
        "tier": "premium",
        "priceUSD": 0,
        "deliveryTime": "10–14 Days",
        "revisions": "Unlimited Revisions",
        "badge": "Full Growth Kit",
        "description": "30-day complete social media creative system with ad creatives and templates.",
        "features": [
          "Complete social media design system",
          "Advanced content templates (25+ posts)",
          "Story templates & animated Reel covers",
          "Carousels (5 multi-slide decks)",
          "Campaign creatives & paid ad sets",
          "High-converting ad creatives (FB, IG, LinkedIn)",
          "YouTube banner & custom video thumbnails",
          "Brand consistency guidelines & template suite"
        ],
        "isActive": true,
        "sortOrder": 3
      },
      {
        "id": "social-on-demand",
        "name": "Client On-Demand",
        "tier": "on_demand",
        "priceUSD": 0,
        "deliveryTime": "Custom Scope",
        "revisions": "Custom Scope",
        "badge": "Custom Creatives",
        "description": "Custom social media campaigns, high-scale ad suites, and monthly creative retainers.",
        "features": [
          "Monthly ongoing creative retainer",
          "Large-scale paid ad creative suites",
          "Custom 3D & motion social graphics",
          "Event & influencer launch kits",
          "Multi-language social media asset scaling"
        ],
        "isActive": true,
        "sortOrder": 4
      }
    ],
    "features": [
      "Custom Instagram grid posts & educational carousel slides",
      "Story & Reel cover graphics",
      "LinkedIn infographic sliders & executive banner graphics",
      "High-converting Facebook & Instagram ad creatives",
      "YouTube channel art & custom thumbnails",
      "Editable Canva or Figma templates for easy re-use"
    ],
    "benefits": [
      "Dramatically increase follower engagement, saves, and clicks",
      "Maintain a polished, unified brand feed that builds authority",
      "Save hours of design time with ready-to-publish Canva/Figma templates"
    ],
    "processSteps": [
      {
        "step": "01",
        "title": "Content Planning",
        "desc": "Reviewing post topics, ad goals, and brand theme."
      },
      {
        "step": "02",
        "title": "Creative Design",
        "desc": "Designing high-contrast graphics and carousel slides."
      },
      {
        "step": "03",
        "title": "Review & Polish",
        "desc": "Fine-tuning text overlays, hierarchy, and imagery."
      },
      {
        "step": "04",
        "title": "Export & Handoff",
        "desc": "Delivering PNG files and editable Canva / Figma template links."
      }
    ],
    "faqs": [
      {
        "question": "Can I edit the text and images myself later?",
        "answer": "Yes! We deliver editable Canva or Figma templates so you can quickly customize text and images for your daily posts."
      }
    ],
    "deliverables": [
      "Post Graphics Pack",
      "Carousel Slides",
      "Ad Creatives",
      "Editable Canva & Figma Templates"
    ],
    "techStack": [
      "Canva",
      "Photoshop",
      "Figma",
      "Illustrator"
    ]
  },
  {
    "id": "business-presentation",
    "slug": "business-presentation",
    "name": "Business Presentation",
    "tagline": "Investor pitch decks, sales presentations & company profiles.",
    "category": "branding",
    "startingPriceUSD": 0,
    "deliveryTimeline": "3–7 Days",
    "iconName": "Presentation",
    "shortDescription": "Captivate investors, board members, and clients with custom pitch decks, sales decks, and polished company profiles.",
    "fullDescription": "Secure funding and close high-value deals with custom-designed presentations. We turn complex data, market statistics, and business strategy into visually compelling, easy-to-digest pitch decks in PowerPoint, Google Slides, or PDF.",
    "packages": [
      {
        "id": "presentation-basic",
        "name": "Basic",
        "tier": "basic",
        "priceUSD": 0,
        "deliveryTime": "3–4 Days",
        "revisions": "2 Revisions",
        "description": "Professional presentation redesign for up to 10 slides.",
        "features": [
          "Professional presentation design",
          "Up to 10 slides redesign",
          "Basic layouts & slide grid",
          "Typography & brand colors alignment",
          "PDF & editable PPT delivery"
        ],
        "isActive": true,
        "sortOrder": 1
      },
      {
        "id": "presentation-professional",
        "name": "Professional",
        "tier": "professional",
        "priceUSD": 0,
        "deliveryTime": "5–7 Days",
        "revisions": "4 Revisions",
        "highlight": true,
        "badge": "Most Popular",
        "description": "Custom-crafted presentation deck with data charts, infographics, and slide master.",
        "features": [
          "Custom presentation design",
          "Up to 20 branded slides",
          "Data visualization & custom charts",
          "Custom icons & infographic diagrams",
          "Professional master slide layout",
          "Editable source files (PowerPoint & Google Slides)",
          "High-resolution PDF export"
        ],
        "isActive": true,
        "sortOrder": 2
      },
      {
        "id": "presentation-premium",
        "name": "Premium",
        "tier": "premium",
        "priceUSD": 0,
        "deliveryTime": "10–14 Days",
        "revisions": "Unlimited Revisions",
        "badge": "Investor Pitch Ready",
        "description": "Complete investor pitch deck with storytelling structure, financial models, and animations.",
        "features": [
          "Investor-ready presentation & pitch deck",
          "Up to 35 custom designed slides",
          "Advanced data visualization & financial modeling charts",
          "Custom vector infographics",
          "Storytelling narrative structure",
          "Professional slide animations & transitions",
          "Master slide template for future revisions",
          "Editable PowerPoint (.pptx) & Google Slides",
          "Print-ready & email-optimized PDF versions",
          "One-pager executive summary sheet"
        ],
        "isActive": true,
        "sortOrder": 3
      },
      {
        "id": "presentation-on-demand",
        "name": "Client On-Demand",
        "tier": "on_demand",
        "priceUSD": 0,
        "deliveryTime": "Custom Scope",
        "revisions": "Custom Scope",
        "badge": "Executive Custom",
        "description": "Custom presentations, investor roadshows, annual reports, and corporate keynote decks.",
        "features": [
          "Multi-deck corporate roadshow suites",
          "Annual reports & ESG investor presentations",
          "Keynote & conference speaker presentations",
          "Interactive clickable slide decks",
          "Confidential M&A and funding pitch decks"
        ],
        "isActive": true,
        "sortOrder": 4
      }
    ],
    "features": [
      "Custom slide layouts matching brand guidelines",
      "Data visualization, financial graphs, and custom diagrams",
      "Infographics & visual timeline slides",
      "Editable PowerPoint (.pptx) & Google Slides formats",
      "High-resolution PDF export for emailing and printing",
      "Stock photos & vector iconography included"
    ],
    "benefits": [
      "Impress venture capitalists and angel investors",
      "Communicate value propositions quickly and clearly",
      "Reusable master slide templates for future pitch updates"
    ],
    "processSteps": [
      {
        "step": "01",
        "title": "Deck Structure",
        "desc": "Reviewing outline, market data, financial models, and core messaging."
      },
      {
        "step": "02",
        "title": "Slide Master Design",
        "desc": "Establishing grid layout, typography, and color schemes."
      },
      {
        "step": "03",
        "title": "Data & Visual Crafting",
        "desc": "Creating custom charts, graphics, and icon metrics."
      },
      {
        "step": "04",
        "title": "Final Formatting",
        "desc": "Exporting editable PPTX, Google Slides, and PDF versions."
      }
    ],
    "faqs": [
      {
        "question": "In what file formats do you deliver the presentation?",
        "answer": "PowerPoint (.pptx), Google Slides link, and high-quality PDF format."
      }
    ],
    "deliverables": [
      "Editable PowerPoint (.pptx) File",
      "Google Slides Link",
      "Print-Ready PDF Deck",
      "Custom Graphic Assets"
    ],
    "techStack": [
      "PowerPoint",
      "Google Slides",
      "Figma",
      "Illustrator"
    ]
  },
  {
    "id": "seo",
    "slug": "seo",
    "name": "SEO (Search Engine Optimization)",
    "tagline": "Technical, on-page, local SEO & keyword ranking strategies.",
    "category": "marketing",
    "startingPriceUSD": 0,
    "deliveryTimeline": "5–14 Days",
    "iconName": "Search",
    "shortDescription": "Dominate Google search results with comprehensive technical audits, keyword strategy, schema markup, and speed optimization.",
    "fullDescription": "Drive sustainable, organic traffic to your website without relying solely on paid ads. Our SEO services cover deep technical fixes, keyword mapping, content structuring, schema markup, local SEO, and Google Search Console performance optimization.",
    "packages": [
      {
        "id": "seo-basic",
        "name": "Basic",
        "tier": "basic",
        "priceUSD": 0,
        "deliveryTime": "5–7 Days",
        "revisions": "1 Review",
        "description": "Essential technical and on-page SEO setup for up to 5 core website pages.",
        "features": [
          "Technical SEO basics audit",
          "Meta titles & meta descriptions (Up to 5 pages)",
          "Basic keyword setup & mapping",
          "XML Sitemap configuration",
          "Robots.txt optimization",
          "Google Search Console setup & verification"
        ],
        "isActive": true,
        "sortOrder": 1
      },
      {
        "id": "seo-professional",
        "name": "Professional",
        "tier": "professional",
        "priceUSD": 0,
        "deliveryTime": "10–14 Days",
        "revisions": "3 Reviews",
        "highlight": true,
        "badge": "Most Popular",
        "description": "Comprehensive on-page and technical SEO with competitor analysis and keyword strategy.",
        "features": [
          "Technical SEO audit & error fixes",
          "In-depth keyword research (Up to 25 keywords)",
          "On-page SEO optimization for 10 key pages",
          "Content structure & H1-H6 heading hierarchy",
          "Internal linking architecture",
          "Search Console & GA4 performance setup",
          "Performance & Core Web Vitals optimization",
          "Basic competitor gap analysis"
        ],
        "isActive": true,
        "sortOrder": 2
      },
      {
        "id": "seo-premium",
        "name": "Premium",
        "tier": "premium",
        "priceUSD": 0,
        "deliveryTime": "Monthly Retainer / Ongoing",
        "revisions": "Continuous",
        "badge": "Dominate Search",
        "description": "Complete full-scale SEO growth strategy with schema markup, content blueprints, and reporting.",
        "features": [
          "Complete SEO growth strategy",
          "Advanced keyword research & content clusters",
          "Comprehensive technical SEO resolution",
          "On-page SEO optimization across all pages",
          "Content strategy & article outlines",
          "Competitor analysis & backlink profile review",
          "Internal linking optimization",
          "Schema markup (JSON-LD structured data)",
          "Performance & speed optimization",
          "Google Search Console & GA4 tracking",
          "Monthly detailed SEO ranking & growth report"
        ],
        "isActive": true,
        "sortOrder": 3
      },
      {
        "id": "seo-on-demand",
        "name": "Client On-Demand",
        "tier": "on_demand",
        "priceUSD": 0,
        "deliveryTime": "Custom Scope",
        "revisions": "Custom Scope",
        "badge": "Custom SEO",
        "description": "Custom SEO campaigns, international multi-region SEO, programmatic SEO, and penalty recoveries.",
        "features": [
          "International multi-lingual & multi-region hreflang SEO",
          "E-commerce SEO for 1,000+ SKU stores",
          "Programmatic SEO architecture",
          "Google penalty recovery & domain migration SEO",
          "Enterprise SaaS product search optimization"
        ],
        "isActive": true,
        "sortOrder": 4
      }
    ],
    "features": [
      "Comprehensive Technical SEO audit & site health fixes",
      "In-depth keyword research & competitor mapping",
      "On-page title, meta, H1-H6, and content optimization",
      "Schema markup (JSON-LD) implementation",
      "XML Sitemap & Robots.txt setup",
      "Google Search Console & GA4 configuration",
      "Local SEO & Google Business Profile optimization"
    ],
    "benefits": [
      "Achieve top rankings for high-intent buyer keywords",
      "Attract steady, free organic leads 24/7",
      "Fix indexation errors and broken backlink structures"
    ],
    "processSteps": [
      {
        "step": "01",
        "title": "SEO Audit",
        "desc": "Analyzing crawlability, page speed, meta tags, and indexing issues."
      },
      {
        "step": "02",
        "title": "Keyword Strategy",
        "desc": "Finding high-traffic, low-competition search terms in your niche."
      },
      {
        "step": "03",
        "title": "On-Page Optimization",
        "desc": "Updating title tags, meta descriptions, alt text, and schema."
      },
      {
        "step": "04",
        "title": "Technical Hardening & Analytics",
        "desc": "Optimizing site architecture and configuring Google Search Console."
      }
    ],
    "faqs": [
      {
        "question": "How long does it take to see SEO results?",
        "answer": "Organic SEO typically shows measurable ranking improvements within 3 to 6 months depending on keyword competition and domain authority."
      }
    ],
    "deliverables": [
      "Technical Audit Report",
      "Keyword Mapping Document",
      "On-Page Meta Optimization",
      "GSC & Analytics Setup"
    ],
    "techStack": [
      "Google Search Console",
      "Ahrefs",
      "SEMrush",
      "Schema.org",
      "GA4"
    ]
  },
  {
    "id": "ai-solutions",
    "slug": "ai-solutions",
    "name": "AI Solutions",
    "tagline": "Custom AI chatbots, workflow automation & LLM integration.",
    "category": "ai",
    "startingPriceUSD": 0,
    "deliveryTimeline": "5–21 Days",
    "iconName": "Bot",
    "shortDescription": "Empower your business with custom AI chatbots, automated customer support, Gemini API workflows, and smart task automation.",
    "fullDescription": "Leverage state-of-the-art AI technology to automate customer support, generate smart business insights, and streamline daily operations. We build custom AI applications, Gemini/OpenAI API integrations, RAG knowledge bots, and automated workflows.",
    "packages": [
      {
        "id": "ai-basic",
        "name": "Basic",
        "tier": "basic",
        "priceUSD": 0,
        "deliveryTime": "5–7 Days",
        "revisions": "2 Revisions",
        "description": "Starter AI integration and chatbot setup for your website or customer channel.",
        "features": [
          "AI consultation & roadmap",
          "AI workflow planning",
          "Basic AI integration (Gemini / OpenAI)",
          "Simple chatbot / customer automation widget",
          "Prompt engineering & setup"
        ],
        "isActive": true,
        "sortOrder": 1
      },
      {
        "id": "ai-professional",
        "name": "Professional",
        "tier": "professional",
        "priceUSD": 0,
        "deliveryTime": "10–14 Days",
        "revisions": "4 Revisions",
        "highlight": true,
        "badge": "Most Popular",
        "description": "Custom AI chatbot trained on your company data with CRM integration and automated workflows.",
        "features": [
          "Custom AI chatbot development",
          "AI workflow automation",
          "API integrations (Gemini, OpenAI, Claude)",
          "Relevant AI model integration",
          "Knowledge base & business FAQ integration",
          "Lead capture & CRM automation",
          "Custom AI workflows & webhook triggers",
          "Branded chat interface"
        ],
        "isActive": true,
        "sortOrder": 2
      },
      {
        "id": "ai-premium",
        "name": "Premium",
        "tier": "premium",
        "priceUSD": 0,
        "deliveryTime": "3–4 Weeks",
        "revisions": "Unlimited Revisions",
        "badge": "Autonomous AI",
        "description": "Advanced autonomous AI system with agents, vector database, custom dashboard, and analytics.",
        "features": [
          "Advanced AI solution architecture",
          "Custom AI agents & autonomous tools",
          "Full-featured AI chatbot",
          "Advanced multi-step automation",
          "API integrations & secure server proxy",
          "Database integration (PostgreSQL / Vector DB)",
          "AI knowledge base & RAG architecture",
          "Custom internal admin dashboards",
          "Multi-step business workflows",
          "Advanced business automation",
          "Monitoring, safety rails & optimization"
        ],
        "isActive": true,
        "sortOrder": 3
      },
      {
        "id": "ai-on-demand",
        "name": "Client On-Demand",
        "tier": "on_demand",
        "priceUSD": 0,
        "deliveryTime": "Custom Scope",
        "revisions": "Custom Scope",
        "badge": "Enterprise AI",
        "description": "Custom AI products, specialized agent networks, enterprise automation, and fine-tuned models.",
        "features": [
          "Fine-tuned domain-specific AI models",
          "Enterprise AI SaaS product engineering",
          "Voice & real-time conversational agents",
          "High-volume automated data extraction pipelines",
          "Proprietary internal AI tools & custom APIs"
        ],
        "isActive": true,
        "sortOrder": 4
      }
    ],
    "features": [
      "Custom Gemini & OpenAI API integration with secure backend proxies",
      "Smart customer support chatbots grounded in your business documents",
      "Automated email & content generation workflows",
      "AI document analysis & automated data extraction",
      "Voice & multimodal AI assistant integrations",
      "Custom internal AI dashboards for staff productivity"
    ],
    "benefits": [
      "Reduce customer support response times to under 3 seconds",
      "Automate repetitive manual data tasks and save dozens of hours weekly",
      "Operate 24/7 with intelligent, human-like AI responses"
    ],
    "processSteps": [
      {
        "step": "01",
        "title": "Use Case Analysis",
        "desc": "Identifying business tasks that can be automated with LLMs & APIs."
      },
      {
        "step": "02",
        "title": "Knowledge Grounding",
        "desc": "Structuring your business documents & FAQs for AI retrieval."
      },
      {
        "step": "03",
        "title": "API & Widget Development",
        "desc": "Building responsive AI chat widgets & secure server backend."
      },
      {
        "step": "04",
        "title": "Testing & Safety Rails",
        "desc": "Implementing prompt safety checks, rate limiting, and context limits."
      }
    ],
    "faqs": [
      {
        "question": "Which AI models do you support?",
        "answer": "We specialize in Gemini 2.5/1.5, OpenAI GPT-4o, Claude 3.5 Sonnet, and open-source models."
      }
    ],
    "deliverables": [
      "Custom AI Widget / App",
      "Server Proxy & API Integration",
      "Prompt Engineering Architecture",
      "Admin Control Panel"
    ],
    "techStack": [
      "Gemini API",
      "TypeScript",
      "Node.js",
      "Vector DB",
      "Express"
    ]
  },
  {
    "id": "business-consultation",
    "slug": "business-consultation",
    "name": "Business Consultation",
    "tagline": "Strategic roadmap for digital transformation, branding & growth.",
    "category": "consulting",
    "startingPriceUSD": 0,
    "deliveryTimeline": "1-on-1 Session",
    "iconName": "TrendingUp",
    "shortDescription": "Get expert 1-on-1 strategic guidance on web technology, brand positioning, online scaling, and AI adoption for your business.",
    "fullDescription": "Unsure which technology stack to choose, how to rebrand, or how to implement AI in your operations? Sit down with BRANIFY strategy leads for an actionable consultation session that provides clear roadmaps, vendor audits, and growth blueprints.",
    "packages": [
      {
        "id": "consult-basic",
        "name": "Basic",
        "tier": "basic",
        "priceUSD": 0,
        "deliveryTime": "60-Min Session",
        "revisions": "Q&A Included",
        "description": "Actionable 1-on-1 strategy call reviewing your digital assets and opportunities.",
        "features": [
          "Business consultation (60 minutes)",
          "Basic website & business review",
          "Identification of growth bottlenecks",
          "Basic actionable recommendations",
          "Action plan summary checklist"
        ],
        "isActive": true,
        "sortOrder": 1
      },
      {
        "id": "consult-professional",
        "name": "Professional",
        "tier": "professional",
        "priceUSD": 0,
        "deliveryTime": "90-Min Call + Blueprint",
        "revisions": "7-Day Follow-Up",
        "highlight": true,
        "badge": "Most Popular",
        "description": "Deep-dive business, web, and brand audit with strategic growth blueprint.",
        "features": [
          "Detailed business audit session (90 minutes)",
          "Website & conversion audit",
          "Brand positioning audit",
          "Competitor review & positioning analysis",
          "Growth recommendations & tech stack advice",
          "Custom Strategic Roadmap document (PDF)"
        ],
        "isActive": true,
        "sortOrder": 2
      },
      {
        "id": "consult-premium",
        "name": "Premium",
        "tier": "premium",
        "priceUSD": 0,
        "deliveryTime": "Full Roadmap + 30 Days",
        "revisions": "30-Day Advisory",
        "badge": "Strategic Advisory",
        "description": "Comprehensive business strategy, tech recommendations, AI roadmap, and 30-day advisory access.",
        "features": [
          "Complete business digital strategy",
          "Brand strategy & positioning plan",
          "Website & conversion architecture strategy",
          "Digital growth strategy & channels",
          "In-depth competitor analysis",
          "Marketing direction & ad channel review",
          "Technology stack recommendations",
          "Automation & AI opportunities blueprint",
          "Detailed 90-day growth roadmap document",
          "30 days direct advisory access (Email/WhatsApp)"
        ],
        "isActive": true,
        "sortOrder": 3
      },
      {
        "id": "consult-on-demand",
        "name": "Client On-Demand",
        "tier": "on_demand",
        "priceUSD": 0,
        "deliveryTime": "Custom Scope",
        "revisions": "Custom Scope",
        "badge": "Custom Advisory",
        "description": "Custom consulting requirements, fractional CTO/CGO advisory, and enterprise transformations.",
        "features": [
          "Fractional CTO / CGO advisory support",
          "M&A technology and brand due diligence",
          "Corporate digital transformation programs",
          "Agency vendor evaluation & hiring strategy"
        ],
        "isActive": true,
        "sortOrder": 4
      }
    ],
    "features": [
      "1-on-1 strategy video consultation (60 to 90 minutes)",
      "Digital presence & website performance audit",
      "Brand positioning & messaging analysis",
      "Technology stack & SaaS tool recommendations",
      "Custom Actionable Growth Blueprint document",
      "Follow-up email Q&A support for 14 days"
    ],
    "benefits": [
      "Avoid costly mistakes on wrong technology choices",
      "Get a clear step-by-step roadmap tailored to your budget",
      "Direct feedback from experienced international digital strategists"
    ],
    "processSteps": [
      {
        "step": "01",
        "title": "Pre-Session Audit",
        "desc": "We analyze your website, competitors, and goals beforehand."
      },
      {
        "step": "02",
        "title": "1-on-1 Live Strategy Call",
        "desc": "In-depth discussion on challenges, tech options, and action items."
      },
      {
        "step": "03",
        "title": "Growth Blueprint Delivery",
        "desc": "Receiving a structured PDF report outlining steps & tools."
      },
      {
        "step": "04",
        "title": "14-Day Q&A Window",
        "desc": "Email support for any follow-up questions."
      }
    ],
    "faqs": [
      {
        "question": "How is the session conducted?",
        "answer": "Sessions are conducted live via Google Meet or Zoom, with a complete video recording provided afterward."
      }
    ],
    "deliverables": [
      "1-on-1 Live Strategy Session",
      "Custom Growth Blueprint PDF",
      "Recorded Call Session",
      "14-Day Email Q&A Access"
    ],
    "techStack": [
      "Google Meet",
      "Strategy Blueprint",
      "Audit System"
    ]
  }
];

export default servicesRegistry;
