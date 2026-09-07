/* AI tool guides — Voice & Audio + Coding + No-code Builders (see aiToolGuides.ts for types & rules) */
import type { AIToolGuideContent } from './aiToolGuides';

const g = (t: AIToolGuideContent): AIToolGuideContent => t;

export const aiToolGuidesBuild: Record<string, AIToolGuideContent> = {
  /* ============================== VOICE & AUDIO ============================== */
  elevenlabs: g({
    about:
      'ElevenLabs is the best-known platform for realistic AI voices: text-to-speech, voice cloning and dubbing in many languages. Paste or type text, pick a voice, and it renders natural-sounding audio. A free tier is available for testing — check the official website for current limits and cloning rules.',
    bestFor: ['Voiceovers', 'Audiobook & narration', 'Video voice tracks', 'Multilingual dubbing', 'Accessibility audio'],
    useCases: [
      { title: 'Video voiceovers', text: 'Narrate explainers, ads and social videos without booking a studio or voice actor.' },
      { title: 'Audiobooks and articles', text: 'Turn written content into listenable audio with natural pacing and emotion.' },
      { title: 'Multilingual dubbing', text: 'Localize content across languages while keeping a consistent voice where supported.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Create a free account', text: 'Sign up at elevenlabs.io — the free tier includes a monthly character allowance.' },
      { title: 'Open the speech tool', text: 'Go to Text to Speech and pick a voice from the default library.' },
      { title: 'Paste your script', text: 'Type or paste short text first (a paragraph) to test the voice.' },
      { title: 'Tune the settings', text: 'Adjust stability and similarity sliders: more stability = flatter and consistent, less = more expressive.' },
      { title: 'Generate and download', text: 'Generate, listen, tweak punctuation for pacing, then download the audio file.' },
    ],
    prompts: [
      { title: 'Ad voiceover script', category: 'Business', content: 'Write a 30-second voiceover script for [product]. Warm, confident tone, one clear benefit per sentence, ending with “Learn more at [site]”. Then paste it into ElevenLabs to render.' },
      { title: 'Podcast intro', category: 'Voice & Audio', content: 'Write a 15-second podcast intro for a show about [topic], energetic but professional, ending with the show name and tagline.' },
    ],
    tips: [
      'Punctuation controls pacing: commas for breaths, periods for full stops, ellipses for hesitation.',
      'Test two or three voices on the same paragraph before committing to one.',
      'Respect voice-cloning consent rules — only clone voices you have permission to use.',
    ],
    pros: ['Most realistic default voices in class', 'Free tier to test', 'Strong multilingual support'],
    limitations: ['Character limits on lower tiers', 'Voice cloning requires appropriate consent and often a paid plan'],
    faqs: [
      { question: 'Is ElevenLabs free?', answer: 'There is a free tier with a monthly character quota; paid plans add capacity and features — check elevenlabs.io for current details.' },
      { question: 'What can ElevenLabs create?', answer: 'Realistic speech audio from text: voiceovers, narration, dubbing and audio versions of articles, in many languages.' },
      { question: 'How do beginners start?', answer: 'Create a free account, choose a library voice, and render one paragraph to hear the quality before longer scripts.' },
      { question: 'Can I clone my own voice?', answer: 'Yes, with consent verification, typically on paid tiers — review the official voice-cloning policy first.' },
    ],
  }),

  'murf-ai': g({
    about:
      'Murf AI is a voiceover generator aimed at videos and presentations: pick an AI voice, paste your script, and sync the audio to slides or video on a timeline. A free tier is available to try voices — check the official website for current plans.',
    bestFor: ['Presentation voiceovers', 'Explainer videos', 'E-learning narration', 'Business audio'],
    useCases: [
      { title: 'Slide narration', text: 'Narrate PowerPoint-style presentations with synchronized voice and timing.' },
      { title: 'Product and explainer videos', text: 'Generate clean professional voice tracks for marketing videos.' },
      { title: 'Course and training audio', text: 'Produce consistent narration across many lessons.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Create an account', text: 'Sign up at murf.ai and start a new project.' },
      { title: 'Pick a voice', text: 'Filter the voice library by language, style and use case; shortlist two or three.' },
      { title: 'Paste your script', text: 'Add script text per slide or scene, keeping each block to a few sentences.' },
      { title: 'Sync and adjust', text: 'Align audio blocks on the timeline, tweak pacing and emphasis, then render and export.' },
    ],
    prompts: [
      { title: 'Explainer narration', category: 'Business', content: 'Write a 45-second explainer narration for [product]: problem, solution, proof, call to action. Neutral-professional tone suitable for an AI voice.' },
    ],
    tips: [
      'Write short blocks — one scene per block makes timing fixes painless.',
      'Use emphasis controls on key words instead of CAPITALS or punctuation hacks.',
      'Preview at full speed; AI voices can rush long compound sentences.',
    ],
    pros: ['Timeline sync for slides and video', 'Business-friendly voice library', 'Free tier for testing'],
    limitations: ['Voice realism slightly behind the top specialist tools', 'Long-form rendering time on lower plans'],
    faqs: [
      { question: 'Is Murf AI free?', answer: 'A free tier is available for trying voices; paid plans unlock exports and capacity — check murf.ai for current details.' },
      { question: 'What can Murf AI create?', answer: 'AI voiceovers for videos, presentations and e-learning, synced on a timeline.' },
      { question: 'How do beginners start?', answer: 'Create a project, pick two voices, narrate a 3-slide presentation and export a test render.' },
    ],
  }),

  /* ============================== CODING ============================== */
  'github-copilot': g({
    about:
      'GitHub Copilot is an AI pair programmer that suggests code and whole functions as you type, directly in your editor (VS Code, JetBrains and more) and in GitHub chat. It is a paid subscription for most individuals, with free access for students and maintainers — check the official website for current eligibility and pricing.',
    bestFor: ['Everyday coding speed', 'Boilerplate & tests', 'Learning new frameworks', 'Editor-integrated AI'],
    useCases: [
      { title: 'Autocomplete that writes code', text: 'Accept multi-line suggestions for functions, tests and repetitive patterns as you type.' },
      { title: 'Explain and fix', text: 'Ask Copilot Chat to explain unfamiliar code or suggest fixes for errors.' },
      { title: 'Learn frameworks faster', text: 'See idiomatic examples in the exact language and version you are working in.' },
    ],
    beginnerFriendly: false,
    steps: [
      { title: 'Check eligibility', text: 'Copilot is a paid subscription for most developers; students and open-source maintainers may get free access — verify on the official page.' },
      { title: 'Install the extension', text: 'Install GitHub Copilot in VS Code or your JetBrains IDE and sign in with GitHub.' },
      { title: 'Code with suggestions', text: 'Write a comment describing the function, pause, and review the grey suggestion — Tab to accept, Esc to dismiss.' },
      { title: 'Use Copilot Chat', text: 'Highlight code and ask “explain this” or “write a test for this” in the chat panel.' },
      { title: 'Review everything', text: 'Suggestions can be wrong or dated — read, test and own the code you ship.' },
    ],
    prompts: [
      { title: 'Write unit tests', category: 'Testing', content: '// Write Jest unit tests for the function below, covering happy path, empty input and error cases:' },
      { title: 'Explain selected code', category: 'Coding', content: 'Explain what this code does, list any bugs, and suggest a safer alternative. Keep the explanation under 150 words.' },
    ],
    tips: [
      'Comments are prompts: a precise one-line description yields a much better function.',
      'Keep context nearby — open related files so suggestions match your patterns.',
      'Use the chat for “why”, not just “write”: understanding beats copy-paste.',
    ],
    pros: ['Deep editor integration', 'Strong multi-language suggestions', 'Free for verified students/maintainers'],
    limitations: ['Paid for most users', 'Suggestions need review — security and licence awareness still matter'],
    faqs: [
      { question: 'Is GitHub Copilot free?', answer: 'Most individual developers need a paid subscription; students and maintainers of popular open-source projects can get free access — check the official site for current terms.' },
      { question: 'What can Copilot do?', answer: 'It autocompletes code as you type, generates functions and tests, and explains or fixes code through editor chat.' },
      { question: 'How do beginners start?', answer: 'Install the extension in VS Code, write a comment describing a small utility function, and review the suggestion carefully.' },
    ],
  }),

  cursor: g({
    about:
      'Cursor is an AI-first code editor (a fork of VS Code) built around AI: chat with your whole codebase, apply multi-file edits, and generate changes inline. A free tier is available; Pro plans add capacity — check the official website for current limits.',
    bestFor: ['AI-assisted development', 'Whole-codebase chat', 'Multi-file edits', 'VS Code users'],
    useCases: [
      { title: 'Codebase-aware chat', text: 'Ask questions that reference your actual files: “where do we validate payments?”' },
      { title: 'Apply edits across files', text: 'Describe a change and let Cursor propose edits across multiple files for review.' },
      { title: 'Faster debugging', text: 'Paste an error, reference the code, and ask for the likely cause and fix.' },
    ],
    beginnerFriendly: false,
    steps: [
      { title: 'Download Cursor', text: 'Install from cursor.com — it imports your VS Code settings and extensions.' },
      { title: 'Open your project', text: 'Open a repository folder so the AI can index your codebase.' },
      { title: 'Chat with context', text: 'Open the chat (Ctrl/Cmd+L), @-mention files, and ask questions or request changes.' },
      { title: 'Review diffs', text: 'When Cursor proposes edits, review each diff before applying — you stay the editor of record.' },
    ],
    prompts: [
      { title: 'Find the flow', category: 'Coding', content: 'Where is user authentication handled in this repo? Trace the login flow from the UI to the database and list the files involved.' },
      { title: 'Refactor request', category: 'Debugging', content: 'This component re-renders too often. Identify the cause and propose a minimal refactor. Show the diff before applying.' },
    ],
    tips: [
      '@-mention specific files to focus the model and save context space.',
      'Ask for the plan first (“how would you fix this?”), then apply — better for learning.',
      'Keep commits small so AI-suggested changes are easy to review and revert.',
    ],
    pros: ['Codebase-wide awareness', 'Multi-file edit proposals', 'Familiar VS Code foundation'],
    limitations: ['Heavier AI usage needs a paid plan', 'Proposed multi-file edits still need careful review'],
    faqs: [
      { question: 'Is Cursor free?', answer: 'A free tier is available with usage limits; Pro plans add capacity — check cursor.com for current details.' },
      { question: 'What is Cursor?', answer: 'An AI-first code editor based on VS Code that chats with your codebase and proposes multi-file edits.' },
      { question: 'How do beginners start?', answer: 'Install Cursor, open a small project, and ask it to explain the project structure before requesting changes.' },
    ],
  }),

  replit: g({
    about:
      'Replit is a browser-based coding platform with AI assistance and instant deployment: write, run and host apps without local setup. Its AI agent can build small apps from prompts. Free access is available with limits — check the official website for current plans.',
    bestFor: ['Zero-setup coding', 'Learning to code', 'Quick prototypes', 'Instant hosting'],
    useCases: [
      { title: 'Code from any browser', text: 'No installs: open a workspace, pick a language template and start coding immediately.' },
      { title: 'Prompt-to-app experiments', text: 'Describe a simple app and let the AI scaffold it, then edit the result.' },
      { title: 'Ship and share', text: 'Deploy small apps and sites directly and share a live URL.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Create a free account', text: 'Sign up at replit.com and click Create Repl.' },
      { title: 'Pick a template', text: 'Choose a language or app template (Python, Node, HTML/CSS) to start with a working baseline.' },
      { title: 'Run your code', text: 'Click Run — output appears instantly in the console preview.' },
      { title: 'Ask the AI', text: 'Use Replit AI to explain code, fix errors or generate features as you go.' },
      { title: 'Deploy when ready', text: 'Use the Deploy option to publish your app on a shareable URL.' },
    ],
    prompts: [
      { title: 'First web page', category: 'Landing Page', content: 'Create a simple personal portfolio page with my name, a short bio, and three project cards. Clean HTML and CSS only, no frameworks.' },
      { title: 'Debug my error', category: 'Debugging', content: 'My Python script fails with this error: [paste error]. Explain the cause simply and show the corrected code.' },
    ],
    tips: [
      'Start from a template instead of an empty file — you learn by modifying working code.',
      'Use the console output as your teacher: read errors top-down.',
      'Deploy early; a live URL is motivating and easy to share for feedback.',
    ],
    pros: ['Nothing to install', 'Run + host in one place', 'Approachable for absolute beginners'],
    limitations: ['Free tier has resource limits', 'Large production apps outgrow browser workspaces'],
    faqs: [
      { question: 'Is Replit free?', answer: 'Yes, with limits on resources and AI usage. Paid plans add capacity — check replit.com for current details.' },
      { question: 'What can Replit do?', answer: 'Browser coding in many languages, AI-assisted building, and one-click deployment of small apps and sites.' },
      { question: 'How do beginners start?', answer: 'Create a free account, open the HTML/CSS template, change some text, and press Run — your first program in minutes.' },
    ],
  }),

  lovable: g({
    about:
      'Lovable builds full web applications — frontend, backend and database — from natural-language prompts, inside your browser. You describe the app, review the generated version, and refine by chatting. A free tier is available to start — check the official website for current limits.',
    bestFor: ['Prompt-built web apps', 'MVPs & internal tools', 'Non-coders shipping products', 'Fast iteration'],
    useCases: [
      { title: 'Idea to working MVP', text: 'Describe a product idea and get a usable app with UI and data persistence to iterate on.' },
      { title: 'Internal tools', text: 'CRUD dashboards, trackers and admin panels without writing code.' },
      { title: 'Learning how apps fit together', text: 'Watch the structure it generates — a practical way to see how frontend and database connect.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Sign up free', text: 'Create an account at lovable.dev.' },
      { title: 'Describe your app', text: 'Write what it should do, who uses it, and the main screens — specificity beats vagueness.' },
      { title: 'Review the first build', text: 'Click through the generated app and note what is missing or wrong.' },
      { title: 'Refine by chatting', text: 'Request one change at a time: “add a form to submit requests”, “only admins can delete”.' },
      { title: 'Connect and publish', text: 'Attach the database/backend when prompted and publish when the flow works end-to-end.' },
    ],
    prompts: [
      { title: 'Client tracker app', category: 'Automation', content: 'Build a small app to track freelance clients: a table with name, status (lead/active/archived), rate and next follow-up date. Add a form to add clients and a filter by status.' },
      { title: 'Team booking tool', category: 'API', content: 'Build a simple meeting-room booking app: list rooms, pick a time slot, and prevent double bookings. Show today\u2019s bookings on a dashboard.' },
    ],
    tips: [
      'Iterate in small, single-purpose messages — big change lists produce mushy results.',
      'Describe roles and permissions early if the app has users.',
      'Test the data flow (create → edit → delete) before adding more features.',
    ],
    pros: ['Full-stack output, not just a page', 'Very fast idea-to-usable loop', 'Beginner-friendly chat workflow'],
    limitations: ['Complex logic still needs developer review', 'Free usage is credit-limited'],
    faqs: [
      { question: 'Is Lovable free?', answer: 'A free tier is available with usage credits; paid plans add capacity — check lovable.dev for current details.' },
      { question: 'What can Lovable build?', answer: 'Full web apps with UI, backend and database from prompts — MVPs, dashboards, trackers and internal tools.' },
      { question: 'How do beginners start?', answer: 'Describe one small tool you actually need (e.g. an expense tracker) and refine it one feature at a time.' },
    ],
  }),

  bolt: g({
    about:
      'Bolt generates full-stack web applications from natural-language prompts in your browser, with a live preview and code you can edit or export. A free tier is available — check the official website for current limits.',
    bestFor: ['Instant app prototypes', 'Landing pages & dashboards', 'Exportable code', 'Hackathon-speed building'],
    useCases: [
      { title: 'Prototype in minutes', text: 'Describe the product and get a clickable version to put in front of stakeholders.' },
      { title: 'Marketing sites and dashboards', text: 'Generate landing pages or admin-style dashboards, then tweak the code directly.' },
      { title: 'Own the code', text: 'Export the generated project and continue in your own editor.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Open bolt.new', text: 'Create a free account to save your projects.' },
      { title: 'Describe the app', text: 'Say what it is, who uses it, and the key screens. Attach requirements if you have them.' },
      { title: 'Use the live preview', text: 'Click through the preview while it builds; note fixes needed.' },
      { title: 'Refine or edit code', text: 'Chat refinements for structure, or open the code editor for precise tweaks.' },
      { title: 'Export or deploy', text: 'Download the project or use the deploy option to publish.' },
    ],
    prompts: [
      { title: 'SaaS landing page', category: 'Landing Page', content: 'Build a landing page for a booking tool for barber shops: hero with headline and CTA, 3 feature cards, pricing table with 3 tiers, FAQ accordion. Modern, clean, mobile-friendly.' },
      { title: 'Metrics dashboard', category: 'Automation', content: 'Build a dashboard with 4 KPI cards (revenue, orders, refunds, active users), a line chart placeholder, and a sortable recent-orders table. Dark sidebar layout.' },
    ],
    tips: [
      'List the screens you want in the first prompt — it anchors the whole build.',
      'Fix visual issues by editing the code directly; fix structure by chatting.',
      'Export early and often if you plan to continue the project elsewhere.',
    ],
    pros: ['Very fast prompt-to-app loop', 'In-browser live preview', 'Code is exportable'],
    limitations: ['Free credits are limited', 'Complex backend logic needs review by a developer'],
    faqs: [
      { question: 'Is Bolt free?', answer: 'There is a free tier with usage limits; subscriptions add capacity — check bolt.new for current details.' },
      { question: 'What can Bolt create?', answer: 'Full-stack web apps and sites from prompts — landing pages, dashboards, prototypes — with editable, exportable code.' },
      { question: 'How do beginners start?', answer: 'Ask for a one-page site you need (a portfolio, a menu page), review the preview, and request one specific change at a time.' },
    ],
  }),
};
