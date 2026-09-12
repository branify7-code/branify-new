/* =========================================================
   BlogView — 1:1 replica of branify.store's blog pages:
   • BlogIndex    → /blog          (hero, featured article,
     post grid, consultation CTA strip)
   • BlogPostPage → /blog/<slug>   (author row, cover,
     article body, tags, more insights)
   Article bodies render through the SHARED BlogArticleBody
   (sanitized editor HTML with auto TOC, or legacy markdown).
========================================================= */

import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Seo from '../../components/Seo';
import { BlogArticleBody } from '../../components/BlogArticleBody';
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
/* Shared card fragments                                               */
/* ------------------------------------------------------------------ */

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => (
  <span className="absolute top-4 left-4 bg-[#EEF2FF]/95 backdrop-blur text-[#5B5FEF] border border-[#E0E7FF] shadow-sm text-[10px] font-bold uppercase rounded-full px-3 py-1 tracking-wider">
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
          <span className="inline-flex px-4 py-1.5 rounded-full bg-[#C9A45C]/10 border border-[#C9A45C]/30 text-[#8F6B2D] text-xs font-extrabold uppercase tracking-widest mb-6">
            Industry Insights &amp; Strategies
          </span>
          <h1 className="font-display font-extrabold text-[#111827] text-4xl sm:text-5xl tracking-[-0.03em] leading-[1.08] mb-5">
            Engineering &amp; Digital Growth Blog
          </h1>
          <p className="text-[#64748B] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Actionable guides on web performance, Gemini AI automation, branding conversion strategies, and scaling digital products.
          </p>
        </div>

        <div className="max-w-7xl mx-auto space-y-14">
          {/* Featured article — large editorial, text below (NOT boxed) */}
          <article
            onClick={() => onNavigate(`/blog/${featured.slug}`)}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <img
                src={featured.coverImage}
                alt={featured.title}
                className="aspect-[2/1] sm:aspect-[21/9] object-cover w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                loading="lazy"
              />
              <CategoryBadge category={featured.category} />
            </div>
            <div className="pt-6 space-y-3 max-w-3xl">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#64748B]">
                {featured.publishedAt} • {featured.readTime}
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight leading-tight group-hover:text-[#5B5FEF] transition-colors">
                <a href={`/blog/${featured.slug}`} onClick={(e) => { e.preventDefault(); onNavigate(`/blog/${featured.slug}`); }}>
                  {featured.title}
                </a>
              </h2>
              <p className="text-sm sm:text-base text-[#475569] leading-relaxed">{featured.excerpt}</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B5FEF] tracking-wider">
                Read Full Article <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </article>

          {/* Remaining posts */}
          <div className="grid sm:grid-cols-2 gap-6">
            {rest.map((post) => (
              <article
                key={post.slug}
                onClick={() => onNavigate(`/blog/${post.slug}`)}
                className="group bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden hover:border-[#C9A45C]/40 hover:shadow-[0_14px_34px_-14px_rgba(15,23,42,0.14)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="aspect-video object-cover w-full transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <CategoryBadge category={post.category} />
                </div>
                <div className="p-6 space-y-3 flex flex-col flex-1">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#94A3B8]">
                    {post.publishedAt} • {post.readTime}
                  </p>
                  <h3 className="font-display text-lg font-extrabold text-[#111827] tracking-tight leading-snug group-hover:text-[#5B5FEF] transition-colors">
                    <a href={`/blog/${post.slug}`} onClick={(e) => { e.preventDefault(); onNavigate(`/blog/${post.slug}`); }}>
                      {post.title}
                    </a>
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{post.excerpt}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B5FEF] tracking-wider mt-auto pt-1">
                    Read Full Article <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </article>
            ))}
          </div>

          {/* Newsletter-style CTA strip */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-8 text-center">
            <p className="font-display text-base sm:text-lg font-bold text-[#111827] mb-5">
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
          robots="noindex, follow"
        />
        <section className="px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight mb-6">
            Article not found
          </h1>
          <p className="text-sm text-[#64748B] mb-8 max-w-md mx-auto">
            The insight you are looking for may have been moved or no longer exists. Explore our latest articles instead.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/blog')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-[#E2E8F0] text-xs font-bold uppercase tracking-widest text-[#334155] shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:border-[#5B5FEF]/50 hover:text-[#5B5FEF] transition cursor-pointer"
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
        robots={post.robots || 'index, follow'}
        articleSchema={{
          headline: post.title,
          description: post.excerpt,
          image: post.coverImage,
          datePublished: post.publishedAtISO || post.publishedAt,
          dateModified: post.updatedAtISO,
          authorName: post.author.name,
          authorRole: post.author.role,
          section: post.category,
          keywords: post.tags,
        }}
      />

      <section className="px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          {/* Back to blog */}
          <button
            type="button"
            onClick={() => onNavigate('/blog')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.04)] text-[11px] font-bold uppercase tracking-widest text-[#475569] hover:border-[#5B5FEF]/50 hover:text-[#5B5FEF] transition cursor-pointer mb-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Insights Blog
          </button>

          <article>
            {/* Author row */}
            <div className="flex items-center gap-4 mb-7">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-11 h-11 rounded-full border border-[#E2E8F0] object-cover"
                loading="lazy"
              />
              <div>
                <p className="uppercase text-xs font-black text-[#111827] tracking-wider">{post.author.name}</p>
                <p className="text-[11px] text-[#64748B]">
                  {post.author.role} • {post.publishedAt} • {post.readTime}
                </p>
              </div>
            </div>

            {/* Title H1 (from post.title, not markdown) */}
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight leading-[1.15] mb-8">
              {post.title}
            </h1>

            {/* Cover image */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="rounded-2xl border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] w-full aspect-video object-cover mb-10"
              loading="lazy"
            />

            {/* Article body — sanitized editor HTML (with auto TOC) or legacy markdown */}
            <BlogArticleBody content={post.content} contentHtml={post.contentHtml} />

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-10">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="uppercase text-[11px] font-bold text-[#8F6B2D] bg-[#C9A45C]/10 border border-[#C9A45C]/25 rounded-full px-3 py-1 tracking-wider"
                >
                  # {tag}
                </span>
              ))}
            </div>
          </article>

          {/* More insights — the other posts */}
          <div className="border-t border-[#E2E8F0] mt-14 pt-10">
            <h2 className="font-display text-base font-extrabold text-[#111827] tracking-wide mb-6">
              More Insights
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {others.map((other) => (
                <article
                  key={other.slug}
                  onClick={() => onNavigate(`/blog/${other.slug}`)}
                  className="group bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#C9A45C]/40 hover:shadow-[0_14px_34px_-14px_rgba(15,23,42,0.14)] transition-all duration-300 cursor-pointer flex flex-col space-y-2.5"
                >
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8]">
                    {other.category} • {other.readTime}
                  </p>
                  <h3 className="text-sm font-extrabold text-[#111827] tracking-tight leading-snug group-hover:text-[#5B5FEF] transition-colors">
                    <a href={`/blog/${other.slug}`} onClick={(e) => { e.preventDefault(); onNavigate(`/blog/${other.slug}`); }}>
                      {other.title}
                    </a>
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{other.excerpt}</p>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#5B5FEF] tracking-wider mt-auto pt-1">
                    Read <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </article>
              ))}
            </div>
          </div>

          {/* End-of-article conversion CTA */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-8 text-center mt-12">
            <p className="font-display text-base sm:text-lg font-bold text-[#111827] mb-5">
              Want results like these on your own website?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/contact')}
                className="btn-gold-primary rounded-full text-xs font-black uppercase px-7 py-3 inline-flex items-center gap-2 tracking-wider cursor-pointer"
              >
                Book a Free Consultation <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/services')}
                className="rounded-full bg-white border border-[#E2E8F0] px-7 py-3 text-xs font-bold uppercase tracking-widest text-[#334155] shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-colors hover:border-[#5B5FEF]/50 hover:text-[#5B5FEF] cursor-pointer"
              >
                Explore Our Services
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogIndex;
