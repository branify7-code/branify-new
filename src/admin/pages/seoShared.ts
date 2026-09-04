// =============================================================================
// BRANIFY ADMIN — SEO shared engine (pure functions, no React)
// -----------------------------------------------------------------------------
// Owns: the REAL public route inventory of the site, the SEO resolution
// priority chain (override → content SEO → auto → global), the audit engine,
// and sitemap build/parse helpers. Everything here is side-effect free so it
// can be unit-reasoned about and reused by the SEO dashboard + sitemap page.
// =============================================================================

import type { SeoOverrideRow, SiteSettings } from '../lib/types';

// ------------------------------------------------------------------ row shape
/** Minimal structural shape of content rows fetched via listRows(). */
export interface ContentRowLike {
  slug?: string;
  name?: string;
  title?: string;
  description?: string;
  excerpt?: string;
  seo?: { title?: string; description?: string } | null;
  active?: boolean;
  archived?: boolean;
  published?: boolean;
  status?: string;
  updated_at?: string;
}

export interface InventoryInput {
  services?: ContentRowLike[];
  tools?: ContentRowLike[];
  aiTools?: ContentRowLike[];
  products?: ContentRowLike[];
  blog?: ContentRowLike[];
  portfolio?: ContentRowLike[];
}

// ------------------------------------------------------------------ inventory
export type PageKind =
  | 'home'
  | 'static'
  | 'legal'
  | 'service_hub'
  | 'service'
  | 'tools_hub'
  | 'tool'
  | 'ai_tools'
  | 'templates_hub'
  | 'template'
  | 'blog_hub'
  | 'blog'
  | 'portfolio_hub'
  | 'portfolio';

export interface PageMeta {
  /** Public path, e.g. '/tools/word-counter' */
  path: string;
  kind: PageKind;
  /** Human label used for auto-generated titles ("About", "Word Counter"…) */
  label: string;
  /** SEO fields that live ON the content row (registry/DB derived). */
  sourceTitle?: string;
  sourceDescription?: string;
  /** Real updated_at of the content row (used for sitemap lastmod). */
  sourceUpdated?: string;
}

export const PAGE_KIND_LABEL: Record<PageKind, string> = {
  home: 'Home',
  static: 'Static',
  legal: 'Legal',
  service_hub: 'Services hub',
  service: 'Service',
  tools_hub: 'Tools hub',
  tool: 'Tool',
  ai_tools: 'AI directory',
  templates_hub: 'Templates hub',
  template: 'Template',
  blog_hub: 'Blog hub',
  blog: 'Blog post',
  portfolio_hub: 'Portfolio hub',
  portfolio: 'Case study',
};

/** A row counts as a live public page: not archived / inactive / draft. */
function isLive(row: ContentRowLike): boolean {
  if (!row) return false;
  if (row.archived) return false;
  if (row.active === false) return false;
  if (row.published === false) return false;
  if (row.status === 'draft') return false;
  return true;
}

function contentSeo(row: ContentRowLike): { title?: string; description?: string } {
  const t = (row.seo?.title || '').trim();
  const d = (row.seo?.description || '').trim();
  return {
    title: t || undefined,
    description: d || undefined,
  };
}

/**
 * Builds the FULL public page inventory of the site (the same routes the
 * public SPA serves):
 *   / + /about /contact /pricing + 5 legal pages
 *   /services hub + /services/<slug> (services rows)
 *   /tools hub + /tools/<slug> (tools rows)
 *   /ai-tools (single directory page — AI tools are EXTERNAL links, not site pages)
 *   /free-templates hub + /free-templates/<slug> (products rows)
 *   /blog hub + /blog/<slug> (published blog rows)
 *   /portfolio hub + /portfolio/<slug> (portfolio rows)
 */
export function buildPageInventory(rows: InventoryInput): PageMeta[] {
  const pages: PageMeta[] = [];

  // --- statics (9) — titles/descriptions mirror what the live views actually
  //     render (index.html, ServicesView, FreeToolsView, AIToolsView,
  //     FreeTemplatesView, BlogView, LegalPageView) so the audit reports the
  //     site's TRUE state. Statics without view-level SEO (about, contact,
  //     pricing, portfolio, tools-hub description) intentionally fall through
  //     to the global default — the audit will surface that as a finding.
  pages.push({
    path: '/', kind: 'home', label: 'BRANIFY',
    sourceTitle: 'Custom Web Development & Digital Agency | BRANIFY',
    sourceDescription: 'Build a stronger digital presence with BRANIFY—web development, branding, AI solutions, SEO and digital products designed for modern businesses worldwide.',
  });
  pages.push({ path: '/about', kind: 'static', label: 'About' });
  pages.push({ path: '/contact', kind: 'static', label: 'Contact' });
  pages.push({ path: '/pricing', kind: 'static', label: 'Pricing' });
  pages.push({
    path: '/privacypolicy', kind: 'legal', label: 'Privacy Policy',
    sourceTitle: 'Privacy Policy | BRANIFY',
    sourceDescription: 'How BRANIFY collects, uses, and protects personal information for international web development, branding, and digital product clients.',
  });
  pages.push({
    path: '/termsandconditions', kind: 'legal', label: 'Terms & Conditions',
    sourceTitle: 'Terms of Service | BRANIFY',
    sourceDescription: 'The terms and conditions that govern the use of BRANIFY digital services, downloads, and the branify.store website.',
  });
  pages.push({
    path: '/refundpolicy', kind: 'legal', label: 'Refund Policy',
    sourceTitle: 'Refund & Cancellation Policy | BRANIFY',
    sourceDescription: 'BRANIFY refund and cancellation terms for instant digital downloads and custom agency service engagements.',
  });
  pages.push({
    path: '/cookiespolicy', kind: 'legal', label: 'Cookie Policy',
    sourceTitle: 'Cookies Policy | BRANIFY',
    sourceDescription: 'How BRANIFY uses cookies and local browser storage for Progressive Web App caching and site preferences.',
  });
  pages.push({
    path: '/disclaimer', kind: 'legal', label: 'Disclaimer',
    sourceTitle: 'Legal Disclaimer | BRANIFY',
    sourceDescription: 'Legal disclaimer and trademark notices covering BRANIFY case studies, portfolio content, and digital publications.',
  });

  // --- services (hub + detail) ---
  pages.push({
    path: '/services', kind: 'service_hub', label: 'Services',
    sourceTitle: 'Digital Agency Services | Web, Branding, AI & SEO | BRANIFY',
    sourceDescription: "Explore BRANIFY's digital services including web development, branding, AI solutions, e-commerce, SEO, UI/UX and digital growth.",
  });
  for (const r of rows.services || []) {
    if (!isLive(r) || !r.slug) continue;
    const seo = contentSeo(r);
    pages.push({
      path: `/services/${r.slug}`,
      kind: 'service',
      label: r.title || r.slug,
      sourceTitle: seo.title,
      sourceDescription: seo.description,
      sourceUpdated: r.updated_at,
    });
  }

  // --- tools (hub + detail) ---
  pages.push({
    path: '/tools', kind: 'tools_hub', label: 'Free Tools',
    sourceTitle: '100+ Free Online Tools | Browser Utilities | BRANIFY',
  });
  for (const r of rows.tools || []) {
    if (!isLive(r) || !r.slug) continue;
    const seo = contentSeo(r);
    pages.push({
      path: `/tools/${r.slug}`,
      kind: 'tool',
      label: r.name || r.slug,
      sourceTitle: seo.title,
      sourceDescription: seo.description,
      sourceUpdated: r.updated_at,
    });
  }

  // --- AI tools directory (one page; the 26 ai_tools rows are EXTERNAL links,
  //     not site pages — they never enter the sitemap or route inventory) ---
  pages.push({
    path: '/ai-tools', kind: 'ai_tools', label: 'AI Tools Directory',
    sourceTitle: '27+ AI Tools for Work & Productivity | BRANIFY',
    sourceDescription: 'Discover useful AI tools for productivity, business, content, design and everyday workflows from BRANIFY.',
  });

  // --- free templates (= products rows) ---
  pages.push({
    path: '/free-templates', kind: 'templates_hub', label: 'Free Templates',
    sourceTitle: 'Free Templates for Business & Creators | BRANIFY',
    sourceDescription: 'Free Website & Design Templates | BRANIFY',
  });
  for (const r of rows.products || []) {
    if (!isLive(r) || !r.slug) continue;
    const seo = contentSeo(r);
    pages.push({
      path: `/free-templates/${r.slug}`,
      kind: 'template',
      label: r.name || r.slug,
      sourceTitle: seo.title,
      sourceDescription: seo.description,
      sourceUpdated: r.updated_at,
    });
  }

  // --- blog (hub + published posts only) ---
  pages.push({
    path: '/blog', kind: 'blog_hub', label: 'Blog',
    sourceTitle: 'Insights & Articles on Web Development, Branding & AI | BRANIFY',
    sourceDescription: 'Actionable guides on web performance, AI automation, branding conversion strategies, and scaling digital products.',
  });
  for (const r of rows.blog || []) {
    if (!isLive(r) || !r.slug) continue;
    const seo = contentSeo(r);
    pages.push({
      path: `/blog/${r.slug}`,
      kind: 'blog',
      label: r.title || r.slug,
      sourceTitle: seo.title,
      sourceDescription: seo.description || (r.excerpt || '').trim() || undefined,
      sourceUpdated: r.updated_at,
    });
  }

  // --- portfolio (hub + case studies) ---
  pages.push({ path: '/portfolio', kind: 'portfolio_hub', label: 'Portfolio' });
  for (const r of rows.portfolio || []) {
    if (!isLive(r) || !r.slug) continue;
    const seo = contentSeo(r);
    pages.push({
      path: `/portfolio/${r.slug}`,
      kind: 'portfolio',
      label: r.title || r.slug,
      sourceTitle: seo.title,
      sourceDescription: seo.description || (r.description || '').trim() || undefined,
      sourceUpdated: r.updated_at,
    });
  }

  return pages;
}

// ------------------------------------------------------------------ resolution
export type SeoSource = 'override' | 'content' | 'auto' | 'global';

export interface ResolvedSeo {
  path: string;
  kind: PageKind;
  label: string;
  title: string;
  description: string;
  robots: string;
  canonical: string;
  ogImage: string;
  source: SeoSource;
}

export const DEFAULT_ROBOTS = 'index,follow';

function siteOrigin(settings: SiteSettings | null | undefined): string {
  const fromSettings = (settings?.general?.site_url || '').trim().replace(/\/+$/, '');
  if (fromSettings) return fromSettings;
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return '';
}

function autoTitleFor(page: PageMeta): string | undefined {
  // The homepage never gets a label-derived title — it falls through to the
  // global default ("BRANIFY — Luxury Digital Studio…") which is intentional.
  if (page.kind === 'home') return undefined;
  return `${page.label} — BRANIFY`;
}

function globalTitle(settings: SiteSettings | null | undefined): string {
  return (settings?.seo_defaults?.default_title || '').trim();
}

function globalDescription(settings: SiteSettings | null | undefined): string {
  return (settings?.seo_defaults?.default_description || '').trim();
}

function globalOgImage(settings: SiteSettings | null | undefined): string {
  const fromSeo = (settings?.seo_defaults?.default_og_image || '').trim();
  const fromBrand = (settings?.brand?.default_og_image || '').trim();
  return fromSeo || fromBrand;
}

/**
 * SEO resolution priority chain:
 *   1) seo_overrides row (per-page override)
 *   2) content SEO fields (registry-derived sourceTitle/sourceDescription)
 *   3) auto-generated ("{Name} — BRANIFY" / content description truncated to 160)
 *   4) global defaults (settings.seo_defaults)
 * Empty override fields fall through the chain but the source stays 'override'.
 */
export function resolveSeo(
  page: PageMeta,
  override: SeoOverrideRow | null | undefined,
  settings: SiteSettings | null | undefined,
): ResolvedSeo {
  const maxDesc = Math.max(1, Number(settings?.seo_defaults?.description_max_length) || 160);

  const gTitle = globalTitle(settings);
  const gDesc = globalDescription(settings);
  const autoTitle = autoTitleFor(page);
  const contentDesc = (page.sourceDescription || '').trim();

  const chainTitle = override?.title?.trim() || page.sourceTitle || autoTitle || gTitle;
  const chainDescription =
    override?.description?.trim() ||
    contentDesc ||
    gDesc;

  const title = chainTitle;
  const description = contentDesc && chainDescription === contentDesc
    ? contentDesc.slice(0, maxDesc)
    : chainDescription;

  const source: SeoSource = override ? 'override' : page.sourceTitle ? 'content' : autoTitle ? 'auto' : 'global';

  const origin = siteOrigin(settings);
  const canonical = (override?.canonical || '').trim() || (origin ? `${origin}${page.path}` : page.path);

  return {
    path: page.path,
    kind: page.kind,
    label: page.label,
    title,
    description,
    robots: (override?.robots || '').trim() || DEFAULT_ROBOTS,
    canonical,
    ogImage: (override?.og?.image || '').trim() || globalOgImage(settings),
    source,
  };
}

/** True when the effective robots directive hides the page from search. */
export function isNoindex(robots: string): boolean {
  return (robots || '').toLowerCase().includes('noindex');
}

// ------------------------------------------------------------------ audit
export type AuditStatus = 'pass' | 'warning' | 'error';

export interface AuditIssue {
  level: 'warning' | 'error';
  code:
    | 'missing_title'
    | 'title_long'
    | 'title_short'
    | 'missing_description'
    | 'description_long'
    | 'description_short'
    | 'duplicate_title'
    | 'duplicate_description'
    | 'noindex'
    | 'og_missing';
  message: string;
}

export interface PageAudit {
  path: string;
  status: AuditStatus;
  issues: AuditIssue[];
}

export interface DuplicateGroup {
  value: string;
  paths: string[];
}

export interface AuditSummary {
  total: number;
  pass: number;
  warning: number;
  error: number;
  errors: number; // total error-issue count across pages
  warnings: number; // total warning-issue count across pages
  score: number; // weighted health: (pass + 0.5·warning-pages) / total × 100
  duplicateTitles: DuplicateGroup[];
  duplicateDescriptions: DuplicateGroup[];
}

export interface AuditReport {
  pages: PageAudit[];
  summary: AuditSummary;
}

const TITLE_MAX = 60;
const TITLE_MIN = 30;
const DESC_MAX = 160;
const DESC_MIN = 50;

function duplicates(values: Array<{ path: string; value: string }>, valueLabel: string): {
  groups: DuplicateGroup[];
  issues: Map<string, AuditIssue>;
} {
  const byKey = new Map<string, string[]>();
  for (const { path, value } of values) {
    const key = value.trim().toLowerCase();
    if (!key) continue;
    const list = byKey.get(key) || [];
    list.push(path);
    byKey.set(key, list);
  }
  const groups: DuplicateGroup[] = [];
  const issues = new Map<string, AuditIssue>();
  for (const [, paths] of byKey) {
    if (paths.length < 2) continue;
    groups.push({ value: paths[0], paths });
    const others = paths.filter((p) => p !== paths[0]);
    const preview = others.slice(0, 2).join(', ');
    const extra = others.length > 2 ? ` +${others.length - 2} more` : '';
    for (const p of paths) {
      const othersFor = paths.filter((x) => x !== p);
      const prevFor = othersFor.slice(0, 2).join(', ');
      const extraFor = othersFor.length > 2 ? ` +${othersFor.length - 2} more` : '';
      issues.set(p, {
        level: 'warning',
        code: valueLabel === 'title' ? 'duplicate_title' : 'duplicate_description',
        message: `Duplicate ${valueLabel} also used on ${prevFor || othersFor[0] || 'other pages'}${extraFor}`,
      });
    }
  }
  return { groups, issues };
}

/**
 * Real SEO audit over resolved pages:
 *  - missing title (E) · title >60/<30 (W)
 *  - missing description (E) · description >160/<50 (W)
 *  - duplicate titles / descriptions across pages (W, offenders listed)
 *  - robots contains noindex (W flag)
 *  - missing og:image after override/brand-default derivation (W)
 * Score = weighted health percentage: passing pages count fully, pages with
 * warnings count half (length heuristics are advisory, not failures). Errors
 * (missing title/description) already exclude a page from "pass". Clamped
 * 0..100 — a page-level health signal that stays meaningful for content-rich
 * registries (100×warning pages would otherwise clamp the score to 0).
 */
export function auditPages(resolved: ResolvedSeo[]): AuditReport {
  // duplicates first (issues attach per page)
  const titleDup = duplicates(resolved.map((r) => ({ path: r.path, value: r.title })), 'title');
  const descDup = duplicates(resolved.map((r) => ({ path: r.path, value: r.description })), 'description');

  const pages: PageAudit[] = resolved.map((r) => {
    const issues: AuditIssue[] = [];

    if (!r.title.trim()) {
      issues.push({ level: 'error', code: 'missing_title', message: 'Missing title tag' });
    } else {
      if (r.title.length > TITLE_MAX) issues.push({ level: 'warning', code: 'title_long', message: `Title is ${r.title.length} chars (max ${TITLE_MAX})` });
      if (r.title.length < TITLE_MIN) issues.push({ level: 'warning', code: 'title_short', message: `Title is only ${r.title.length} chars (min ${TITLE_MIN})` });
    }

    if (!r.description.trim()) {
      issues.push({ level: 'error', code: 'missing_description', message: 'Missing meta description' });
    } else {
      if (r.description.length > DESC_MAX) issues.push({ level: 'warning', code: 'description_long', message: `Description is ${r.description.length} chars (max ${DESC_MAX})` });
      if (r.description.length < DESC_MIN) issues.push({ level: 'warning', code: 'description_short', message: `Description is only ${r.description.length} chars (min ${DESC_MIN})` });
    }

    const dupTitle = titleDup.issues.get(r.path);
    if (dupTitle) issues.push(dupTitle);
    const dupDesc = descDup.issues.get(r.path);
    if (dupDesc) issues.push(dupDesc);

    if (isNoindex(r.robots)) {
      issues.push({ level: 'warning', code: 'noindex', message: `robots = "${r.robots}" — hidden from search engines` });
    }
    if (!r.ogImage.trim()) {
      issues.push({ level: 'warning', code: 'og_missing', message: 'No og:image (override or brand default)' });
    }

    const hasError = issues.some((i) => i.level === 'error');
    const status: AuditStatus = hasError ? 'error' : issues.length ? 'warning' : 'pass';
    return { path: r.path, status, issues };
  });

  let errors = 0;
  let warnings = 0;
  let pass = 0;
  let warning = 0;
  let error = 0;
  for (const p of pages) {
    if (p.status === 'pass') pass += 1;
    else if (p.status === 'warning') warning += 1;
    else error += 1;
    for (const i of p.issues) {
      if (i.level === 'error') errors += 1;
      else warnings += 1;
    }
  }

  const score = pages.length
    ? Math.round((100 * (pass + 0.5 * warning)) / pages.length)
    : 100;

  return {
    pages,
    summary: {
      total: pages.length,
      pass,
      warning,
      error,
      errors,
      warnings,
      score,
      duplicateTitles: titleDup.groups,
      duplicateDescriptions: descDup.groups,
    },
  };
}

// ------------------------------------------------------------------ sitemap
export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq: string;
  priority: string;
}

const SITEMAP_POLICY: Record<PageKind, { changefreq: string; priority: string }> = {
  home: { changefreq: 'daily', priority: '1.0' },
  static: { changefreq: 'monthly', priority: '0.7' },
  legal: { changefreq: 'yearly', priority: '0.3' },
  service_hub: { changefreq: 'weekly', priority: '0.9' },
  service: { changefreq: 'monthly', priority: '0.8' },
  tools_hub: { changefreq: 'daily', priority: '0.9' },
  tool: { changefreq: 'weekly', priority: '0.6' },
  ai_tools: { changefreq: 'weekly', priority: '0.7' },
  templates_hub: { changefreq: 'weekly', priority: '0.9' },
  template: { changefreq: 'weekly', priority: '0.7' },
  blog_hub: { changefreq: 'weekly', priority: '0.8' },
  blog: { changefreq: 'monthly', priority: '0.6' },
  portfolio_hub: { changefreq: 'weekly', priority: '0.8' },
  portfolio: { changefreq: 'monthly', priority: '0.7' },
};

const xmlEscape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/**
 * Builds sitemap entries from the inventory, EXCLUDING pages hidden by a
 * noindex override (or a noindex directive of any kind). Archived/inactive/
 * draft content never enters the inventory in the first place.
 */
export function sitemapEntries(
  inventory: PageMeta[],
  overrides: SeoOverrideRow[],
  settings: SiteSettings | null | undefined,
): SitemapEntry[] {
  const origin = siteOrigin(settings);
  const byPath = new Map<string, SeoOverrideRow>();
  for (const o of overrides) if (o?.page_path) byPath.set(o.page_path, o);

  const out: SitemapEntry[] = [];
  for (const page of inventory) {
    const override = byPath.get(page.path);
    const resolved = resolveSeo(page, override, settings);
    if (isNoindex(resolved.robots)) continue;
    const policy = SITEMAP_POLICY[page.kind] || SITEMAP_POLICY.static;
    out.push({
      loc: `${origin}${page.path}` || page.path,
      lastmod: page.sourceUpdated ? page.sourceUpdated.slice(0, 10) : undefined,
      changefreq: policy.changefreq,
      priority: policy.priority,
    });
  }
  return out;
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((e) =>
      [
        '  <url>',
        `    <loc>${xmlEscape(e.loc)}</loc>`,
        e.lastmod ? `    <lastmod>${xmlEscape(e.lastmod)}</lastmod>` : null,
        `    <changefreq>${e.changefreq}</changefreq>`,
        `    <priority>${e.priority}</priority>`,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export interface ParsedSitemap {
  ok: boolean;
  locs: string[];
  lastmods: string[];
}

/** Extracts real <loc>/<lastmod> values from a live sitemap.xml document. */
export function parseSitemapXml(xml: string): ParsedSitemap {
  const locs: string[] = [];
  const lastmods: string[] = [];
  const locRe = /<loc>\s*([^<]*?)\s*<\/loc>/g;
  const lmRe = /<lastmod>\s*([^<]*?)\s*<\/lastmod>/g;
  let m: RegExpExecArray | null;
  while ((m = locRe.exec(xml))) locs.push(m[1]);
  while ((m = lmRe.exec(xml))) lastmods.push(m[1]);
  return { ok: locs.length > 0, locs, lastmods };
}
