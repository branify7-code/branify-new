/* =========================================================
   BRANIFY — AI Tools public data layer
   -----------------------------------------------------
   Single source of truth = aiToolsDirectory entries, which
   contentOverrides overlays with the admin ai_tools DB rows
   (name/desc/pricing/url/icon/featured/sort + extended seo
   document). Guide seed content lives in aiToolGuides.
   Nothing here invents data — everything reads stored fields.
========================================================= */
import { aiToolsDirectory, aiToolCategories, type AIDirectoryTool } from '../data/aiToolsDirectory';
import type { AIToolPrompt } from '../data/aiToolGuides';

export { aiToolCategories };
export type { AIDirectoryTool };

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** All active tools in admin sort order. */
export function getAllAiTools(): AIDirectoryTool[] {
  return [...aiToolsDirectory].sort((a, b) => a.sort - b.sort);
}

export function getAiToolBySlug(slug: string): AIDirectoryTool | undefined {
  const s = slug.toLowerCase();
  return aiToolsDirectory.find((t) => t.slug === s || slugify(t.name) === s);
}

export function getFeaturedAiTools(limit = 6): AIDirectoryTool[] {
  const featured = getAllAiTools().filter((t) => t.featured);
  return (featured.length ? featured : getAllAiTools()).slice(0, limit);
}

/** Related tools: same category first, then same pricing tier. Never returns the tool itself. */
export function getRelatedAiTools(tool: AIDirectoryTool, limit = 3): AIDirectoryTool[] {
  const others = getAllAiTools().filter((t) => t.slug !== tool.slug);
  const sameCategory = others.filter((t) => t.category === tool.category);
  const sameTier = others.filter((t) => t.category !== tool.category && t.pricing === tool.pricing);
  return [...sameCategory, ...sameTier].slice(0, limit);
}

/* ---------------------------------------------------------
   Search — tool name, category, use case, tags/capability,
   beginner keywords. Pure client-side over stored text.
--------------------------------------------------------- */
export function searchAiTools(query: string, tools?: AIDirectoryTool[]): AIDirectoryTool[] {
  const q = query.trim().toLowerCase();
  const pool = tools || getAllAiTools();
  if (!q) return pool;
  return pool.filter((t) => {
    const haystack = [
      t.name,
      t.category,
      t.desc,
      t.guide?.about || '',
      ...(t.guide?.bestFor || []),
      ...(t.guide?.useCases || []).map((u) => `${u.title} ${u.text}`),
      ...(t.guide?.prompts || []).map((p) => `${p.title} ${p.category}`),
      ...Object.keys(t.seo || {}),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

/* ---------------------------------------------------------
   Task finder — "What do you want to do?"
   Only tools whose stored category / use-case data supports
   the task are recommended (no unsupported suggestions).
--------------------------------------------------------- */
export interface FinderTask {
  id: string;
  label: string;
  emoji: string;
  blurb: string;
  categories: string[];
  keywords: string[];
}

export const FINDER_TASKS: FinderTask[] = [
  { id: 'images', label: 'Create Images', emoji: '🎨', blurb: 'Generate art, product shots and graphics from a description.', categories: ['Image Generation'], keywords: [] },
  { id: 'write', label: 'Write Content', emoji: '✍️', blurb: 'Draft posts, emails and copy in minutes.', categories: ['Writing & Content', 'Chat Assistants'], keywords: [] },
  { id: 'videos', label: 'Generate Videos', emoji: '🎬', blurb: 'Turn text ideas into short video clips.', categories: ['Video Generation'], keywords: [] },
  { id: 'voice', label: 'Create Voice', emoji: '🎙️', blurb: 'Realistic narration and voiceovers from text.', categories: ['Voice & Audio'], keywords: [] },
  { id: 'code', label: 'Code', emoji: '💻', blurb: 'Write, fix and understand code faster.', categories: ['Coding'], keywords: [] },
  { id: 'research', label: 'Research', emoji: '🔎', blurb: 'Find answers with sources you can verify.', categories: ['Productivity & Research'], keywords: ['research', 'sources', 'answer engine'] },
  { id: 'present', label: 'Create Presentations', emoji: '📊', blurb: 'Turn notes into polished slide decks.', categories: [], keywords: ['presentation', 'presentations', 'slides', 'deck'] },
  { id: 'automate', label: 'Automate Work', emoji: '⚙️', blurb: 'Connect apps so busywork runs itself.', categories: ['Automation'], keywords: ['automation', 'workflow'] },
  { id: 'websites', label: 'Build Websites', emoji: '🌐', blurb: 'Describe a site or app and get a working version.', categories: ['No-code Builders'], keywords: ['web app', 'website', 'landing page', 'apps from prompts'] },
];

export function getToolsForTask(task: FinderTask): AIDirectoryTool[] {
  const kw = task.keywords.map((k) => k.toLowerCase());
  return getAllAiTools().filter((t) => {
    if (task.categories.includes(t.category)) return true;
    if (!kw.length) return false;
    const text = [
      ...(t.guide?.bestFor || []),
      ...(t.guide?.useCases || []).map((u) => `${u.title} ${u.text}`),
      t.desc,
    ]
      .join(' ')
      .toLowerCase();
    return kw.some((k) => text.includes(k));
  });
}

/* ---------------------------------------------------------
   Beginner flow ("New to AI?") — 6 simple outputs.
--------------------------------------------------------- */
export interface BeginnerOption {
  id: string;
  label: string;
  emoji: string;
  taskId: string;
}

export const BEGINNER_OPTIONS: BeginnerOption[] = [
  { id: 'b-image', label: 'Image', emoji: '🎨', taskId: 'images' },
  { id: 'b-video', label: 'Video', emoji: '🎬', taskId: 'videos' },
  { id: 'b-text', label: 'Text', emoji: '✍️', taskId: 'write' },
  { id: 'b-voice', label: 'Voice', emoji: '🎙️', taskId: 'voice' },
  { id: 'b-website', label: 'Website', emoji: '🌐', taskId: 'websites' },
  { id: 'b-code', label: 'Code', emoji: '💻', taskId: 'code' },
];

/* ---------------------------------------------------------
   Filters — pricing & beginner flags come from stored data
   only (no invented classifications).
--------------------------------------------------------- */
export type PricingFilter = 'All' | 'Free' | 'Freemium' | 'Paid' | 'Beginner Friendly';

export function filterAiTools(tools: AIDirectoryTool[], pricing: PricingFilter): AIDirectoryTool[] {
  if (pricing === 'All') return tools;
  if (pricing === 'Beginner Friendly') return tools.filter((t) => t.beginnerFriendly);
  return tools.filter((t) => t.pricing === pricing);
}

/* ---------------------------------------------------------
   Comparison — only stored, visible fields.
--------------------------------------------------------- */
export interface ComparisonRow {
  label: string;
  value: (t: AIDirectoryTool) => string;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  { label: 'Category', value: (t) => t.category },
  { label: 'Pricing', value: (t) => `${t.pricing} — check the official site for current plans` },
  { label: 'Beginner friendly', value: (t) => (t.beginnerFriendly ? 'Yes — good first tool' : 'Some learning curve') },
  { label: 'Best for', value: (t) => (t.guide?.bestFor || []).slice(0, 4).join(', ') || t.desc },
  { label: 'Main capability', value: (t) => t.guide?.useCases?.[0]?.title || t.desc.split('.')[0] },
];

/* ---------------------------------------------------------
   Prompt grouping for the detail page.
--------------------------------------------------------- */
export function groupPromptsByCategory(prompts: AIToolPrompt[]): Array<{ category: string; prompts: AIToolPrompt[] }> {
  const map = new Map<string, AIToolPrompt[]>();
  for (const p of prompts) {
    const cat = p.category || 'Prompts';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(p);
  }
  return [...map.entries()].map(([category, list]) => ({ category, prompts: list }));
}

/** Full detail-page SEO for a tool — admin seo doc first, honest generated fallback. */
export function getToolSeo(tool: AIDirectoryTool): { title: string; description: string; canonical?: string; ogTitle?: string; ogDescription?: string; ogImage?: string; focusKeyword?: string } {
  const seo = tool.seo || {};
  const title = seo.title || `${tool.name} — ${tool.category} AI Tool Guide | BRANIFY`;
  const description =
    seo.description ||
    `${tool.desc} Learn what ${tool.name} does, who it is best for, and how beginners can start — with a step-by-step guide, example prompts and FAQs from BRANIFY.`;
  return {
    title,
    description,
    canonical: seo.canonical || undefined,
    ogTitle: seo.og_title || title,
    ogDescription: seo.og_description || description,
    ogImage: seo.og_image || undefined,
    focusKeyword: seo.focus_keyword || undefined,
  };
}
