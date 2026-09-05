/* =========================================================
   BRANIFY — TEMPLATE LIBRARY data layer (public source of truth)
   • templatesRegistry (generated from the supplied Flow AI mockups)
   • 16 canonical categories with SEO/category-page copy
   • Query helpers used by the library, category pages, detail pages,
     homepage showcase, sitemap, related templates and admin.
   Admin edits arrive via contentOverrides (published rows merge over
   this registry) — this file stays the compile-time source of truth.
========================================================= */

import { templatesRegistry, type TemplateRecord } from './templates';

export interface TemplateCategory {
  slug: string;
  name: string;
  /** Short blurb shown on category cards + library category navigation. */
  tagline: string;
  /** Longer hero paragraph for the category page (category-specific). */
  heroDescription: string;
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    slug: 'restaurant-food', name: 'Restaurant & Food',
    tagline: 'Fine dining, bistros and street food brands.',
    heroDescription: 'Explore responsive restaurant website templates designed for modern dining businesses, cafés, food brands and hospitality companies — with menu presentation, reservations and gallery sections built in.',
  },
  {
    slug: 'cafe-coffee', name: 'Café & Coffee',
    tagline: 'Warm café and specialty coffee experiences.',
    heroDescription: 'Explore café and coffee shop website templates crafted for specialty roasters, espresso bars and neighborhood cafés — with menu boards, store info and warm, inviting layouts.',
  },
  {
    slug: 'real-estate', name: 'Real Estate',
    tagline: 'Property listings and luxury real estate.',
    heroDescription: 'Explore real estate website templates designed for agencies, brokerages and luxury property brands — with listing showcases, neighborhood highlights and enquiry-first lead capture.',
  },
  {
    slug: 'fashion-accessories', name: 'Fashion & Accessories',
    tagline: 'Editorial fashion, e-commerce and jewelry.',
    heroDescription: 'Explore fashion website templates designed for labels, boutiques and accessory brands — with lookbook grids, collection storytelling and conversion-ready product layouts.',
  },
  {
    slug: 'beauty-salon', name: 'Beauty & Salon',
    tagline: 'Salons, spas and beauty studios.',
    heroDescription: 'Explore beauty and salon website templates designed for salons, spas and beauty studios — with service menus, stylist profiles and booking call-to-actions built in.',
  },
  {
    slug: 'healthcare-medical', name: 'Healthcare & Medical',
    tagline: 'Clinics, medical centers and wellness practices.',
    heroDescription: 'Explore healthcare website templates designed for clinics, medical centers and wellness practices — with department pages, doctor directories and appointment funnels.',
  },
  {
    slug: 'interior-design', name: 'Interior Design',
    tagline: 'Studios and architects presenting spaces.',
    heroDescription: 'Explore interior design and architecture website templates designed for studios and practices — with project spotlights, material galleries and consultation enquiries.',
  },
  {
    slug: 'fitness-lifestyle', name: 'Fitness & Lifestyle',
    tagline: 'Gyms, yoga studios and wellness brands.',
    heroDescription: 'Explore fitness and lifestyle website templates designed for gyms, studios, coaches and wellness brands — with class schedules, trainer profiles and membership tiers.',
  },
  {
    slug: 'tech-digital', name: 'Tech & Digital',
    tagline: 'SaaS platforms, apps and digital agencies.',
    heroDescription: 'Explore tech and SaaS website templates designed for software platforms, apps and digital agencies — with feature walkthroughs, integration grids and pricing sections.',
  },
  {
    slug: 'automotive', name: 'Automotive',
    tagline: 'Dealerships, detailing and workshops.',
    heroDescription: 'Explore automotive website templates designed for dealerships, detailing studios and workshops — with inventory showcases, service menus and test-drive funnels.',
  },
  {
    slug: 'home-services', name: 'Home Services',
    tagline: 'Cleaning, trade and relocation services.',
    heroDescription: 'Explore home services website templates designed for cleaning, trade and relocation companies — with quote-first funnels, service checklists and trust signals.',
  },
  {
    slug: 'education', name: 'Education',
    tagline: 'Schools, tutoring and course platforms.',
    heroDescription: 'Explore education website templates designed for schools, tutors and course platforms — with subject grids, program pages and enrollment funnels.',
  },
  {
    slug: 'business-services', name: 'Business & Professional Services',
    tagline: 'Consultancies, law firms and B2B practices.',
    heroDescription: 'Explore professional services website templates designed for consultancies, law firms and B2B practices — with authority-led design, case studies and enquiry flows.',
  },
  {
    slug: 'pet-care', name: 'Pet Care',
    tagline: 'Groomers, spas and veterinary clinics.',
    heroDescription: 'Explore pet care website templates designed for groomers, spas and veterinary clinics — with service menus, team introductions and friendly booking flows.',
  },
  {
    slug: 'events-creative', name: 'Events & Creative',
    tagline: 'Weddings, event production and photography.',
    heroDescription: 'Explore events and creative website templates designed for wedding planners, event producers, photographers and studios — with portfolio galleries and enquiry journeys.',
  },
  {
    slug: 'catering-services', name: 'Catering Services',
    tagline: 'Caterers and private chefs.',
    heroDescription: 'Explore catering website templates designed for caterers and private chefs — with menus, package tiers and enquiry flows that turn visitors into bookings.',
  },
];

// ------------------------------------------------------------------ helpers

/** All published templates in registry order (admin overrides already applied). */
export const allTemplates = (): TemplateRecord[] => templatesRegistry.filter((t) => t.status === 'published');

/** Live template count for badges/UI. */
export const templateCount = (): number => allTemplates().length;

export const getTemplateBySlug = (slug: string): TemplateRecord | undefined =>
  templatesRegistry.find((t) => t.slug === slug && t.status === 'published');

export const getCategoryBySlug = (slug: string): TemplateCategory | undefined =>
  TEMPLATE_CATEGORIES.find((c) => c.slug === slug);

export const getTemplatesByCategory = (categorySlug: string): TemplateRecord[] =>
  allTemplates().filter((t) => t.categorySlug === categorySlug);

/** Live per-category counts (computed, never hardcoded in UI). */
export const categoryCounts = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const c of TEMPLATE_CATEGORIES) counts[c.slug] = 0;
  for (const t of allTemplates()) counts[t.categorySlug] = (counts[t.categorySlug] || 0) + 1;
  return counts;
};

export const featuredTemplates = (limit = 8): TemplateRecord[] =>
  allTemplates().filter((t) => t.featured).slice(0, limit);

/** Canonical URLs — one route scheme for the whole system. */
export const templateHref = (t: TemplateRecord): string => `/templates/${t.categorySlug}/${t.slug}`;
export const templatePreviewHref = (t: TemplateRecord): string => `/templates/${t.categorySlug}/${t.slug}/preview`;
export const categoryHref = (slug: string): string => `/templates/${slug}`;

/**
 * Related templates: same category first (excluding the current template),
 * then same industry/tags overlap, then featured as fallback.
 */
export const relatedTemplates = (current: TemplateRecord, limit = 3): TemplateRecord[] => {
  const pool = allTemplates().filter((t) => t.slug !== current.slug);
  const sameCategory = pool.filter((t) => t.categorySlug === current.categorySlug);
  const tagOverlap = pool
    .filter((t) => !sameCategory.includes(t))
    .filter((t) => t.tags.some((tag) => current.tags.includes(tag)));
  const featuredFallback = pool.filter((t) => !sameCategory.includes(t) && !tagOverlap.includes(t) && t.featured);
  return [...sameCategory, ...tagOverlap, ...featuredFallback].slice(0, limit);
};

/** Client-side search across name, category, industry and tags. */
export const searchTemplates = (templates: TemplateRecord[], query: string): TemplateRecord[] => {
  const q = query.trim().toLowerCase();
  if (!q) return templates;
  return templates.filter((t) =>
    t.name.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q) ||
    t.industry.toLowerCase().includes(q) ||
    t.shortDescription.toLowerCase().includes(q) ||
    t.tags.some((tag) => tag.toLowerCase().includes(q))
  );
};

export type { TemplateRecord };
