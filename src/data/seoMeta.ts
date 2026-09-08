/* =========================================================
   seoMeta — single source of truth for the SEO titles and
   meta descriptions of the fixed duplicate-metadata pages.
   Consumed by BOTH the public views (runtime <Seo/>) and the
   admin audit inventory (seoShared.ts buildPageInventory) so
   the audit always mirrors what the site actually renders.
   Every string is grounded in the real page content:
   - /pricing renders ServicesView (11 services × 4 package
     tiers, live USD rates, currency switcher)
   - free-template categories mirror freeTemplatesRegistry
   ========================================================= */

export interface PageSeo {
  title: string;
  description: string;
}

/* ------------------------------------------------ */
/* Static pages                                      */
/* ------------------------------------------------ */

export const STATIC_PAGE_SEO: Record<
  'about' | 'contact' | 'pricing' | 'tools' | 'portfolio',
  PageSeo
> = {
  about: {
    title: 'About BRANIFY | International Digital Agency & Studio',
    description:
      'BRANIFY is an international digital agency pairing deep-stack engineering with premium design — websites, brand identity, AI products and growth systems.',
  },
  contact: {
    title: 'Contact BRANIFY | Consultation & Project Inquiry',
    description:
      'Tell BRANIFY about your website, branding or AI project. Senior leadership personally responds within 24 business hours — book a free consultation.',
  },
  pricing: {
    title: 'Digital Agency Pricing & Service Packages | BRANIFY',
    description:
      'Compare BRANIFY pricing across 11 digital services — web development, branding, SEO and AI. Four transparent package tiers per service with live USD rates.',
  },
  tools: {
    title: '100+ Free Online Tools | Browser Utilities | BRANIFY',
    description:
      '136 fast, privacy-first online tools that run in your browser — PDF, image, text, developer and SEO utilities plus business calculators. No sign-up needed.',
  },
  portfolio: {
    title: 'Portfolio & Case Studies | Web, E-Commerce & AI | BRANIFY',
    description:
      'Explore BRANIFY case studies — e-commerce storefronts, digital marketplaces, AI trading platforms and learn-to-earn education platforms for clients worldwide.',
  },
};

/* ------------------------------------------------ */
/* Free templates: hub + category pages              */
/* ------------------------------------------------ */

export const FREE_TEMPLATES_HUB_SEO: PageSeo = {
  title: 'Free Templates for Business & Creators | BRANIFY',
  description:
    'Browse the free BRANIFY template library — website, Canva, social media, business, resume, presentation, Notion and spreadsheet templates, free to download.',
};

/** Keyed by templateCategories slug (freeTemplatesRegistry). */
export const FREE_TEMPLATE_CATEGORY_SEO: Record<string, PageSeo> = {
  website: {
    title: 'Free Website Templates: SaaS & Portfolio Starters | BRANIFY',
    description:
      'Download free website templates in HTML5 and Tailwind CSS — a conversion-focused SaaS landing page and a clean developer portfolio starter, ready to customize.',
  },
  canva: {
    title: 'Free Canva Templates: Brand Guidelines Deck | BRANIFY',
    description:
      'A free 25-slide brand guidelines presentation kit for Canva — document logos, colors and typography with minimalist, presentation-ready slide layouts.',
  },
  'social-media': {
    title: 'Free Social Media Templates: Content Calendar | BRANIFY',
    description:
      'Plan and schedule posts across LinkedIn, Twitter and Instagram with a free multi-platform social media content calendar template — CSV, free to download.',
  },
  business: {
    title: 'Free Business Templates: Contracts & Client Briefs | BRANIFY',
    description:
      'Free business templates for agencies and freelancers — a master services agreement with SOW plus a 20-question client discovery and project brief template.',
  },
  resume: {
    title: 'Free Resume & CV Templates: ATS-Optimized Tech | BRANIFY',
    description:
      'Download a free ATS-optimized resume template for software engineers, designers and tech professionals — a single-column layout built to pass ATS checks.',
  },
  presentation: {
    title: 'Free Presentation Templates: Startup Pitch Deck | BRANIFY',
    description:
      'Structure a fundraise-ready story with a free 15-slide seed startup pitch deck template — a slide-by-slide blueprint for pre-seed and seed capital.',
  },
  notion: {
    title: 'Free Notion Templates: Client Portal & Project Hub | BRANIFY',
    description:
      'Run client work from one place with a free Notion client portal template — project tracking, feedback and delivery dashboards for freelancers and studios.',
  },
  spreadsheet: {
    title: 'Free Spreadsheet Templates: Runway & Burn Model | BRANIFY',
    description:
      'Model startup burn rate, cash flow and runway with a free 12-month financial model spreadsheet — CSV and Excel formats, free to download from BRANIFY.',
  },
};
