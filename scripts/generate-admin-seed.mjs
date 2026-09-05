// =============================================================================
// BRANIFY ADMIN — SEED GENERATOR
// Emits:  supabase/admin-seed.sql          (production Supabase seed)
//         mini-services/branify-admin-api/seed.json  (local preview backend seed)
// Source: the site's REAL live data registries (single source of truth).
// Run:    cd mini-services/branify-web && bun scripts/generate-admin-seed.mjs
// =============================================================================
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const { servicesRegistry } = await import(join(ROOT, 'src/data/servicesRegistry.ts'));
const { toolsRegistry } = await import(join(ROOT, 'src/data/toolsRegistry.ts'));
const { aiToolsDirectory } = await import(join(ROOT, 'src/data/aiToolsDirectory.ts'));
const { projectsData } = await import(join(ROOT, 'src/data/projects.ts'));
const { blogPosts } = await import(join(ROOT, 'src/data/blogPosts.ts'));
const { freeTemplates } = await import(join(ROOT, 'src/data/freeTemplatesRegistry.ts'));
const { templatesRegistry } = await import(join(ROOT, 'src/data/templates/templates.ts'));
const { TEMPLATE_CATEGORIES } = await import(join(ROOT, 'src/data/templates/index.ts'));

const SITE_URL = 'https://branify-new.vercel.app';

const q = (v) => {
  if (v === null || v === undefined) return "''";
  return `'${String(v).replace(/'/g, "''")}'`;
};
const qarr = (arr) => `ARRAY[${(arr || []).map((x) => q(x)).join(',')}]::text[]`;
const qjson = (obj) => (obj && Object.keys(obj).length ? `${q(JSON.stringify(obj))}::jsonb` : `'{}'::jsonb`);
const qtstz = (v) => (v ? q(new Date(v).toISOString()) : 'now()');

// ---------------------------------------------------------------- map: services
const services = servicesRegistry.map((s, i) => ({
  slug: s.slug,
  number: String(i + 1).padStart(2, '0'),
  title: s.name,
  subtitle: s.tagline || '',
  description: s.fullDescription || s.shortDescription || '',
  icon: s.iconName || 'Sparkles',
  category: s.category || '',
  technologies: s.techStack || [],
  deliverables: s.deliverables || [],
  stat_label: 'Starting price',
  stat_value: s.startingPriceUSD ? `$${s.startingPriceUSD}` : 'Custom quote',
  price_note: s.deliveryTimeline || '',
  active: true,
  featured: i < 3,
  sort_order: i,
  seo: { title: `${s.name} Services — BRANIFY`, description: s.shortDescription || '' },
}));

// ------------------------------------------------------------------ map: tools
const tools = toolsRegistry.map((t, i) => ({
  slug: t.slug,
  name: t.name,
  category: t.category,
  description: t.description || '',
  icon: t.iconName || 'Wrench',
  url: `/tools/${t.slug}`,
  input_type: t.inputType || 'text',
  active: true,
  featured: Boolean(t.featured),
  popular: Boolean(t.popular),
  sort_order: i,
  seo: {
    title: t.metaTitle || `${t.name} — BRANIFY Tools`,
    description: t.metaDescription || t.description || '',
    keywords: t.keywords || [],
  },
}));

// ------------------------------------------------------------------ map: ai_tools
const aiTools = aiToolsDirectory.map((t, i) => ({
  slug: t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  name: t.name,
  category: t.category,
  description: t.desc || '',
  icon: 'Sparkles',
  url: t.url,
  pricing: t.pricing || 'Free',
  active: true,
  featured: i < 6,
  sort_order: i,
  seo: { title: `${t.name} — AI Tools Directory | BRANIFY`, description: t.desc || '' },
}));

// --------------------------------------------------------- map: portfolio_projects
const portfolio = projectsData.map((p, i) => ({
  slug: p.id,
  title: p.title,
  category: p.category || '',
  client: p.client || '',
  description: p.description || '',
  hero_image: p.heroImage || '',
  gallery: [],
  technologies: p.deliverables || [],
  challenge: '',
  solution: '',
  outcome: (p.impactMetrics || []).map((m) => `${m.label}: ${m.value}`).join(' · '),
  live_url: p.liveUrl || '',
  featured: Boolean(p.isFeatured),
  published: true,
  sort_order: i,
  seo: { title: `${p.title} — Case Study | BRANIFY`, description: p.description || '' },
}));

// ------------------------------------------------------------------ map: products
const products = freeTemplates.map((t, i) => ({
  slug: t.slug,
  name: t.title,
  category: t.category || '',
  description: t.fullDescription || t.shortDescription || '',
  image: '',
  price: 0,
  currency: 'USD',
  status: t.status === 'coming_soon' ? 'coming_soon' : 'active',
  delivery_info: t.license ? `License: ${t.license}` : '',
  file_url: t.downloadUrl || '',
  featured: Boolean(t.featured),
  sort_order: t.sortOrder ?? i,
  seo: { title: t.seoTitle || `${t.title} — Free Download | BRANIFY`, description: t.metaDescription || '' },
}));

// --------------------------------------------------------------- map: blog_posts
const posts = blogPosts.map((p) => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt || '',
  content: p.content || '',
  cover_image: p.coverImage || '',
  author_name: p.author?.name || 'BRANIFY Team',
  author_role: p.author?.role || '',
  published_at: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
  category: p.category || '',
  tags: p.tags || [],
  status: 'published',
  featured: Boolean(p.featured),
  seo: { title: `${p.title} | BRANIFY Blog`, description: p.excerpt || '' },
}));

// -------------------------------------------------- map: template_categories
// The 16 canonical /templates categories (public data layer = source of truth).
const templateCategories = TEMPLATE_CATEGORIES.map((c, i) => ({
  slug: c.slug,
  name: c.name,
  tagline: c.tagline || '',
  hero_description: c.heroDescription || '',
  image: '',
  seo_title: `${c.name} Website Templates — BRANIFY`,
  seo_description: c.heroDescription || c.tagline || '',
  og_image: '',
  active: true,
  sort_order: i,
}));

// --------------------------------------------------------- map: templates
// 70 generated TemplateRecord entries (Flow AI mockups).
const templates = templatesRegistry.map((t, i) => ({
  slug: t.slug,
  name: t.name,
  category_slug: t.categorySlug,
  short_description: t.shortDescription || '',
  description: t.description || '',
  thumbnail: t.thumbnail || '',
  preview_image: t.previewImage || '',
  demo_url: '',
  tags: t.tags || [],
  featured: Boolean(t.featured),
  status: t.status === 'draft' ? 'draft' : 'published',
  sort_order: t.order ?? i,
  seo: {
    title: t.seo?.title || '',
    description: t.seo?.description || '',
    og_image: t.seo?.ogImage || '',
  },
}));

// ------------------------------------------------------------------- settings
const settings = {
  general: {
    site_name: 'BRANIFY',
    site_url: SITE_URL,
    tagline: 'Luxury Digital Studio & Futuristic Technology',
  },
  brand: {
    logo_url: '/branify-logo-horizontal.svg',
    favicon_url: '/branify-icon.svg',
    default_og_image: '/og/home.jpg',
  },
  contact: {
    email: 'admin@branify.store',
    phone: '+8801879176373',
    whatsapp: '923321029333',
    whatsapp_display: '+92 332 1029333',
    offices: [
      { label: 'USA Office', lines: ['Remote-first', 'Serving worldwide'] },
      { label: 'Bangladesh Office', lines: ['Dhaka', 'Bangladesh'] },
    ],
  },
  social: {
    instagram: 'https://instagram.com/branify',
    facebook: 'https://facebook.com/branify',
    linkedin: 'https://www.linkedin.com/company/branify',
    youtube: 'https://www.youtube.com/@branify',
    tiktok: 'https://www.tiktok.com/@branify',
  },
  seo_defaults: {
    title_template: '%s | BRANIFY',
    default_title: 'BRANIFY — Luxury Digital Studio & Futuristic Technology',
    default_description:
      'BRANIFY is a futuristic digital studio delivering web development, branding, AI solutions, 100+ free tools and premium digital products for ambitious international brands.',
    default_og_image: '/og/home.jpg',
    title_max_length: 60,
    description_max_length: 160,
  },
  performance: {
    analytics_provider: 'first_party', // 'first_party' | 'google_analytics' (when configured)
  },
};

// ============================================================== SQL EMITTER
function rows(table, list, map) {
  if (!list.length) return '';
  const values = list
    .map((r) => `  (${map(r)})`)
    .join(',\n');
  return `-- ${table} (${list.length} rows)\ninsert into public.${table} (${Object.keys(list[0]).join(', ')})\nvalues\n${values}\non conflict (${table === 'blog_posts' ? 'slug' : 'slug'}) do nothing;\n`;
}

const sqlParts = [];
sqlParts.push(`-- =============================================================================
-- BRANIFY ADMIN SEED — generated from the live site's data registries.
-- Auto-generated by scripts/generate-admin-seed.mjs — DO NOT EDIT BY HAND.
-- Run AFTER admin-schema.sql. Idempotent: existing slugs are left untouched.
-- =============================================================================\n`);

const cols = (o) => Object.keys(o).join(', ');
sqlParts.push(rows('services', services, (r) =>
  `${q(r.slug)}, ${q(r.number)}, ${q(r.title)}, ${q(r.subtitle)}, ${q(r.description)}, ${q(r.icon)}, ${q(r.category)}, ${qarr(r.technologies)}, ${qarr(r.deliverables)}, ${q(r.stat_label)}, ${q(r.stat_value)}, ${q(r.price_note)}, ${r.active}, ${r.featured}, ${r.sort_order}, ${qjson(r.seo)}`));
sqlParts.push('\n');
sqlParts.push(rows('tools', tools, (r) =>
  `${q(r.slug)}, ${q(r.name)}, ${q(r.category)}, ${q(r.description)}, ${q(r.icon)}, ${q(r.url)}, ${q(r.input_type)}, ${r.active}, ${r.featured}, ${r.popular}, ${r.sort_order}, ${qjson(r.seo)}`));
sqlParts.push('\n');
sqlParts.push(rows('ai_tools', aiTools, (r) =>
  `${q(r.slug)}, ${q(r.name)}, ${q(r.category)}, ${q(r.description)}, ${q(r.icon)}, ${q(r.url)}, ${q(r.pricing)}, ${r.active}, ${r.featured}, ${r.sort_order}, ${qjson(r.seo)}`));
sqlParts.push('\n');
sqlParts.push(rows('portfolio_projects', portfolio, (r) =>
  `${q(r.slug)}, ${q(r.title)}, ${q(r.category)}, ${q(r.client)}, ${q(r.description)}, ${q(r.hero_image)}, ${qarr(r.gallery)}, ${qarr(r.technologies)}, ${q(r.challenge)}, ${q(r.solution)}, ${q(r.outcome)}, ${q(r.live_url)}, ${r.featured}, ${r.published}, ${r.sort_order}, ${qjson(r.seo)}`));
sqlParts.push('\n');
sqlParts.push(rows('products', products, (r) =>
  `${q(r.slug)}, ${q(r.name)}, ${q(r.category)}, ${q(r.description)}, ${q(r.image)}, ${r.price}, ${q(r.currency)}, ${q(r.status)}, ${q(r.delivery_info)}, ${q(r.file_url)}, ${r.featured}, ${r.sort_order}, ${qjson(r.seo)}`));
sqlParts.push('\n');
sqlParts.push(rows('blog_posts', posts, (r) =>
  `${q(r.slug)}, ${q(r.title)}, ${q(r.excerpt)}, ${q(r.content)}, ${q(r.cover_image)}, ${q(r.author_name)}, ${q(r.author_role)}, ${qtstz(r.published_at)}, ${q(r.category)}, ${qarr(r.tags)}, ${q(r.status)}, ${r.featured}, ${qjson(r.seo)}`));
sqlParts.push('\n');
sqlParts.push(rows('template_categories', templateCategories, (r) =>
  `${q(r.slug)}, ${q(r.name)}, ${q(r.tagline)}, ${q(r.hero_description)}, ${q(r.image)}, ${q(r.seo_title)}, ${q(r.seo_description)}, ${q(r.og_image)}, ${r.active}, ${r.sort_order}`));
sqlParts.push('\n');
sqlParts.push(rows('templates', templates, (r) =>
  `${q(r.slug)}, ${q(r.name)}, ${q(r.category_slug)}, ${q(r.short_description)}, ${q(r.description)}, ${q(r.thumbnail)}, ${q(r.preview_image)}, ${q(r.demo_url)}, ${qarr(r.tags)}, ${r.featured}, ${q(r.status)}, ${r.sort_order}, ${qjson(r.seo)}`));
sqlParts.push('\n');

// settings — insert per-key
const settingRows = Object.entries(settings)
  .map(([k, v]) => `(${q(k)}, ${q(JSON.stringify(v))}::jsonb)`)
  .join(',\n');
sqlParts.push(`-- settings (defaults; never overwrites existing rows)\ninsert into public.settings (key, value)\nvalues\n${settingRows}\non conflict (key) do nothing;\n`);

const seedSql = sqlParts.join('\n');
mkdirSync(join(ROOT, 'supabase'), { recursive: true });
writeFileSync(join(ROOT, 'supabase/admin-seed.sql'), seedSql);

// ============================================================== JSON EMITTER
// NOTE: column order must match the SQL inserts above.
const withCols = (list, cols_) => list.map((r) => Object.fromEntries(cols_.map((c) => [c, r[c]])));

const seedJson = {
  generated_at: new Date().toISOString(),
  services: withCols(services, ['slug','number','title','subtitle','description','icon','category','technologies','deliverables','stat_label','stat_value','price_note','active','featured','sort_order','seo']),
  tools: withCols(tools, ['slug','name','category','description','icon','url','input_type','active','featured','popular','sort_order','seo']),
  ai_tools: withCols(aiTools, ['slug','name','category','description','icon','url','pricing','active','featured','sort_order','seo']),
  portfolio_projects: withCols(portfolio, ['slug','title','category','client','description','hero_image','gallery','technologies','challenge','solution','outcome','live_url','featured','published','sort_order','seo']),
  products: withCols(products, ['slug','name','category','description','image','price','currency','status','delivery_info','file_url','featured','sort_order','seo']),
  blog_posts: withCols(posts, ['slug','title','excerpt','content','cover_image','author_name','author_role','published_at','category','tags','status','featured','seo']),
  template_categories: withCols(templateCategories, ['slug','name','tagline','hero_description','image','seo_title','seo_description','og_image','active','sort_order']),
  templates: withCols(templates, ['slug','name','category_slug','short_description','description','thumbnail','preview_image','demo_url','tags','featured','status','sort_order','seo']),
  settings,
};

const apiDir = join(ROOT, '..', 'branify-admin-api');
mkdirSync(apiDir, { recursive: true });
writeFileSync(join(apiDir, 'seed.json'), JSON.stringify(seedJson, null, 2));

console.log(
  `Seed generated:\n` +
  `  supabase/admin-seed.sql (${services.length} services, ${tools.length} tools, ${aiTools.length} ai_tools, ${portfolio.length} portfolio, ${products.length} products, ${posts.length} posts, ${templateCategories.length} template_categories, ${templates.length} templates, ${Object.keys(settings).length} settings)\n` +
  `  mini-services/branify-admin-api/seed.json`
);
