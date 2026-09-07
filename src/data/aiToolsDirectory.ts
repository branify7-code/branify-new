/* =========================================================
   BRANIFY AI TOOLS DIRECTORY — full copy of branify.store
   26 hand-picked AI tools across 9 categories (1:1 live data).
   ---------------------------------------------------------
   Extended model (spec: AI TOOLS DISCOVERY + GUIDES):
   · slug/icon/featured/beginnerFriendly/guide are seeded here
     and OVERLAID by the admin DB rows through contentOverrides.
   · guide content comes from aiToolGuides.ts (seed) and can be
     replaced per tool from the admin editor (ai_tools.seo).
========================================================= */

import { aiToolGuides, type AIToolGuideContent } from './aiToolGuides';

export type { AIToolGuideContent };
export type { AIToolGuideStep, AIToolPrompt, AIToolUseCase, AIToolFaq } from './aiToolGuides';

/** Extended SEO/metadata document stored in ai_tools.seo (jsonb). */
export interface AIToolSeoDoc {
  /* standard fields (compatible with the shared admin SEO block) */
  title?: string;
  description?: string;
  keywords?: string[];
  og_image?: string;
  /* extended fields (admin editor) */
  focus_keyword?: string;
  secondary_keywords?: string[];
  canonical?: string;
  og_title?: string;
  og_description?: string;
  about?: string;
  best_for?: string[];
  use_cases?: Array<{ title: string; text: string }>;
  beginner_friendly?: boolean;
  tips?: string[];
  pros?: string[];
  limitations?: string[];
  guide_intro?: string;
  guide_steps?: Array<{ title: string; text: string; image?: string; caption?: string; alt?: string }>;
  prompts?: Array<{ title: string; category: string; content: string; sort?: number; active?: boolean }>;
  outputs?: Array<{ image?: string; caption?: string; alt?: string; prompt?: string; sort?: number }>;
  faqs?: Array<{ question: string; answer: string; sort?: number; active?: boolean }>;
}

export interface AIDirectoryTool {
  name: string;
  desc: string;
  category: string;
  pricing: 'Free' | 'Freemium' | 'Paid';
  url: string;
  /* extended (seeded at module init below) */
  slug: string;
  icon: string;
  featured: boolean;
  beginnerFriendly: boolean;
  sort: number;
  guide: AIToolGuideContent | null;
  seo: AIToolSeoDoc;
}

const SEED_NAME_TO_SLUG: Record<string, string> = {
  ChatGPT: 'chatgpt',
  Claude: 'claude',
  Gemini: 'gemini',
  Grok: 'grok',
  Jasper: 'jasper',
  'Copy.ai': 'copy-ai',
  Grammarly: 'grammarly',
  Midjourney: 'midjourney',
  'Leonardo.Ai': 'leonardo-ai',
  Ideogram: 'ideogram',
  'Adobe Firefly': 'adobe-firefly',
  Runway: 'runway',
  Synthesia: 'synthesia',
  Veo: 'veo',
  ElevenLabs: 'elevenlabs',
  'Murf AI': 'murf-ai',
  'GitHub Copilot': 'github-copilot',
  Cursor: 'cursor',
  Replit: 'replit',
  Lovable: 'lovable',
  Bolt: 'bolt',
  Perplexity: 'perplexity',
  NotebookLM: 'notebooklm',
  Gamma: 'gamma',
  Zapier: 'zapier',
  n8n: 'n8n',
};

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

type SeedTool = Pick<AIDirectoryTool, 'name' | 'desc' | 'category' | 'pricing' | 'url'>;

export const aiToolsDirectory: AIDirectoryTool[] = (
  [
  { name: 'ChatGPT', desc: 'General-purpose AI assistant for writing, coding, research, and images.', category: 'Chat Assistants', pricing: 'Freemium', url: 'https://chat.openai.com' },
  { name: 'Claude', desc: 'AI assistant strong at writing, coding, and reasoning-heavy tasks.', category: 'Chat Assistants', pricing: 'Freemium', url: 'https://claude.ai' },
  { name: 'Gemini', desc: "Google's AI assistant, integrated with Gmail, Docs, and Sheets.", category: 'Chat Assistants', pricing: 'Freemium', url: 'https://gemini.google.com' },
  { name: 'Grok', desc: 'AI chatbot with fact-checking and image/video generation.', category: 'Chat Assistants', pricing: 'Freemium', url: 'https://grok.com' },
  { name: 'Jasper', desc: 'AI writing assistant for marketing and long-form content.', category: 'Writing & Content', pricing: 'Paid', url: 'https://www.jasper.ai' },
  { name: 'Copy.ai', desc: 'AI copywriting tool for ads, emails, and product descriptions.', category: 'Writing & Content', pricing: 'Freemium', url: 'https://www.copy.ai' },
  { name: 'Grammarly', desc: 'AI-powered grammar, tone, and clarity checker.', category: 'Writing & Content', pricing: 'Freemium', url: 'https://www.grammarly.com' },
  { name: 'Midjourney', desc: 'AI image generator known for stylized, artistic visuals.', category: 'Image Generation', pricing: 'Paid', url: 'https://www.midjourney.com' },
  { name: 'Leonardo.Ai', desc: 'AI image generator with a generous free daily token tier.', category: 'Image Generation', pricing: 'Freemium', url: 'https://leonardo.ai' },
  { name: 'Ideogram', desc: 'AI image generator that renders text accurately inside images.', category: 'Image Generation', pricing: 'Freemium', url: 'https://ideogram.ai' },
  { name: 'Adobe Firefly', desc: "Adobe's generative AI for images and design assets.", category: 'Image Generation', pricing: 'Freemium', url: 'https://firefly.adobe.com' },
  { name: 'Runway', desc: 'AI video generation and editing platform.', category: 'Video Generation', pricing: 'Freemium', url: 'https://runwayml.com' },
  { name: 'Synthesia', desc: 'Creates business and training videos from text scripts.', category: 'Video Generation', pricing: 'Paid', url: 'https://www.synthesia.io' },
  { name: 'Veo', desc: "Google's AI video generator from text or image prompts.", category: 'Video Generation', pricing: 'Freemium', url: 'https://deepmind.google/technologies/veo/' },
  { name: 'ElevenLabs', desc: 'Realistic AI voice generation, cloning, and text-to-speech.', category: 'Voice & Audio', pricing: 'Freemium', url: 'https://elevenlabs.io' },
  { name: 'Murf AI', desc: 'AI voiceover generator for videos and presentations.', category: 'Voice & Audio', pricing: 'Freemium', url: 'https://murf.ai' },
  { name: 'GitHub Copilot', desc: 'AI pair programmer that suggests code as you type.', category: 'Coding', pricing: 'Paid', url: 'https://github.com/features/copilot' },
  { name: 'Cursor', desc: 'AI-first code editor that understands your whole codebase.', category: 'Coding', pricing: 'Freemium', url: 'https://www.cursor.com' },
  { name: 'Replit', desc: 'Browser-based AI coding environment with instant deployment.', category: 'Coding', pricing: 'Freemium', url: 'https://replit.com' },
  { name: 'Lovable', desc: 'Builds full web apps — frontend, backend, database — from prompts.', category: 'No-code Builders', pricing: 'Freemium', url: 'https://lovable.dev' },
  { name: 'Bolt', desc: 'Generates full-stack web apps from natural language in seconds.', category: 'No-code Builders', pricing: 'Freemium', url: 'https://bolt.new' },
  { name: 'Perplexity', desc: 'AI answer engine that cites sources for research queries.', category: 'Productivity & Research', pricing: 'Freemium', url: 'https://www.perplexity.ai' },
  { name: 'NotebookLM', desc: 'Answers questions grounded in your own uploaded documents.', category: 'Productivity & Research', pricing: 'Free', url: 'https://notebooklm.google' },
  { name: 'Gamma', desc: 'Turns notes and outlines into polished presentations.', category: 'Productivity & Research', pricing: 'Freemium', url: 'https://gamma.app' },
  { name: 'Zapier', desc: 'No-code AI workflow automation across thousands of apps.', category: 'Automation', pricing: 'Freemium', url: 'https://zapier.com' },
  { name: 'n8n', desc: 'Developer-friendly workflow automation with AI steps.', category: 'Automation', pricing: 'Freemium', url: 'https://n8n.io' },
] as SeedTool[]).map((t, i): AIDirectoryTool => {
  const slug = SEED_NAME_TO_SLUG[t.name] || slugify(t.name);
  return {
    ...t,
    slug,
    icon: '',
    featured: i < 6,
    beginnerFriendly: aiToolGuides[slug]?.beginnerFriendly ?? true,
    sort: i,
    guide: aiToolGuides[slug] || null,
    seo: {},
  };
});

export const aiToolCategories: string[] = ['All', ...Array.from(new Set(aiToolsDirectory.map((t) => t.category)))];

export default aiToolsDirectory;
