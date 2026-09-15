/* =========================================================
   BRANIFY — AI TOOL GUIDE (BRANIFY-owned tool)
   -----------------------------------------------------
   Seed guide content for the "Free AI Prompt Generator"
   (/ai-tools/free-ai-prompt-generator). BRANIFY-owned free
   utility — factually conservative, no invented stats.
   The admin ai_tools.seo (jsonb) overrides this seed.
========================================================= */
import type { AIToolGuideContent } from './aiToolGuides';

const g = (tool: AIToolGuideContent): AIToolGuideContent => tool;

export const aiToolGuidesBranify: Record<string, AIToolGuideContent> = {
  'free-ai-prompt-generator': g({
    about:
      'Free AI Prompt Generator is BRANIFY\'s own free tool that turns a simple, plain-language idea into a ready-to-use prompt for AI tools like ChatGPT, Claude, Gemini, Midjourney, Leonardo.Ai, Cursor and more. You pick what you want to create (an image, a blog post, a social campaign, code, a website...), describe your idea in everyday words, and the tool writes a well-structured prompt with the right context, goal, audience, tone and output format baked in. No prompt-engineering experience needed.',
    bestFor: [
      'Beginners who are new to AI and not sure what to type',
      'Small business owners creating marketing content',
      'Creators writing image, video or social media prompts',
      'Developers asking AI tools for complete, runnable code',
    ],
    useCases: [
      { title: 'Image prompts', text: 'Describe a visual idea and get a prompt with subject, style, lighting, composition and aspect ratio for image AI tools.' },
      { title: 'Writing & blogs', text: 'Turn a topic into a structured writing prompt with audience, tone, length and key points.' },
      { title: 'Social media', text: 'Get platform-ready prompts for hooks, captions, calls to action and hashtag suggestions.' },
      { title: 'Marketing copy', text: 'Prompts that cover the offer, audience, benefit, pain point and CTA for campaigns and ads.' },
      { title: 'Coding help', text: 'Prompts that state the stack, requirements, constraints and edge cases so AI tools return usable code.' },
      { title: 'Website briefs', text: 'Describe a business and get a prompt covering pages, features, style and conversion goals.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Choose what you want to create', text: 'Pick a category — Image, Blog & Writing, Social Media, Marketing, Business, Video, Coding, Website or Research.' },
      { title: 'Describe your idea', text: 'Write one or two everyday sentences, like "I want a luxury restaurant Instagram post". No special wording needed.' },
      { title: 'Choose optional tone & detail', text: 'Pick a tone (Professional, Creative, Friendly, Persuasive, Minimal) and a detail level (Simple, Detailed, Expert) — or leave the defaults.' },
      { title: 'Generate your prompt', text: 'Press Generate Prompt. BRANIFY writes a complete, structured prompt you can read and copy in seconds.' },
      { title: 'Copy and use it', text: 'Copy the prompt and paste it into your preferred AI tool — ChatGPT, Claude, Gemini, Midjourney, Cursor and others.' },
    ],
    prompts: [
      { title: 'Premium restaurant Instagram campaign', category: 'Social Media', content: 'Act as a social media creative director. Create a 3-post Instagram campaign for a premium fine-dining restaurant launching a weekend tasting menu. Audience: affluent food lovers aged 25–45. For each post give: a hook, a caption (max 40 words), a visual direction (lighting, styling, mood) and 5 relevant hashtags. Tone: elegant, warm, exclusive. End with one story idea with a poll CTA.' },
      { title: 'Realistic product photography prompt', category: 'Image', content: 'Create an image-generation prompt for a realistic product photo of a matte-black wireless earbuds case on a wet slate surface. Include: subject framing (macro, centered), lighting (soft directional studio light with one warm rim light), environment (dark minimalist with subtle reflections), camera look (85mm, f/2.8, shallow depth of field) and aspect ratio 4:5. Style: premium commercial photography, no text in image.' },
      { title: 'Professional homepage hero section', category: 'Writing', content: 'Write the hero section for a boutique interior-design studio homepage. Audience: homeowners planning a renovation. Include: headline (max 8 words), subheadline (max 25 words) with the main benefit, one primary CTA button label and one trust microcopy line. Tone: confident, refined, no clichés. Provide 3 variations.' },
      { title: 'React landing page request', category: 'Coding', content: 'Act as a senior React developer. Build a responsive landing page component in React + Tailwind CSS for a SaaS analytics product. Requirements: sticky header, hero with headline + email capture form, 3 feature cards, pricing teaser, footer. Constraints: TypeScript, accessibility (labels, focus states), mobile-first, no external UI libraries. Output: complete runnable code with brief usage notes, plus 2 edge cases to handle (empty form submit, long headlines).' },
      { title: 'Small-business blog outline', category: 'Writing', content: 'Create a blog outline for a small bakery\'s website on the topic "how to choose a wedding cake". Audience: engaged couples planning on a mid-range budget. Structure: SEO-friendly title, meta description (max 155 characters), 5 H2 sections with 2–3 bullet points each, and a closing CTA for a free tasting appointment. Tone: friendly, expert, local.' },
    ],
    tips: [
      'Mention the "who" and the "why" — audience and goal improve any prompt instantly.',
      'One idea per prompt. Split big projects into several focused prompts.',
      'Add a constraint you care about (length, platform, budget, style) — constraints sharpen output.',
      'Use Detail level "Simple" for quick drafts and "Expert" when you need production-ready results.',
      'If the first result is off, rephrase the idea with one more specific detail and generate again.',
    ],
    pros: [
      'Free to use, no sign-up required for the daily free generations',
      'Built for beginners — plain-language ideas in, structured prompts out',
      'Task-aware: image, writing, social, marketing, business, video, coding, website and research prompts each follow the right structure',
      'Works alongside any AI tool — the output is plain text you can paste anywhere',
    ],
    limitations: [
      'Free generations are limited per visitor per day (fair-use protection)',
      'The tool writes the prompt; the final output quality depends on the AI tool you paste it into',
      'Very niche or technical domains may still need manual tuning of the generated prompt',
    ],
    faqs: [
      { question: 'Is the Free AI Prompt Generator really free?', answer: 'Yes. Every visitor gets free generations every day — no sign-up or card required. A daily fair-use limit keeps the tool free for everyone.' },
      { question: 'Do I need to know prompt engineering?', answer: 'No. That is the whole point. Describe your idea in simple words — for example "I want a luxury restaurant Instagram post" — and BRANIFY turns it into a well-structured prompt.' },
      { question: 'Which AI tools can I use the generated prompt with?', answer: 'Any tool that accepts text prompts: ChatGPT, Claude, Gemini, Midjourney, Leonardo.Ai, Ideogram, Cursor, GitHub Copilot, Replit and others in the BRANIFY AI Tools directory.' },
      { question: 'How many free prompts do I get?', answer: 'You get several free generations per day per visitor. The tool shows your remaining free generations, and the counter resets the next day.' },
      { question: 'What categories does it support?', answer: 'Image, Blog & Writing, Social Media, Marketing, Business, Video, Coding, Website and Research. Each category shapes the prompt structure — an image prompt includes style, lighting and aspect ratio, while a coding prompt includes stack, requirements and edge cases.' },
      { question: 'Does BRANIFY publish or share my prompts?', answer: 'No. Your idea text is processed to generate your prompt and is not published anywhere. Only anonymous, hashed abuse-prevention counters are kept to protect the free tier.' },
    ],
  }),
};
