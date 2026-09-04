/* =========================================================
   BRANIFY AI TOOLS DIRECTORY — full copy of branify.store
   26 hand-picked AI tools across 9 categories (1:1 live data).
========================================================= */

export interface AIDirectoryTool {
  name: string;
  desc: string;
  category: string;
  pricing: 'Free' | 'Freemium' | 'Paid';
  url: string;
}

export const aiToolsDirectory: AIDirectoryTool[] = [
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
];

export const aiToolCategories: string[] = ['All', ...Array.from(new Set(aiToolsDirectory.map((t) => t.category)))];

export default aiToolsDirectory;
