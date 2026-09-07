/* =========================================================
   BlogArticleBody — shared article renderer.
   Renders SANITIZED article HTML (from the admin Blog
   Editor) or legacy Markdown with the exact same article
   styling, so the admin preview is pixel-identical to the
   published /blog/<slug> page.

   • HTML path  → sanitizeArticleHtml() + anchored H2/H3 +
                  auto table of contents (only when the
                  article has 3+ headings).
   • Markdown   → tiny local renderer (no deps) kept for
                  the three seeded registry posts.
   ========================================================= */

import React, { useMemo } from 'react';
import { ListTree } from 'lucide-react';
import {
  extractHeadings, sanitizeArticleHtml, slugifyAnchor, withHeadingAnchors,
} from '../lib/sanitizeHtml';

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export interface BlogArticleBodyProps {
  /** Legacy markdown content (registry posts) */
  content?: string;
  /** Editor-produced article HTML (already sanitized once; re-sanitized here — defense in depth) */
  contentHtml?: string;
  /** Hide the TOC (e.g. short admin previews) */
  toc?: boolean;
}

/* ------------------------------------------------------------------ */
/* TOC                                                                 */
/* ------------------------------------------------------------------ */

const ArticleToc: React.FC<{ headings: Array<{ level: 2 | 3; text: string; id: string }> }> = ({ headings }) => (
  <nav aria-label="Table of contents" className="mb-10 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
    <p className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#8F6B2D]">
      <ListTree size={13} /> In this article
    </p>
    <ul className="flex flex-col gap-1.5">
      {headings.map((h) => (
        <li key={h.id} className={h.level === 3 ? 'pl-4' : ''}>
          <a
            href={`#${h.id}`}
            className="text-[13px] leading-snug text-[#475569] transition-colors hover:text-[#5B5FEF]"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            {h.level === 3 ? '— ' : ''}{h.text}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

/* ------------------------------------------------------------------ */
/* Markdown renderer (legacy registry posts — unchanged behaviour)     */
/* ------------------------------------------------------------------ */

type MarkdownBlock =
  | { kind: 'heading2' | 'heading3' | 'heading4' | 'paragraph'; text: string }
  | { kind: 'list'; items: string[] };

const parseMarkdown = (content: string): MarkdownBlock[] => {
  const lines = content.split('\n');

  // The very first non-empty line of every article body is the `# `
  // H1 — it duplicates the page H1 (rendered from post.title), so
  // drop it before parsing blocks.
  const firstContentIdx = lines.findIndex((l) => l.trim() !== '');
  if (firstContentIdx !== -1 && lines[firstContentIdx].startsWith('# ')) {
    lines.splice(firstContentIdx, 1);
  }

  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: 'paragraph', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list && list.length > 0) blocks.push({ kind: 'list', items: list });
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') {
      flushParagraph();
      flushList();
    } else if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'heading4', text: line.slice(4).trim() });
    } else if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'heading3', text: line.slice(3).trim() });
    } else if (line.startsWith('# ')) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'heading2', text: line.slice(2).trim() });
    } else if (line.startsWith('- ')) {
      flushParagraph();
      if (!list) list = [];
      list.push(line.slice(2).trim());
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
};

/** Inline renderer: **bold** → <strong>, `code` → <code>. */
const renderInline = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts
    .filter((part) => part !== '')
    .map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-[#111827]">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="font-mono text-[#8F6B2D] text-[0.9em] bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.5 rounded">
            {part.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
};

export const renderMarkdownBody = (content: string): React.ReactNode[] => {
  const blocks = parseMarkdown(content);
  return blocks.map((block, i) => {
    switch (block.kind) {
      case 'heading2':
        return (
          <h2 key={i} className="font-display text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mt-10 mb-4">
            {renderInline(block.text)}
          </h2>
        );
      case 'heading3':
        return (
          <h3 key={i} className="font-display text-xl font-extrabold text-[#111827] tracking-tight mt-8 mb-3">
            {renderInline(block.text)}
          </h3>
        );
      case 'heading4':
        return (
          <h4 key={i} className="text-base sm:text-lg font-extrabold text-[#111827] mt-6 mb-2">
            {renderInline(block.text)}
          </h4>
        );
      case 'list':
        return (
          <ul key={i} className="list-disc list-inside text-[#475569] text-sm mb-2 space-y-1.5">
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item)}</li>
            ))}
          </ul>
        );
      case 'paragraph':
      default:
        return (
          <p key={i} className="text-sm sm:text-base text-[#334155] leading-relaxed mb-5">
            {renderInline(block.text)}
          </p>
        );
    }
  });
};

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

const TOC_MIN_HEADINGS = 3;

export const BlogArticleBody: React.FC<BlogArticleBodyProps> = ({ content, contentHtml, toc = true }) => {
  const htmlBody = useMemo(() => {
    const raw = (contentHtml || '').trim();
    if (!raw) return null;
    const sanitized = sanitizeArticleHtml(raw);
    const withAnchors = withHeadingAnchors(sanitized);
    const headings = withAnchors.headings;
    return {
      html: withAnchors.html,
      headings,
      showToc: toc && headings.filter((h) => h.level === 2).length >= Math.min(2, TOC_MIN_HEADINGS) && headings.length >= TOC_MIN_HEADINGS,
    };
  }, [contentHtml, toc]);

  if (htmlBody && htmlBody.html) {
    return (
      <>
        {htmlBody.showToc && <ArticleToc headings={htmlBody.headings} />}
        <div className="article-body" dangerouslySetInnerHTML={{ __html: htmlBody.html }} />
      </>
    );
  }

  // Legacy markdown fallback
  if (content) {
    return <div className="article-body article-body-md">{renderMarkdownBody(content)}</div>;
  }

  return <p className="text-sm text-[#64748B]">This article has no content yet.</p>;
};

/** Stable anchor id helper re-exported for tests/tools. */
export { slugifyAnchor };

export default BlogArticleBody;
