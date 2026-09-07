// =============================================================================
// BRANIFY — shared article HTML sanitizer (DOMPurify)
// -----------------------------------------------------------------------------
// One sanitizer for BOTH surfaces that render author-controlled article HTML:
//   • Admin Blog Editor (visual mode, HTML mode, preview)
//   • Public /blog/<slug> article body
// Admin-only input is STILL sanitized (defense in depth — a compromised admin
// account must never be able to inject script into the public site).
//
// Allowlist covers exactly the article vocabulary the editor produces:
// p, h2-h4, strong/em/u/s, blockquote, ul/ol/li, a, img, figure/figcaption,
// table parts, pre/code, hr, br, div/span, mark.
// Everything else (script, style, iframe, object, embed, svg, form, on*
// handlers, javascript:/data: URIs…) is stripped by DOMPurify.
// =============================================================================

import DOMPurify from 'dompurify';

/** dompurify's sanitize() may return TrustedTypes-wrapped output in strict hosts; runtime value is a string. */
type SanitizeConfig = NonNullable<Parameters<typeof DOMPurify.sanitize>[1]>;

export const ARTICLE_ALLOWED_TAGS = [
  'p', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote',
  'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code',
  'hr', 'br', 'div', 'span', 'mark',
];

export const ARTICLE_ALLOWED_ATTR = [
  'href', 'src', 'srcset', 'alt', 'title', 'width', 'height', 'loading',
  'target', 'rel', 'class', 'colspan', 'rowspan', 'start', 'id',
];

/** Heading ids must be plain url-anchors — nothing else may carry an id. */
const SAFE_ID_RE = /^[a-z0-9][a-z0-9-_]{0,79}$/i;

const cfg: SanitizeConfig = {
  ALLOWED_TAGS: ARTICLE_ALLOWED_TAGS,
  ALLOWED_ATTR: ARTICLE_ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false,
  // DOMPurify's default URI whitelist (http/https/mailto/tel/ftp + relative)
  // already rejects javascript:, vbscript: and data: URIs.
};

let hooked = false;
function ensureHooks(): void {
  if (hooked) return;
  hooked = true;
  // External links open safely; heading ids are constrained to anchor slugs.
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (!(node instanceof Element)) return;

    if (node.tagName === 'A' && node.hasAttribute('href')) {
      const href = node.getAttribute('href') || '';
      if (/^https?:\/\//i.test(href)) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }

    if (node.tagName === 'IMG') {
      // Never execute Anything weird through images; default lazy below fold.
      node.removeAttribute('srcset');
      if (!node.getAttribute('loading')) node.setAttribute('loading', 'lazy');
    }

    const id = node.getAttribute('id');
    if (id && !SAFE_ID_RE.test(id)) node.removeAttribute('id');
  });
}

/** Sanitize author-supplied article HTML. Always call before render AND store. */
export function sanitizeArticleHtml(html: string): string {
  if (!html) return '';
  ensureHooks();
  return normalizeInlineTags(DOMPurify.sanitize(html, cfg) as string).trim();
}

/**
 * Normalize `<b>` → `<strong>` and `<i>` → `<em>` so the article vocabulary
 * stays semantic (execCommand and pasted rich text emit b/i). Input MUST
 * already be sanitized — the pass re-parses trusted html only.
 */
function normalizeInlineTags(html: string): string {
  if (!html || !/<(b|i)(\s|>)/i.test(html)) return html;
  try {
    const host = document.createElement('div');
    host.innerHTML = html; // sanitized upstream
    host.querySelectorAll('b').forEach((el) => {
      const s = document.createElement('strong');
      s.innerHTML = el.innerHTML;
      el.replaceWith(s);
    });
    host.querySelectorAll('i').forEach((el) => {
      const e = document.createElement('em');
      e.innerHTML = el.innerHTML;
      el.replaceWith(e);
    });
    return host.innerHTML;
  } catch {
    return html;
  }
}

/** True when a string already looks like article HTML rather than markdown. */
export function looksLikeHtml(s: string): boolean {
  if (!s) return false;
  return /<\/?(p|h2|h3|h4|ul|ol|li|blockquote|figure|img|table|pre|div|a|strong|em|br|hr)\b[^>]*>/i.test(s);
}

/** Strip tags to plain text (for counts, excerpts, keyword analysis). */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // Blocks that read as separate paragraphs get newlines so word counts and
    // sentence detection behave like the rendered article.
    doc.querySelectorAll('p, li, h2, h3, h4, blockquote, figcaption, pre, tr').forEach((el) => {
      el.append(' ');
    });
    return (doc.body.textContent || '').replace(/[ \t]+/g, ' ').replace(/ +\n/g, '\n').trim();
  } catch {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

export function escapeHtmlText(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Stable anchor id for TOC targets, e.g. "Choose WordPress If:" → choose-wordpress-if */
export function slugifyAnchor(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
    .replace(/(^-|-$)/g, '') || 'section';
}

export interface HeadingInfo {
  level: 2 | 3;
  text: string;
  id: string;
}

/** Extract H2/H3 outline from SANITIZED html (used by TOC + audit). */
export function extractHeadings(sanitizedHtml: string): HeadingInfo[] {
  if (!sanitizedHtml) return [];
  try {
    const doc = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
    const out: HeadingInfo[] = [];
    doc.querySelectorAll('h2, h3').forEach((el) => {
      const text = (el.textContent || '').trim();
      if (!text) return;
      const level = el.tagName === 'H2' ? 2 : 3;
      const existing = el.getAttribute('id');
      out.push({
        level: level as 2 | 3,
        text,
        id: existing && SAFE_ID_RE.test(existing) ? existing : slugifyAnchor(text),
      });
    });
    return out;
  } catch {
    return [];
  }
}

/**
 * Add stable ids to H2/H3 elements of sanitized html so the public article
 * can render an anchored table of contents. Returns html + the outline.
 */
export function withHeadingAnchors(
  sanitizedHtml: string,
): { html: string; headings: HeadingInfo[] } {
  const headings = extractHeadings(sanitizedHtml);
  if (!headings.length || typeof document === 'undefined') {
    return { html: sanitizedHtml, headings };
  }
  const host = document.createElement('div');
  host.innerHTML = sanitizedHtml; // input is already sanitized
  const used = new Set<string>();
  host.querySelectorAll('h2, h3').forEach((el) => {
    const text = (el.textContent || '').trim();
    if (!text) return;
    let id = slugifyAnchor(text);
    let n = 2;
    while (used.has(id)) id = `${slugifyAnchor(text)}-${n++}`;
    used.add(id);
    el.setAttribute('id', id);
  });
  return { html: host.innerHTML, headings };
}

// ------------------------------------------------------------------ Task 2-d — image alt auto-populate

/**
 * First meaningful sentence of the article body (headings skipped).
 * Falls back to the first ~160 characters when no sentence terminator exists.
 */
export function extractFirstSentence(sanitizedHtml: string): string {
  const text = htmlToPlainText(sanitizedHtml);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const bodyLine = lines.find((l) => l.length > 12) || lines[0] || '';
  const cleaned = bodyLine.replace(/^#+\s*/, '').trim();
  if (!cleaned) return '';
  const m = cleaned.match(/^([\s\S]{10,320}?[.!?…])(\s|$)/);
  if (m) return m[1].trim();
  return cleaned.length > 160 ? `${cleaned.slice(0, 157).trimEnd()}…` : cleaned;
}

/**
 * Task 2-d — alt auto-populate: give every BODY image without alt text the
 * article's first sentence. Body images only — the featured image lives in
 * cover_image/seo.cover_alt and is never touched here. Images that already
 * carry alt text are left exactly as written. Runs on SANITIZED html.
 * Returns [html, number of images backfilled].
 */
export function backfillArticleAlt(
  sanitizedHtml: string,
  fallbackAlt?: string,
): [string, number] {
  if (!sanitizedHtml || !/<img\b/i.test(sanitizedHtml)) return [sanitizedHtml, 0];
  let filled = 0;
  const host = document.createElement('div');
  host.innerHTML = sanitizedHtml; // input is already sanitized
  const fallback =
    (fallbackAlt || '').trim() || extractFirstSentence(sanitizedHtml);
  if (!fallback) return [sanitizedHtml, 0];
  host.querySelectorAll('img').forEach((img) => {
    if (!(img.getAttribute('src') || '').trim()) return;
    if ((img.getAttribute('alt') || '').trim()) return;
    img.setAttribute('alt', fallback);
    filled += 1;
  });
  return filled ? [host.innerHTML, filled] : [sanitizedHtml, 0];
}

/**
 * Canonical save/publish pipeline (admin BlogEditor):
 *   raw editor HTML → sanitize → alt backfill (Task 2-d) → stored HTML.
 */
export function finalizeArticleHtml(rawHtml: string): { html: string; altBackfilled: number } {
  const clean = sanitizeArticleHtml(rawHtml);
  const [html, altBackfilled] = backfillArticleAlt(clean);
  return { html, altBackfilled };
}

// ------------------------------------------------------------------ markdown → html
// Legacy blog rows (and the 3 seeded posts) store Markdown in `content`.
// The editor converts that exact subset to sanitized HTML once, on first open:
// "#/##/###" headings, "- " lists, blank-line paragraphs, **bold**, *italic*,
// `code`, and [text](url) links. Everything is escaped BEFORE tag substitution.
export function convertLegacyMarkdownToHtml(md: string): string {
  if (!md) return '';
  if (looksLikeHtml(md)) return sanitizeArticleHtml(md);

  const inline = (raw: string): string => {
    let s = escapeHtmlText(raw);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) => {
      const safeUrl = /^(https?:\/\/|\/|#|mailto:)/i.test(url) ? url : '#';
      return `<a href="${safeUrl}">${text}</a>`;
    });
    return s;
  };

  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let list: string[] | null = null;

  const flushP = () => {
    if (paragraph.length) blocks.push(`<p>${paragraph.map(inline).join(' ')}</p>`);
    paragraph = [];
  };
  const flushL = () => {
    if (list && list.length) blocks.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`);
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { flushP(); flushL(); continue; }
    if (line.startsWith('### ')) { flushP(); flushL(); blocks.push(`<h4>${inline(line.slice(4))}</h4>`); }
    else if (line.startsWith('## ')) { flushP(); flushL(); blocks.push(`<h3>${inline(line.slice(3))}</h3>`); }
    else if (line.startsWith('# ')) { flushP(); flushL(); blocks.push(`<h3>${inline(line.slice(2))}</h3>`); }
    else if (line.startsWith('- ')) { flushP(); list = list || []; list.push(line.slice(2)); }
    else { flushL(); paragraph.push(line); }
  }
  flushP(); flushL();

  return sanitizeArticleHtml(blocks.join('\n'));
}
