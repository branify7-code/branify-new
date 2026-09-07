/* AI tool guides — Productivity & Research + Automation (see aiToolGuides.ts for types & rules) */
import type { AIToolGuideContent } from './aiToolGuides';

const g = (t: AIToolGuideContent): AIToolGuideContent => t;

export const aiToolGuidesWork: Record<string, AIToolGuideContent> = {
  /* ============================== PRODUCTIVITY & RESEARCH ============================== */
  perplexity: g({
    about:
      'Perplexity is an AI answer engine: ask a question and it searches the web, then answers with cited sources you can verify. It suits research, comparisons and fact-finding better than a plain chatbot. A free tier is available — check the official website for current limits.',
    bestFor: ['Research with sources', 'Fact-checking', 'Comparisons', 'Market and topic scans'],
    useCases: [
      { title: 'Answered questions with receipts', text: 'Every claim links to its source, so you can verify before you trust or cite.' },
      { title: 'Fast topic briefings', text: '“What is the current state of X?” produces a structured overview with recent sources.' },
      { title: 'Side-by-side comparisons', text: 'Compare tools, products or options in a table with links to the underlying pages.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Open Perplexity', text: 'Go to perplexity.ai — no account needed to start, though a free account saves history.' },
      { title: 'Ask a real question', text: 'Phrase it as you would to a research assistant: specific, with context if needed.' },
      { title: 'Check the sources', text: 'Click the numbered citations to confirm the answer reflects what the sources actually say.' },
      { title: 'Refine or go deeper', text: 'Ask follow-ups in the same thread, or switch to a focused mode (academic, discussions) where available.' },
    ],
    prompts: [
      { title: 'Market scan', category: 'Research', content: 'What are the 5 most significant recent developments in [industry]? Summarize each in two lines and cite sources with dates.' },
      { title: 'Comparison brief', category: 'Research', content: 'Compare [tool A] and [tool B] for a small business: pricing model, main strengths, common complaints. Use recent sources and link them.' },
    ],
    tips: [
      'Treat it as a research assistant, not an oracle — the citations are the product.',
      'Add a timeframe (“in the last 12 months”) for anything fast-moving.',
      'For important decisions, open the two most authoritative sources and read them directly.',
    ],
    pros: ['Answers with verifiable citations', 'Free to start', 'Excellent for research workflows'],
    limitations: ['Answer quality depends on available sources', 'Deep analysis still needs human judgment'],
    faqs: [
      { question: 'Is Perplexity free?', answer: 'Yes, a free tier is available; Pro plans add more powerful models and higher limits — check the official site for current details.' },
      { question: 'What makes Perplexity different?', answer: 'It searches the web and answers with numbered citations, so you can verify every claim.' },
      { question: 'How do beginners start?', answer: 'Ask one real question you care about, click two citations, and compare the answer to the sources — that habit is the whole skill.' },
    ],
  }),

  notebooklm: g({
    about:
      'NotebookLM is Google\u2019s AI research notebook: upload your own documents (PDFs, Docs, websites, videos) and it answers questions grounded strictly in those sources, with citations back to the exact passage. It also generates study guides and audio overviews. Free with a Google account — check the official website for current details.',
    bestFor: ['Studying your own documents', 'Research synthesis', 'Meeting/report Q&A', 'Audio overviews'],
    useCases: [
      { title: 'Grounded document Q&A', text: 'Answers come from your uploads with citations — not from the model\u2019s general memory.' },
      { title: 'Study material generation', text: 'Turn course packs or reports into study guides, briefs and FAQs automatically.' },
      { title: 'Audio overviews', text: 'Generate a podcast-style discussion of your sources for learning on the go.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Open NotebookLM', text: 'Go to notebooklm.google and sign in with your Google account.' },
      { title: 'Create a notebook', text: 'Make one notebook per project (a course, a client, a research topic).' },
      { title: 'Add your sources', text: 'Upload PDFs, paste text, or link websites and videos you want it grounded in.' },
      { title: 'Ask questions', text: 'Ask about your sources only — every answer cites the exact passage it came from.' },
      { title: 'Generate outputs', text: 'Request a study guide, briefing doc or audio overview when you need a digest.' },
    ],
    prompts: [
      { title: 'Report brief', category: 'Research', content: 'Based only on my uploaded sources: what are the 5 key findings, what contradicts what, and what is still unproven? Cite each point.' },
      { title: 'Study guide', category: 'Learning', content: 'Create a study guide from my sources: 10 key terms with definitions, 5 short-answer questions, and a 200-word summary.' },
    ],
    tips: [
      'One project per notebook keeps answers focused and citations clean.',
      'Trust the citations: click through to the passage before quoting it.',
      'The audio overview is a great first pass on dense material — then read the key sections.',
    ],
    pros: ['Answers grounded in your documents only', 'Citations reduce hallucination risk', 'Free with a Google account'],
    limitations: ['Only as good as the sources you upload', 'Not a general web-search tool'],
    faqs: [
      { question: 'Is NotebookLM free?', answer: 'Yes, it is free to use with a Google account; capacity limits may apply — check the official site for current details.' },
      { question: 'What can NotebookLM do?', answer: 'Answer questions about your uploaded documents with citations, generate study guides and briefs, and create audio overviews.' },
      { question: 'How do beginners start?', answer: 'Upload two or three related PDFs and ask for a 5-point summary with citations to see how grounding works.' },
    ],
  }),

  gamma: g({
    about:
      'Gamma turns notes and outlines into polished presentations, documents and web pages. Paste an outline or a topic, pick a theme, and it generates a designed deck you can edit card by card. A free tier is available — check the official website for current limits.',
    bestFor: ['Fast presentations', 'Pitch & business decks', 'Documents as sites', 'Non-designers'],
    useCases: [
      { title: 'Deck from an outline', text: 'Give it your talking points and get a designed, structured deck in minutes.' },
      { title: 'Repackaging content', text: 'Turn a blog post or report into presentation cards for meetings.' },
      { title: 'Quick web pages', text: 'Publish a deck as a simple shareable web page when a doc is not enough.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Create a free account', text: 'Sign up at gamma.app.' },
      { title: 'Start from text', text: 'Choose “generate from text” and paste your outline or bullet points.' },
      { title: 'Pick a theme', text: 'Select a visual theme; you can change it later without redoing content.' },
      { title: 'Edit card by card', text: 'Adjust wording, images and layout per card. Regenerate single cards that miss.' },
      { title: 'Present or share', text: 'Present in the browser or share a link / export when done.' },
    ],
    prompts: [
      { title: 'Business review deck', category: 'Business', content: 'Create a 10-slide business review deck from these points: Q3 wins, metrics, misses, Q4 plan. Professional tone, one idea per slide, include a chart suggestion per metrics slide.' },
      { title: 'Workshop outline to deck', category: 'Social Media', content: 'Turn this workshop outline into a 12-slide training deck with speaker-note style text per slide: [paste outline]' },
    ],
    tips: [
      'Give it a real outline with 1 line per slide — output quality mirrors input structure.',
      'Regenerate individual cards instead of the whole deck when something is off.',
      'Keep slides to one message each; move detail into the notes.',
    ],
    pros: ['Design quality without design skills', 'Free tier', 'Cards are easy to reorder and regenerate'],
    limitations: ['Deep customization is lighter than PowerPoint/Keynote', 'Free exports may carry limits'],
    faqs: [
      { question: 'Is Gamma free?', answer: 'A free tier is available with credits; paid plans unlock more generations and controls — check gamma.app for current details.' },
      { question: 'What can Gamma create?', answer: 'Presentations, documents and simple web pages from text prompts or outlines, in designed themes.' },
      { question: 'How do beginners start?', answer: 'Paste a 10-line outline from any meeting notes and generate — then edit the two weakest cards.' },
    ],
  }),

  /* ============================== AUTOMATION ============================== */
  zapier: g({
    about:
      'Zapier is no-code automation that connects thousands of apps: when something happens in one app (a trigger), Zapier runs one or more actions in others — with AI steps available in the middle. Start free with limited tasks — check the official website for current limits.',
    bestFor: ['App-to-app automation', 'Lead & form workflows', 'Notifications & digests', 'No-code AI steps'],
    useCases: [
      { title: 'Form to CRM, automatically', text: 'New form submission → add lead to your CRM → notify the team in Slack.' },
      { title: 'AI-enriched workflows', text: 'Insert an AI step to summarize, classify or draft text between your apps.' },
      { title: 'Scheduled digests', text: 'Collect rows during the week and post a Friday summary to email or chat.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Create a free account', text: 'Sign up at zapier.com.' },
      { title: 'Pick a trigger app', text: 'Choose where the workflow starts — Gmail, a form tool, Stripe, a spreadsheet.' },
      { title: 'Pick the action app', text: 'Choose what happens next and map the fields (e.g. form name → CRM contact name).' },
      { title: 'Test the Zap', text: 'Run a real test with sample data and check both apps did what you expected.' },
      { title: 'Turn it on and monitor', text: 'Enable the Zap and review the task history occasionally for failures.' },
    ],
    prompts: [
      { title: 'AI classification step', category: 'Automation', content: 'In an AI-by-Zapier step, classify inbound messages: reply with exactly one label — “sales”, “support” or “spam” — based on the message text passed from the trigger.' },
    ],
    tips: [
      'Name Zaps clearly (“Lead form → HubSpot + Slack”) or your dashboard becomes a maze.',
      'Test with realistic data — edge cases in field mapping cause most breakages.',
      'Add a filter step before expensive AI steps to save tasks.',
    ],
    pros: ['Largest app directory', 'No-code, fast first automation', 'AI steps built in'],
    limitations: ['Task limits on the free tier', 'Very complex logic gets brittle and pricey'],
    faqs: [
      { question: 'Is Zapier free?', answer: 'A free plan covers a limited number of tasks per month; paid plans raise limits — check zapier.com for current details.' },
      { question: 'What can Zapier automate?', answer: 'Handoffs between apps: leads, notifications, spreadsheets, email lists and AI-generated summaries or classifications in between.' },
      { question: 'How do beginners start?', answer: 'Automate one handoff you do manually every day — for example form submissions to email — and expand from there.' },
    ],
  }),

  n8n: g({
    about:
      'n8n is a developer-friendly workflow automation tool: visual nodes for the common work, plus real code when you need it, and AI agent steps. You can self-host it (free community edition) or use the cloud — check the official website for the current options.',
    bestFor: ['Complex automations', 'Self-hosted workflows', 'AI agent pipelines', 'Technical teams'],
    useCases: [
      { title: 'Multi-step data pipelines', text: 'Fetch, transform, branch and route data between systems with full visibility.' },
      { title: 'AI agents with tools', text: 'Build agent workflows that call models, search, and act in other apps — with your logic in between.' },
      { title: 'Self-hosted control', text: 'Run sensitive automations on your own infrastructure with the community edition.' },
    ],
    beginnerFriendly: false,
    steps: [
      { title: 'Choose cloud or self-host', text: 'Start on n8n.cloud for zero setup, or self-host the community edition if you want data control.' },
      { title: 'Create your first workflow', text: 'Add a trigger (schedule, webhook, app event) and one action; execute it and inspect the data at each node.' },
      { title: 'Use expressions', text: 'Reference fields from earlier nodes with expressions instead of hardcoding values.' },
      { title: 'Add an AI step', text: 'Insert an AI node to summarize or classify text mid-flow, passing data in and out explicitly.' },
      { title: 'Activate and monitor', text: 'Activate the workflow and use the execution log to debug any failed runs.' },
    ],
    prompts: [
      { title: 'Support triage flow', category: 'Automation', content: 'Design an n8n workflow: webhook receives a support email → AI node labels it billing/bug/other → route to the right channel and log to a sheet. Show the nodes and expressions.' },
    ],
    tips: [
      'Inspect node inputs/outputs while building — most bugs are field-name mismatches.',
      'Branch early: separate happy path from error path so failures are visible.',
      'Version-control workflow exports once they become business-critical.',
    ],
    pros: ['Code-level control when needed', 'Self-hosting option', 'Powerful AI agent capabilities'],
    limitations: ['Steeper learning curve than no-code tools', 'Self-hosting means you operate it'],
    faqs: [
      { question: 'Is n8n free?', answer: 'The self-hosted community edition is free; the cloud service is paid — check n8n.io for current plans.' },
      { question: 'What is n8n used for?', answer: 'Complex automations and AI agent workflows across apps and APIs, with visual nodes plus custom code.' },
      { question: 'How do beginners start?', answer: 'Build a two-node workflow (schedule trigger → send an HTTP request) and inspect the data between nodes to learn the model.' },
    ],
  }),
};
