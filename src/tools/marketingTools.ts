// Marketing Tools — 12 tool definitions for the BRANIFY free-tools engine.
// Every tool runs 100% client-side. Import style follows ./types + ./helpers.
import * as QRCode from 'qrcode';
import type { ToolDefinition } from './types';
import { num, str, bool } from './types';
import { kv, bullet, titleCase, pick } from './helpers';

/* ------------------------- local mini-utils ------------------------- */

const join = (lines: (string | number)[]): string => lines.map(String).join('\n');

const clampInt = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.round(v)));

const fillTemplate = (t: string, vars: Record<string, string>): string =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(v), t);

/* ============================== TOOLS ============================== */

export const marketingTools: ToolDefinition[] = [
  /* 1 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'utm-builder',
    fields: [
      { name: 'baseUrl', label: 'Base URL', type: 'text', default: 'https://branify.store/free-tools', placeholder: 'https://yourpage.com/landing' },
      { name: 'source', label: 'utm_source', type: 'text', default: 'instagram', hint: 'Where the traffic comes from: instagram, newsletter, google…' },
      { name: 'medium', label: 'utm_medium', type: 'text', default: 'social', hint: 'Marketing channel: social, cpc, email…' },
      { name: 'campaign', label: 'utm_campaign', type: 'text', default: 'summer_launch', hint: 'Campaign name: use_snake_case.' },
      { name: 'term', label: 'utm_term (optional)', type: 'text', default: '' },
      { name: 'content', label: 'utm_content (optional)', type: 'text', default: '', hint: 'Used to A/B test creatives.' },
    ],
    run: (ctx) => {
      const base = str(ctx.values.baseUrl, 'https://branify.store/free-tools').trim() || 'https://branify.store/free-tools';
      const source = str(ctx.values.source, 'instagram').trim();
      const medium = str(ctx.values.medium, 'social').trim();
      const campaign = str(ctx.values.campaign, 'summer_launch').trim();
      const term = str(ctx.values.term, '').trim();
      const content = str(ctx.values.content, '').trim();

      const params = new URLSearchParams();
      if (source) params.set('utm_source', source);
      if (medium) params.set('utm_medium', medium);
      if (campaign) params.set('utm_campaign', campaign);
      if (term) params.set('utm_term', term);
      const sep = base.includes('?') ? '&' : '?';
      const finalUrl = `${base}${sep}${params.toString()}`;

      const variantParams = new URLSearchParams(params);
      variantParams.set('utm_content', content || 'text_link');
      const variantUrl = `${base}${sep}${variantParams.toString()}`;

      const output = join([
        bullet('utm_source', source || '(empty)'),
        bullet('utm_medium', medium || '(empty)'),
        bullet('utm_campaign', campaign || '(empty)'),
        ...(term ? [bullet('utm_term', term)] : []),
        '',
        kv('Final tracking URL', finalUrl),
        kv('Variant with utm_content', variantUrl),
      ]);
      return { output, note: 'UTM values are case-sensitive in GA4 — keep one naming convention.' };
    },
  },

  /* 2 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'hashtag-generator-mkt',
    fields: [
      { name: 'topic', label: 'Topic / Niche', type: 'text', default: 'handmade jewelry', placeholder: 'branding, ecommerce, saas…' },
      {
        name: 'platform', label: 'Platform', type: 'select', default: 'instagram',
        options: [
          { value: 'instagram', label: 'Instagram' },
          { value: 'tiktok', label: 'TikTok' },
          { value: 'linkedin', label: 'LinkedIn' },
          { value: 'x', label: 'X (Twitter)' },
        ],
      },
      { name: 'count', label: 'How many hashtags', type: 'number', default: 30, min: 5, max: 60, step: 1 },
    ],
    run: (ctx) => {
      const topic = str(ctx.values.topic, 'handmade jewelry').trim() || 'handmade jewelry';
      const platform = str(ctx.values.platform, 'instagram');
      const count = clampInt(num(ctx.values.count, 30), 5, 60);

      const words = topic.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
      const phrase = words.join('');
      const topicTags = words.map((w) => `#${w}`);
      if (phrase) {
        topicTags.push(
          `#${phrase}`,
          `#${phrase}lover`,
          `#${phrase}gram`,
          `#${phrase}daily`,
          `#${phrase}addict`,
          `#${phrase}community`,
          `#${phrase}business`,
          `#${phrase}tips`,
          `#${phrase}oftheday`,
        );
      }
      const wordCombos = words.flatMap((w) => [`#${w}business`, `#${w}life`, `#${w}love`, `#${w}design`]);

      const banks: Record<string, string[]> = {
        instagram: ['#instagood', '#reels', '#explore', '#explorepage', '#viral', '#trending', '#photooftheday', '#smallbusiness', '#supportsmallbusiness', '#instadaily', '#contentcreator', '#madewithlove', '#styleinspo', '#shopsmall', '#creatorslife'],
        tiktok: ['#foryou', '#fyp', '#foryoupage', '#viral', '#trending', '#learnontiktok', '#tiktokmademebuyit', '#smallbusinesscheck', '#tiktokshop', '#behindthescenes', '#creatoreconomy', '#businessowner', '#dailyvlog', '#satisfying', '#musthaves'],
        linkedin: ['#smallbusiness', '#entrepreneur', '#leadership', '#marketing', '#businessgrowth', '#b2b', '#personalbranding', '#founders', '#startuplife', '#b2bmarketing', '#strategy', '#innovation', '#networking', '#careergrowth', '#businesstips'],
        x: ['#buildinpublic', '#startup', '#marketing', '#founders', '#tech', '#saas', '#growth', '#entrepreneur', '#smallbusiness', '#branding', '#seo', '#design', '#ai', '#creator', '#nocode'],
      };
      const generic = ['#growth', '#marketing', '#branding', '#tips', '#inspiration', '#goals', '#creators', '#smallbusiness'];

      const seen = new Set<string>();
      const tags: string[] = [];
      for (const t of [...topicTags, ...wordCombos, ...(banks[platform] ?? []), ...generic]) {
        if (!seen.has(t)) { seen.add(t); tags.push(t); }
        if (tags.length >= count) break;
      }

      const output = join([
        kv('Topic', topic),
        kv('Platform', platform),
        '',
        tags.join(' '),
        '',
        bullet('Hashtags generated', `${tags.length} (requested ${count})`),
        bullet('Mix', `${topicTags.length} topic-derived + platform evergreens + niche combos`),
        bullet('Tip', 'Rotate sets between posts — identical tag blocks on every post look spammy to the algorithm.'),
      ]);
      return { output, note: 'Instagram caps posts at 30 hashtags; 8–15 highly relevant tags often outperform max volume.' };
    },
  },

  /* 3 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'social-caption-hook-gen',
    fields: [
      { name: 'topic', label: 'Topic', type: 'text', default: 'website redesign services', placeholder: 'website redesign tips…' },
      {
        name: 'tone', label: 'Tone', type: 'select', default: 'bold',
        options: [
          { value: 'bold', label: 'Bold' },
          { value: 'friendly', label: 'Friendly' },
          { value: 'luxury', label: 'Luxury' },
          { value: 'educational', label: 'Educational' },
        ],
      },
    ],
    run: (ctx) => {
      const topic = str(ctx.values.topic, 'website redesign services').trim() || 'your topic';
      const tone = str(ctx.values.tone, 'bold');
      const year = String(new Date().getFullYear());

      const banks: Record<string, string[]> = {
        bold: [
          'Stop scrolling if you need {topic} that actually converts.',
          'Your competitors already invested in {topic}. Did you?',
          'Most {topic} advice is outdated. Here is what works in {year}.',
          'Nobody tells you this about {topic} — so I will.',
          'Unpopular opinion: {topic} is your biggest untapped growth lever.',
          'Read this before you spend another dollar on {topic}.',
          'The fastest win we ever shipped came from {topic}.',
          'You are one fix away from {topic} that finally performs.',
          'Forget everything you know about {topic}. Start here.',
          'Warning: {topic} done wrong costs more than doing nothing.',
        ],
        friendly: [
          'Looking for {topic} that finally feels easy? Start here.',
          'Quick one for anyone curious about {topic} today.',
          'We tried {topic} so you do not have to — here is the honest take.',
          'Small {topic} wins that made our whole week better.',
          'If {topic} feels overwhelming, this post is for you.',
          'Here is the friendly, no-jargon guide to {topic}.',
          'Ever wondered how {topic} actually works? Let me show you.',
          'Three tiny {topic} tweaks you can make before lunch.',
          'Come for the {topic} tips, stay for the behind-the-scenes.',
          'Your future self will thank you for reading this {topic} note.',
        ],
        luxury: [
          'Quiet luxury starts with {topic} done properly.',
          'Some things should never be rushed — {topic} is one of them.',
          'True craftsmanship shows in the details of {topic}.',
          'For those who expect more from {topic}.',
          'Elegance never fades — the same is true for {topic} built to last.',
          'Because exceptional {topic} is never an accident.',
          'Discreet, deliberate, and built to endure: our approach to {topic}.',
          'The standard for {topic} just changed. Meet it.',
          'Refined {topic} for brands that lead rather than follow.',
          'When only the finest {topic} will do.',
        ],
        educational: [
          'How {topic} works — explained in 60 seconds.',
          'The 3 rules of {topic} most beginners miss.',
          '{topic} 101: the only framework you need.',
          'Why does {topic} matter? Let the numbers answer.',
          'A common {topic} mistake (and the 2-minute fix).',
          'Save this checklist before your next {topic} project.',
          'What nobody teaches you about {topic} in school.',
          'Here is exactly how professionals approach {topic}.',
          'The difference between good and great {topic}, visualized.',
          'One chart that finally makes {topic} click.',
        ],
      };

      const hooks = (banks[tone] ?? banks.bold).map((t) => fillTemplate(t, { topic, year }));
      const toneLabel = { bold: 'Bold', friendly: 'Friendly', luxury: 'Luxury', educational: 'Educational' }[tone] ?? 'Bold';

      const output = join([
        kv('Topic', topic),
        kv('Tone', toneLabel),
        '',
        ...hooks.map((h, i) => `${i + 1}. ${h}`),
        '',
        bullet('Tip', 'The hook is the first line only — put the payoff in the body and exactly one CTA at the end.'),
      ]);
      return { output, note: 'Re-run for a fresh set — pair hooks with a strong first frame for Reels/Shorts.' };
    },
  },

  /* 4 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'email-subject-line-tester',
    fields: [
      { name: 'subject', label: 'Email Subject Line', type: 'text', default: '🎉 LAST CHANCE: 50% Off Ends Tonight!!', placeholder: 'Claim your 30% discount on web branding today!' },
    ],
    run: (ctx) => {
      const subject = str(ctx.values.subject, '🎉 LAST CHANCE: 50% Off Ends Tonight!!').trim() || '(empty subject)';
      const lower = subject.toLowerCase();

      // 1. Length (30–50 ideal) — max 25 pts
      const len = subject.length;
      const lengthScore = len >= 30 && len <= 50 ? 25 : (len >= 20 && len <= 59 ? 15 : 5);
      const lengthState = len >= 30 && len <= 50 ? 'PASS (30–50 ideal)' : len < 30 ? `WARN — short (${len} chars)` : `WARN — long (${len} chars, mobile truncates ~35)`;

      // 2. Spam trigger words — max 25 pts
      const spamList = ['free', 'guarantee', 'act now', 'last chance', '50% off', 'limited', 'winner', 'cash', 'urgent', 'risk-free', 'click here', 'buy now', 'congratulations', '100% off'];
      const hits = spamList.filter((w) => lower.includes(w));
      const spamScore = hits.length === 0 ? 25 : hits.length === 1 ? 12 : hits.length === 2 ? 5 : 0;

      // 3. ALL-CAPS word ratio — max 20 pts
      const wordTokens = subject.match(/[A-Za-z0-9'’]+/g) ?? [];
      const letterWords = wordTokens.filter((w) => /[A-Za-z]/.test(w));
      const capsWords = letterWords.filter((w) => w.length >= 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
      const capsRatio = letterWords.length ? capsWords.length / letterWords.length : 0;
      const capsScore = capsRatio <= 0.2 ? 20 : capsRatio <= 0.4 ? 10 : 0;
      const capsState = capsRatio <= 0.2 ? 'PASS' : capsRatio <= 0.4 ? 'WARN' : 'FAIL';

      // 4. Exclamation marks — max 15 pts
      const exclam = (subject.match(/!/g) ?? []).length;
      const exclamScore = exclam <= 1 ? 15 : exclam === 2 ? 7 : 0;

      // 5. Emoji count — max 15 pts
      const emojis = subject.match(/\p{Extended_Pictographic}/gu) ?? [];
      const emojiScore = emojis.length <= 2 ? 15 : emojis.length <= 4 ? 8 : 0;

      // 6. Personalization bonus (+5, capped at 100)
      const hasToken = /\{\{?\s*\w+\s*\}?\}|%recipient|\$first_name/i.test(subject);
      const score = Math.min(100, lengthScore + spamScore + capsScore + exclamScore + emojiScore + (hasToken ? 5 : 0));
      const verdict = score >= 80 ? 'EXCELLENT' : score >= 60 ? 'GOOD — minor fixes' : score >= 40 ? 'NEEDS WORK' : 'HIGH SPAM RISK';

      // Improved variant: de-spam, de-shout, de-exclaim (deterministic).
      let improved = subject
        .replace(/act now/gi, 'reply today')
        .replace(/last chance/gi, 'final hours')
        .replace(/50% off/gi, 'half price')
        .replace(/\bfree\b/gi, 'complimentary')
        .replace(/guarantee/gi, 'promise')
        .replace(/urgent/gi, 'time-sensitive')
        .replace(/\bwinner\b/gi, 'top pick')
        .replace(/\bcash\b/gi, 'rewards')
        .replace(/\blimited\b/gi, 'exclusive');
      improved = improved.replace(/\b[A-Z]{2,}\b/g, (w) => titleCase(w));
      improved = improved.replace(/!{2,}/g, '!');
      if ((improved.match(/\p{Extended_Pictographic}/gu) ?? []).length > 2) {
        improved = improved.replace(/\p{Extended_Pictographic}/gu, '').trim();
      }
      const firstLetter = improved.search(/[A-Za-z]/);
      if (firstLetter > -1) improved = improved.slice(0, firstLetter) + improved[firstLetter].toUpperCase() + improved.slice(firstLetter + 1);

      const output = join([
        kv('Subject', subject),
        kv('Length', `${len} chars`),
        '',
        bullet('Length check', lengthState),
        bullet('Spam words', hits.length ? `FAIL — ${hits.length} found: ${hits.join(', ')}` : 'PASS — none found'),
        bullet('ALL-CAPS ratio', `${Math.round(capsRatio * 100)}% (${capsWords.length}/${letterWords.length} words) — ${capsState}`),
        bullet('Exclamation marks', `${exclam} — ${exclam <= 1 ? 'PASS' : exclam === 2 ? 'WARN' : 'FAIL'}`),
        bullet('Emoji count', `${emojis.length} — ${emojis.length <= 2 ? 'PASS' : 'WARN'}`),
        bullet('Personalization token', hasToken ? 'PASS — token found (+5 bonus)' : 'WARN — consider {{first_name}} for a lift'),
        bullet('Overall score', `${score}/100 — ${verdict}`),
        '',
        `Suggested improvement: ${improved}`,
      ]);
      return { output, note: 'Scoring is heuristic — when in doubt, A/B test the two strongest variants.' };
    },
  },

  /* 5 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'cta-button-copy-gen',
    fields: [
      {
        name: 'goal', label: 'Conversion Goal', type: 'select', default: 'signup',
        options: [
          { value: 'signup', label: 'Sign up' },
          { value: 'buy', label: 'Buy now' },
          { value: 'call', label: 'Book a call' },
          { value: 'download', label: 'Download' },
          { value: 'subscribe', label: 'Subscribe' },
        ],
      },
      { name: 'keyword', label: 'Product / Offer Keyword', type: 'text', default: 'free audit', placeholder: 'Free Strategy Call, Instant Download…' },
    ],
    run: (ctx) => {
      const goal = str(ctx.values.goal, 'signup');
      const kw = str(ctx.values.keyword, 'free audit').trim() || 'your offer';

      const banks: Record<string, { urgency: string[]; benefit: string[]; friction: string[] }> = {
        signup: {
          urgency: ['Get Started Now', 'Claim Your Spot Today', 'Start Free — Today Only', 'Join Before Doors Close'],
          benefit: ['Start Growing Free', `Unlock ${titleCase(kw)}`, 'Get Instant Access'],
          friction: ['Sign Up in 30 Seconds', 'No Card Needed', 'Try It Free'],
        },
        buy: {
          urgency: ['Buy Now — Limited Batch', `Grab ${titleCase(kw)} Today`, 'Order Before Midnight', 'Last Few Left — Order Now'],
          benefit: [`Get ${titleCase(kw)} Today`, 'Upgrade My Setup', 'Own It in Minutes'],
          friction: ['One-Click Checkout', 'Free Returns', 'Secure Checkout'],
        },
        call: {
          urgency: ['Book My Call Today', 'Reserve Your Slot Now', 'Only 3 Slots This Week', 'Talk to an Expert Today'],
          benefit: [`Get My ${titleCase(kw)}`, 'Get Expert Eyes on It', 'Leave With a Plan'],
          friction: ['15 Minutes, No Prep', 'Free — No Strings', 'Pick a Time in 2 Clicks'],
        },
        download: {
          urgency: ['Download Instantly', `Get the ${titleCase(kw)} Now`, 'Save My Copy Today', 'Grab It Before It Closes'],
          benefit: [`Steal the ${titleCase(kw)}`, 'Start Fixing Things Today', 'Get the Full Playbook'],
          friction: ['No Email Needed', 'Instant PDF Access', 'One Tap Download'],
        },
        subscribe: {
          urgency: ['Subscribe Today', 'Lock In My Plan', 'Founding Price Ends Soon', 'Join Now'],
          benefit: [`Get ${titleCase(kw)} Weekly`, 'Start Saving Today', 'Never Miss an Issue'],
          friction: ['Cancel Anytime', '1-Minute Setup', 'No Commitment'],
        },
      };

      const group = banks[goal] ?? banks.signup;
      const goalLabels: Record<string, string> = { signup: 'Sign up', buy: 'Buy now', call: 'Book a call', download: 'Download', subscribe: 'Subscribe' };
      const entries = [
        { group: 'URGENCY', items: group.urgency },
        { group: 'BENEFIT-LED', items: group.benefit },
        { group: 'LOW-FRICTION', items: group.friction },
      ];

      let n = 0;
      const out: (string | number)[] = [kv('Goal', goalLabels[goal] ?? goal), kv('Keyword', kw), ''];
      for (const g of entries) {
        out.push(g.group);
        for (const label of g.items) {
          n++;
          const fit = label.length <= 25 ? '' : ' — over 25, shorten';
          out.push(`${n}. ${label}  (${label.length} chars${fit})`);
        }
        out.push('');
      }
      out.push(bullet('A/B tip', 'Test urgency vs. low-friction on a 50/50 split — wait for 200+ clicks per arm before calling a winner.'));
      return { output: join(out.slice(0, -1)), note: 'Button copy under 25 characters avoids wrapping on mobile.' };
    },
  },

  /* 6 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'content-idea-generator',
    fields: [
      { name: 'niche', label: 'Niche', type: 'text', default: 'AI productivity tools', placeholder: 'Shopify development, AI automation…' },
      {
        name: 'format', label: 'Format', type: 'select', default: 'any',
        options: [
          { value: 'any', label: 'Any' },
          { value: 'blog', label: 'Blog' },
          { value: 'video', label: 'Video' },
        ],
      },
    ],
    run: (ctx) => {
      const niche = str(ctx.values.niche, 'AI productivity tools').trim() || 'your niche';
      const format = str(ctx.values.format, 'any');
      const year = String(new Date().getFullYear());
      const N = niche;
      const Nc = titleCase(niche);

      const blogBank = [
        `7 ${N} Mistakes That Cost You Clients`,
        `The Beginner's Guide to ${N}`,
        `How I Used ${N} to 3x Output`,
        `${Nc}: What Actually Works in ${year}`,
        `5 ${N} Tools We Use Every Single Day`,
        `Why Your ${N} Strategy Is Failing (and the Fix)`,
        `The Hidden Cost of Ignoring ${N}`,
        `${Nc} vs. the Old Way: an Honest Comparison`,
        `Case Study: 30 Days of ${N}`,
        `Stop Doing ${N} Like It Is 2019`,
        `The Ultimate ${Nc} Checklist for Busy Teams`,
        `What Nobody Tells You About ${N}`,
      ];
      const videoBank = [
        `I Tried ${N} for 30 Days — Here Is What Happened`,
        `${Nc} in 60 Seconds`,
        `Build a ${N} System With Me`,
        `Reacting to the Worst ${N} Advice Online`,
        `3 ${N} Hacks That Feel Like Cheating`,
        `My Exact ${Nc} Setup (Full Tour)`,
        `${Nc}: Before and After`,
        `The ${Nc} Mistake Everyone Makes on Camera`,
        `From Zero to ${Nc} in One Weekend`,
        `Answering Your Top ${Nc} Questions`,
      ];

      const pool =
        format === 'blog' ? blogBank
        : format === 'video' ? videoBank
        : blogBank.flatMap((b, i) => (videoBank[i] ? [b, videoBank[i]] : [b]));
      const ideas = pool.slice(0, 10);
      const formatLabel = { any: 'Any', blog: 'Blog', video: 'Video' }[format] ?? 'Any';

      const output = join([
        kv('Niche', niche),
        kv('Format', formatLabel),
        '',
        ...ideas.map((t, i) => `${i + 1}. ${t}`),
        '',
        bullet('Bonus', `Turn ideas 1, 2, and 11 into a pillar page: one long "${Nc}: The Complete Guide" post that links out to every cluster article.`),
      ]);
      return { output, note: 'Batch-write intros for all 10 in one sitting — momentum beats perfection.' };
    },
  },

  /* 7 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'ad-copy-framework-gen',
    fields: [
      { name: 'product', label: 'Product / Service', type: 'text', default: 'conversion-focused website package' },
      { name: 'audience', label: 'Target Audience', type: 'text', default: 'growing e-commerce brands' },
      { name: 'pain', label: 'Main Pain Point', type: 'text', default: 'a slow, outdated site that leaks sales' },
      {
        name: 'framework', label: 'Framework', type: 'select', default: 'pas',
        options: [
          { value: 'pas', label: 'PAS (Problem–Agitate–Solve)' },
          { value: 'aida', label: 'AIDA (Attention–Interest–Desire–Action)' },
          { value: 'both', label: 'Both' },
        ],
      },
    ],
    run: (ctx) => {
      const product = str(ctx.values.product, 'conversion-focused website package').trim() || 'your offer';
      const audience = str(ctx.values.audience, 'your audience').trim() || 'your audience';
      const pain = str(ctx.values.pain, 'lost revenue').trim() || 'lost revenue';
      const framework = str(ctx.values.framework, 'pas');

      const agitateBank = [
        `It compounds: every extra day with ${pain} trains customers to shop elsewhere — and they rarely come back on their own.`,
        `Meanwhile your competitors run the same traffic into a page that converts — the gap widens every single week.`,
        `The scariest part? Most of ${pain} never shows up as an error — it just quietly taxes every session.`,
      ];
      const attentionBank = [
        `Your site has about 3 seconds to prove it deserves the click. Most never make it past hello.`,
        `You only get one first impression per visitor — and ${pain} burns through it in seconds.`,
        `Attention is the most expensive traffic cost, and ${pain} wastes it at the door.`,
      ];
      const actionBank = [
        'Book your free audit today — slots are capped each month.',
        'Start with a free audit — the first report lands within 48 hours.',
        'Claim your free audit — it costs nothing but 15 minutes.',
      ];

      const pas = join([
        'PAS FRAMEWORK',
        '',
        `PROBLEM: ${audience} are losing money to ${pain}. Traffic arrives and intent is real — but the experience lets buyers slip away before the value lands.`,
        '',
        `AGITATE: ${pick(agitateBank)}`,
        '',
        `SOLUTION: ${product} is built to erase ${pain} — fast load times, sharp messaging, and conversion architecture proven with ${audience}. You see before/after numbers, not vague promises.`,
        '',
        `NEXT STEP: ${pick(actionBank)}`,
      ]);

      const aida = join([
        'AIDA FRAMEWORK',
        '',
        `ATTENTION: ${pick(attentionBank)}`,
        '',
        `INTEREST: ${product} was designed for ${audience} — one senior team owning strategy, design, and build so nothing gets lost in handoffs.`,
        '',
        `DESIRE: Picture ${pain} gone: pages load instantly, the message clicks in seconds, and your dashboard shows revenue climbing month over month.`,
        '',
        `ACTION: ${pick(actionBank)}`,
      ]);

      const frameworkLabel = { pas: 'PAS', aida: 'AIDA', both: 'PAS + AIDA' }[framework] ?? 'PAS';
      const body = framework === 'pas' ? pas : framework === 'aida' ? aida : join([pas, '', '──────────────', '', aida]);

      const output = join([
        kv('Framework', frameworkLabel),
        kv('Product', product),
        kv('Audience', audience),
        kv('Pain point', pain),
        '',
        body,
      ]);
      return { output, note: 'Re-run to remix the pick() phrases, then tighten to your brand voice.' };
    },
  },

  /* 8 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'bio-generator-social',
    fields: [
      { name: 'name', label: 'Name / Brand', type: 'text', default: 'BRANIFY' },
      { name: 'profession', label: 'Profession', type: 'text', default: 'Web Development Agency' },
      {
        name: 'platform', label: 'Platform', type: 'select', default: 'instagram',
        options: [
          { value: 'instagram', label: 'Instagram (150 chars)' },
          { value: 'x', label: 'X / Twitter (160 chars)' },
          { value: 'linkedin', label: 'LinkedIn (~220 chars)' },
        ],
      },
      { name: 'emoji', label: 'Add emojis', type: 'checkbox', default: false },
    ],
    run: (ctx) => {
      const name = str(ctx.values.name, 'BRANIFY').trim() || 'BRANIFY';
      const profession = str(ctx.values.profession, 'Web Development Agency').trim() || 'Digital Agency';
      const platform = str(ctx.values.platform, 'instagram');
      const emoji = bool(ctx.values.emoji, false);

      const limits: Record<string, { max: number; label: string }> = {
        instagram: { max: 150, label: 'Instagram (150 chars)' },
        x: { max: 160, label: 'X / Twitter (160 chars)' },
        linkedin: { max: 220, label: 'LinkedIn (~220 chars)' },
      };
      const limit = limits[platform] ?? limits.instagram;

      const e1 = emoji ? ' 🚀' : '';
      const e2 = emoji ? ' ✨' : '';
      const e3 = emoji ? ' 💬' : '';
      const variants = [
        `${name} | ${profession}${e1} Fast, conversion-focused digital experiences that turn clicks into customers.`,
        `${profession} for ambitious brands.${e2} Design · Code · Growth. Free audit — link below.`,
        `We help brands win online.${e3} ${profession} · Trusted worldwide. DM "GROW" to start.`,
      ];

      const output = join([
        kv('Platform', limit.label),
        kv('Name', name),
        kv('Profession', profession),
        '',
        ...variants.flatMap((v, i) => [
          `${i + 1}. ${v}`,
          bullet(`Variant ${i + 1} length`, `${v.length}/${limit.max} — ${v.length <= limit.max ? 'PASS' : 'TOO LONG'}`),
        ]),
        '',
        bullet('Tip', 'Front-load the value — mobile profiles truncate everything after the first line.'),
      ]);
      return { output, note: 'Line separators: use the "·" character or real line breaks when pasting into your profile.' };
    },
  },

  /* 9 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'tagline-slogan-generator',
    fields: [
      { name: 'brand', label: 'Brand Name', type: 'text', default: 'BRANIFY' },
      { name: 'industry', label: 'Industry', type: 'text', default: 'digital agency' },
      {
        name: 'style', label: 'Style', type: 'select', default: 'luxury',
        options: [
          { value: 'luxury', label: 'Luxury' },
          { value: 'bold', label: 'Bold' },
          { value: 'minimal', label: 'Minimal' },
          { value: 'playful', label: 'Playful' },
        ],
      },
    ],
    run: (ctx) => {
      const brand = str(ctx.values.brand, 'BRANIFY').trim() || 'BRANIFY';
      const industry = str(ctx.values.industry, 'digital agency').trim() || 'digital agency';
      const style = str(ctx.values.style, 'luxury');

      const banks: Record<string, string[]> = {
        luxury: [
          '{brand}. Built Different.',
          'Where {industry} Becomes an Art.',
          'The Standard in {industry}.',
          'Quietly Exceptional. Unmistakably {brand}.',
          'Crafted for Brands That Lead.',
          '{brand} — Excellence, by Design.',
          'Beyond {industry}. Beyond Expectation.',
          'For Those Who Accept Nothing Less.',
          'Timeless {industry}. Modern Edge.',
          '{brand}. The Final Word in {industry}.',
        ],
        bold: [
          "{brand} Doesn't Follow. We Lead.",
          'Dominate {industry}. Own the Market.',
          'No Excuses. Just Results.',
          '{brand} — Built to Win.',
          'Stop Blending In. Start Scaling.',
          "We Don't Do Average.",
          'Attack the Market. Win the Customer.',
          '{brand}: Relentless by Default.',
          'Big Goals. Bigger Execution.',
          'Your {industry}. Your Rules.',
        ],
        minimal: [
          'Simply {brand}.',
          '{brand}. Nothing More Needed.',
          'Less Noise. More {brand}.',
          '{industry}, Distilled.',
          'Just {brand}.',
          "Everything You Need. Nothing You Don't.",
          '{brand} — Made Simple.',
          'The Essential {industry} Partner.',
          'Clean. Clear. {brand}.',
          'Less, But Better — {brand}.',
        ],
        playful: [
          '{brand} — Serious Results, Zero Boring.',
          'Warning: May Cause Growth Spurts.',
          'We Make {industry} Fun Again.',
          '{brand}: Like Coffee, but for Growth.',
          'Click Us. Thank Us Later.',
          'Small Team. Giant Ideas.',
          '{brand} — Boring Is Not in Our Vocabulary.',
          'Making {industry} Slightly Smug Since Day One.',
          'Good Vibes. Great {industry}.',
          'Fast, Friendly, Slightly Show-Offy — {brand}.',
        ],
      };

      const styleLabel = { luxury: 'Luxury', bold: 'Bold', minimal: 'Minimal', playful: 'Playful' }[style] ?? 'Luxury';
      const slogans = (banks[style] ?? banks.luxury).map((t) => fillTemplate(t, { brand, industry }));

      const output = join([
        kv('Brand', brand),
        kv('Industry', industry),
        kv('Style', styleLabel),
        '',
        ...slogans.map((s, i) => `${i + 1}. ${s}`),
        '',
        bullet('Tip', 'Say the top 3 out loud — a tagline must survive being spoken, not just read.'),
      ]);
      return { output, note: 'Re-run for a fresh batch; mix styles before shortlisting.' };
    },
  },

  /* 10 ──────────────────────────────────────────────────────────────── */
  {
    slug: 'qr-code-utm-builder',
    fields: [
      { name: 'url', label: 'Destination URL', type: 'text', default: 'https://branify.store/free-tools' },
      { name: 'source', label: 'utm_source', type: 'text', default: 'print' },
      { name: 'medium', label: 'utm_medium', type: 'text', default: 'offline' },
      { name: 'campaign', label: 'utm_campaign', type: 'text', default: 'qr_flyer' },
      { name: 'size', label: 'QR Size (px)', type: 'number', default: 250, min: 100, max: 1000, step: 50 },
      { name: 'fill', label: 'Fill Color', type: 'text', default: '#000000' },
      { name: 'bg', label: 'Background Color', type: 'text', default: '#ffffff' },
    ],
    run: async (ctx) => {
      const base = str(ctx.values.url, 'https://branify.store/free-tools').trim() || 'https://branify.store/free-tools';
      const source = str(ctx.values.source, 'print').trim() || 'print';
      const medium = str(ctx.values.medium, 'offline').trim() || 'offline';
      const campaign = str(ctx.values.campaign, 'qr_flyer').trim() || 'qr_flyer';
      const size = clampInt(num(ctx.values.size, 250), 100, 1000);
      const fill = str(ctx.values.fill, '#000000').trim() || '#000000';
      const bg = str(ctx.values.bg, '#ffffff').trim() || '#ffffff';

      const params = new URLSearchParams({ utm_source: source, utm_medium: medium, utm_campaign: campaign });
      const tracked = `${base}${base.includes('?') ? '&' : '?'}${params.toString()}`;

      const context = join([
        bullet('Tracked URL', tracked),
        bullet('UTM source / medium / campaign', `${source} / ${medium} / ${campaign}`),
        bullet('QR spec', `${size}px, margin 2, error correction M`),
        bullet('Colors', `${fill} on ${bg}`),
      ]);

      try {
        const dataUrl = await QRCode.toDataURL(tracked, {
          width: size,
          margin: 2,
          color: { dark: fill, light: bg },
          errorCorrectionLevel: 'M',
        });
        return {
          output: context,
          imageDataUrl: dataUrl,
          downloadName: 'branify-utm-qr.png',
          downloadMime: 'image/png',
          note: 'Scans resolve to the tracked URL — every scan lands in GA4 as print/offline traffic.',
        };
      } catch {
        return {
          output: join([context, '', 'QR rendering unavailable — use the URL above with any QR generator.']),
          note: 'QR rendering unavailable — use the URL with any QR generator.',
        };
      }
    },
  },

  /* 11 ──────────────────────────────────────────────────────────────── */
  {
    slug: 'target-audience-persona-gen',
    fields: [
      { name: 'product', label: 'Product / Service', type: 'text', default: 'premium web design service' },
      {
        name: 'market', label: 'Market', type: 'select', default: 'b2b_startup',
        options: [
          { value: 'b2b_startup', label: 'B2B Startups' },
          { value: 'b2b_enterprise', label: 'B2B Enterprise' },
          { value: 'local', label: 'Local Business' },
          { value: 'ecommerce', label: 'E-commerce' },
        ],
      },
      { name: 'tone', label: 'Tone', type: 'text', default: 'Professional' },
    ],
    run: (ctx) => {
      const product = str(ctx.values.product, 'premium web design service').trim() || 'your product';
      const market = str(ctx.values.market, 'b2b_startup');
      const tone = str(ctx.values.tone, 'Professional').trim() || 'Professional';

      const banks: Record<string, {
        names: string[]; roles: string[]; age: string; style: string;
        pains: string[]; goals: string[]; objections: string[];
        channels: string; price: string;
      }> = {
        b2b_startup: {
          names: ['Alex Carter', 'Maya Chen', 'Jordan Blake', 'Priya Nair'],
          roles: ['Founder & CEO', 'Co-founder / Head of Growth', 'Startup CMO'],
          age: '28–40, urban or remote-first',
          style: 'Fast, data-first, allergic to fluff',
          pains: [
            'Burns weeks wrangling freelancers instead of shipping product',
            'The site converts poorly, so paid-acquisition CAC keeps climbing',
            'The brand looks less credible than the product actually is',
          ],
          goals: [
            'Launch a site that earns investor and customer trust in one visit',
            'Convert more of existing traffic before buying more of it',
            'One accountable partner instead of five vendors',
          ],
          objections: [
            '"Agencies are too slow for our sprint cadence"',
            '"We could rebuild it in-house with a template"',
            '"Cash is tight — prove ROI in the first quarter"',
          ],
          channels: 'LinkedIn and X, founder communities, podcast recommendations, proof-heavy cold email',
          price: 'High — needs milestone pricing and a fast payback story',
        },
        b2b_enterprise: {
          names: ['Daniel Reyes', 'Karen Whitfield', 'Marcus Lee', 'Anita Sharma'],
          roles: ['VP of Digital', 'Head of Brand', 'Director of Marketing'],
          age: '35–50, metro business districts',
          style: 'Risk-averse, process-driven, needs stakeholders on board',
          pains: [
            'Legacy CMS slows every campaign to a crawl',
            'Brand consistency breaks across regional teams',
            'Procurement cycles stall simple improvements for months',
          ],
          goals: [
            'Modernize without disrupting live revenue funnels',
            'Consolidate vendors under one senior partner',
            'Report measurable lift to the steering committee each quarter',
          ],
          objections: [
            '"Security and compliance review will be painful"',
            '"We already have a preferred-supplier list"',
            '"The last agency overpromised and underdelivered"',
          ],
          channels: 'LinkedIn, industry conferences, analyst reports, peer referrals',
          price: 'Medium — RFP comparisons matter more than sticker price',
        },
        local: {
          names: ['Tom Becker', 'Rosa Delgado', 'Sam Okafor', 'Nina Petrov'],
          roles: ['Owner / Operator', 'Store Manager', 'Franchise Owner'],
          age: '35–55, local metro area',
          style: 'Practical, results-now, suspicious of jargon',
          pains: [
            'Google profile and site are outdated, so calls go to competitors',
            'No time to manage ads, reviews, and bookings personally',
            'Every agency quote feels built for big-city budgets',
          ],
          goals: [
            'Rank in the local map pack for the services they actually sell',
            'Fill the calendar or floor without discounting',
            'One monthly report in plain language',
          ],
          objections: [
            '"Marketing never worked for us before"',
            '"I can get a nephew to build a site for free"',
            '"Contracts scare me — I want month-to-month"',
          ],
          channels: 'Google Business Profile, Facebook community groups, local sponsorships, word of mouth',
          price: 'High — flat monthly packages with visible quick wins win the deal',
        },
        ecommerce: {
          names: ['Lily Nguyen', 'Chris Fontaine', 'Zara Ahmed', 'Owen Clarke'],
          roles: ['E-commerce Director', 'DTC Brand Manager', 'Head of Retention'],
          age: '27–42, nationally distributed',
          style: 'Metric-obsessed, test-everything, platform fluent',
          pains: [
            'Mobile checkout leaks carts at the payment step',
            'Product pages underperform despite healthy ad spend',
            'Site speed tanked after every new app install',
          ],
          goals: [
            'Lift conversion rate without raising ad budget',
            'Speed up Core Web Vitals across the catalog',
            'Turn one-time buyers into subscription customers',
          ],
          objections: [
            '"A redesign risks breaking our best-selling funnels"',
            '"Our platform has limits — prove you know it"',
            '"Show me the A/B numbers from similar stores"',
          ],
          channels: 'Shopify/agency partner directories, X, e-commerce newsletters, case-study search',
          price: 'Medium — performance guarantees or rev-share models stand out',
        },
      };

      const b = banks[market] ?? banks.b2b_startup;
      const marketLabel = { b2b_startup: 'B2B Startups', b2b_enterprise: 'B2B Enterprise', local: 'Local Business', ecommerce: 'E-commerce' }[market] ?? 'B2B Startups';
      const name = pick(b.names);
      const role = pick(b.roles);

      const output = join([
        `BUYER PERSONA: ${name} — ${role}`,
        kv('Market', marketLabel),
        kv('Tone', tone),
        kv('Product evaluated', product),
        kv('Age range', b.age),
        kv('Decision style', b.style),
        '',
        'CORE PAIN POINTS',
        ...b.pains.map((p, i) => `${i + 1}. ${p}`),
        '',
        'GOALS',
        ...b.goals.map((g, i) => `${i + 1}. ${g}`),
        '',
        'OBJECTIONS',
        ...b.objections.map((o, i) => `${i + 1}. ${o}`),
        '',
        'BEST CHANNELS',
        b.channels,
        '',
        'PRICE SENSITIVITY',
        b.price,
      ]);
      return { output, note: 'Re-run for a different name/role; keep 2–3 personas max per product line.' };
    },
  },

  /* 12 ──────────────────────────────────────────────────────────────── */
  {
    slug: 'review-request-email-builder',
    fields: [
      { name: 'business', label: 'Business Name', type: 'text', default: 'BRANIFY' },
      { name: 'customer', label: 'Customer Name', type: 'text', default: 'Sarah' },
      { name: 'topic', label: 'Project / Review Topic', type: 'text', default: 'the new e-commerce website' },
      {
        name: 'channel', label: 'Review Channel', type: 'select', default: 'google',
        options: [
          { value: 'google', label: 'Google' },
          { value: 'trustpilot', label: 'Trustpilot' },
        ],
      },
    ],
    run: (ctx) => {
      const business = str(ctx.values.business, 'BRANIFY').trim() || 'BRANIFY';
      const customer = str(ctx.values.customer, 'Sarah').trim() || 'there';
      const topic = str(ctx.values.topic, 'the new e-commerce website').trim() || 'the project';
      const channel = str(ctx.values.channel, 'google');

      const link =
        channel === 'trustpilot'
          ? `https://www.trustpilot.com/review/${business.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
          : 'https://g.page/r/review';
      const channelLabel = channel === 'trustpilot' ? 'Trustpilot' : 'Google';

      const output = join([
        kv('Business', business),
        kv('Channel', channelLabel),
        kv('Review link', link),
        '',
        `Subject: ${customer}, one quick favor?`,
        '',
        `Hi ${customer},`,
        '',
        `Thank you again for trusting ${business} with ${topic}. It was a genuine pleasure to bring it to life with you, and we hope it is already paying for itself.`,
        '',
        `Honest reviews are what help teams like yours find us when they need this work most — and they take less than a minute to write.`,
        '',
        'If you have 60 seconds, would you share a short review of your experience?',
        link,
        '',
        `Either way, thank you for choosing ${business}. We are one message away whenever you need us again.`,
        '',
        'With gratitude,',
        `${business} Team`,
        '',
        `PS: Your feedback on ${topic} doesn't just help us — it helps the next team decide with confidence. Thank you, ${customer}!`,
      ]);
      return { output, note: 'Replace the placeholder link with your real review URL before sending; send 2–5 days after delivery.' };
    },
  },
];
