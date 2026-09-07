/* =========================================================
   BRANIFY ADMIN — AI Tool on-page SEO audit
   -----------------------------------------------------
   Real, explainable checks over the tool's stored fields
   (spec §47-49). This is an on-page quality check — it is
   NOT a Google ranking and never claims to be.
========================================================= */

export interface AiToolAuditInput {
  name: string;
  slug: string;
  category: string;
  description: string;
  url: string;
  about: string;
  bestFor: string[];
  useCases: Array<{ title: string; text: string }>;
  guideSteps: Array<{ title: string; text: string; image?: string; caption?: string; alt?: string }>;
  prompts: Array<{ title: string; category: string; content: string; active?: boolean }>;
  faqs: Array<{ question: string; answer: string; active?: boolean }>;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
    focus_keyword?: string;
    secondary_keywords?: string[];
    canonical?: string;
    og_title?: string;
    og_description?: string;
    og_image?: string;
  };
  otherTools: Array<{ slug: string; seo: { title?: string; description?: string } }>;
}

export interface AuditCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  weight: number;
}

export interface ReadabilityReport {
  scorePct: number;
  label: string;
  avgSentenceWords: number;
  longSentences: number;
  longParagraphs: number;
  detail: string;
}

export interface AiToolAuditReport {
  checks: AuditCheck[];
  scorePct: number;
  passed: number;
  warned: number;
  failed: number;
  readability: ReadabilityReport;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function readability(texts: string[]): ReadabilityReport {
  const body = texts.join(' ').replace(/\s+/g, ' ').trim();
  const sentences = body.split(/[.!?]+(?:\s|$)/).map((s) => s.trim()).filter(Boolean);
  const words = body.split(/\s+/).filter(Boolean);
  const avg = sentences.length ? words.length / sentences.length : 0;
  const longSentences = sentences.filter((s) => s.split(/\s+/).length > 30).length;
  // "paragraphs" ≈ about/use-case texts — flag texts over 90 words as hard to scan
  const longParagraphs = texts.filter((t) => t.split(/\s+/).filter(Boolean).length > 90).length;
  let score = 100;
  score -= clamp((avg - 18) * 3, 0, 40);
  score -= clamp(longSentences * 8, 0, 30);
  score -= clamp(longParagraphs * 10, 0, 20);
  const pct = clamp(Math.round(score), 0, 100);
  const label = pct >= 80 ? 'Easy to read' : pct >= 60 ? 'Fairly readable' : 'Needs simplifying';
  const detail = `Average sentence ${Math.round(avg)} words · ${longSentences} long sentence(s) · ${longParagraphs} overly long text block(s)`;
  return { scorePct: pct, label, avgSentenceWords: Math.round(avg), longSentences, longParagraphs, detail };
}

export function auditAiTool(input: AiToolAuditInput): AiToolAuditReport {
  const checks: AuditCheck[] = [];
  const add = (id: string, label: string, status: AuditCheck['status'], detail: string, weight = 1) =>
    checks.push({ id, label, status, detail, weight });

  const seoTitle = (input.seo.title || '').trim();
  const seoDesc = (input.seo.description || '').trim();
  const focus = (input.seo.focus_keyword || '').trim().toLowerCase();
  const about = input.about.trim();
  const guideTexts = [about, ...input.useCases.map((u) => `${u.title}. ${u.text}`), ...input.guideSteps.map((s) => `${s.title}. ${s.text}`)];

  // SEO title
  if (!seoTitle) add('seo-title', 'SEO title exists', 'fail', 'No SEO title configured — the page falls back to a generated one.', 2);
  else if (seoTitle.length < 20 || seoTitle.length > 65) add('seo-title', 'SEO title length', 'warn', `${seoTitle.length} characters — aim for 20–65 so it is not truncated in results.`, 2);
  else add('seo-title', 'SEO title length', 'pass', `${seoTitle.length} characters — good length.`, 2);

  // Meta description
  if (!seoDesc) add('meta-desc', 'Meta description exists', 'fail', 'No meta description configured.', 2);
  else if (seoDesc.length < 50 || seoDesc.length > 165) add('meta-desc', 'Meta description length', 'warn', `${seoDesc.length} characters — aim for 50–165.`, 2);
  else add('meta-desc', 'Meta description length', 'pass', `${seoDesc.length} characters — good length.`, 2);

  // H1 (the tool name renders as the page H1)
  add('h1', 'H1 exists', input.name.trim() ? 'pass' : 'fail', input.name.trim() ? `H1 renders from the tool name: “${input.name.trim()}”.` : 'Tool name is empty — the page would have no H1.', 2);

  // Heading hierarchy — the detail page renders H2 sections from stored content
  const sectionCount = (about ? 1 : 0) + (input.useCases.length ? 1 : 0) + (input.guideSteps.length ? 1 : 0) + (input.prompts.length ? 1 : 0) + (input.faqs.length ? 1 : 0);
  add('headings', 'Heading hierarchy', sectionCount >= 3 ? 'pass' : sectionCount >= 1 ? 'warn' : 'fail',
    sectionCount >= 3 ? `${sectionCount} content sections render as H2s with a single H1.` : 'Add about / use cases / guide steps / FAQs so the page has a proper H2 structure.', 1);

  // Focus keyword
  if (!focus) add('focus-kw', 'Focus keyword configured', 'warn', 'No focus keyword set — recommended for consistent optimization.');
  else {
    const inTitle = seoTitle.toLowerCase().includes(focus);
    const inDesc = seoDesc.toLowerCase().includes(focus);
    const inAbout = about.toLowerCase().includes(focus);
    const hits = [inTitle, inDesc, inAbout].filter(Boolean).length;
    add('focus-kw', 'Focus keyword usage', hits >= 2 ? 'pass' : hits === 1 ? 'warn' : 'fail',
      hits ? `Focus keyword “${input.seo.focus_keyword}” appears in ${hits}/3 key places (title, meta description, about).` : `Focus keyword “${input.seo.focus_keyword}” does not appear in the title, description or about text.`);
  }

  // Slug
  const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) && input.slug.length >= 2 && input.slug.length <= 60;
  add('slug', 'Readable slug', slugOk ? 'pass' : 'fail', slugOk ? `/ai-tools/${input.slug}` : `“${input.slug || 'empty'}” — use lowercase words separated by hyphens.`, 1);

  // Introductory content (about)
  const aboutWords = about.split(/\s+/).filter(Boolean).length;
  add('intro', 'Introductory content', aboutWords >= 60 ? 'pass' : aboutWords >= 25 ? 'warn' : 'fail',
    about ? `${aboutWords} words in the About text — ${aboutWords >= 60 ? 'good depth for an intro.' : 'aim for 60+ words to explain the tool properly.'}` : 'The About text is empty — the page would be too thin.', 2);

  // Internal links (related tools render automatically when other tools share categories)
  const relatedCount = input.otherTools.filter((o) => o.slug !== input.slug).length;
  add('internal-links', 'Internal links', relatedCount >= 3 ? 'pass' : 'warn',
    relatedCount >= 3 ? `${relatedCount} other tools are available for the Related section.` : 'Few other tools exist — the Related section may be thin.');

  // Image alt text
  const imgSteps = input.guideSteps.filter((s) => (s.image || '').trim());
  const missingAlt = imgSteps.filter((s) => !(s.alt || '').trim());
  add('img-alt', 'Image alt text', !imgSteps.length ? 'warn' : missingAlt.length ? 'warn' : 'pass',
    !imgSteps.length ? 'No guide images yet — add screenshots with alt text when available.' : missingAlt.length ? `${missingAlt.length} guide image(s) missing alt text.` : 'All guide images have alt text.');

  // OG image
  add('og-image', 'OG image', (input.seo.og_image || '').trim() ? 'pass' : 'warn',
    (input.seo.og_image || '').trim() ? 'Custom OG image configured.' : 'No custom OG image — the site default is used.');

  // Canonical
  const canonical = (input.seo.canonical || '').trim();
  add('canonical', 'Canonical URL', !canonical ? 'pass' : canonical.startsWith('https://branify.store') ? 'pass' : 'warn',
    !canonical ? 'Canonical auto-generates from the slug on the production domain.' : canonical.startsWith('https://branify.store') ? 'Canonical points to the production domain.' : 'Custom canonical should normally start with https://branify.store');

  // Content depth
  const depthWords = guideTexts.join(' ').split(/\s+/).filter(Boolean).length;
  add('depth', 'Content depth', depthWords >= 250 ? 'pass' : depthWords >= 120 ? 'warn' : 'fail',
    `${depthWords} words of guide content — ${depthWords >= 250 ? 'a genuinely useful page.' : 'add use cases, guide steps and prompts to reach ~250 words.'}`, 2);

  // FAQ
  const activeFaqs = input.faqs.filter((f) => f.active !== false && (f.question || '').trim() && (f.answer || '').trim());
  add('faq', 'FAQ section', activeFaqs.length >= 3 ? 'pass' : activeFaqs.length ? 'warn' : 'warn',
    activeFaqs.length >= 3 ? `${activeFaqs.length} active FAQs — eligible for FAQ structured data.` : activeFaqs.length ? `${activeFaqs.length} FAQ — 3+ recommended for FAQ structured data.` : 'No FAQs yet — beginner questions (what is it, is it free, how to start) work well.');

  // Duplicate title / description warnings
  const dupTitle = input.otherTools.filter((o) => (o.seo?.title || '').trim() && o.seo.title!.trim() === seoTitle);
  add('dup-title', 'Duplicate title check', seoTitle && dupTitle.length ? 'warn' : 'pass',
    dupTitle.length ? `SEO title matches ${dupTitle.map((d) => d.slug).join(', ')} — make titles unique.` : 'SEO title is unique among tools.');

  const dupDesc = input.otherTools.filter((o) => (o.seo?.description || '').trim() && o.seo.description!.trim() === seoDesc);
  add('dup-desc', 'Duplicate description check', seoDesc && dupDesc.length ? 'warn' : 'pass',
    dupDesc.length ? `Meta description matches ${dupDesc.map((d) => d.slug).join(', ')}.` : 'Meta description is unique among tools.');

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.reduce((s, c) => s + (c.status === 'pass' ? c.weight : c.status === 'warn' ? c.weight * 0.5 : 0), 0);
  const scorePct = Math.round((earned / totalWeight) * 100);

  return {
    checks,
    scorePct,
    passed: checks.filter((c) => c.status === 'pass').length,
    warned: checks.filter((c) => c.status === 'warn').length,
    failed: checks.filter((c) => c.status === 'fail').length,
    readability: readability(guideTexts),
  };
}
