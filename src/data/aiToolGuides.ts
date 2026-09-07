/* =========================================================
   BRANIFY — AI TOOL GUIDES (seed content)
   -----------------------------------------------------
   Beginner-friendly, factually conservative guide content
   for every tool in the /ai-tools directory.

   SOURCING RULES (project spec):
   · describes only well-known, publicly documented capabilities
   · NEVER states current prices, plan limits or model lists —
     pricing shown on cards comes from the admin DB and pages
     link to the official site for current pricing
   · no fake statistics, reviews, rankings or partnerships

   The admin panel stores overrides in ai_tools.seo (jsonb):
   when a DB row carries guide content it wins over this seed.
========================================================= */

/* AI tool guides — Voice & Audio + Coding + No-code Builders + Productivity + Automation */
import { aiToolGuidesBuild } from './aiToolGuides.build';
import { aiToolGuidesImage } from './aiToolGuides.media';
import { aiToolGuidesWork } from './aiToolGuides.work';

export interface AIToolGuideStep {
  title: string;
  text: string;
  image?: string;
  caption?: string;
  alt?: string;
}

export interface AIToolPrompt {
  title: string;
  category: string;
  content: string;
}

export interface AIToolUseCase {
  title: string;
  text: string;
}

export interface AIToolFaq {
  question: string;
  answer: string;
}

export interface AIToolGuideContent {
  about: string;
  bestFor: string[];
  useCases: AIToolUseCase[];
  beginnerFriendly: boolean;
  steps: AIToolGuideStep[];
  prompts: AIToolPrompt[];
  tips: string[];
  pros: string[];
  limitations: string[];
  faqs: AIToolFaq[];
}

const g = (tool: AIToolGuideContent): AIToolGuideContent => tool;

export const aiToolGuides: Record<string, AIToolGuideContent> = {
  /* ============================== CHAT ASSISTANTS ============================== */
  chatgpt: g({
    about:
      'ChatGPT is OpenAI\u2019s general-purpose AI assistant. You type a request in plain language and it answers, writes, summarizes, translates, brainstorms and helps with code. It runs in the browser and in mobile apps, and the free tier is enough for most first experiments — check the official website for current plan details.',
    bestFor: ['Everyday questions', 'Writing & rewriting', 'Summarizing documents', 'Brainstorming ideas', 'Coding help', 'Learning new topics'],
    useCases: [
      { title: 'Draft anything faster', text: 'Emails, blog outlines, product descriptions, job posts — describe the tone and audience and ChatGPT produces a first draft you can edit.' },
      { title: 'Understand long text', text: 'Paste an article, report or meeting note and ask for a summary, key action items or a simpler explanation.' },
      { title: 'Think through problems', text: 'Use it as a sounding board: ask for pros and cons, alternative angles, or a step-by-step plan before you decide.' },
      { title: 'Code and formulas', text: 'Ask for a snippet, a regex, an Excel formula or an explanation of an error message in plain English.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Open the official website', text: 'Go to chat.openai.com (or install the mobile app) and sign in, or create a free account.' },
      { title: 'Start a new chat', text: 'Click New chat. Nothing you type is shared with other users — each conversation is separate.' },
      { title: 'Describe what you want', text: 'Write your request in plain language. Add context: who it is for, the tone, the length, the format.' },
      { title: 'Read and refine', text: 'Read the answer, then reply with changes: “shorter”, “more formal”, “add examples”. Iterating is normal and expected.' },
      { title: 'Copy the result', text: 'Select the text you like and copy it into your document. Always review facts before publishing.' },
    ],
    prompts: [
      { title: 'Rewrite an email politely', category: 'Email', content: 'Rewrite this email so it sounds friendly but professional, and 30% shorter. Keep all key details:\n[paste your email]' },
      { title: 'Explain a topic simply', category: 'Learning', content: 'Explain [topic] to me as if I were a curious 12-year-old. Use one everyday analogy and finish with the 3 most important points.' },
      { title: 'Blog outline', category: 'Blog', content: 'Create an outline for a blog post titled “[title]”. Audience: [audience]. Include an intro hook, 5 H2 sections with 3 bullet points each, and a conclusion with a call to action.' },
      { title: 'Summarize into action items', category: 'Productivity', content: 'Summarize the text below in 5 bullet points, then list every action item with an owner if mentioned:\n[paste text]' },
    ],
    tips: [
      'Give context: role (“act as a marketing coach”), audience and desired format dramatically improve answers.',
      'Ask for variations: “give me 3 versions — formal, friendly, and bold” — then pick and refine.',
      'Double-check facts, numbers and citations. AI assistants can sound confident and still be wrong.',
    ],
    pros: ['Extremely versatile — one tool for writing, learning and code', 'Free tier available', 'Conversational follow-ups refine results quickly'],
    limitations: ['Can produce incorrect facts presented confidently', 'Knowledge has a training cutoff unless browsing is enabled', 'Long documents may exceed context limits on lower plans'],
    faqs: [
      { question: 'Is ChatGPT free?', answer: 'There is a free tier. Paid plans add faster models and extra features — check the official OpenAI website for current pricing and availability.' },
      { question: 'What can ChatGPT do?', answer: 'It answers questions, writes and rewrites text, summarizes and translates, brainstorms, explains concepts, writes code snippets and more — all from plain-language instructions.' },
      { question: 'How do beginners start?', answer: 'Create a free account, open a new chat, and describe what you want in one or two sentences. Then refine the result with short follow-up replies.' },
      { question: 'What should I include in a prompt?', answer: 'The task, the context (who it is for), the tone, the length and the format. Example: “Write a friendly 100-word product description for a ceramic mug, for an online store.”' },
    ],
  }),

  claude: g({
    about:
      'Claude is Anthropic\u2019s AI assistant, popular for thoughtful writing, careful analysis and coding help. It handles long documents well and is known for a measured, natural writing style. A free tier is available — see the official website for current plans.',
    bestFor: ['Long-document analysis', 'Careful writing & editing', 'Coding assistance', 'Document Q&A', 'Structured thinking'],
    useCases: [
      { title: 'Work with long documents', text: 'Paste reports, contracts or research papers and ask for summaries, risks, or answers grounded in the text.' },
      { title: 'Refine your writing', text: 'Ask Claude to tighten, restructure or change the tone of drafts while keeping your voice.' },
      { title: 'Code reviews and debugging', text: 'Share code and ask for bugs, improvements or a plain-English explanation of what it does.' },
      { title: 'Structured outputs', text: 'Ask for tables, JSON, checklists or step-by-step plans — Claude follows format instructions closely.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Open the official website', text: 'Go to claude.ai and sign in or create a free account.' },
      { title: 'Start a conversation', text: 'Click New chat. You can type a request or attach a document or image.' },
      { title: 'Give clear instructions', text: 'Say what you need, for whom, and in what format — for example “summarize in 5 bullets for a busy CEO”.' },
      { title: 'Iterate', text: 'Ask follow-up questions or request changes. Claude keeps the context of the conversation.' },
      { title: 'Verify and use', text: 'Copy the parts you need. As with any AI, verify important facts before you rely on them.' },
    ],
    prompts: [
      { title: 'Document brief', category: 'Business', content: 'Read the document below and produce: 1) a 5-sentence summary, 2) the 3 biggest risks, 3) any deadlines mentioned as a list.\n[paste document]' },
      { title: 'Improve this paragraph', category: 'Writing', content: 'Improve the paragraph below for clarity and flow. Keep my voice, do not add new claims, and explain in one line what you changed.\n[paste paragraph]' },
      { title: 'Explain this code', category: 'Coding', content: 'Explain what this code does step by step in plain English, then list any bugs or edge cases you notice:\n[paste code]' },
    ],
    tips: [
      'Claude follows format instructions well — request markdown tables, numbered lists or JSON explicitly.',
      'For long documents, put your instruction first, then the text, so nothing gets lost.',
      'Ask “what would you need to know to do this better?” when results feel off.',
    ],
    pros: ['Strong long-document handling', 'Careful, natural writing style', 'Free tier available'],
    limitations: ['Image generation and some multimedia features are not the focus', 'Still requires fact-checking for critical claims'],
    faqs: [
      { question: 'Is Claude free?', answer: 'A free tier is available. Paid plans offer higher usage limits and priority access — check the official Anthropic website for current details.' },
      { question: 'What is Claude best at?', answer: 'Thoughtful writing, editing, analyzing long documents, and coding tasks. It is especially good at following detailed formatting instructions.' },
      { question: 'Can Claude read files?', answer: 'Yes — you can attach documents such as PDFs or text files and ask questions about their content.' },
      { question: 'How is it different from other chatbots?', answer: 'Claude is known for a measured writing style and strong long-context handling. The best way to decide is to try the same prompt in two tools and compare.' },
    ],
  }),

  gemini: g({
    about:
      'Gemini is Google\u2019s AI assistant. It answers questions, writes and summarizes text, works with images, and is integrated into Google services like Gmail, Docs and Sheets. The web app is free to use — check the official website for current capabilities and plans.',
    bestFor: ['Google Workspace users', 'Research with sources', 'Writing in Gmail/Docs', 'Image understanding', 'Everyday questions'],
    useCases: [
      { title: 'Write inside Google apps', text: 'Draft and polish emails in Gmail and documents in Docs with Gemini\u2019s help where the integration is available.' },
      { title: 'Ask about the world', text: 'Ask questions that benefit from current information and Google-quality search grounding.' },
      { title: 'Analyze images', text: 'Upload a photo or screenshot and ask what it shows, or get help interpreting charts and diagrams.' },
      { title: 'Plan and organize', text: 'Trip plans, schedules, comparison tables — Gemini formats plans clearly and can export ideas into Google files.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Open Gemini', text: 'Go to gemini.google.com and sign in with your Google account.' },
      { title: 'Type your request', text: 'Ask in plain language — the same way you would ask a colleague.' },
      { title: 'Add files or images', text: 'Use the upload option to ask questions about images or documents where supported.' },
      { title: 'Refine the answer', text: 'Ask for a different tone, length or format. Use “Google it” style follow-ups for current info where offered.' },
      { title: 'Export where useful', text: 'Move drafts into Gmail or Docs to keep working in the tools you already use.' },
    ],
    prompts: [
      { title: 'Trip plan', category: 'Planning', content: 'Plan a 3-day weekend in [city] for someone who loves food and walking tours. Include a per-day schedule with morning, afternoon and evening, plus local transport tips.' },
      { title: 'Email from bullets', category: 'Email', content: 'Turn these bullet points into a short, polite professional email:\n- [point 1]\n- [point 2]\n- [point 3]' },
      { title: 'Compare options', category: 'Research', content: 'Compare [option A] and [option B] in a simple table: price range, best for, main drawback. Add a one-line recommendation for a small business.' },
    ],
    tips: [
      'Sign in with the Google account you use for Gmail/Docs so the integrations are available.',
      'For current events, ask Gemini to search the web rather than relying on memory.',
      'Ask for tables and lists — Gemini formats structured answers cleanly.',
    ],
    pros: ['Deep Google Workspace integration', 'Free to start', 'Strong image understanding'],
    limitations: ['Best features depend on your Google account and region', 'Availability of advanced models varies by plan'],
    faqs: [
      { question: 'Is Gemini free?', answer: 'The standard web app is free with a Google account. Advanced versions are part of paid Google plans — check the official website for current details.' },
      { question: 'What can Gemini do?', answer: 'Answer questions, write and summarize text, work with images, help plan, and assist inside Gmail, Docs and Sheets where integrations are available.' },
      { question: 'How do beginners start?', answer: 'Sign in at gemini.google.com and ask one simple question. Then try uploading a photo or asking for a plan to see structured answers.' },
      { question: 'Does Gemini work with Gmail?', answer: 'Yes — where available, Gemini can help draft and refine emails directly in Gmail and text in Docs.' },
    ],
  }),

  grok: g({
    about:
      'Grok is xAI\u2019s AI chatbot. It answers questions, generates images, and is known for a direct, less formal tone. Access is tied to X (Twitter) and x.ai accounts — check the official website for current availability and plans.',
    bestFor: ['Current-events chat', 'Direct, casual answers', 'Image generation', 'X (Twitter) users'],
    useCases: [
      { title: 'Ask about recent events', text: 'Grok can lean on X posts and web data for questions about what is happening now, where available.' },
      { title: 'Casual brainstorming', text: 'Its informal tone suits quick ideas, names, jokes and social-media copy.' },
      { title: 'Generate images', text: 'Describe a scene and Grok creates an image, useful for quick social visuals.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Open Grok', text: 'Go to grok.com or open Grok inside the X app.' },
      { title: 'Sign in', text: 'Use your X or x.ai account, following the on-screen steps.' },
      { title: 'Ask your question', text: 'Type your request in normal language — no special commands needed.' },
      { title: 'Try an image', text: 'Ask “create an image of …” to test the image-generation workflow.' },
      { title: 'Refine', text: 'Reply with changes — shorter, funnier, more serious — until it fits.' },
    ],
    prompts: [
      { title: 'Social hook', category: 'Social Media', content: 'Write 5 scroll-stopping opening lines for a post about [topic]. Keep them under 12 words each and honest — no clickbait claims.' },
      { title: 'Quick explain', category: 'Learning', content: 'What is [topic]? Explain in 3 short paragraphs with zero jargon, then give one practical takeaway.' },
    ],
    tips: [
      'Specify the tone you want — Grok adapts easily between playful and formal.',
      'For image requests, describe style, subject and mood in one sentence.',
      'As with every AI, verify important claims before sharing them.',
    ],
    pros: ['Direct, conversational tone', 'Image generation built in', 'Strong fit if you already use X'],
    limitations: ['Requires X/x.ai account access', 'Feature availability varies by plan and region'],
    faqs: [
      { question: 'Is Grok free?', answer: 'Access options have changed over time and depend on X/x.ai plans — check the official website for current availability.' },
      { question: 'What can Grok create?', answer: 'Text answers, ideas and social copy, plus AI-generated images from text descriptions.' },
      { question: 'How do beginners start?', answer: 'Sign in at grok.com or in the X app and ask one simple question, then try an image prompt.' },
    ],
  }),

  /* ============================== WRITING & CONTENT ============================== */
  jasper: g({
    about:
      'Jasper is an AI writing platform built for marketing teams: brand-voice controls, campaign templates, and collaboration features for producing blog posts, ads, emails and social content at scale. It is a paid product aimed at businesses — check the official website for current pricing.',
    bestFor: ['Marketing teams', 'Brand-consistent content', 'Campaign copy', 'Scaling blog production'],
    useCases: [
      { title: 'Campaign copy in one voice', text: 'Define your brand voice once, then generate ads, emails and posts that stay consistent across channels.' },
      { title: 'Long-form blog drafts', text: 'Go from outline to a structured first draft with section-by-section generation.' },
      { title: 'Repurposing', text: 'Turn one webinar or article into social posts, email snippets and ad variants.' },
    ],
    beginnerFriendly: false,
    steps: [
      { title: 'Start a trial', text: 'Create an account on jasper.ai — Jasper is a paid product, so start from the plan that matches your team size.' },
      { title: 'Set up brand voice', text: 'Paste examples of your writing or your website so Jasper learns your tone and style rules.' },
      { title: 'Pick a template', text: 'Choose a workflow — blog post, product description, ad campaign — instead of a blank page.' },
      { title: 'Generate and edit', text: ' Produce drafts section by section, editing as you go. Treat output as a first draft, not a final piece.' },
      { title: 'Review facts and publish', text: 'Verify claims, add your expertise and images, then publish through your normal channels.' },
    ],
    prompts: [
      { title: 'Product description', category: 'Product Description', content: 'Write a 120-word product description for [product]. Audience: [audience]. Tone: confident, concrete, zero hype words. End with one short benefit-led call to action.' },
      { title: 'Ad variants', category: 'Marketing', content: 'Give me 5 Google ad headlines (max 30 characters) and 2 descriptions (max 90 characters) for [offer]. Focus on the outcome, not the feature.' },
    ],
    tips: [
      'Invest time in the brand-voice setup — everything downstream gets better.',
      'Use campaigns to keep messaging consistent instead of one-off generations.',
      'Always fact-check statistics; AI drafts are not research.',
    ],
    pros: ['Brand-voice consistency across content', 'Marketing-specific templates and workflows', 'Team collaboration features'],
    limitations: ['Paid-only, priced for teams', 'Output still needs human editing and fact-checking'],
    faqs: [
      { question: 'Is Jasper free?', answer: 'Jasper is a paid product; trial availability changes — check the official jasper.ai website for current pricing and plans.' },
      { question: 'What is Jasper used for?', answer: 'Marketing content at scale: blog drafts, ads, emails, product descriptions and social posts, all tuned to a defined brand voice.' },
      { question: 'How do beginners start?', answer: 'Start with one template (e.g. product description), set up your brand voice, and generate a first draft you edit by hand.' },
      { question: 'Do I need a marketing background?', answer: 'No, but clear briefs help. Know your audience and the outcome you want before generating.' },
    ],
  }),

  'copy-ai': g({
    about:
      'Copy.ai is an AI copywriting tool focused on marketing text: ads, emails, product descriptions and social posts. It offers templates for common formats plus workflow features, with a free tier to test — check the official website for current limits.',
    bestFor: ['Ad copy', 'Cold emails', 'Product descriptions', 'Social captions', 'Small marketing teams'],
    useCases: [
      { title: 'Sales emails that get replies', text: 'Generate personalized cold-email drafts and follow-up sequences you can edit and send.' },
      { title: 'Product descriptions at scale', text: 'Turn a feature list into benefit-led descriptions for dozens of products.' },
      { title: 'Ad and social variants', text: 'Produce multiple hooks and captions per campaign and A/B test the winners.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Create a free account', text: 'Sign up at copy.ai and confirm your email.' },
      { title: 'Describe your business once', text: 'Fill in what you sell and who you sell to — templates use this context.' },
      { title: 'Choose a template', text: 'Pick the format you need (email, ad, product description) from the template library.' },
      { title: 'Generate and tighten', text: 'Generate several variants, keep the best lines and edit for accuracy and brand tone.' },
    ],
    prompts: [
      { title: 'Cold email', category: 'Email', content: 'Write a 90-word cold email to [role] at a [industry] company. Open with their problem, not our product. One line of proof, one soft call to action. No buzzwords.' },
      { title: 'Product description', category: 'Product Description', content: 'Turn these features into a 100-word description that leads with benefits for [audience]:\n- [feature 1]\n- [feature 2]' },
    ],
    tips: [
      'Fill in the business-context fields properly — generic input gives generic copy.',
      'Generate 3–5 variants and mix the best lines instead of accepting the first.',
      'Edit claims and numbers yourself; the tool does not verify them.',
    ],
    pros: ['Free tier to test', 'Fast template-driven workflow', 'Good for short marketing formats'],
    limitations: ['Long-form content needs heavy editing', 'Brand voice is simpler than team-focused platforms'],
    faqs: [
      { question: 'Is Copy.ai free?', answer: 'There is a free tier with usage limits. Paid plans add more credits and features — check the official website for current details.' },
      { question: 'What can Copy.ai write?', answer: 'Short marketing copy: ads, emails, product descriptions, social captions and similar formats, from built-in templates.' },
      { question: 'How do beginners start?', answer: 'Sign up free, describe your business, and run one template end-to-end — for example a product description — before exploring workflows.' },
    ],
  }),

  grammarly: g({
    about:
      'Grammarly is an AI-powered writing assistant that checks grammar, spelling, punctuation, tone and clarity as you type. It works in the browser, as a desktop app, and inside Gmail, Docs and Word. A free plan covers the essentials — check the official website for current features.',
    bestFor: ['Error-free writing', 'Tone adjustment', 'Non-native English writers', 'Professional emails'],
    useCases: [
      { title: 'Fix mistakes instantly', text: 'Grammar, spelling and punctuation issues are underlined with one-click fixes everywhere you write.' },
      { title: 'Adjust tone', text: 'See how a message reads (confident, friendly, urgent) and rewrite sentences that miss the mark.' },
      { title: 'Shorten and clarify', text: 'Cut wordy sentences and jargon so your point lands faster.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Create a free account', text: 'Sign up at grammarly.com and install the browser extension or desktop app.' },
      { title: 'Write anywhere', text: 'Compose an email or document as usual — suggestions appear inline automatically.' },
      { title: 'Accept fixes one by one', text: 'Review each card: correctness fixes first, then clarity and tone. Accept what helps, ignore the rest.' },
      { title: 'Check the overall tone', text: 'Open the tone detector before sending important messages and adjust if it reads wrong.' },
    ],
    prompts: [
      { title: 'Full rewrite check', category: 'Email', content: 'Paste your draft into Grammarly\u2019s editor and ask: “Make this email more concise and confident without changing the meaning.”' },
    ],
    tips: [
      'Read the explanation on each suggestion — you\u2019ll write better without the tool over time.',
      'Set your audience and formality level in goals so suggestions fit the context.',
      'Don\u2019t accept every suggestion blindly; style suggestions are opinions.',
    ],
    pros: ['Works everywhere you write', 'Great for non-native speakers', 'Free plan covers corrections'],
    limitations: ['Advanced rewrites require a paid plan', 'Suggestions can flatten creative or stylistic writing'],
    faqs: [
      { question: 'Is Grammarly free?', answer: 'Yes, a free plan covers grammar, spelling and punctuation. Premium adds clarity, tone and rewrite features — check the official site for current plans.' },
      { question: 'Does Grammarly work in Gmail?', answer: 'Yes — the browser extension underlines and fixes text directly inside Gmail, Docs and most web editors.' },
      { question: 'Will it work for my language?', answer: 'Grammarly focuses on English writing. It is especially popular with non-native English speakers.' },
      { question: 'Can it change my tone?', answer: 'It flags how text may come across and offers rewrites for tone — for example making a message sound more confident or less blunt.' },
    ],
  }),

  ...aiToolGuidesImage,
  ...aiToolGuidesBuild,
  ...aiToolGuidesWork,
};

export const AI_TOOL_GUIDE_COUNT = Object.keys(aiToolGuides).length;
