// =============================================================================
// BRANIFY ADMIN — Blog SEO audit + readability engine (pure functions)
// -----------------------------------------------------------------------------
// Every score is derived from REAL, explainable checks — nothing random.
// The resulting number is an ON-PAGE COMPLETENESS score: it does NOT predict
// Google rankings and must never be presented as such.
// =============================================================================

import { extractHeadings, htmlToPlainText, type HeadingInfo } from '../../lib/sanitizeHtml';

export interface AuditSeoInput {
  title: string;
  description: string;
  focus_keyword: string;
  keywords: string[];
  canonical: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_image: string;
  robots: string;
}

export interface BlogAuditInput {
  title: string;
  slug: string;
  excerpt: string;
  /** SANITIZED article html */
  contentHtml: string;
  seo: AuditSeoInput;
  coverImage: string;
  /** Other existing posts (for duplicate warnings) */
  otherPosts: Array<{ slug: string; title: string; description: string }>;
}

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface AuditCheck {
  id: string;
  label: string;
  status: CheckStatus;
  weight: number;
  detail: string;
}

export interface ReadabilityReport {
  flesch: number | null;
  level: string;
  avgSentenceWords: number;
  longSentences: number;
  sentences: number;
  paragraphs: number;
  longParagraphs: Array<{ preview: string; words: number }>;
}

export interface BlogAuditReport {
  checks: AuditCheck[];
  score: number;
  label: 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical';
  words: number;
  chars: number;
  readingTimeMin: number;
  headings: HeadingInfo[];
  images: { total: number; missingAlt: number };
  links: { internal: number; external: number; brokenHint: string[] };
  readability: ReadabilityReport;
  duplicates: { slug: boolean; title: boolean; description: boolean };
  warnings: string[];
}

// ------------------------------------------------------------------ helpers
const SITE_HOST = 'branify.store';

function words(text: string): string[] {
  return (text || '').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
}

function countSentences(text: string): number {
  const matches = text.match(/[^.!?]+[.!?]+/g);
  const rest = text.replace(/[^.!?]+[.!?]+/g, '').trim();
  return (matches?.length || 0) + (rest ? 1 : 0);
}

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

function occurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(esc.replace(/\s+/g, '\\s+'), 'gi');
  return (haystack.match(re) || []).length;
}

// ------------------------------------------------------------------ main
export function analyzeArticle(input: BlogAuditInput): BlogAuditReport {
  const { title, slug, excerpt, seo, coverImage } = input;
  const bodyText = htmlToPlainText(input.contentHtml);
  const wordList = words(bodyText);
  const wordCount = wordList.length;
  const charCount = bodyText.length;
  const lowerBody = bodyText.toLowerCase();
  const kw = (seo.focus_keyword || '').trim().toLowerCase();

  // ---- structure
  const headings = extractHeadings(input.contentHtml);
  const h2 = headings.filter((h) => h.level === 2);
  const paras = input.contentHtml ? (input.contentHtml.match(/<p[\s>]/gi) || []).length : 0;

  // ---- images / links
  let imgTotal = 0;
  let imgMissingAlt = 0;
  let internal = 0;
  let external = 0;
  const brokenHint: string[] = [];
  try {
    const doc = new DOMParser().parseFromString(input.contentHtml, 'text/html');
    doc.querySelectorAll('img').forEach((img) => {
      imgTotal += 1;
      if (!(img.getAttribute('alt') || '').trim()) imgMissingAlt += 1;
      const src = img.getAttribute('src') || '';
      if (!src) brokenHint.push('image with empty src');
    });
    doc.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (!href || href === '#' || href.startsWith('javascript:')) {
        brokenHint.push(`link "${(a.textContent || '').trim().slice(0, 40) || href}" has no usable href`);
        return;
      }
      if (href.startsWith('/') || href.startsWith('#') || href.includes(SITE_HOST)) internal += 1;
      else if (/^https?:\/\//i.test(href)) external += 1;
    });
  } catch { /* parse guard */ }

  // ---- readability
  const sentences = Math.max(1, countSentences(bodyText));
  const avgSentenceWords = Math.round((wordCount / sentences) * 10) / 10;
  const longSentences = (bodyText.match(/[^.!?]+[.!?]+/g) || [bodyText])
    .filter((s) => words(s).length >= 30).length;
  let syllableTotal = 0;
  for (const w of wordList) syllableTotal += syllables(w);
  const flesch = wordCount > 0 && syllableTotal > 0
    ? Math.round((206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllableTotal / wordCount)) * 10) / 10
    : null;
  const fleschLevel = flesch === null ? '—'
    : flesch >= 70 ? 'Easy (grade ~6-7)'
    : flesch >= 60 ? 'Plain English (grade ~8-9)'
    : flesch >= 50 ? 'Fairly difficult (grade ~10-12)'
    : 'Difficult (college level)';

  // long paragraphs (first 64 chars as identifier)
  const longParagraphs: Array<{ preview: string; words: number }> = [];
  try {
    const doc = new DOMParser().parseFromString(input.contentHtml, 'text/html');
    doc.querySelectorAll('p').forEach((p) => {
      const text = (p.textContent || '').replace(/\s+/g, ' ').trim();
      const w = words(text).length;
      if (w > 120) longParagraphs.push({ preview: text.slice(0, 64) + '…', words: w });
    });
  } catch { /* parse guard */ }

  const readability: ReadabilityReport = {
    flesch,
    level: fleschLevel,
    avgSentenceWords,
    longSentences,
    sentences,
    paragraphs: paras,
    longParagraphs: longParagraphs.slice(0, 5),
  };

  // ---- duplicates
  const otherPosts = input.otherPosts || [];
  const norm = (s: string) => (s || '').trim().toLowerCase();
  const seoTitle = norm(seo.title || title);
  const duplicates = {
    slug: otherPosts.some((p) => p.slug === slug),
    title: otherPosts.some((p) => norm(p.title) === seoTitle && seoTitle !== ''),
    description: Boolean(norm(seo.description)) &&
      otherPosts.some((p) => norm(p.description) === norm(seo.description)),
  };

  // ---- keyword placement
  const firstChunk = bodyText.slice(0, Math.max(220, Math.floor(bodyText.length * 0.12))).toLowerCase();
  const kwInHeadings = headings.filter((h) => h.text.toLowerCase().includes(kw)).length;
  const kwTotal = kw ? occurrences(lowerBody, kw) : 0;
  const density = kw && wordCount > 0 ? (kwTotal / wordCount) * 100 : 0;

  // ---- og/twitter effective values (with fallbacks)
  const ogTitleOk = Boolean(seo.og_title || title);
  const ogDescOk = Boolean(seo.og_description || excerpt);
  const ogImageOk = Boolean(seo.og_image || coverImage);
  const twitterImageOk = Boolean(seo.twitter_image || seo.og_image || coverImage);

  const slugWords = (slug || '').split('-').filter(Boolean);
  const slugReadable = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug || '') && slugWords.length >= 2;

  // ---- checks (weights are relative; score is normalized to 100)
  const checks: AuditCheck[] = [];
  const add = (id: string, label: string, status: CheckStatus, weight: number, detail: string) =>
    checks.push({ id, label, status, weight, detail });

  add('seo_title', 'SEO title present', seo.title ? 'pass' : 'fail', 8,
    seo.title ? 'On-page title tag is set.' : 'No SEO title — the post title will be used, but set a tailored one.');

  if (!seo.title) add('seo_title_len', 'SEO title length (30-60 chars)', 'fail', 8, 'Title is empty.');
  else {
    const len = seo.title.length;
    add('seo_title_len', 'SEO title length (30-60 chars)',
      len >= 30 && len <= 60 ? 'pass' : len <= 70 && len >= 20 ? 'warn' : 'fail', 8,
      `${len} characters. Google typically displays ~50-60.`);
  }

  add('focus_keyword', 'Focus keyword configured', kw ? 'pass' : 'fail', 8,
    kw ? `Focus keyword: “${seo.focus_keyword}”.` : 'Set one primary keyword to guide the article.');

  add('kw_in_title', 'Keyword in SEO title', kw
    ? (seo.title.toLowerCase().includes(kw) ? 'pass' : 'warn')
    : 'warn', 6, kw ? '' : 'Configure a focus keyword first.');

  add('meta_desc', 'Meta description present', seo.description ? 'pass' : 'fail', 8,
    seo.description ? '' : 'Missing — search results will fall back to page content.');

  if (!seo.description) add('meta_desc_len', 'Meta description length (120-160 chars)', 'fail', 8, 'Description is empty.');
  else {
    const len = seo.description.length;
    add('meta_desc_len', 'Meta description length (120-160 chars)',
      len >= 120 && len <= 160 ? 'pass' : len >= 80 && len <= 170 ? 'warn' : 'fail', 8, `${len} characters.`);
  }

  add('kw_in_desc', 'Keyword in meta description', kw
    ? (seo.description.toLowerCase().includes(kw) ? 'pass' : 'warn')
    : 'warn', 4, '');

  add('kw_in_intro', 'Keyword in first paragraph', kw
    ? (firstChunk.includes(kw) ? 'pass' : 'warn')
    : 'warn', 8, kw && !firstChunk.includes(kw) ? 'Mention the keyword naturally near the top.' : '');

  add('kw_in_headings', 'Keyword in H2/H3 headings', kw
    ? (kwInHeadings > 0 ? 'pass' : 'warn')
    : 'warn', 6, kw && kwInHeadings === 0 ? 'At least one subheading naming the topic helps readers scan.' : '');

  if (!kw) add('kw_density', 'Keyword usage is natural', 'warn', 8, 'Configure a focus keyword to measure density.');
  else if (density > 3.5) add('kw_density', 'Keyword usage is natural', 'fail', 8,
    `${density.toFixed(1)}% — reads as keyword stuffing. Rewrite some mentions.`);
  else if (density < 0.3) add('kw_density', 'Keyword usage is natural', 'warn', 8,
    `${density.toFixed(1)}% — the topic barely appears. Mention it naturally a few times.`);
  else add('kw_density', 'Keyword usage is natural', 'pass', 8, `${density.toFixed(1)}% — natural range.`);

  add('kw_in_slug', 'Keyword in slug', kw ? (slug.includes(kw.replace(/\s+/g, '-')) || slug.includes(kw.replace(/\s+/g, '')) ? 'pass' : 'warn') : 'warn', 4, '');

  add('slug_readable', 'Readable slug (lowercase, hyphenated)',
    slugReadable ? 'pass' : (slug ? 'warn' : 'fail'), 4,
    slug ? `/${slug}/ — ${slugWords.length} word segment${slugWords.length === 1 ? ' (a little short)' : ''}.` : 'Slug is empty.');

  add('canonical', 'Canonical URL', (seo.canonical || slug) ? 'pass' : 'fail', 4,
    seo.canonical ? `Custom canonical: ${seo.canonical}` : slug ? 'Auto: https://branify.store/blog/<slug>.' : 'Add a slug so a canonical can resolve.');

  try {
    const doc = new DOMParser().parseFromString(input.contentHtml, 'text/html');
    const h1count = doc.querySelectorAll('h1').length;
    add('h1_unique', 'Single H1 (title renders as H1)', h1count === 0 ? 'pass' : 'warn', 4,
      h1count === 0 ? 'Article body uses H2/H3 below the page H1.' : `${h1count} H1 tag${h1count > 1 ? 's' : ''} inside the body — use H2/H3 instead.`);
  } catch { /* guard */ }

  add('h2_structure', 'H2/H3 structure', h2.length >= 2 ? 'pass' : h2.length === 1 ? 'warn' : 'fail', 8,
    `${h2.length} H2 · ${headings.length - h2.length} H3.`);

  add('content_length', 'Article depth (600+ words)',
    wordCount >= 600 ? 'pass' : wordCount >= 300 ? 'warn' : 'fail', 8,
    `${wordCount} words.`);

  add('internal_links', 'Internal links', internal >= 1 ? 'pass' : 'fail', 6,
    internal >= 1 ? `${internal} internal link${internal === 1 ? '' : 's'} — good for discovery.` : 'Link to at least one BRANIFY page (services, tools, portfolio…).');

  add('external_links', 'External references', external >= 1 ? 'pass' : 'warn', 2,
    external >= 1 ? `${external} outbound reference${external === 1 ? '' : 's'}.` : 'Citing 1-2 authoritative sources builds trust (optional).');

  add('inline_images', 'Inline images', imgTotal >= 1 ? 'pass' : 'warn', 2,
    imgTotal >= 1 ? `${imgTotal} inline image${imgTotal === 1 ? '' : 's'}.` : 'Break up long text with a relevant image.');

  if (imgTotal === 0) add('image_alt', 'Image alt text', 'warn', 6, 'No inline images to describe yet.');
  else if (imgMissingAlt === 0) add('image_alt', 'Image alt text', 'pass', 6, 'Every inline image has alt text.');
  else add('image_alt', 'Image alt text', 'fail', 6, `${imgMissingAlt} of ${imgTotal} image${imgTotal === 1 ? '' : 's'} missing alt text.`);

  add('featured_image', 'Featured (cover) image', coverImage ? 'pass' : 'fail', 4,
    coverImage ? '' : 'Listing cards, social shares and the article header use it.');

  add('og_meta', 'Open Graph metadata', ogTitleOk && ogDescOk && ogImageOk ? 'pass'
    : (ogTitleOk || ogDescOk || ogImageOk) ? 'warn' : 'fail', 6,
    ogTitleOk && ogDescOk && ogImageOk
      ? 'Set (custom fields or sensible fallbacks).'
      : 'Needs title, description and image (or post fallbacks).');

  add('twitter_image', 'Twitter/X card image', twitterImageOk ? 'pass' : 'warn', 2,
    twitterImageOk ? 'Falls back to OG image / cover when not set.' : 'Set an OG image or cover for the card.');

  // ---- score
  const maxWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.reduce((s, c) => s + (c.status === 'pass' ? c.weight : c.status === 'warn' ? c.weight * 0.5 : 0), 0);
  const score = Math.round((earned / maxWeight) * 100);
  const label = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 40 ? 'Needs Improvement' : 'Critical';

  // ---- transparent warnings (suggestions, never blockers)
  const warnings: string[] = [];
  if (h2.length === 0) warnings.push('No H2 headings found — long articles are hard to scan without subheadings.');
  if (longParagraphs.length > 0) warnings.push(`${longParagraphs.length} paragraph${longParagraphs.length === 1 ? ' is' : 's are'} very long (120+ words) — consider splitting.`);
  if (imgMissingAlt > 0) warnings.push(`${imgMissingAlt} image${imgMissingAlt === 1 ? '' : 's'} missing alt text.`);
  if (!seo.description) warnings.push('Meta description is missing.');
  if (!kw) warnings.push('Focus keyword has not been configured.');
  if (avgSentenceWords > 25 && wordCount > 120) warnings.push(`Average sentence length is ${avgSentenceWords} words — aim for under ~20.`);
  if (duplicates.slug) warnings.push('Another post already uses this slug — publishing will fail until it is unique.');
  if (duplicates.title) warnings.push('SEO/title duplicates another post — consider differentiating it.');

  return {
    checks,
    score,
    label,
    words: wordCount,
    chars: charCount,
    readingTimeMin: wordCount > 0 ? Math.max(1, Math.ceil(wordCount / 200)) : 0,
    headings,
    images: { total: imgTotal, missingAlt: imgMissingAlt },
    links: { internal, external, brokenHint: [...new Set(brokenHint)].slice(0, 5) },
    readability,
    duplicates,
    warnings,
  };
}

/** Suggests a meta description from the excerpt/intro — a starting point, not gospel. */
export function suggestMetaDescription(excerpt: string, bodyText: string, kw: string): string {
  const base = (excerpt || bodyText || '').replace(/\s+/g, ' ').trim();
  if (!base) return '';
  const sentences = base.match(/[^.!?]+[.!?]*/g) || [base];
  let out = '';
  for (const s of sentences) {
    if ((out + s).length >= 120) break;
    out += (out ? ' ' : '') + s.trim();
  }
  if (out.length < 80) out = base.slice(0, 155);
  const desc = out.length > 160 ? out.slice(0, 157).replace(/\s+\S*$/, '') + '…' : out;
  if (!kw || desc.toLowerCase().includes(kw.toLowerCase())) return desc;
  return desc;
}
