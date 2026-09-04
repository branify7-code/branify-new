// SEO Tools — 15 tool definitions for the BRANIFY free-tools engine.
// Every tool runs 100% client-side. Import style follows ./types + ./helpers.
import type { ToolDefinition } from './types';
import { num, str, bool } from './types';
import { fmtNum, kv, bullet, titleCase, isStopword, fleschReadingEase } from './helpers';

/* ------------------------- local mini-utils ------------------------- */

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const xmlEscape = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const truncate = (s: string, n: number): string =>
  s.length <= n ? s : s.slice(0, Math.max(0, n - 1)).trimEnd() + '…';

const join = (lines: (string | number)[]): string => lines.map(String).join('\n');

const stripWww = (host: string): string => host.toLowerCase().replace(/^www\./, '');

/** Reduce a hostname to its root (last two labels) — naive for multi-part TLDs. */
const rootDomain = (host: string): string => {
  const h = stripWww(host);
  const labels = h.split('.').filter(Boolean);
  return labels.length > 2 ? labels.slice(-2).join('.') : h;
};

/* ============================== TOOLS ============================== */

export const seoTools: ToolDefinition[] = [
  /* 1 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'meta-title-description-gen',
    fields: [
      { name: 'brand', label: 'Brand Name', type: 'text', default: 'BRANIFY' },
      { name: 'keyword', label: 'Primary Keyword', type: 'text', default: 'Web Development', hint: 'The search phrase this page should rank for.' },
      { name: 'valueProp', label: 'Unique Value Prop', type: 'text', default: 'conversion-focused websites for ambitious brands' },
      {
        name: 'pageType', label: 'Page Type', type: 'select', default: 'Service',
        options: [
          { value: 'Home', label: 'Home' },
          { value: 'Service', label: 'Service' },
          { value: 'Product', label: 'Product' },
          { value: 'Blog', label: 'Blog' },
          { value: 'Landing', label: 'Landing' },
        ],
      },
    ],
    run: (ctx) => {
      const brand = str(ctx.values.brand, 'BRANIFY').trim() || 'BRANIFY';
      const keyword = str(ctx.values.keyword, 'Web Development').trim() || 'Web Development';
      const valueProp = str(ctx.values.valueProp, 'conversion-focused websites for ambitious brands').trim();
      const pageType = str(ctx.values.pageType, 'Service');

      // Title: richest candidate that still fits a brand suffix inside 60 chars.
      const candidates = [
        `${titleCase(keyword)} ${pageType} — ${valueProp}`,
        `${titleCase(keyword)} ${pageType} for Growing Brands`,
        `${titleCase(keyword)} ${pageType}`,
      ];
      let title = '';
      for (const c of candidates) {
        const withBrand = `${c} | ${brand}`;
        if (withBrand.length <= 60) { title = withBrand; break; }
      }
      if (!title) title = candidates[candidates.length - 1].slice(0, 60).trimEnd();

      // Description: greedy fill toward the 150–160 sweet spot, hard-capped at 160.
      let desc = `${brand} delivers ${keyword.toLowerCase()} ${pageType.toLowerCase()} built around ${valueProp || 'your goals'}.`;
      const suffixes = [
        ' Fast delivery and measurable results.',
        ' Free audit.',
        ' Trusted by 100+ brands.',
        ' Book your free strategy call today.',
        ' Built to rank and convert.',
      ];
      for (const s of suffixes) {
        if (desc.length + s.length <= 160) desc += s;
        if (desc.length >= 155) break;
      }
      if (desc.length > 160) desc = desc.slice(0, 160).replace(/\s+\S*$/, '').trimEnd();

      const keywordsMeta = `${keyword}, ${keyword} ${pageType.toLowerCase()}, ${brand}`;
      const titleOk = title.length <= 60;
      const descOk = desc.length >= 150 && desc.length <= 160;

      const output = join([
        kv('Brand', brand),
        kv('Page type', pageType),
        kv('Primary keyword', keyword),
        '',
        bullet('Meta title', `"${title}" — ${title.length}/60 chars ${titleOk ? 'PASS' : 'TOO LONG'}`),
        bullet('Meta description', `${desc.length}/160 chars ${descOk ? 'PASS — inside the 150–160 target' : desc.length < 150 ? '— below the 150-char target' : 'TOO LONG'}`),
        '',
        'COPY-PASTE SNIPPET',
        `<title>${escapeHtml(title)}</title>`,
        `<meta name="description" content="${escapeHtml(desc)}" />`,
        `<meta name="keywords" content="${escapeHtml(keywordsMeta)}" />`,
      ]);
      return { output, note: 'Title is capped at 60 characters; the description fills greedily toward 150–160.' };
    },
  },

  /* 2 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'serp-snippet-preview',
    fields: [
      { name: 'pageTitle', label: 'Page Title', type: 'text', default: 'Custom Web Development & Digital Agency | BRANIFY' },
      { name: 'url', label: 'Page URL', type: 'text', default: 'https://branify.store' },
      { name: 'description', label: 'Meta Description', type: 'textarea', rows: 3, default: 'Award-winning web development studio building fast, conversion-focused websites for ambitious brands.' },
    ],
    run: (ctx) => {
      const title = str(ctx.values.pageTitle, 'Custom Web Development & Digital Agency | BRANIFY').trim() || '(no title)';
      const url = str(ctx.values.url, 'https://branify.store').trim() || '(no url)';
      const desc = str(ctx.values.description, '').trim() || '(no description)';

      const titleState = title.length <= 60 ? (title.length > 55 ? 'PASS (truncation risk above 55)' : 'PASS') : `TOO LONG (${title.length}/60)`;
      const descState = desc.length <= 160 ? (desc.length < 70 ? 'PASS (a bit short — aim for 120+)' : 'PASS') : `TOO LONG (${desc.length}/160)`;

      const output = join([
        bullet('Title length', `${title.length}/60 — ${titleState}`),
        bullet('Description length', `${desc.length}/160 — ${descState}`),
        '',
        'GOOGLE DESKTOP PREVIEW',
        `Title: ${title}`,
        `URL: ${url}`,
        `Description: ${desc}`,
        '',
        'GOOGLE MOBILE PREVIEW',
        `Title: ${truncate(title, 60)}`,
        `URL: ${url}`,
        `Description: ${truncate(desc, 120)}`,
      ]);
      return { output, note: 'Google rewrites ~60% of titles; keep the keyword near the front.' };
    },
  },

  /* 3 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'keyword-density-checker-seo',
    fields: [
      {
        name: 'content', label: 'Page Content', type: 'textarea', rows: 8,
        default:
          'Effective web design shapes how customers judge your brand within seconds. Clean layouts, fast load times, and clear navigation keep visitors exploring your pages instead of bouncing back to search results. Strong typography and generous whitespace guide every eye toward the actions that matter most.\n' +
          '\n' +
          'Investing in professional web design pays off through higher conversion rates, stronger search visibility, and a consistent brand experience across every device. Treat each page as a salesperson: it should load quickly, answer questions clearly, and confidently guide visitors toward booking a call or requesting a quote.',
      },
      { name: 'keyword', label: 'Focus Keyword', type: 'text', default: 'web design', hint: 'Multi-word phrases are supported.' },
    ],
    run: (ctx) => {
      const content = str(ctx.values.content, '');
      const keyword = str(ctx.values.keyword, 'web design').trim().toLowerCase().replace(/\s+/g, ' ');

      const tokens = content.toLowerCase().match(/[a-z0-9']+/g) ?? [];
      const total = tokens.length;
      const unique = new Set(tokens).size;

      let count = 0;
      if (keyword) {
        const hay = content.toLowerCase().replace(/\s+/g, ' ');
        let idx = hay.indexOf(keyword);
        while (idx !== -1) { count++; idx = hay.indexOf(keyword, idx + keyword.length); }
      }
      const density = total ? (count / total) * 100 : 0;
      const status =
        density < 0.5 ? 'LOW — consider adding the keyword naturally once or twice more.'
        : density <= 2.5 ? 'HEALTHY — inside the natural 0.5–2.5% range.'
        : 'RISK — keyword stuffing territory; prune repeated mentions.';

      const freq = new Map<string, number>();
      for (const t of tokens) {
        const w = t.replace(/^'+|'+$/g, '');
        if (w.length < 3 || isStopword(w)) continue;
        freq.set(w, (freq.get(w) ?? 0) + 1);
      }
      const top = [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5);

      const output = join([
        kv('Keyword analyzed', keyword || '—'),
        '',
        bullet('Total words', total),
        bullet('Unique words', unique),
        bullet(`Matches for "${keyword}"`, count),
        bullet('Keyword density', `${fmtNum(density, 2)}%`),
        bullet('Status', status),
        '',
        'TOP 5 WORDS (STOPWORDS EXCLUDED)',
        ...top.map(([w, c], i) => `${i + 1}. ${w} — ${c}× (${fmtNum(total ? (c / total) * 100 : 0, 1)}%)`),
      ]);
      return { output, note: 'Density is match count divided by total word count.' };
    },
  },

  /* 4 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'robots-txt-generator',
    fields: [
      {
        name: 'policy', label: 'Crawl Policy', type: 'select', default: 'allow',
        options: [
          { value: 'allow', label: 'Allow all' },
          { value: 'block', label: 'Block all' },
          { value: 'admin', label: 'Block /admin + /cart' },
          { value: 'custom', label: 'Custom rules below' },
        ],
      },
      { name: 'sitemapUrl', label: 'Sitemap URL', type: 'text', default: 'https://branify.store/sitemap.xml' },
      { name: 'customRules', label: 'Custom Directives', type: 'textarea', rows: 3, default: 'Disallow: /private/\nDisallow: /tmp/', hint: 'One directive per line — used only when policy = Custom.' },
      { name: 'blockAI', label: 'Block AI crawlers (GPTBot, ClaudeBot, CCBot, Google-Extended)', type: 'checkbox', default: true },
      { name: 'crawlDelay', label: 'Crawl-delay (seconds, 0 = omit)', type: 'number', default: 0, min: 0, max: 30, step: 1 },
    ],
    run: (ctx) => {
      const policy = str(ctx.values.policy, 'allow');
      const sitemap = str(ctx.values.sitemapUrl, 'https://branify.store/sitemap.xml').trim();
      const blockAI = bool(ctx.values.blockAI, true);
      const delay = Math.min(30, Math.max(0, Math.round(num(ctx.values.crawlDelay, 0))));
      const customRules = str(ctx.values.customRules, '').split('\n').map((l) => l.trim()).filter(Boolean);

      const main = ['User-agent: *'];
      if (delay > 0) main.push(`Crawl-delay: ${delay}`);
      if (policy === 'allow') main.push('Allow: /');
      else if (policy === 'block') main.push('Disallow: /');
      else if (policy === 'admin') main.push('Disallow: /admin', 'Disallow: /cart', 'Allow: /');
      else main.push(...(customRules.length ? customRules : ['Disallow: /private/']));

      const groups: string[] = [main.join('\n')];
      if (blockAI && policy !== 'block') {
        for (const bot of ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot']) {
          groups.push(`User-agent: ${bot}\nDisallow: /`);
        }
      }
      if (sitemap) groups.push(`Sitemap: ${sitemap}`);

      return {
        output: groups.join('\n\n'),
        note: policy === 'block' ? 'Uploading this blocks the whole site — use staging only.' : 'Upload as /robots.txt at your domain root.',
      };
    },
  },

  /* 5 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'sitemap-xml-generator-helper',
    fields: [
      {
        name: 'urls', label: 'URLs (one per line)', type: 'textarea', rows: 6,
        default: 'https://branify.store/\nhttps://branify.store/services\nhttps://branify.store/free-tools',
      },
      {
        name: 'changefreq', label: 'Change Frequency', type: 'select', default: 'weekly',
        options: [
          { value: 'daily', label: 'daily' },
          { value: 'weekly', label: 'weekly' },
          { value: 'monthly', label: 'monthly' },
        ],
      },
      { name: 'priority', label: 'Priority (0–1)', type: 'number', default: 0.8, min: 0, max: 1, step: 0.1 },
    ],
    run: (ctx) => {
      const urls = str(ctx.values.urls, '').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
      const freq = str(ctx.values.changefreq, 'weekly');
      const priority = Math.min(1, Math.max(0, num(ctx.values.priority, 0.8)));
      const today = new Date().toISOString().split('T')[0];

      const entries = urls
        .map((u) =>
          join([
            '  <url>',
            `    <loc>${xmlEscape(u)}</loc>`,
            `    <lastmod>${today}</lastmod>`,
            `    <changefreq>${freq}</changefreq>`,
            `    <priority>${priority}</priority>`,
            '  </url>',
          ])
        )
        .join('\n');

      const output = join([
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        entries,
        '</urlset>',
      ]);
      return { output, note: `${urls.length} URL(s) encoded. Submit this file in Google Search Console → Sitemaps.` };
    },
  },

  /* 6 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'schema-markup-organization',
    fields: [
      { name: 'orgName', label: 'Organization Name', type: 'text', default: 'BRANIFY' },
      { name: 'orgUrl', label: 'Website URL', type: 'text', default: 'https://branify.store' },
      { name: 'logoUrl', label: 'Logo URL', type: 'text', default: 'https://branify.store/brand/branify-logo.png', hint: 'PNG/SVG, min 112×112px.' },
      { name: 'sameAs', label: 'Social Profiles (comma-separated)', type: 'text', default: 'https://www.instagram.com/branify, https://x.com/branify, https://www.linkedin.com/company/branify' },
    ],
    run: (ctx) => {
      const name = str(ctx.values.orgName, 'BRANIFY').trim() || 'BRANIFY';
      const url = (str(ctx.values.orgUrl, 'https://branify.store').trim() || 'https://branify.store').replace(/\/$/, '');
      const logo = str(ctx.values.logoUrl, '').trim();
      const sameAs = str(ctx.values.sameAs, '').split(',').map((s) => s.trim()).filter(Boolean);

      const obj: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url,
      };
      if (logo) obj.logo = logo;
      if (sameAs.length) obj.sameAs = sameAs;
      obj.contactPoint = {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${url}/contact`,
      };

      const output = join([
        '<script type="application/ld+json">',
        JSON.stringify(obj, null, 2),
        '</script>',
      ]);
      return { output, note: 'Paste into the <head> of your homepage, then validate at validator.schema.org.' };
    },
  },

  /* 7 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'schema-faq-generator',
    fields: [
      {
        name: 'faq', label: 'Q:/A: Pairs (one per line)', type: 'textarea', rows: 8,
        default:
          'Q: What services does BRANIFY offer?\n' +
          'A: BRANIFY builds websites, brand identities, and growth systems — from custom web development to SEO and AI-powered automation.\n' +
          '\n' +
          'Q: How long does a typical project take?\n' +
          'A: Most marketing sites launch in 2–4 weeks, while larger platforms are scoped milestone-by-milestone during the discovery call.',
      },
    ],
    run: (ctx) => {
      const raw = str(ctx.values.faq, '');
      const items: { q: string; a: string }[] = [];
      for (const rawLine of raw.split('\n')) {
        const line = rawLine.trim();
        if (!line) continue;
        if (/^q\s*[:：]/i.test(line)) {
          items.push({ q: line.replace(/^q\s*[:：]\s*/i, ''), a: '' });
        } else if (/^a\s*[:：]/i.test(line)) {
          const last = items[items.length - 1];
          if (last) last.a = last.a ? `${last.a} ${line.replace(/^a\s*[:：]\s*/i, '')}` : line.replace(/^a\s*[:：]\s*/i, '');
        } else if (items.length) {
          const last = items[items.length - 1];
          if (!last.a && !last.q) last.q = line;
          else if (!last.a) last.q = `${last.q} ${line}`;
          else last.a = `${last.a} ${line}`;
        }
      }
      const valid = items.filter((i) => i.q && i.a);
      if (!valid.length) {
        return {
          output: join([
            '⚠ Could not parse any Q:/A: pairs.',
            '',
            'FORMAT GUIDE',
            'Q: Your question here?',
            'A: Your answer here.',
            '(Leave a blank line between pairs. Multi-line answers: repeat the A: prefix.)',
          ]),
          note: 'Each question needs exactly one Q: line and at least one A: line.',
        };
      }

      const obj = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: valid.map((v) => ({
          '@type': 'Question',
          name: v.q,
          acceptedAnswer: { '@type': 'Answer', text: v.a },
        })),
      };
      const output = join([
        '<script type="application/ld+json">',
        JSON.stringify(obj, null, 2),
        '</script>',
      ]);
      return { output, note: `${valid.length} question(s) encoded. FAQ rich results now show mainly for authoritative health/gov sites — markup is still worth shipping.` };
    },
  },

  /* 8 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'open-graph-tag-gen',
    fields: [
      { name: 'ogTitle', label: 'Title', type: 'text', default: 'Custom Web Development & Digital Agency | BRANIFY' },
      { name: 'ogDescription', label: 'Description', type: 'textarea', rows: 3, default: 'Award-winning web development studio building fast, conversion-focused websites for ambitious brands.' },
      { name: 'ogImage', label: 'Image URL (1200×630)', type: 'text', default: 'https://branify.store/og-cover.png' },
      { name: 'ogUrl', label: 'Page URL', type: 'text', default: 'https://branify.store' },
      { name: 'ogSiteName', label: 'Site Name', type: 'text', default: 'BRANIFY' },
      { name: 'ogHandle', label: 'Twitter Handle', type: 'text', default: '@branify' },
    ],
    run: (ctx) => {
      const title = str(ctx.values.ogTitle, '').trim();
      const desc = str(ctx.values.ogDescription, '').trim();
      const image = str(ctx.values.ogImage, '').trim();
      const pageUrl = str(ctx.values.ogUrl, '').trim();
      const siteName = str(ctx.values.ogSiteName, '').trim();
      const handle = str(ctx.values.ogHandle, '').trim();

      const meta = (attr: 'property' | 'name', key: string, content: string): string =>
        `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;

      const output = join([
        meta('property', 'og:title', title),
        meta('property', 'og:description', desc),
        meta('property', 'og:image', image),
        meta('property', 'og:url', pageUrl),
        meta('property', 'og:type', 'website'),
        meta('property', 'og:site_name', siteName),
        meta('name', 'twitter:card', 'summary_large_image'),
        meta('name', 'twitter:site', handle),
        meta('name', 'twitter:title', title),
        meta('name', 'twitter:description', desc),
        meta('name', 'twitter:image', image),
      ]);
      return { output, note: 'Paste inside <head>. Ideal og:image is 1200×630px, under 5MB.' };
    },
  },

  /* 9 ───────────────────────────────────────────────────────────────── */
  {
    slug: 'redirect-htaccess-gen',
    fields: [
      {
        name: 'redirects', label: 'Redirect Pairs (old-path new-url, one per line)', type: 'textarea', rows: 4,
        default: '/old-home https://branify.store/\n/services/web-design https://branify.store/services',
      },
      { name: 'oldDomain', label: 'Old Domain', type: 'text', default: 'https://old-site.com', hint: 'Used for the catch-all fallback rule.' },
    ],
    run: (ctx) => {
      const raw = str(ctx.values.redirects, '');
      const oldDomain = str(ctx.values.oldDomain, 'https://old-site.com').trim();

      const rules: string[] = [];
      let firstTargetOrigin = '';
      for (const line of raw.split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const parts = t.split(/\s+/);
        if (parts.length < 2) continue;
        let oldPath = parts[0];
        const target = parts[1];
        if (/^https?:\/\//i.test(oldPath)) {
          try { oldPath = new URL(oldPath).pathname; } catch { /* keep raw path */ }
        }
        if (!oldPath.startsWith('/')) oldPath = `/${oldPath}`;
        if (!firstTargetOrigin && /^https?:\/\//i.test(target)) {
          try { firstTargetOrigin = new URL(target).origin; } catch { /* ignore */ }
        }
        rules.push(`Redirect 301 ${oldPath} ${target}`);
      }

      let oldHost = oldDomain;
      try { oldHost = new URL(oldDomain).host; } catch { oldHost = oldDomain.replace(/^https?:\/\//i, ''); }
      const hostEscaped = oldHost.replace(/\./g, '\\.');
      const fallbackOrigin = firstTargetOrigin || 'https://branify.store';

      const output = join([
        '<IfModule mod_rewrite.c>',
        'RewriteEngine On',
        '',
        ...(rules.length ? rules : ['# (add one "old-path new-url" pair per line above)']),
        '',
        '# Fallback: any other request to the old domain lands on the new site',
        `RewriteCond %{HTTP_HOST} ^${hostEscaped}$ [NC]`,
        `RewriteRule ^(.*)$ ${fallbackOrigin}/$1 [R=301,L]`,
        '</IfModule>',
      ]);
      return { output, note: 'Test with curl -I before deploying — conflicting rules can cause redirect loops.' };
    },
  },

  /* 10 ──────────────────────────────────────────────────────────────── */
  {
    slug: 'canonical-tag-gen',
    fields: [
      { name: 'pageUrl', label: 'Canonical Page URL', type: 'text', default: 'https://branify.store/tools', placeholder: 'https://branify.store/services/web-development' },
      { name: 'forceSlash', label: 'Force trailing slash', type: 'checkbox', default: false },
    ],
    run: (ctx) => {
      let url = str(ctx.values.pageUrl, 'https://branify.store/tools').trim() || 'https://branify.store/tools';
      const force = bool(ctx.values.forceSlash, false);
      if (force && !url.endsWith('/')) url = `${url}/`;

      const output = join([
        `<link rel="canonical" href="${escapeHtml(url)}" />`,
        '',
        bullet('What this does', 'Tells search engines this exact URL is the preferred, indexable version.'),
        bullet('Placement', 'Inside <head>, before the closing </head> tag.'),
        bullet('One per page', 'Never output multiple canonical tags — conflicting signals cancel each other out.'),
        bullet('Trailing slash', force ? 'Forced ON — href ends with "/".' : 'Left exactly as entered.'),
        bullet('Pair with', 'Internal links and sitemap entries pointing at the same canonical URL.'),
      ]);
      return { output, note: 'Self-referencing canonicals are recommended even on unique pages.' };
    },
  },

  /* 11 ──────────────────────────────────────────────────────────────── */
  {
    slug: 'header-tag-structure-checker',
    fields: [
      {
        name: 'html', label: 'HTML to Inspect', type: 'textarea', rows: 10,
        default:
          '<h1>Custom Web Development Services</h1>\n' +
          '<h3>Conversion-Focused Design</h3>\n' +
          '<h2>Why Brands Choose BRANIFY</h2>\n' +
          '<h4>Wireframes &amp; Prototypes</h4>\n' +
          '<h2>Our Development Process</h2>\n' +
          '<h1>Portfolio Highlights</h1>',
      },
    ],
    run: (ctx) => {
      const html = str(ctx.values.html, '');
      const re = /<h([1-6])[^>]*>(.*?)<\/h\1>/gis;
      const headings: { level: number; text: string }[] = [];
      for (const m of html.matchAll(re)) {
        const text = m[2]
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/\s+/g, ' ')
          .trim();
        headings.push({ level: Number(m[1]), text });
      }

      if (!headings.length) {
        return {
          output: join(['⚠ No <h1>–<h6> tags found in the input.', '', bullet('Tip', 'Paste the rendered HTML of your page (View Source → copy the body).')]),
        };
      }

      const counts = new Array(7).fill(0) as number[];
      for (const h of headings) counts[h.level]++;

      const h1Count = counts[1];
      const skipped: string[] = [];
      for (let i = 1; i < headings.length; i++) {
        const prev = headings[i - 1];
        const cur = headings[i];
        if (cur.level > prev.level + 1) skipped.push(`H${prev.level} jumps to H${cur.level} after "${truncate(prev.text || '(empty)', 30)}"`);
      }
      const emptyCount = headings.filter((h) => !h.text).length;
      const headingWords = headings.reduce((acc, h) => acc + (h.text ? h.text.split(/\s+/).length : 0), 0);
      const overall = h1Count === 1 && !skipped.length && !emptyCount ? 'PASS' : 'NEEDS FIXES';

      const output = join([
        'HEADING OUTLINE',
        ...headings.map((h) => `${'  '.repeat(h.level - 1)}H${h.level}: ${h.text || '(empty)'}`),
        '',
        bullet('Heading counts', [...Array.from({ length: 6 }, (_, i) => (counts[i + 1] ? `H${i + 1}×${counts[i + 1]}` : ''))].filter(Boolean).join('  ')),
        bullet('Single H1', h1Count === 1 ? 'PASS' : `FAIL (found ${h1Count})`),
        ...(skipped.length ? skipped.map((s) => bullet('Skipped level', s)) : [bullet('Skipped levels', 'PASS — none found')]),
        bullet('Empty headings', emptyCount ? `FAIL (${emptyCount} empty tag(s))` : 'PASS'),
        bullet('Heading word count', `${headingWords} words across ${headings.length} headings`),
        bullet('Overall', overall),
      ]);
      return { output, note: 'Best practice: exactly one H1, and never skip more than one level downward.' };
    },
  },

  /* 12 ──────────────────────────────────────────────────────────────── */
  {
    slug: 'alt-text-generator-guide',
    fields: [
      { name: 'subject', label: 'Image Subject', type: 'text', default: 'luxury gold logo mockup' },
      {
        name: 'context', label: 'Context / Page Type', type: 'select', default: 'E-commerce',
        options: [
          { value: 'E-commerce', label: 'E-commerce' },
          { value: 'Blog', label: 'Blog' },
          { value: 'Portfolio', label: 'Portfolio' },
        ],
      },
      { name: 'includeKeyword', label: 'Include exact keyword in suggestion 1', type: 'checkbox', default: true },
    ],
    run: (ctx) => {
      const subject = str(ctx.values.subject, 'luxury gold logo mockup').trim() || 'product photo';
      const context = str(ctx.values.context, 'E-commerce');
      const includeKeyword = bool(ctx.values.includeKeyword, true);
      const S = titleCase(subject);

      const banks: Record<string, string[]> = {
        'E-commerce': [
          `${S} product photo on a neutral studio background`,
          `${S} shown from a three-quarter angle with soft lighting`,
          `Close-up detail of ${subject} highlighting the premium finish`,
          `${S} styled with minimal props for an online store listing`,
          `Packaging shot of ${subject} ready for shipping`,
        ],
        Blog: [
          `${S} featured image for an in-depth article`,
          `Step-by-step preview showing how ${subject} is made`,
          `Annotated diagram explaining the parts of ${subject}`,
          `${S} example used in a real case study`,
          `Workspace flat-lay featuring ${subject} in progress`,
        ],
        Portfolio: [
          `${S} — full-resolution portfolio piece`,
          `Detail crop of ${subject} showing texture and finish`,
          `${S} presented in a dark gallery layout`,
          `Before-and-after comparison of ${subject}`,
          `${S} displayed on desktop and mobile mockups`,
        ],
      };

      const raw = banks[context] ?? banks['E-commerce'];
      const alts = includeKeyword ? [subject, ...raw.slice(1)] : raw;

      const output = join([
        kv('Subject', subject),
        kv('Context', context),
        '',
        'READY-TO-USE ALT TEXT',
        ...alts.map((a, i) => `${i + 1}. ${a} (${a.length} chars)`),
        '',
        'BEST-PRACTICE CHECKLIST',
        bullet('Length', 'Keep alt text under 125 characters — screen readers truncate long descriptions.'),
        bullet('Avoid', "Never start with 'image of' or 'picture of' — it is implied."),
        bullet('Be specific', 'Describe what is actually visible, not the feeling you want to evoke.'),
        bullet('Decorative images', 'Use alt="" for pure decoration so screen readers skip them.'),
        bullet('Keyword use', includeKeyword ? 'Suggestion 1 carries the exact keyword — never stuff it into every image.' : 'Add one keyword only where it fits naturally.'),
      ]);
      return { output, note: 'Alt text is a ranking factor for Google Images and required for WCAG AA.' };
    },
  },

  /* 13 ──────────────────────────────────────────────────────────────── */
  {
    slug: 'readability-score-checker',
    fields: [
      {
        name: 'content', label: 'Content to Score', type: 'textarea', rows: 8,
        default:
          'BRANIFY builds fast, conversion-focused websites for ambitious brands. Our team designs every page around one goal: turning curious visitors into paying customers. We combine clean code, sharp copywriting, and measurable search strategies so your marketing budget works harder. From the first wireframe to the final launch, you get clear timelines, honest pricing, and a partner who treats your growth like our own.',
      },
    ],
    run: (ctx) => {
      const content = str(ctx.values.content, '');
      const r = fleschReadingEase(content);
      const avgWords = r.words && r.sentences ? r.words / r.sentences : 0;
      const avgSyll = r.words ? r.syllables / r.words : 0;
      const verdict =
        r.score >= 60 ? 'EASY TO READ — great for general audiences.'
        : r.score >= 30 ? 'MODERATE — acceptable for informed B2B readers.'
        : 'DIFFICULT — simplify sentences and swap long words.';

      const output = join([
        kv('Content length', `${r.words} words / ${r.sentences} sentences`),
        '',
        bullet('Flesch Reading Ease', fmtNum(r.score, 1)),
        bullet('Grade level', r.grade),
        bullet('Words', r.words),
        bullet('Sentences', r.sentences),
        bullet('Syllables', r.syllables),
        bullet('Avg words/sentence', fmtNum(avgWords, 1)),
        bullet('Avg syllables/word', fmtNum(avgSyll, 2)),
        '',
        bullet('Verdict', verdict),
        ...(avgWords > 20 ? [bullet('Tip', `Sentences average ${fmtNum(avgWords, 1)} words — aim for 15–20 by splitting long ones.`)] : []),
        ...(r.score < 60 ? [bullet('Tip', 'Replace multi-syllable words with shorter ones to lift the score.')] : []),
      ]);
      return { output, note: 'Flesch = 206.835 − 1.015×(words/sentence) − 84.6×(syllables/word).' };
    },
  },

  /* 14 ──────────────────────────────────────────────────────────────── */
  {
    slug: 'domain-extractor-tool',
    fields: [
      {
        name: 'urls', label: 'URL List (one per line)', type: 'textarea', rows: 7,
        default:
          'https://branify.store/services\n' +
          'http://www.example.com/page?id=1&ref=x\n' +
          'https://blog.branify.store/seo-tips\n' +
          'www.shopify.com/pricing\n' +
          'not-a-valid-url',
      },
    ],
    run: (ctx) => {
      const rawLines = str(ctx.values.urls, '').split('\n').map((l) => l.trim()).filter(Boolean);

      const looksLikeDomain = (host: string): boolean => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host) && /\.[a-z]{2,}$/i.test(host);

      const extract = (raw: string): { domain: string; ok: boolean } => {
        let host = '';
        try { host = new URL(raw).hostname; } catch {
          try { host = new URL(`https://${raw}`).hostname; } catch {
            const m = raw.match(/([a-z0-9-]+\.)+[a-z]{2,}/i);
            host = m ? m[0] : '';
          }
        }
        host = host.toLowerCase();
        if (!host || !looksLikeDomain(host)) return { domain: '', ok: false };
        return { domain: rootDomain(host), ok: true };
      };

      const results = rawLines.map(extract);
      const okCount = results.filter((r) => r.ok).length;
      const invalidCount = results.length - okCount;
      const uniqueDomains = [...new Set(results.filter((r) => r.ok).map((r) => r.domain))];

      const output = join([
        kv('Lines processed', rawLines.length),
        '',
        'EXTRACTED ROOT DOMAINS',
        ...results.map((r, i) => (r.ok ? `${i + 1}. ${r.domain}` : `${i + 1}. (invalid) ${rawLines[i]}`)),
        '',
        bullet('Valid lines', okCount),
        bullet('Invalid lines', invalidCount),
        bullet('Unique domains', uniqueDomains.length),
        '',
        'UNIQUE DOMAIN LIST',
        ...uniqueDomains.map((d, i) => `${i + 1}. ${d}`),
      ]);
      return { output, note: 'Subdomains collapse to the root (blog.x.com → x.com). Multi-part TLDs like .co.uk are treated naively.' };
    },
  },

  /* 15 ──────────────────────────────────────────────────────────────── */
  {
    slug: 'google-index-link-builder',
    fields: [
      {
        name: 'urls', label: 'URLs to Inspect (one per line)', type: 'textarea', rows: 4,
        default: 'https://branify.store/\nhttps://branify.store/free-tools',
      },
    ],
    run: (ctx) => {
      const urls = str(ctx.values.urls, '').split('\n').map((l) => l.trim()).filter(Boolean);

      const blocks = urls.map((u, i) => {
        const stripped = u.replace(/^https?:\/\//i, '');
        const siteQuery = `site:${stripped}`;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(siteQuery)}`;
        const cacheUrl = `https://www.google.com/search?q=${encodeURIComponent(`cache:${stripped}`)}`;
        return join([
          `${i + 1}. ${u}`,
          `   Query: ${siteQuery}`,
          `   Search: ${searchUrl}`,
          `   Cache variant: ${cacheUrl}`,
        ]);
      });

      const output = join([
        ...blocks,
        '',
        bullet('Reading results', 'Zero results means not indexed (yet) — request indexing in Search Console.'),
        bullet('Next step', 'Open the links and compare with your expected pages.'),
      ]);
      return { output, note: 'site: shows what Google has indexed; cache: shows the last stored snapshot.' };
    },
  },
];
