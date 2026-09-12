/* =========================================================
   BRANIFY — TEMPLATE LIBRARY data layer (public source of truth)
   • templatesRegistry (generated from the supplied Flow AI mockups)
   • 15 canonical categories with SEO/category-page copy
   • Query helpers used by the library, category pages, detail pages,
     homepage showcase, sitemap, related templates and admin.
   Admin edits arrive via contentOverrides (published rows merge over
   this registry) — this file stays the compile-time source of truth.
========================================================= */

import { templatesRegistry, type TemplateRecord } from './templates';
import { TEMPLATE_CATEGORIES, categoryHref, type TemplateCategory } from '../templateCategories';

// Categories live in a lightweight standalone module (src/data/templateCategories.ts)
// so boot-graph consumers (Header) don't pull the full registry. Re-exported
// here to keep the public API of this data layer unchanged.
export { TEMPLATE_CATEGORIES, categoryHref };
export type { TemplateCategory };
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
