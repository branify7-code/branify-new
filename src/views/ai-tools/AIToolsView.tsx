/* =========================================================
   AIToolsView — BRANIFY AI Tools discovery platform
   -----------------------------------------------------
   Hero + prominent search → "What do you want to do?" task
   finder → "New to AI?" beginner flow → Featured tools →
   category + pricing/beginner filters → full directory with
   redesigned cards → compare (client-side state, non-indexable)
   → beginner CTA. Data: aiToolsData lib (admin DB + seed).
========================================================= */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Sparkles, Search, ArrowUpRight, BookOpen, X, Scale, ChevronRight,
  Wand2, LayoutGrid, Star,
} from 'lucide-react';
import Seo from '../../components/Seo';
import { trackEvent } from '../../lib/track';
import { ToolIcon } from '../../components/ToolIcon';
import {
  getAllAiTools, getFeaturedAiTools, searchAiTools, filterAiTools,
  getToolsForTask, FINDER_TASKS, BEGINNER_OPTIONS, aiToolCategories,
  COMPARISON_ROWS, type AIDirectoryTool, type PricingFilter,
} from '../../lib/aiToolsData';

interface AIToolsViewProps {
  onNavigate?: (path: string) => void;
}

const PRICING_FILTERS: PricingFilter[] = ['All', 'Free', 'Freemium', 'Paid', 'Beginner Friendly'];

const pricingBadgeClass = (pricing: string) =>
  pricing === 'Free'
    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25'
    : pricing === 'Freemium'
      ? 'bg-[#C9A45C]/10 text-[#8F6B2D] border-[#C9A45C]/30'
      : 'bg-[#8B5CF6]/10 text-[#6D28D9] border-[#8B5CF6]/25';

/* ------------------------------------------------------------------ card */
const ToolCard: React.FC<{
  tool: AIDirectoryTool;
  compareMode: boolean;
  inCompare: boolean;
  onToggleCompare: (slug: string) => void;
  onOpenGuide: (tool: AIDirectoryTool) => void;
}> = ({ tool, compareMode, inCompare, onToggleCompare, onOpenGuide }) => (
  <article className="group relative bg-white border border-[#E2E8F0] hover:border-[#5B5FEF]/40 rounded-2xl p-5 transition-all duration-300 flex flex-col shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_14px_34px_-14px_rgba(15,23,42,0.14)] hover:-translate-y-1">
    {/* compare checkbox */}
    <button
      type="button"
      aria-label={inCompare ? `Remove ${tool.name} from comparison` : `Add ${tool.name} to comparison`}
      className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
        inCompare
          ? 'bg-[#5B5FEF] border-[#5B5FEF] text-white opacity-100'
          : 'bg-white/90 border-[#E2E8F0] text-transparent opacity-0 group-hover:opacity-100 focus:opacity-100'
      } ${compareMode && !inCompare ? 'opacity-100' : ''}`}
      onClick={(e) => { e.preventDefault(); onToggleCompare(tool.slug); }}
    >
      <Scale className="w-3.5 h-3.5" strokeWidth={2.4} />
    </button>

    <div className="flex items-start gap-3.5">
      <ToolIcon icon={tool.icon} name={tool.name} className="w-11 h-11" />
      <div className="min-w-0 space-y-1 pr-7">
        <span className="block text-[10px] font-black uppercase tracking-widest text-[#5B5FEF]">{tool.category}</span>
        <h3 className="font-display text-lg font-bold text-[#111827] leading-snug">
          <button
            type="button"
            className="hover:text-[#4338CA] transition-colors cursor-pointer text-left"
            onClick={() => onOpenGuide(tool)}
          >
            {tool.name}
          </button>
        </h3>
      </div>
    </div>

    <div className="flex items-center gap-1.5 mt-3">
      <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider border ${pricingBadgeClass(tool.pricing)}`}>
        {tool.pricing}
      </span>
      {tool.beginnerFriendly && (
        <span className="text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider border bg-teal-500/10 text-teal-700 border-teal-500/25">
          Beginner friendly
        </span>
      )}
      {tool.featured && (
        <span className="text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider border bg-[#C9A45C]/10 text-[#8F6B2D] border-[#C9A45C]/30 inline-flex items-center gap-1">
          <Star className="w-2.5 h-2.5 fill-current" /> Featured
        </span>
      )}
    </div>

    <p className="text-[#64748B] text-[13px] leading-relaxed mt-3 line-clamp-2">{tool.desc}</p>

    {tool.guide?.bestFor?.length ? (
      <p className="text-[11px] text-[#475569] mt-2.5 truncate">
        <span className="font-extrabold text-[#334155]">Best for:</span>{' '}
        {tool.guide.bestFor.slice(0, 3).join(' · ')}
      </p>
    ) : null}

    <div className="pt-4 mt-auto flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => onOpenGuide(tool)}
        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#4338CA] hover:text-[#312E81] transition-colors cursor-pointer"
        aria-label={`View the ${tool.name} beginner guide`}
      >
        <BookOpen className="w-3.5 h-3.5" />
        View Guide
        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>
      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => { trackEvent('ai_tool_visit', { name: tool.name, url: tool.url }); trackEvent('ai_tool_click', { name: tool.name, url: tool.url }); }}
        className="inline-flex items-center gap-1 text-xs font-bold text-[#64748B] hover:text-[#111827] transition-colors"
      >
        Visit Tool
        <ArrowUpRight className="w-3.5 h-3.5" />
      </a>
    </div>
  </article>
);

/* ------------------------------------------------------------------ view */
export const AIToolsView: React.FC<AIToolsViewProps> = () => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [pricing, setPricing] = useState<PricingFilter>('All');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [beginnerOpen, setBeginnerOpen] = useState(false);
  const [beginnerPick, setBeginnerPick] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const searchDebounce = useRef<number | null>(null);
  const directoryRef = useRef<HTMLDivElement>(null);

  const allTools = useMemo(() => getAllAiTools(), []);
  const featured = useMemo(() => getFeaturedAiTools(6), []);

  /* task finder → directory, pre-filtered */
  const taskTools = useMemo(() => {
    if (!selectedTask) return null;
    const task = FINDER_TASKS.find((t) => t.id === selectedTask);
    return task ? getToolsForTask(task) : null;
  }, [selectedTask]);

  const beginnerTools = useMemo(() => {
    if (!beginnerPick) return null;
    const opt = BEGINNER_OPTIONS.find((o) => o.id === beginnerPick);
    if (!opt) return null;
    const task = FINDER_TASKS.find((t) => t.id === opt.taskId);
    return task ? getToolsForTask(task) : null;
  }, [beginnerPick]);

  const filtered = useMemo(() => {
    const base = taskTools || allTools;
    return filterAiTools(searchAiTools(query, base), pricing).filter(
      (t) => activeCategory === 'All' || t.category === activeCategory,
    );
  }, [taskTools, allTools, query, pricing, activeCategory]);

  const searchHandler = (value: string) => {
    setQuery(value);
    if (searchDebounce.current) window.clearTimeout(searchDebounce.current);
    if (value.trim().length >= 3) {
      searchDebounce.current = window.setTimeout(() => {
        trackEvent('ai_tool_search', { query: value.trim().slice(0, 80) });
      }, 900);
    }
  };

  const toggleCompare = (slug: string) => {
    setCompare((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 3) return prev;
      return [...prev, slug];
    });
  };

  const scrollToDirectory = () => {
    directoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pickTask = (id: string) => {
    setSelectedTask((prev) => (prev === id ? null : id));
    setBeginnerOpen(false);
    setBeginnerPick(null);
    const task = FINDER_TASKS.find((t) => t.id === id);
    if (task && id !== selectedTask) trackEvent('ai_tool_finder_selection', { task: task.id, label: task.label });
    window.setTimeout(scrollToDirectory, 80);
  };

  useEffect(() => { window.clearTimeout(searchDebounce.current || undefined); }, []);

  const compareTools = allTools.filter((t) => compare.includes(t.slug));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF2FF] via-white to-white text-[#334155]">
      <Seo
        title="AI Tools Directory: Best AI Tools for Work & Creativity | BRANIFY"
        description="Discover the best AI tools for writing, images, video, coding, research and automation — with beginner guides, example prompts and honest comparisons from BRANIFY."
        canonicalPath="/ai-tools"
        ogType="website"
        keywords={['AI tools', 'best AI tools', 'AI tools directory', 'AI image generators', 'AI writing tools', 'AI video generation', 'beginner AI guides', 'BRANIFY']}
      />

      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden pt-14 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-[#C7D2FE]/40 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-5 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur border border-[#C7D2FE] text-xs font-extrabold uppercase tracking-widest text-[#4338CA] shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
            <Sparkles className="w-3.5 h-3.5 text-[#5B5FEF]" />
            <span>Curated AI Directory · Beginner Guides · Example Prompts</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#111827] tracking-[-0.02em]">
            AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B5FEF] to-[#8B5CF6]">Tools</span>
          </h1>
          <p className="text-[#475569] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Discover the best AI tools for writing, images, video, coding, research and automation —
            and learn how to use them with step-by-step beginner guides, example prompts and honest comparisons.
          </p>

          {/* prominent search */}
          <div className="relative max-w-2xl mx-auto pt-2">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
            <input
              type="search"
              placeholder="What do you want to do with AI?"
              value={query}
              onChange={(e) => searchHandler(e.target.value)}
              aria-label="What do you want to do with AI?"
              className="w-full bg-white border border-[#E2E8F0] rounded-2xl pl-14 pr-12 py-4 text-sm sm:text-base text-[#111827] placeholder-[#94A3B8] shadow-[0_6px_24px_rgba(15,23,42,0.07)] focus:outline-none focus:border-[#5B5FEF]/50 focus:shadow-[0_0_0_4px_rgba(91,95,239,0.12)] transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => searchHandler('')}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#94A3B8]">
            <span className="font-semibold">Try:</span>
            {['image', 'video', 'blog', 'voice', 'coding', 'research'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { searchHandler(k); scrollToDirectory(); }}
                className="px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#5B5FEF]/45 hover:text-[#5B5FEF] transition-all cursor-pointer font-semibold"
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== WHAT DO YOU WANT TO DO? ==================== */}
      <section className="py-10 px-4 sm:px-6 lg:px-8" aria-labelledby="finder-heading">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <div className="eyebrow-label mb-2"><Wand2 className="w-3.5 h-3.5" /><span>// Task Finder</span></div>
              <h2 id="finder-heading" className="font-display text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-[-0.02em]">
                What do you want to do?
              </h2>
              <p className="text-[#64748B] text-sm mt-1.5">Pick a goal — we'll show the AI tools that can actually do it.</p>
            </div>
            <button
              type="button"
              onClick={() => setBeginnerOpen((v) => !v)}
              className="hidden sm:inline-flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#F6DF84] via-[#D4AF37] to-[#B3841F] text-[#1A1206] text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-[#C9A45C]/25 hover:brightness-105 transition-all cursor-pointer"
              aria-expanded={beginnerOpen}
            >
              <Sparkles className="w-3.5 h-3.5" />
              New to AI?
            </button>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5">
            {FINDER_TASKS.map((task) => {
              const active = selectedTask === task.id;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => pickTask(task.id)}
                  aria-pressed={active}
                  title={task.blurb}
                  className={`flex flex-col items-center gap-2 px-2 py-4 rounded-2xl border text-center transition-all cursor-pointer ${
                    active
                      ? 'bg-[#5B5FEF] border-[#5B5FEF] text-white shadow-[0_10px_24px_-8px_rgba(91,95,239,0.5)] scale-[1.02]'
                      : 'bg-white border-[#E2E8F0] text-[#475569] hover:border-[#5B5FEF]/45 hover:text-[#4338CA] hover:shadow-[0_8px_20px_-10px_rgba(15,23,42,0.15)]'
                  }`}
                >
                  <span className="text-2xl leading-none" role="img" aria-hidden="true">{task.emoji}</span>
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wide leading-tight">{task.label}</span>
                </button>
              );
            })}
          </div>

          {/* task result summary strip */}
          {selectedTask && taskTools && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E2E8F0] rounded-2xl px-5 py-3.5">
              <p className="text-sm text-[#475569]">
                <span className="font-extrabold text-[#111827]">
                  {FINDER_TASKS.find((t) => t.id === selectedTask)?.label}
                </span>{' '}
                — {taskTools.length} recommended tool{taskTools.length === 1 ? '' : 's'} based on their listed capabilities.
              </p>
              <button
                type="button"
                onClick={() => { setSelectedTask(null); }}
                className="text-xs font-extrabold text-[#4338CA] hover:text-[#312E81] cursor-pointer inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          )}

          {/* beginner mini-flow */}
          {beginnerOpen && (
            <div className="mt-4 bg-white border border-[#C9A45C]/40 rounded-2xl p-6 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.15)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#111827]">New to AI? We'll help you choose where to start.</h3>
                  <p className="text-xs text-[#64748B] mt-1">What do you want to create?</p>
                </div>
                <button type="button" onClick={() => setBeginnerOpen(false)} aria-label="Close beginner flow" className="text-[#94A3B8] hover:text-[#475569] cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mt-4">
                {BEGINNER_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setBeginnerPick(opt.id); trackEvent('ai_tool_finder_selection', { flow: 'beginner', pick: opt.label }); }}
                    className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border transition-all cursor-pointer ${
                      beginnerPick === opt.id
                        ? 'bg-[#C9A45C]/15 border-[#C9A45C] text-[#8F6B2D]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:border-[#C9A45C]/50 hover:text-[#8F6B2D]'
                    }`}
                  >
                    <span className="text-xl" role="img" aria-hidden="true">{opt.emoji}</span>
                    <span className="text-[11px] font-extrabold">{opt.label}</span>
                  </button>
                ))}
              </div>
              {beginnerTools && (
                <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#8F6B2D] mb-3">Recommended tools</p>
                  <div className="flex flex-wrap gap-2">
                    {beginnerTools.map((t) => (
                      <a
                        key={t.slug}
                        href={`/ai-tools/${t.slug}`}
                        onClick={(e) => {
                          if (window.location.pathname.startsWith('/admin')) return;
                          e.preventDefault();
                          window.location.href = `/ai-tools/${t.slug}`;
                        }}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#C9A45C] text-xs font-bold text-[#334155] hover:text-[#8F6B2D] transition-all"
                      >
                        <ToolIcon icon={t.icon} name={t.name} className="w-5 h-5" rounded="rounded-md" />
                        {t.name}
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F8FAFC] text-[#64748B] font-mono">{t.pricing}</span>
                      </a>
                    ))}
                    {!beginnerTools.length && <p className="text-xs text-[#94A3B8]">No tools listed for this yet.</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ==================== FEATURED ==================== */}
      {!query && !selectedTask && activeCategory === 'All' && pricing === 'All' && (
        <section className="py-8 px-4 sm:px-6 lg:px-8" aria-labelledby="featured-heading">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <div className="eyebrow-label mb-2"><Star className="w-3.5 h-3.5" /><span>// Hand-picked</span></div>
                <h2 id="featured-heading" className="font-display text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-[-0.02em]">Featured AI Tools</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((tool) => (
                <ToolCard key={`feat-${tool.slug}`} tool={tool} compareMode={false} inCompare={compare.includes(tool.slug)} onToggleCompare={toggleCompare} onOpenGuide={(t) => { window.location.href = `/ai-tools/${t.slug}`; }} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== DIRECTORY ==================== */}
      <section ref={directoryRef} className="py-10 px-4 sm:px-6 lg:px-8 scroll-mt-20" aria-labelledby="directory-heading">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="eyebrow-label mb-2"><LayoutGrid className="w-3.5 h-3.5" /><span>// Full Directory</span></div>
              <h2 id="directory-heading" className="font-display text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-[-0.02em]">
                {selectedTask ? `${FINDER_TASKS.find((t) => t.id === selectedTask)?.label} — recommended tools` : 'All AI Tools'}
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8] font-mono">{filtered.length} / {allTools.length} tools</p>
          </div>

          {/* category chips */}
          <div className="flex flex-wrap items-center gap-2">
            {aiToolCategories.map((cat) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-gradient-to-b from-[#F6DF84] via-[#D4AF37] to-[#B3841F] text-[#1A1206] shadow-lg shadow-[#C9A45C]/25'
                    : 'bg-white text-[#475569] border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-[#5B5FEF]/45 hover:text-[#5B5FEF]'
                }`}
                onClick={() => { setActiveCategory(cat); if (cat !== 'All') trackEvent('ai_tool_category_view', { category: cat }); }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* pricing / beginner filters */}
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter tools">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8] mr-1">Filter:</span>
            {PRICING_FILTERS.map((p) => (
              <button
                key={p}
                onClick={() => setPricing(p)}
                aria-pressed={pricing === p}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                  pricing === p
                    ? 'bg-[#5B5FEF] border-[#5B5FEF] text-white'
                    : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#5B5FEF]/45 hover:text-[#5B5FEF]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((tool) => (
              <ToolCard
                key={tool.slug}
                tool={tool}
                compareMode={compare.length > 0 && compare.length < 3}
                inCompare={compare.includes(tool.slug)}
                onToggleCompare={toggleCompare}
                onOpenGuide={(t) => { window.location.href = `/ai-tools/${t.slug}`; }}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center space-y-3 bg-white border border-[#E2E8F0] rounded-2xl">
                <Sparkles className="w-8 h-8 text-[#94A3B8] mx-auto animate-pulse" />
                <p className="text-[#64748B] font-semibold text-sm">No AI tools found matching your search query.</p>
                <button
                  onClick={() => { searchHandler(''); setActiveCategory('All'); setPricing('All'); setSelectedTask(null); }}
                  className="btn-metal px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== BEGINNER CTA ==================== */}
      <section className="py-14 px-4 sm:px-6 lg:px-8" aria-labelledby="cta-heading">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#EEF2FF] via-white to-[#FAF5FF] border border-[#C7D2FE]/70 rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-[0_20px_50px_-24px_rgba(91,95,239,0.25)]">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#C7D2FE] text-[10px] font-black uppercase tracking-widest text-[#4338CA]">
            <BookOpen className="w-3.5 h-3.5" /> Learn · Try · Compare
          </div>
          <h2 id="cta-heading" className="font-display text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-[-0.02em]">
            Never used an AI tool before?
          </h2>
          <p className="text-[#475569] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Open any tool guide for a plain-language explanation, a step-by-step beginner walkthrough,
            copy-ready example prompts and honest tips — then visit the official tool from there.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => { setBeginnerOpen(true); document.getElementById('finder-heading')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
              className="px-6 py-3 rounded-xl bg-[#5B5FEF] text-white text-xs font-extrabold uppercase tracking-widest shadow-lg shadow-[#5B5FEF]/30 hover:bg-[#4C46E8] transition-colors cursor-pointer"
            >
              Start with the Task Finder
            </button>
            <a
              href="/ai-tools/chatgpt"
              className="px-6 py-3 rounded-xl bg-white border border-[#E2E8F0] text-[#334155] text-xs font-extrabold uppercase tracking-widest hover:border-[#5B5FEF]/50 hover:text-[#4338CA] transition-all inline-flex items-center gap-2"
            >
              Read the ChatGPT guide
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ==================== COMPARE BAR ==================== */}
      {compare.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl">
          <div className="bg-[#111827] text-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(15,23,42,0.5)] px-5 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Scale className="w-4 h-4 text-[#C9A45C] shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto">
                {compareTools.map((t) => (
                  <button
                    key={t.slug}
                    onClick={() => toggleCompare(t.slug)}
                    aria-label={`Remove ${t.name} from comparison`}
                    className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    {t.name} <X className="w-3 h-3" />
                  </button>
                ))}
                {compare.length < 3 && <span className="text-[11px] text-white/60 shrink-0">add {3 - compare.length} more</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setCompareOpen(true)}
                disabled={compare.length < 2}
                className={`px-4 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                  compare.length >= 2 ? 'bg-[#C9A45C] text-[#1A1206] hover:brightness-110' : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                Compare
              </button>
              <button onClick={() => setCompare([])} aria-label="Clear comparison" className="text-white/60 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== COMPARE MODAL ==================== */}
      {compareOpen && compareTools.length >= 2 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0F172A]/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Tool comparison" onClick={() => setCompareOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold text-[#111827]">Side-by-side comparison</h3>
              <button onClick={() => setCompareOpen(false)} aria-label="Close comparison" className="text-[#94A3B8] hover:text-[#475569] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest text-[#94A3B8] pb-4 pr-4 align-bottom">Compare</th>
                    {compareTools.map((t) => (
                      <th key={t.slug} className="text-left pb-4 px-3 align-bottom min-w-[180px]">
                        <div className="flex items-center gap-2.5">
                          <ToolIcon icon={t.icon} name={t.name} className="w-9 h-9" rounded="rounded-lg" />
                          <div>
                            <button onClick={() => { setCompareOpen(false); window.location.href = `/ai-tools/${t.slug}`; }} className="font-display font-bold text-[#111827] hover:text-[#4338CA] cursor-pointer text-left">
                              {t.name}
                            </button>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{t.category}</p>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.label} className="border-t border-[#E2E8F0]">
                      <td className="py-3.5 pr-4 text-[11px] font-black uppercase tracking-wider text-[#64748B] whitespace-nowrap">{row.label}</td>
                      {compareTools.map((t) => (
                        <td key={t.slug} className="py-3.5 px-3 text-[13px] text-[#334155] align-top">{row.value(t)}</td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t border-[#E2E8F0]">
                    <td className="py-4 pr-4 text-[11px] font-black uppercase tracking-wider text-[#64748B]">Links</td>
                    {compareTools.map((t) => (
                      <td key={t.slug} className="py-4 px-3">
                        <div className="flex flex-wrap gap-2">
                          <a href={`/ai-tools/${t.slug}`} className="text-xs font-bold text-[#4338CA] hover:underline">Guide →</a>
                          <a href={t.url} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('ai_tool_visit', { name: t.name, url: t.url })} className="text-xs font-bold text-[#64748B] hover:text-[#111827]">
                            Official site ↗
                          </a>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              <p className="text-[11px] text-[#94A3B8] mt-4">
                Comparison uses the stored directory data only. Pricing tiers are indicative — always check each official website for current pricing and availability.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIToolsView;
