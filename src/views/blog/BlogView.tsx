/* =========================================================
   BlogView — 1:1 replica of branify.store's blog pages:
   • BlogIndex    → /blog          (hero, featured article,
     post grid, consultation CTA strip)
   • BlogPostPage → /blog/<slug>   (author row, cover,
     Markdown article renderer, tags, more insights)
   Markdown is rendered by a small local typed renderer
   (no new deps): # / ## / ### headings, **bold**, `code`,
   - lists and blank-line-separated paragraphs.
========================================================= */

import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Seo from '../../components/Seo';
import { blogPosts, BlogPost } from '../../data/blogPosts';

/* ------------------------------------------------------------------ */
/* Shared props                                                        */
/* ------------------------------------------------------------------ */

export interface BlogIndexProps {
  onNavigate: (path: string) => void;
}

export interface BlogPostPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

/* ------------------------------------------------------------------ */
/* Tiny typed Markdown renderer (local, no dependencies)               */
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
        return <strong key={i} className="text-[#F1F2EE]">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="font-mono text-[#E2C27B] text-[0.9em] bg-white/5 px-1.5 py-0.5 rounded">
            {part.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
};

const renderMarkdown = (content: string): React.ReactNode[] => {
  const blocks = parseMarkdown(content);
  return blocks.map((block, i) => {
    switch (block.kind) {
      case 'heading2':
        return (
          <h2 key={i} className="text-2xl sm:text-3xl font-black text-[#F1F2EE] uppercase mt-10 mb-4">
            {renderInline(block.text)}
          </h2>
        );
      case 'heading3':
        return (
          <h3 key={i} className="text-xl font-extrabold text-[#E2C27B] mt-8 mb-3">
            {renderInline(block.text)}
          </h3>
        );
      case 'heading4':
        return (
          <h4 key={i} className="text-base sm:text-lg font-extrabold text-[#F1F2EE] mt-6 mb-2">
            {renderInline(block.text)}
          </h4>
        );
      case 'list':
        return (
          <ul key={i} className="list-disc list-inside text-zinc-300 text-sm mb-2 space-y-1.5">
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item)}</li>
            ))}
          </ul>
        );
      case 'paragraph':
      default:
        return (
          <p key={i} className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-5">
            {renderInline(block.text)}
          </p>
        );
    }
  });
};

/* ------------------------------------------------------------------ */
/* Shared card fragments                                               */
/* ------------------------------------------------------------------ */

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => (
  <span className="absolute top-4 left-4 bg-[#C9A45C] text-[#090A0C] text-[10px] font-black uppercase rounded-full px-3 py-1 tracking-wider">
    {category}
  </span>
);

/* ------------------------------------------------------------------ */
/* BlogIndex — /blog                                                   */
/* ------------------------------------------------------------------ */

export const BlogIndex: React.FC<BlogIndexProps> = ({ onNavigate }) => {
  const featured = useMemo(() => blogPosts.find((p) => p.featured) || blogPosts[0], []);
  const rest = useMemo(() => blogPosts.filter((p) => p.slug !== featured.slug), [featured]);

  return (
    <div className="min-h-screen">
      <Seo
        title="Insights & Articles on Web Development, Branding & AI | BRANIFY"
        description="Actionable guides on web performance, AI automation, branding conversion strategies, and scaling digital products."
        canonicalPath="/blog"
      />

      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center mb-14 sm:mb-16">
          <span className="inline-flex px-4 py-1.5 rounded-full bg-[#C9A45C]/10 border border-[#C9A45C]/30 text-[#E2C27B] text-xs font-extrabold uppercase tracking-widest mb-6">
            Industry Insights &amp; Strategies
          </span>
          <h1 className="font-black text-[#F1F2EE] uppercase text-4xl sm:text-5xl tracking-tight mb-5">
            Engineering &amp; Digital Growth Blog
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Actionable guides on web performance, Gemini AI automation, branding conversion strategies, and scaling digital products.
          </p>
        </div>

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Featured article — large horizontal card */}
          <article
            onClick={() => onNavigate(`/blog/${featured.slug}`)}
            className="grid lg:grid-cols-2 bg-[#080B14] border border-white/[0.08] rounded-3xl overflow-hidden hover:border-[#C9A45C]/40 transition cursor-pointer"
          >
            <div className="relative overflow-hidden">
              <img
                src={featured.coverImage}
                alt={featured.title}
                className="aspect-video lg:aspect-auto object-cover w-full h-full"
                loading="lazy"
              />
              <CategoryBadge category={featured.category} />
            </div>
            <div className="p-6 sm:p-8 space-y-4 flex flex-col justify-center">
              <h2 className="text-xl sm:text-2xl font-black text-[#F1F2EE] uppercase leading-tight">
                {featured.title}
              </h2>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider">
                {featured.publishedAt} • {featured.readTime}
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed">{featured.excerpt}</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#E2C27B] tracking-wider uppercase">
                Read Full Article <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </article>

          {/* Remaining posts */}
          <div className="grid sm:grid-cols-2 gap-6">
            {rest.map((post) => (
              <article
                key={post.slug}
                onClick={() => onNavigate(`/blog/${post.slug}`)}
                className="bg-[#080B14] border border-white/[0.08] rounded-3xl overflow-hidden hover:border-[#C9A45C]/40 transition cursor-pointer flex flex-col"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="aspect-video object-cover w-full"
                    loading="lazy"
                  />
                  <CategoryBadge category={post.category} />
                </div>
                <div className="p-5 space-y-3 flex flex-col flex-1">
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider">
                    {post.publishedAt} • {post.readTime}
                  </p>
                  <h3 className="text-lg font-extrabold text-[#F1F2EE] uppercase leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{post.excerpt}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#E2C27B] tracking-wider uppercase mt-auto pt-1">
                    Read Full Article <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            ))}
          </div>

          {/* Newsletter-style CTA strip */}
          <div className="bg-[#080B14] border border-white/[0.08] rounded-2xl p-6 text-center">
            <p className="text-sm sm:text-base font-bold text-[#F1F2EE] mb-5">
              Want strategies like these applied to your business?
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/contact')}
              className="btn-gold-primary rounded-full text-xs font-black uppercase px-7 py-3 inline-flex items-center gap-2 tracking-wider cursor-pointer"
            >
              Book a Free Consultation <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* BlogPostPage — /blog/<slug>                                         */
/* ------------------------------------------------------------------ */

export const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug, onNavigate }) => {
  const post = useMemo<BlogPost | undefined>(
    () => blogPosts.find((p) => p.slug === slug),
    [slug],
  );
  const others = useMemo(
    () => (post ? blogPosts.filter((p) => p.slug !== post.slug) : []),
    [post],
  );

  if (!post) {
    return (
      <div className="min-h-screen">
        <Seo
          title="Article Not Found | BRANIFY Blog"
          description="The article you are looking for does not exist. Browse the BRANIFY insights blog instead."
          canonicalPath="/blog"
        />
        <section className="px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-[#F1F2EE] uppercase tracking-tight mb-6">
            Article not found
          </h1>
          <p className="text-sm text-zinc-400 mb-8 max-w-md mx-auto">
            The insight you are looking for may have been moved or no longer exists. Explore our latest articles instead.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/blog')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest text-zinc-300 hover:text-[#E2C27B] hover:border-[#C9A45C]/40 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Insights Blog
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Seo
        title={`${post.title} | BRANIFY Blog`}
        description={post.excerpt}
        canonicalPath={`/blog/${post.slug}`}
        ogType="article"
        ogImage={post.coverImage}
      />

      <section className="px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          {/* Back to blog */}
          <button
            type="button"
            onClick={() => onNavigate('/blog')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#E2C27B] hover:border-[#C9A45C]/40 transition cursor-pointer mb-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Insights Blog
          </button>

          <article>
            {/* Author row */}
            <div className="flex items-center gap-4 mb-7">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-11 h-11 rounded-full border border-[#C9A45C]/40 object-cover"
                loading="lazy"
              />
              <div>
                <p className="uppercase text-xs font-black text-[#F1F2EE] tracking-wider">{post.author.name}</p>
                <p className="text-[11px] text-zinc-500">
                  {post.author.role} • {post.publishedAt} • {post.readTime}
                </p>
              </div>
            </div>

            {/* Title H1 (from post.title, not markdown) */}
            <h1 className="text-3xl sm:text-4xl font-black text-[#F1F2EE] uppercase leading-tight mb-8">
              {post.title}
            </h1>

            {/* Cover image */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="rounded-2xl border border-white/10 w-full aspect-video object-cover mb-10"
              loading="lazy"
            />

            {/* Markdown article body */}
            {renderMarkdown(post.content)}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-10">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="uppercase text-[11px] font-bold text-[#E2C27B] bg-[#C9A45C]/10 border border-[#C9A45C]/25 rounded-full px-3 py-1 tracking-wider"
                >
                  # {tag}
                </span>
              ))}
            </div>
          </article>

          {/* More insights — the other posts */}
          <div className="border-t border-white/[0.08] mt-14 pt-10">
            <h2 className="text-sm font-black text-[#F1F2EE] uppercase tracking-widest mb-6">
              More Insights
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {others.map((other) => (
                <article
                  key={other.slug}
                  onClick={() => onNavigate(`/blog/${other.slug}`)}
                  className="bg-[#080B14] border border-white/[0.08] rounded-2xl p-5 hover:border-[#C9A45C]/40 transition cursor-pointer flex flex-col space-y-2.5"
                >
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    {other.category} • {other.readTime}
                  </p>
                  <h3 className="text-sm font-extrabold text-[#F1F2EE] uppercase leading-snug">
                    {other.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{other.excerpt}</p>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#E2C27B] tracking-wider uppercase mt-auto pt-1">
                    Read <ArrowRight className="w-3 h-3" />
                  </span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogIndex;
