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
import { blogPosts, BlogPost } from '../data/blogPosts';
import { freeTemplates } from '../data/freeTemplatesRegistry';
import { templatesRegistry } from '../data/templates/templates';
import { TEMPLATE_CATEGORIES } from '../data/templates';
import { htmlToPlainText, looksLikeHtml, sanitizeArticleHtml } from './sanitizeHtml';

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

/**
 * Converts a published blog_posts DB row into a public BlogPost and injects it
 * into the compiled registry. Content is SANITIZED here (same sanitizer as the
 * article renderer — defense in depth) and reading time is computed from the
 * real word count, never hardcoded.
 */
function dbRowToBlogPost(o: Record<string, unknown>): BlogPost {
  const slug = str(o.slug);
  const raw = str(o.content);
  const isHtml = looksLikeHtml(raw);
  const contentHtml = isHtml ? sanitizeArticleHtml(raw) : undefined;
  const content = isHtml ? '' : raw;
  const plain = htmlToPlainText(contentHtml || content);
  const words = plain.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  const pubIso = str(o.published_at);
  const d = pubIso ? new Date(pubIso) : null;
  const tags = Array.isArray(o.tags) ? o.tags.map(String) : [];
  const seo = (o.seo && typeof o.seo === 'object' ? o.seo : {}) as Record<string, unknown>;
  return {
    id: `db-${slug}`,
    slug,
    title: str(o.title),
    excerpt: str(o.excerpt),
    category: str(o.category) || 'Insights',
    author: {
      name: str(o.author_name) || 'BRANIFY Team',
      role: str(o.author_role),
      avatar: '/brand/branify-logo.png',
    },
    publishedAt: d && !isNaN(d.getTime())
      ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '',
    readTime: `${mins} min read`,
    coverImage: str(o.cover_image),
    tags,
    featured: bool(o.featured) === true,
    content,
    contentHtml,
    publishedAtISO: pubIso || undefined,
    updatedAtISO: str(o.updated_at) || undefined,
    robots: str(seo.robots) || undefined,
  };
}

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
    if (bool(o.active) === false || bool(o.archived) === true) {
      const i = aiToolsDirectory.indexOf(t);
      if (i >= 0) aiToolsDirectory.splice(i, 1);
      continue;
    }
    if (str(o.name)) t.name = str(o.name);
    if (str(o.description)) t.desc = str(o.description);
    if (str(o.category)) t.category = str(o.category);
    if (str(o.url)) t.url = str(o.url);
    if (str(o.pricing)) t.pricing = str(o.pricing) as typeof t.pricing;
    if (str(o.icon)) t.icon = str(o.icon);
    if (bool(o.featured) !== undefined) t.featured = bool(o.featured);
    if (o.sort_order !== undefined && o.sort_order !== null) t.sort = Number(o.sort_order) || 0;
    // extended metadata document (seo jsonb) — guide content, prompts, faqs, seo fields
    const seoDoc = (o.seo && typeof o.seo === 'object' ? o.seo : null) as Record<string, unknown> | null;
    if (seoDoc) {
      const clean = { ...t.seo };
      for (const k of ['title', 'description', 'og_image', 'focus_keyword', 'canonical', 'og_title', 'og_description', 'about', 'guide_intro'] as const) {
        if (typeof seoDoc[k] === 'string' && seoDoc[k]) (clean as Record<string, unknown>)[k] = str(seoDoc[k]);
      }
      for (const k of ['keywords', 'secondary_keywords', 'best_for', 'tips', 'pros', 'limitations'] as const) {
        if (Array.isArray(seoDoc[k])) (clean as Record<string, unknown>)[k] = (seoDoc[k] as unknown[]).map(String).filter(Boolean);
      }
      for (const k of ['use_cases', 'guide_steps', 'prompts', 'outputs', 'faqs'] as const) {
        if (Array.isArray(seoDoc[k]) && (seoDoc[k] as unknown[]).length) (clean as Record<string, unknown>)[k] = seoDoc[k];
      }
      if (typeof seoDoc.beginner_friendly === 'boolean') clean.beginner_friendly = seoDoc.beginner_friendly;
      t.seo = clean;
      // admin-managed guide overrides the compiled seed
      const hasGuideOverride = (Array.isArray(clean.guide_steps) && clean.guide_steps.length > 0) || (typeof clean.about === 'string' && clean.about.length > 0);
      if (hasGuideOverride && t.guide) {
        const dbPrompts = Array.isArray(clean.prompts)
          ? (clean.prompts as Array<Record<string, unknown>>)
              .filter((p) => p.active !== false && String(p.content ?? '').trim())
              .map((p) => ({ title: String(p.title ?? ''), category: String(p.category ?? 'Prompts'), content: String(p.content ?? '') }))
          : [];
        t.guide = {
          ...t.guide,
          about: typeof clean.about === 'string' && clean.about ? clean.about : t.guide.about,
          bestFor: Array.isArray(clean.best_for) && clean.best_for.length ? clean.best_for : t.guide.bestFor,
          useCases: Array.isArray(clean.use_cases) && clean.use_cases.length ? clean.use_cases.map((u) => ({ title: String((u as { title?: unknown })?.title ?? ''), text: String((u as { text?: unknown })?.text ?? '') })).filter((u) => u.title || u.text) : t.guide.useCases,
          beginnerFriendly: typeof clean.beginner_friendly === 'boolean' ? clean.beginner_friendly : t.guide.beginnerFriendly,
          steps: Array.isArray(clean.guide_steps) && clean.guide_steps.length ? clean.guide_steps.map((s) => ({ title: String((s as { title?: unknown })?.title ?? ''), text: String((s as { text?: unknown })?.text ?? ''), image: typeof (s as { image?: unknown })?.image === 'string' ? (s as { image: string }).image : undefined, caption: typeof (s as { caption?: unknown })?.caption === 'string' ? (s as { caption: string }).caption : undefined, alt: typeof (s as { alt?: unknown })?.alt === 'string' ? (s as { alt: string }).alt : undefined })) : t.guide.steps,
          prompts: dbPrompts.length ? dbPrompts : t.guide.prompts,
          tips: Array.isArray(clean.tips) && clean.tips.length ? clean.tips : t.guide.tips,
          pros: Array.isArray(clean.pros) && clean.pros.length ? clean.pros : t.guide.pros,
          limitations: Array.isArray(clean.limitations) && clean.limitations.length ? clean.limitations : t.guide.limitations,
          faqs: Array.isArray(clean.faqs) && clean.faqs.length ? clean.faqs.map((f) => ({ question: String((f as { question?: unknown })?.question ?? ''), answer: String((f as { answer?: unknown })?.answer ?? '') })).filter((f) => f.question && f.answer) : t.guide.faqs,
        };
      }
    }
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
  // 1) Rows matching compiled registry posts patch/remove them (existing).
  // 2) NEW: posts created in the admin editor are INJECTED so /blog grows
  //    without a redeploy. Drafts/archived rows are dropped; scheduled rows
  //    (status published + future published_at) stay hidden until the moment.
  const nowMs = Date.now();
  const freshPosts: Array<Record<string, unknown>> = [];
  for (const o of p.blog_posts || []) {
    const b = blogPosts.find((x) => x.slug === str(o.slug));
    const hidden = str(o.status) === 'draft' || bool(o.archived) === true;
    if (b) {
      const i = blogPosts.indexOf(b);
      if (hidden) {
        blogPosts.splice(i, 1);
        continue;
      }
      if (str(o.title)) b.title = str(o.title);
      if (str(o.excerpt)) b.excerpt = str(o.excerpt);
      // editor content: sanitized HTML wins; legacy markdown passes through
      const c = str(o.content);
      if (c) {
        if (looksLikeHtml(c)) {
          b.contentHtml = sanitizeArticleHtml(c);
          b.content = '';
        } else {
          b.content = c;
          b.contentHtml = undefined;
        }
      }
      if (str(o.cover_image)) b.coverImage = str(o.cover_image);
      continue;
    }
    if (hidden) continue;
    const pubIso = str(o.published_at);
    if (pubIso && Number.isFinite(Date.parse(pubIso)) && Date.parse(pubIso) > nowMs) continue; // scheduled
    if (!str(o.slug) || !str(o.title)) continue;
    freshPosts.push(o);
  }
  freshPosts.sort((a, z) =>
    (Date.parse(str(a.published_at)) || 0) - (Date.parse(str(z.published_at)) || 0));
  for (const o of freshPosts) blogPosts.unshift(dbRowToBlogPost(o));

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
    // Admin "Demo URL" is an external live-preview link - kept OUT of
    // previewImage (an external URL must never end up in an <img src>);
    // exposed as a runtime demoUrl instead.
    if (str(o.demo_url) && /^https:\/\//.test(str(o.demo_url))) {
      (t as unknown as { demoUrl?: string }).demoUrl = str(o.demo_url);
    }
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
