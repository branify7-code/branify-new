// =============================================================================
// BRANIFY — public content overrides
// -----------------------------------------------------------------------------
// Lets the admin dashboard control live public content WITHOUT touching source:
// published services/tools/AI tools/products/portfolio/blog rows override the
// compiled registries at boot. If the admin database is absent (or unreachable)
// nothing changes — the public site renders exactly the shipped registries.
// =============================================================================
import { supabase } from './supabase';
import { servicesRegistry } from '../data/servicesRegistry';
import { toolsRegistry } from '../data/toolsRegistry';
import { aiToolsDirectory } from '../data/aiToolsDirectory';
import { projectsData } from '../data/projects';
import { blogPosts } from '../data/blogPosts';
import { freeTemplates } from '../data/freeTemplatesRegistry';
import { templatesRegistry } from '../data/templates/templates';
import { TEMPLATE_CATEGORIES } from '../data/templates';

const LOCAL_ENABLED = Boolean((import.meta as { env?: Record<string, unknown> }).env?.DEV);
const CACHE_KEY = 'branify_public_overrides_v1';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface OverridesPayload {
  fetchedAt: number;
  template_categories?: Array<Record<string, unknown>>;
  services: Array<Record<string, unknown>>;
  tools: Array<Record<string, unknown>>;
  ai_tools: Array<Record<string, unknown>>;
  products: Array<Record<string, unknown>>;
  portfolio_projects: Array<Record<string, unknown>>;
  blog_posts: Array<Record<string, unknown>>;
  templates: Array<Record<string, unknown>>;
  redirects: Array<Record<string, unknown>>;
  seo_overrides: Array<Record<string, unknown>>;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const bool = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined);

function applyOverrides(p: OverridesPayload): void {
  // ---- services
  for (const o of p.services || []) {
    const s = servicesRegistry.find((x) => x.slug === str(o.slug));
    if (!s) continue;
    if (bool(o.active) === false) {
      const i = servicesRegistry.indexOf(s);
      if (i >= 0) servicesRegistry.splice(i, 1);
      continue;
    }
    if (str(o.title)) s.name = str(o.title);
    if (str(o.subtitle)) s.tagline = str(o.subtitle);
    if (str(o.description)) s.shortDescription = str(o.description);
  }

  // ---- tools
  for (const o of p.tools || []) {
    const t = toolsRegistry.find((x) => x.slug === str(o.slug));
    if (!t) continue;
    if (bool(o.active) === false) {
      const i = toolsRegistry.indexOf(t);
      if (i >= 0) toolsRegistry.splice(i, 1);
      continue;
    }
    if (str(o.name)) t.name = str(o.name);
    if (str(o.description)) t.description = str(o.description);
    if (bool(o.featured) !== undefined) t.featured = bool(o.featured);
    if (bool(o.popular) !== undefined) t.popular = bool(o.popular);
    const seo = o.seo as { title?: string; description?: string } | null;
    if (seo && typeof seo === 'object') {
      if (seo.title) t.metaTitle = seo.title;
      if (seo.description) t.metaDescription = seo.description;
    }
  }

  // ---- ai tools
  for (const o of p.ai_tools || []) {
    const t = aiToolsDirectory.find((x) => str(o.slug) === x.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    if (!t) continue;
    if (bool(o.active) === false) {
      const i = aiToolsDirectory.indexOf(t);
      if (i >= 0) aiToolsDirectory.splice(i, 1);
      continue;
    }
    if (str(o.name)) t.name = str(o.name);
    if (str(o.description)) t.desc = str(o.description);
  }

  // ---- products (free templates)
  for (const o of p.products || []) {
    const t = freeTemplates.find((x) => x.slug === str(o.slug));
    if (!t) continue;
    if (bool(o.archived) === true) {
      const i = freeTemplates.indexOf(t);
      if (i >= 0) freeTemplates.splice(i, 1);
      continue;
    }
    if (str(o.name)) t.title = str(o.name);
    if (str(o.description)) t.fullDescription = str(o.description);
    if (str(o.status)) t.status = str(o.status);
  }

  // ---- portfolio
  for (const o of p.portfolio_projects || []) {
    const pr = projectsData.find((x) => x.id === str(o.slug));
    if (!pr) continue;
    if (bool(o.published) === false || bool(o.archived) === true) {
      const i = projectsData.indexOf(pr);
      if (i >= 0) projectsData.splice(i, 1);
      continue;
    }
    if (str(o.title)) pr.title = str(o.title);
    if (str(o.description)) pr.description = str(o.description);
  }

  // ---- blog
  for (const o of p.blog_posts || []) {
    const b = blogPosts.find((x) => x.slug === str(o.slug));
    if (!b) continue;
    if (str(o.status) === 'draft' || bool(o.archived) === true) {
      const i = blogPosts.indexOf(b);
      if (i >= 0) blogPosts.splice(i, 1);
      continue;
    }
    if (str(o.title)) b.title = str(o.title);
    if (str(o.excerpt)) b.excerpt = str(o.excerpt);
  }

  // ---- template library categories (tagline/hero/name + deactivation)
  for (const o of p.template_categories || []) {
    const c = TEMPLATE_CATEGORIES.find((x) => x.slug === str(o.slug));
    if (!c) continue;
    if (bool(o.active) === false) {
      // Category deactivated → its templates leave the public registry too
      // (library grid, homepage showcase, detail routes).
      for (let i = templatesRegistry.length - 1; i >= 0; i--) {
        if (templatesRegistry[i].categorySlug === c.slug) templatesRegistry.splice(i, 1);
      }
      continue;
    }
    if (str(o.name)) c.name = str(o.name);
    if (str(o.tagline)) c.tagline = str(o.tagline);
    if (str(o.hero_description)) c.heroDescription = str(o.hero_description);
  }

  // ---- template library
  for (const o of p.templates || []) {
    const t = templatesRegistry.find((x) => x.slug === str(o.slug));
    if (!t) continue;
    if (str(o.status) === 'draft') {
      const i = templatesRegistry.indexOf(t);
      if (i >= 0) templatesRegistry.splice(i, 1);
      continue;
    }
    if (str(o.name)) t.name = str(o.name);
    if (str(o.short_description)) t.shortDescription = str(o.short_description);
    if (str(o.description)) t.description = str(o.description);
    if (str(o.thumbnail)) t.thumbnail = str(o.thumbnail);
    if (str(o.preview_image)) t.previewImage = str(o.preview_image);
    if (str(o.demo_url)) t.previewImage = str(o.demo_url);
    if (bool(o.featured) !== undefined) t.featured = bool(o.featured);
    const seo = o.seo as { title?: string; description?: string } | null;
    if (seo && typeof seo === 'object') {
      if (seo.title) t.seo.title = seo.title;
      if (seo.description) t.seo.description = seo.description;
      if (seo.title || seo.description) {
        t.seo.keywords = t.seo.keywords;
      }
    }
  }

  // ---- SEO overrides exposed for the Seo component (runtime meta refresh)
  (window as unknown as { __BRANIFY_SEO_OVERRIDES__?: Record<string, Record<string, string>> }).__BRANIFY_SEO_OVERRIDES__ =
    Object.fromEntries(
      (p.seo_overrides || []).map((o) => [
        str(o.page_path),
        {
          title: str(o.title),
          description: str(o.description),
          ogImage: str((o.og as { image?: string } | null)?.image || ''),
          robots: str(o.robots),
        },
      ]),
    );

  // ---- redirects exposed for the SPA router (admin Redirect Manager)
  const redirectMap: Record<string, { destination: string; status: number }> = {};
  for (const o of p.redirects || []) {
    const source = str(o.source).trim();
    const destination = str(o.destination).trim();
    // Safe internal redirects only — never off-site, never protocol-relative.
    if (!source.startsWith('/') || !destination.startsWith('/') || destination.startsWith('//')) continue;
    redirectMap[source.replace(/\/+$/, '') || '/'] = { destination, status: Number(o.status) || 301 };
  }
  (window as unknown as { __BRANIFY_REDIRECTS__?: Record<string, { destination: string; status: number }> }).__BRANIFY_REDIRECTS__ =
    redirectMap;
}

function readCache(): OverridesPayload | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as OverridesPayload;
    if (!p.fetchedAt || Date.now() - p.fetchedAt > CACHE_TTL_MS) return null;
    return p;
  } catch {
    return null;
  }
}

async function fetchOverrides(): Promise<OverridesPayload | null> {
  const empty: OverridesPayload = { fetchedAt: Date.now(), template_categories: [], services: [], tools: [], ai_tools: [], products: [], portfolio_projects: [], blog_posts: [], templates: [], redirects: [], seo_overrides: [] };

  // Production → Supabase directly
  if (!LOCAL_ENABLED) {
    try {
      const tables: Array<keyof Omit<OverridesPayload, 'fetchedAt'>> = ['template_categories', 'services', 'tools', 'ai_tools', 'products', 'portfolio_projects', 'blog_posts', 'templates', 'redirects', 'seo_overrides'];
      const results = await Promise.all(
        tables.map((t) =>
          supabase
            .from(t)
            .select(t === 'seo_overrides' ? 'page_path,title,description,robots,og' : t === 'redirects' ? 'source,destination,status,active' : '*')
            .limit(500)
            .then(({ data }: { data: unknown[] | null }) => ({ t, rows: data || [] })),
        ),
      );
      const p: OverridesPayload = { ...empty };
      for (const { t, rows } of results) p[t] = rows as Array<Record<string, unknown>>;
      return p;
    } catch {
      return null;
    }
  }

  // Sandbox → local preview API public endpoint (no auth — mirrors the
  // production Supabase anon-SELECT policies: published rows + seo_overrides).
  try {
    const res = await fetch(`/api/admin/public-overrides?XTransformPort=3032`, { signal: AbortSignal.timeout(1800) });
    if (!res.ok) return null;
    const d = (await res.json()) as Partial<OverridesPayload>;
    return { ...empty, ...d, fetchedAt: Date.now() };
  } catch {
    return null;
  }
}

/** Called once at app boot, BEFORE React renders. Never blocks longer than ~1.2s. */
export async function applyPublicContentOverrides(): Promise<void> {
  try {
    const cached = readCache();
    if (cached) {
      applyOverrides(cached);
      // refresh quietly for next load
      void fetchOverrides().then((fresh) => {
        if (fresh) { try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(fresh)); } catch { /* noop */ } }
      });
      return;
    }
    const fresh = await Promise.race([
      fetchOverrides(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200)),
    ]);
    if (fresh) {
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(fresh)); } catch { /* noop */ }
      applyOverrides(fresh);
    }
  } catch { /* public site stays on compiled registries */ }
}

/** Runtime SEO override lookup for the Seo component. */
export function getSeoOverride(pathname: string): { title?: string; description?: string; ogImage?: string; robots?: string } | null {
  try {
    const map = (window as unknown as { __BRANIFY_SEO_OVERRIDES__?: Record<string, Record<string, string>> }).__BRANIFY_SEO_OVERRIDES__;
    return map?.[pathname] || null;
  } catch {
    return null;
  }
}

/** Admin Redirect Manager lookup — exact path match, trailing-slash tolerant. */
export function getRedirectTarget(pathname: string): string | null {
  try {
    const map = (window as unknown as { __BRANIFY_REDIRECTS__?: Record<string, { destination: string; status: number }> }).__BRANIFY_REDIRECTS__;
    if (!map) return null;
    const key = pathname.replace(/\/+$/, '') || '/';
    const hit = map[key] || map[`${key}/`];
    if (!hit) return null;
    // Final safety gate: internal paths only.
    if (!hit.destination.startsWith('/') || hit.destination.startsWith('//')) return null;
    return hit.destination;
  } catch {
    return null;
  }
}
