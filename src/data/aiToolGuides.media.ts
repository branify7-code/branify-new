/* AI tool guides — Image Generation + Video Generation (see aiToolGuides.ts for types & rules) */
import type { AIToolGuideContent } from './aiToolGuides';

const g = (t: AIToolGuideContent): AIToolGuideContent => t;

export const aiToolGuidesImage: Record<string, AIToolGuideContent> = {
  midjourney: g({
    about:
      'Midjourney is an AI image generator known for stylized, artistic and photographic results. You describe an image in plain language and Midjourney returns a grid of options you can refine and upscale. It runs through its official website and Discord bot and is a paid subscription product — check the official website for current plans.',
    bestFor: ['Concept art', 'Marketing visuals', 'Social media graphics', 'Product concepts', 'Creative photography styles', 'Visual storytelling'],
    useCases: [
      { title: 'Brand and campaign visuals', text: 'Generate hero images, mood visuals and campaign concepts with a consistent, recognizable aesthetic.' },
      { title: 'Product and packaging concepts', text: 'Mock up visual directions for products, scenes and packaging before a photo shoot.' },
      { title: 'Social and blog imagery', text: 'Create striking, non-stock-looking images for posts and articles in minutes.' },
      { title: 'Moodboards and exploration', text: 'Produce many style variations quickly to align a team on a visual direction.' },
    ],
    beginnerFriendly: false,
    steps: [
      { title: 'Subscribe and sign in', text: 'Midjourney is subscription-based. Create your account on the official midjourney.com site and choose a plan.' },
      { title: 'Open the creation workflow', text: 'Use the web app\u2019s imagine/creation bar, or the Discord server if you prefer the bot workflow.' },
      { title: 'Describe the image', text: 'Type what you want: subject, setting, lighting, mood and style. Example: “a ceramic coffee cup on a sunlit wooden table, warm morning light, editorial photography”.' },
      { title: 'Review the results', text: 'Midjourney returns several options. Use the vary/reroll actions to explore alternatives to the whole grid.' },
      { title: 'Refine and upscale', text: 'Pick the closest result, refine your wording (or use vary-region style tools) and upscale the final image for download.' },
    ],
    prompts: [
      { title: 'Premium interior photo', category: 'Business', content: 'Premium modern coffee shop interior with warm natural light, cinematic photography, elegant materials, editorial interior design style, realistic textures, high detail.' },
      { title: 'Product photography', category: 'Product Photography', content: 'Matte black skincare bottle on a stone pedestal, soft studio lighting, subtle water droplets, minimal background, commercial product photography, sharp focus.' },
      { title: 'Food hero shot', category: 'Food', content: 'Rustic sourdough bread on a linen cloth, steam rising, soft window light from the left, shallow depth of field, editorial food photography, warm tones.' },
      { title: 'Fashion editorial', category: 'Fashion', content: 'Full-body fashion editorial of a model in a flowing terracotta dress, concrete brutalist backdrop, golden hour light, 85mm lens look, magazine quality.' },
    ],
    tips: [
      'Order matters: put the subject first, then setting, lighting and style.',
      'Reference concrete art terms (“editorial photography”, “soft box light”) instead of vague words like “nice” or “beautiful”.',
      'Iterate: reroll the grid, then refine the best image — first results are a starting point, not the finish line.',
    ],
    pros: ['Distinctive, high-quality artistic output', 'Strong community and prompt culture to learn from', 'Fine control through refinement actions'],
    limitations: ['Paid subscription, no permanent free tier', 'Results vary — exact reproduction of an idea takes iteration', 'Text inside images is unreliable'],
    faqs: [
      { question: 'Is Midjourney free?', answer: 'No — Midjourney is a paid subscription. Check midjourney.com for current plans; there is no permanent free tier.' },
      { question: 'What can Midjourney create?', answer: 'Stylized and photographic images from text descriptions: concepts, scenes, product mockups, editorial-style visuals and more.' },
      { question: 'How do beginners start?', answer: 'Subscribe, open the web creation bar, and write a one-sentence description of an image. Reroll a few times, then refine the best result.' },
      { question: 'What should I include in a prompt?', answer: 'Subject, setting, lighting, mood and style. Concrete visual language works better than adjectives like “amazing”.' },
      { question: 'Can I use images commercially?', answer: 'Usage rights depend on your subscription tier — review the official terms on the Midjourney website before commercial use.' },
    ],
  }),

  'leonardo-ai': g({
    about:
      'Leonardo.Ai is an AI image generation platform with a generous free daily token tier and production-oriented features: fine-tuned models, style presets and an editor. It suits both beginners and creators who need repeatable styles — check the official website for current limits.',
    bestFor: ['Game and character art', 'Style-consistent series', 'Marketing graphics', 'Free-tier image generation', 'Iterative editing'],
    useCases: [
      { title: 'Consistent character and asset art', text: 'Train or pick fine-tuned models so characters and items keep a consistent look across many images.' },
      { title: 'Marketing and social visuals', text: 'Generate ad-ready visuals with presets, then adjust with the built-in editor.' },
      { title: 'Free-tier experimentation', text: 'Daily tokens let beginners learn prompt writing without paying first.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Create a free account', text: 'Sign up at leonardo.ai — the free tier includes daily tokens to generate images.' },
      { title: 'Pick a model and preset', text: 'Choose a base or community model that matches your goal (photo, illustration, game art) and a style preset.' },
      { title: 'Write your prompt', text: 'Describe the subject, style and mood. Add negative prompts (what to avoid) if needed.' },
      { title: 'Generate and refine', text: 'Review the batch, refine wording or settings, and use editor tools (upscale, inpaint) on the best one.' },
      { title: 'Download', text: 'Save the final image. Check the licence terms for your intended use.' },
    ],
    prompts: [
      { title: 'Game item concept', category: 'Game Art', content: 'Ornate fantasy greatsword, enchanted sapphire core, weathered silver engraving, studio item shot on dark background, game asset concept art, high detail.' },
      { title: 'Lifestyle marketing image', category: 'Social Media', content: 'Cozy home office corner at sunrise, laptop with blank screen, plant and ceramic mug, soft warm light, lifestyle photography, clean composition, copy space on the left.' },
    ],
    tips: [
      'Start from a community model close to your goal instead of the generic one.',
      'Use the free daily tokens to practice prompts — consistency comes from iteration.',
      'Keep a notes file of prompts that worked; reuse and tweak them.',
    ],
    pros: ['Free daily token tier', 'Fine-tuned models for consistent styles', 'Built-in editor (upscale, inpaint)'],
    limitations: ['Token system limits heavy free usage', 'Quality varies between community models'],
    faqs: [
      { question: 'Is Leonardo.Ai free?', answer: 'There is a free daily token allowance; paid plans raise the limits and unlock features. Check leonardo.ai for current details.' },
      { question: 'What can Leonardo.Ai create?', answer: 'AI images in many styles — illustrations, game assets, photos, marketing graphics — with fine-tuned models and editing tools.' },
      { question: 'How do beginners start?', answer: 'Create a free account, pick a preset close to your goal, generate a small batch, and refine the best result with the editor.' },
    ],
  }),

  ideogram: g({
    about:
      'Ideogram is an AI image generator that stands out at rendering readable text inside images — posters, logos with lettering, signs and social graphics. It offers a free tier — check the official website for current limits.',
    bestFor: ['Images with text', 'Posters & signs', 'Logo concepts with lettering', 'Social media graphics'],
    useCases: [
      { title: 'Posters with real words', text: 'Generate event posters or quotes where the actual text appears correctly in the image.' },
      { title: 'Logo and lockup concepts', text: 'Explore wordmark and badge directions before briefing a designer.' },
      { title: 'Mock signage', text: 'Storefront signs, labels and packaging concepts that include legible copy.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Sign up', text: 'Create a free account at ideogram.ai.' },
      { title: 'Describe image + text', text: 'Describe the visual and put the exact text you want in quotes — for example a poster that says “GRAND OPENING”.' },
      { title: 'Pick a style and ratio', text: 'Choose the look (illustration, photo, poster) and the aspect ratio that fits your use.' },
      { title: 'Generate and pick', text: 'Review the batch; reword or re-roll if the lettering is off. Text rendering is strong but not perfect.' },
    ],
    prompts: [
      { title: 'Event poster', category: 'Business', content: 'Minimal jazz concert poster, deep navy background, bold white text that says “LATE NIGHT JAZZ”, small trumpet illustration, clean typography, print quality.' },
      { title: 'Cafe sign concept', category: 'Social Media', content: 'Hand-painted wooden cafe sign that reads “FERN & FILTER”, surrounded by illustrated fern leaves, warm afternoon light, cozy editorial style.' },
    ],
    tips: [
      'Always quote the exact text you want rendered, and keep it short.',
      'Mention the type style (“bold serif”, “hand-painted”) to steer lettering.',
      'Generate several variants — lettering accuracy improves on re-rolls.',
    ],
    pros: ['Best-in-class text inside images', 'Free tier', 'Simple, focused workflow'],
    limitations: ['Long text strings can still garble', 'Artistic range is narrower than photo-first tools'],
    faqs: [
      { question: 'Is Ideogram free?', answer: 'A free tier is available with daily limits; paid plans add capacity — check ideogram.ai for current details.' },
      { question: 'What makes Ideogram different?', answer: 'It renders readable text inside images, which most AI image tools handle poorly.' },
      { question: 'How do beginners start?', answer: 'Sign up free and generate a simple poster with a two-word headline in quotes to see the text rendering in action.' },
    ],
  }),

  'adobe-firefly': g({
    about:
      'Adobe Firefly is Adobe\u2019s family of generative AI features for images and design assets, integrated into Adobe Express and Creative Cloud apps like Photoshop. It is designed to be commercially safer for creative work — availability and entitlements depend on your Adobe plan, so check the official website.',
    bestFor: ['Adobe users', 'Commercially safer generations', 'Photoshop workflows', 'Design assets & text effects'],
    useCases: [
      { title: 'Generative fill in Photoshop', text: 'Extend, remove or reimagine parts of your own photos directly inside Photoshop.' },
      { title: 'Design assets', text: 'Generate textures, backgrounds and text effects for layouts in Adobe Express.' },
      { title: 'Brand-safe exploration', text: 'Explore visual directions with a tool designed around commercial-use considerations.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Sign in with Adobe', text: 'Open firefly.adobe.com and sign in with an Adobe account; free credits are typically included.' },
      { title: 'Choose a feature', text: 'Text-to-image, generative fill, or text effects — start with text-to-image for general generation.' },
      { title: 'Write your prompt', text: 'Describe subject, style and composition. Use the style controls to steer the look.' },
      { title: 'Refine in the app', text: 'Adjust settings or move the result into Express/Photoshop for final edits.' },
    ],
    prompts: [
      { title: 'Background texture', category: 'Business', content: 'Seamless abstract background, soft gradient waves in teal and warm sand tones, subtle grain, premium presentation background, minimal.' },
      { title: 'Social graphic', category: 'Social Media', content: 'Square social graphic, bold 3D text effect reading “SALE”, glossy candy-red letters on clean white background, studio lighting.' },
    ],
    tips: [
      'Use Firefly inside Photoshop for edits to photos you already own — it is strongest there.',
      'Check the entitlement/licence page for your plan before commercial projects.',
      'Style sliders (lighting, composition) tighten results faster than longer prompts.',
    ],
    pros: ['Integrated with Adobe apps', 'Designed with commercial use in mind', 'Free credits typically available'],
    limitations: ['Full value needs Adobe subscriptions', 'Fewer community styles than dedicated art platforms'],
    faqs: [
      { question: 'Is Adobe Firefly free?', answer: 'Adobe typically includes free monthly generative credits; full features depend on Adobe plans — check the official website for current details.' },
      { question: 'What can Firefly create?', answer: 'Images from text, generative fill/expand edits inside photos, and styled text effects for design work.' },
      { question: 'How do beginners start?', answer: 'Sign in at firefly.adobe.com with an Adobe account and try text-to-image with a simple scene description.' },
    ],
  }),

  runway: g({
    about:
      'Runway is an AI video generation and editing platform. Its best-known feature is text-to-video: you describe a shot and Runway generates a short clip. It also includes AI editing tools for footage you already have. A free tier is typically available for testing — check the official website for current plans.',
    bestFor: ['Text-to-video clips', 'Concept films & ads', 'AI editing of footage', 'Social video experiments'],
    useCases: [
      { title: 'Text-to-video shots', text: 'Generate short cinematic clips from a description for ads, intros and concept films.' },
      { title: 'Image-to-video', text: 'Animate a still image — product shots and artwork become moving scenes.' },
      { title: 'AI-assisted editing', text: 'Remove backgrounds, track objects and clean up footage with AI tools inside one platform.' },
    ],
    beginnerFriendly: false,
    steps: [
      { title: 'Create an account', text: 'Sign up at runwayml.com. Start on the free tier to learn the workflow, then upgrade for length and quality options.' },
      { title: 'Open the video generator', text: 'Choose text-to-video or image-to-video depending on whether you start from words or a still.' },
      { title: 'Describe the shot', text: 'Write camera movement, subject, setting and lighting: “slow dolly-in on a steamy coffee cup, morning light, shallow depth of field”.' },
      { title: 'Generate and iterate', text: 'Generate short takes, tweak the description, and keep the best take. Clip lengths and credits are limited by plan.' },
      { title: 'Edit and export', text: 'Trim and combine takes on the timeline, then export for use in your editor.' },
    ],
    prompts: [
      { title: 'Product b-roll', category: 'Business', content: 'Slow orbit around a matte-white sneaker on a concrete pedestal, soft studio light, floating dust particles, shallow depth of field, premium product film.' },
      { title: 'Establishing shot', category: 'Social Media', content: 'Aerial sunrise shot gliding over a misty pine forest toward a glass cabin, cinematic color grade, gentle camera drift, photorealistic.' },
    ],
    tips: [
      'Think like a director: one shot per generation — camera move, subject, light.',
      'Short and specific beats long and vague; you can chain clips on the timeline.',
      'Credits are limited per plan — test ideas at lower settings first.',
    ],
    pros: ['Leading text-to-video quality', 'Editing tools in the same platform', 'Free tier to experiment'],
    limitations: ['Video generation consumes credits quickly', 'Clips are short; long scenes need assembly', 'Physics and hands can still glitch'],
    faqs: [
      { question: 'Is Runway free?', answer: 'A free tier with limited credits is typically available; paid plans unlock more generations and higher quality — check runwayml.com for current details.' },
      { question: 'What can Runway create?', answer: 'Short AI-generated video clips from text or images, plus AI editing of existing footage.' },
      { question: 'How do beginners start?', answer: 'Generate a single five-second shot from a simple description, then iterate on camera language before trying complex scenes.' },
    ],
  }),

  synthesia: g({
    about:
      'Synthesia creates business and training videos from text scripts using AI avatars. You paste a script, pick an avatar and voice, and the platform renders a presenter-style video — no camera or studio needed. It is a paid product focused on companies — check the official website for current pricing.',
    bestFor: ['Training & onboarding videos', 'Explainer videos', 'Multilingual corporate content', 'No-camera presenters'],
    useCases: [
      { title: 'Training without a studio', text: 'Turn SOPs and onboarding docs into presenter videos that are easy to update.' },
      { title: 'Multilingual versions', text: 'Produce the same explainer in many languages with consistent avatars and voices.' },
      { title: 'Fast script-to-video', text: 'Edit the script text and re-render — no reshooting required.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Start from the official site', text: 'Synthesia is a paid product — create your account at synthesia.io.' },
      { title: 'Write your script', text: 'Paste a short script (150–250 words per minute of video). Keep sentences speakable.' },
      { title: 'Pick avatar and voice', text: 'Choose a presenter avatar and a voice; select the language you need.' },
      { title: 'Add slides and branding', text: 'Insert text scenes, images and your logo to support the narration.' },
      { title: 'Render and share', text: 'Generate the video, review pronunciation, then export or share the link.' },
    ],
    prompts: [
      { title: 'Onboarding video script', category: 'Business', content: 'Write a 200-word onboarding video script for new [industry] employees covering: welcome, the 3 tools they will use, and who to ask for help. Friendly, clear, no jargon.' },
    ],
    tips: [
      'Write for the ear: short sentences, contractions, no dense jargon.',
      'One idea per scene — use slides for structure, not walls of text.',
      'Preview the voice at full length before the final render to catch mispronunciations.',
    ],
    pros: ['No camera, actors or studio needed', 'Easy multilingual output', 'Simple script edits re-render fast'],
    limitations: ['Paid product aimed at businesses', 'Presenter format — not cinematic footage'],
    faqs: [
      { question: 'Is Synthesia free?', answer: 'Synthesia is a paid product; free demo availability varies — check synthesia.io for current pricing.' },
      { question: 'What can Synthesia create?', answer: 'Presenter-style videos from text scripts: training, onboarding, explainers and internal comms, with AI avatars and voices.' },
      { question: 'How do beginners start?', answer: 'Start with a 60-second script, choose one avatar and voice, and render a test video before scaling to a full course.' },
    ],
  }),

  veo: g({
    about:
      'Veo is Google\u2019s AI video generation model, accessible through Google\u2019s tools (such as Gemini and Google\u2019s AI testbeds). It generates short cinematic clips from text or image prompts. Availability depends on your Google account and region — check the official website for current access options.',
    bestFor: ['Cinematic text-to-video', 'Google ecosystem users', 'Concept footage', 'Image-to-video experiments'],
    useCases: [
      { title: 'Cinematic concept shots', text: 'Describe a scene with camera language and generate photorealistic short clips.' },
      { title: 'Storyboarding', text: 'Prototype film and ad concepts before production.' },
      { title: 'Animating stills', text: 'Turn an image into a moving shot with image-to-video where available.' },
    ],
    beginnerFriendly: true,
    steps: [
      { title: 'Check availability', text: 'Open the Google tool that offers Veo (for example Gemini) and sign in — access depends on account and region.' },
      { title: 'Write the shot', text: 'Describe subject, action, camera movement, lighting and mood in one or two sentences.' },
      { title: 'Generate', text: 'Submit the prompt and wait for the clip; generation may take a while and be usage-limited.' },
      { title: 'Iterate', text: 'Change one variable at a time — camera move or lighting — and regenerate to compare.' },
    ],
    prompts: [
      { title: 'Nature macro', category: 'Social Media', content: 'Extreme close-up of a dew-covered leaf at sunrise, camera slowly pulling back, golden backlight, shallow depth of field, cinematic nature documentary style.' },
      { title: 'Urban establishing shot', category: 'Business', content: 'Handheld-style tracking shot down a rainy neon-lit city street at night, reflections on wet asphalt, cinematic color grade, 24fps film look.' },
    ],
    tips: [
      'Borrow film language: “dolly-in”, “aerial”, “handheld”, “35mm” — it responds well to camera terms.',
      'Keep generations to one shot each; stitch shots in an editor.',
      'If access is unavailable on your account, check Google\u2019s official page for current rollout options.',
    ],
    pros: ['High-quality cinematic output', 'Strong prompt understanding', 'Available inside Google tools you may already use'],
    limitations: ['Access and limits depend on Google plans and region', 'Short clips, usage-limited generation'],
    faqs: [
      { question: 'Is Veo free?', answer: 'Access depends on your Google account and subscriptions — availability has varied over time, so check the official Google page for current options.' },
      { question: 'What can Veo create?', answer: 'Short AI-generated video clips from text or image prompts, with strong cinematic quality.' },
      { question: 'How do beginners start?', answer: 'Open Gemini (or Google\u2019s video tool) where Veo is available and generate a single simple shot, like a nature close-up, before complex scenes.' },
    ],
  }),
};
