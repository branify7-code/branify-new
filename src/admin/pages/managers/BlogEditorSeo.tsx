// =============================================================================
// BRANIFY ADMIN — Blog editor: SEO panel, live previews, audit UI,
// link checker, and the Search-Performance section.
// -----------------------------------------------------------------------------
// Honesty rules baked in:
//   • The SEO score measures ON-PAGE COMPLETENESS only — never rankings.
//   • Google Search Console is NOT connected in this project → the panel says
//     exactly that instead of showing fabricated positions/CTR.
//   • First-party analytics (analytics_events) are real; shown when present.
//   • Cross-origin link verification is impossible from the browser (CORS) →
//     reported as "not verified", never guessed.
// =============================================================================
import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, BarChart3, Check, ExternalLink, Gauge, Globe, Info, Link2,
  ListChecks, ShieldAlert, Wand2, X,
} from 'lucide-react';
import { listRows } from '../../lib/backend';
import type { EventRow } from '../../lib/types';
import { GscMiniPanel } from '../GscMiniPanel';
import { Badge, Btn, Card, EmptyState, Field, Input, LoadingBlock, Textarea, cx } from '../../ui';
import { analyzeArticle, type BlogAuditReport } from '../../lib/blogAudit';
import { htmlToPlainText } from '../../../lib/sanitizeHtml';
import { servicesRegistry } from '../../../data/servicesRegistry';
import { toolsRegistry } from '../../../data/toolsRegistry';
import { aiToolsDirectory } from '../../../data/aiToolsDirectory';
import { blogPosts } from '../../../data/blogPosts';
import { projectsData } from '../../../data/projects';
import { freeTemplates } from '../../../data/freeTemplatesRegistry';

const SITE_URL = 'https://branify.store';

export interface EditorSeo {
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

export const DEFAULT_ROBOTS = 'index, follow';

// ------------------------------------------------------------------ previews
export const GooglePreview: React.FC<{ seoTitle: string; title: string; description: string; slug: string }> =
({ seoTitle, title, description, slug }) => {
  const shown = seoTitle || title || 'Untitled post';
  const fullTitle = shown.includes('BRANIFY') ? shown : `${shown} | BRANIFY`;
  const desc = description || 'Add a meta description so search results show a compelling summary here.';
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Search preview — approximate</p>
      <div className="font-[Arial]">
        <p className="text-[12px] leading-tight text-[#202124]">{SITE_URL.replace('https://', '')} › blog › {slug || 'your-slug'}</p>
        <p className="mt-0.5 truncate text-[17px] leading-snug text-[#1a0dab]">{fullTitle.slice(0, 70)}</p>
        <p className="mt-1 text-[12.5px] leading-snug text-[#4d5156]">{desc.slice(0, 165)}{desc.length > 165 ? '…' : ''}</p>
      </div>
    </div>
  );
};

export const SocialPreview: React.FC<{ title: string; description: string; image: string; network: 'og' | 'twitter' }> =
({ title, description, image, network }) => (
  <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
    <div className="flex h-36 items-center justify-center overflow-hidden bg-[#F1F5F9]">
      {image ? (
        <img src={image} alt={`${network} card preview`} className="h-full w-full object-cover" />
      ) : (
        <p className="px-4 text-center text-[11px] text-[#94A3B8]">No {network === 'og' ? 'OG' : 'Twitter'} image — featured image is used as fallback when set</p>
      )}
    </div>
    <div className="border-t border-[#E2E8F0] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">{network === 'og' ? 'Facebook / Open Graph' : 'Twitter / X card'}</p>
      <p className="mt-0.5 truncate text-[13px] font-semibold text-[#111827]">{title || 'Untitled post'}</p>
      <p className="truncate text-[11px] text-[#64748B]">{description || 'No description set — excerpt is used as fallback.'}</p>
    </div>
  </div>
);

// ------------------------------------------------------------------ SEO fields
export const SeoPanel: React.FC<{
  seo: EditorSeo;
  title: string;
  excerpt: string;
  slug: string;
  coverImage: string;
  onChange: (patch: Partial<EditorSeo>) => void;
  /** Optional: drops a draft meta description built from the article opening. */
  onSuggestDescription?: () => void;
}> = ({ seo, title, excerpt, slug, coverImage, onChange, onSuggestDescription }) => {
  const effTitle = seo.title || title || '';
  const effDesc = seo.description || excerpt || '';
  const effOgImage = seo.og_image || coverImage;
  return (
    <div className="flex flex-col gap-4">
      <GooglePreview seoTitle={seo.title} title={title} description={seo.description || excerpt} slug={slug} />

      <Field label="SEO title" counter={`${seo.title.length} chars`} hint="30-60 characters. Unique per post — search engines may rewrite anything much longer.">
        <Input value={seo.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Custom Web Development for Small Businesses | BRANIFY" />
      </Field>

      <Field
        label="Meta description"
        counter={`${seo.description.length} chars`}
        hint="120-160 characters. Write for humans — this is your pitch in search results."
      >
        <Textarea rows={3} value={seo.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Short, compelling summary of what readers will learn…" />
        {onSuggestDescription && (
          <button
            type="button"
            onClick={onSuggestDescription}
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#5B5FEF] hover:underline"
          >
            <Wand2 size={11} /> Suggest from the article opening
          </button>
        )}
      </Field>

      <Field label="Focus keyword" hint="One primary topic phrase. It should appear naturally — never stuffed.">
        <Input value={seo.focus_keyword} onChange={(e) => onChange({ focus_keyword: e.target.value })} placeholder="e.g. custom web development" />
      </Field>

      <Field label="Secondary keywords" hint="Press Enter after each — supporting phrases and synonyms.">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]/80 p-2">
          {seo.keywords.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-md bg-[#C9A45C]/15 px-2 py-0.5 text-xs text-[#8F6B2D]">
              {t}
              <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange({ keywords: seo.keywords.filter((x) => x !== t) })} className="text-[#475569] hover:text-red-600">
                <X size={11} />
              </button>
            </span>
          ))}
          <input
            value=""
            onChange={() => { /* value handled on keydown */ }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const v = e.currentTarget.value.trim();
                if (v && !seo.keywords.includes(v)) onChange({ keywords: [...seo.keywords, v] });
                e.currentTarget.value = '';
              }
            }}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && !seo.keywords.includes(v)) onChange({ keywords: [...seo.keywords, v] });
              e.target.value = '';
            }}
            placeholder={seo.keywords.length ? 'Add another…' : 'Type and press Enter'}
            className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-sm text-[#111827] outline-none placeholder-[#5A6472]"
          />
        </div>
      </Field>

      <Field label="Canonical URL" hint={`Empty = auto: ${SITE_URL}/blog/${slug || '<slug>'}`}>
        <Input value={seo.canonical} onChange={(e) => onChange({ canonical: e.target.value })} placeholder={`${SITE_URL}/blog/${slug}`} />
      </Field>

      <Field label="Robots" hint="Keep “index, follow” for public posts. Drafts are never rendered publicly.">
        <Input value={seo.robots} onChange={(e) => onChange({ robots: e.target.value })} placeholder={DEFAULT_ROBOTS} />
      </Field>

      <div className="rounded-xl border border-[#E2E8F0] bg-white/[0.4] p-3">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">Open Graph (Facebook, LinkedIn, WhatsApp)</p>
        <div className="flex flex-col gap-3">
          <Field label="OG title" hint={`Empty = SEO title / post title.`}>
            <Input value={seo.og_title} onChange={(e) => onChange({ og_title: e.target.value })} placeholder={effTitle.slice(0, 70)} />
          </Field>
          <Field label="OG description" hint="Empty = meta description / excerpt.">
            <Input value={seo.og_description} onChange={(e) => onChange({ og_description: e.target.value })} placeholder={effDesc.slice(0, 110)} />
          </Field>
          <Field label="OG image URL" hint="Empty = featured image. Ideal 1200×630.">
            <Input value={seo.og_image} onChange={(e) => onChange({ og_image: e.target.value })} placeholder={coverImage || 'https://…'} />
          </Field>
        </div>
      </div>

      <Field label="Twitter/X card image" hint="Empty = OG image → featured image.">
        <Input value={seo.twitter_image} onChange={(e) => onChange({ twitter_image: e.target.value })} placeholder={effOgImage || 'https://…'} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <SocialPreview network="og" title={seo.og_title || effTitle} description={seo.og_description || effDesc} image={effOgImage} />
        <SocialPreview network="twitter" title={seo.og_title || effTitle} description={seo.og_description || effDesc} image={seo.twitter_image || effOgImage} />
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ audit UI
const StatusIcon: React.FC<{ status: 'pass' | 'warn' | 'fail' }> = ({ status }) => (
  <span className={cx(
    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black',
    status === 'pass' && 'bg-emerald-500/15 text-emerald-600',
    status === 'warn' && 'bg-amber-500/15 text-amber-600',
    status === 'fail' && 'bg-red-500/15 text-red-600',
  )}>
    {status === 'pass' ? '✓' : status === 'warn' ? '!' : '✗'}
  </span>
);

export const AuditPanel: React.FC<{ report: BlogAuditReport }> = ({ report }) => {
  const scoreTone = report.score >= 80 ? 'green' : report.score >= 65 ? 'gold' : report.score >= 40 ? 'amber' : 'red';
  const groups: Array<{ label: string; ids: string[] }> = [
    { label: 'Title & description', ids: ['seo_title', 'seo_title_len', 'meta_desc', 'meta_desc_len'] },
    { label: 'Focus keyword', ids: ['focus_keyword', 'kw_in_title', 'kw_in_desc', 'kw_in_intro', 'kw_in_headings', 'kw_density', 'kw_in_slug'] },
    { label: 'Structure & depth', ids: ['h1_unique', 'h2_structure', 'content_length', 'slug_readable'] },
    { label: 'Links & media', ids: ['internal_links', 'external_links', 'inline_images', 'image_alt', 'featured_image'] },
    { label: 'Social & technical', ids: ['canonical', 'og_meta', 'twitter_image'] },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white/[0.4] p-4">
        <div className={cx(
          'flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-4',
          scoreTone === 'green' && 'border-emerald-500/60 text-emerald-700',
          scoreTone === 'gold' && 'border-[#C9A45C]/70 text-[#8F6B2D]',
          scoreTone === 'amber' && 'border-amber-500/60 text-amber-700',
          scoreTone === 'red' && 'border-red-500/60 text-red-700',
        )}>
          <span className="text-xl font-black tabular-nums leading-none">{report.score}</span>
          <span className="text-[9px] font-bold uppercase tracking-wider">/ 100</span>
        </div>
        <div className="min-w-0">
          <Badge tone={scoreTone as 'green' | 'gold' | 'amber' | 'red'}>{report.label}</Badge>
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#475569]">
            SEO <strong>optimization</strong> score — how complete the on-page basics are.
            It does <strong>not</strong> predict Google rankings; actual search performance appears
            in Search Console once connected.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Words', value: report.words },
          { label: 'Characters', value: report.chars },
          { label: 'Reading time', value: `${report.readingTimeMin} min` },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-[#E2E8F0] bg-white/[0.4] px-2 py-2.5">
            <p className="text-sm font-black tabular-nums text-[#111827]">{m.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">{m.label}</p>
          </div>
        ))}
      </div>

      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8F6B2D]">{g.label}</p>
          <ul className="flex flex-col gap-1.5">
            {report.checks.filter((c) => g.ids.includes(c.id)).map((c) => (
              <li key={c.id} className="flex items-start gap-2 text-xs">
                <StatusIcon status={c.status} />
                <span className="min-w-0">
                  <span className="font-semibold text-[#111827]">{c.label}</span>
                  {c.detail && <span className="block text-[11px] leading-snug text-[#64748B]">{c.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {report.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
            <AlertTriangle size={12} /> Structure suggestions
          </p>
          <ul className="list-inside list-disc space-y-1 text-[11.5px] leading-relaxed text-[#7c5a12]">
            {report.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {report.links.brokenHint.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.05] p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-700">
            <ShieldAlert size={12} /> Link problems
          </p>
          <ul className="list-inside list-disc space-y-1 text-[11.5px] text-red-700">
            {report.links.brokenHint.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ readability
export const ReadabilityPanel: React.FC<{ report: BlogAuditReport }> = ({ report }) => {
  const r = report.readability;
  return (
    <div className="flex flex-col gap-3 text-xs">
      <p className="rounded-lg border border-[#E2E8F0] bg-white/[0.4] px-3 py-2 text-[11px] leading-relaxed text-[#475569]">
        A writing-quality aid only — readability is not a direct Google ranking factor.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-[#E2E8F0] bg-white/[0.4] px-3 py-2.5">
          <p className="text-sm font-black tabular-nums text-[#111827]">{r.flesch ?? '—'}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Flesch ease · {r.level}</p>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white/[0.4] px-3 py-2.5">
          <p className="text-sm font-black tabular-nums text-[#111827]">{r.avgSentenceWords}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Avg words / sentence</p>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white/[0.4] px-3 py-2.5">
          <p className="text-sm font-black tabular-nums text-[#111827]">{r.sentences}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Sentences</p>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white/[0.4] px-3 py-2.5">
          <p className={cx('text-sm font-black tabular-nums', r.longSentences > 0 ? 'text-amber-700' : 'text-[#111827]')}>{r.longSentences}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Sentences 30+ words</p>
        </div>
      </div>
      {r.longParagraphs.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8F6B2D]">Very long paragraphs (120+ words)</p>
          <ul className="list-inside list-disc space-y-1 text-[11px] text-[#475569]">
            {r.longParagraphs.map((p, i) => <li key={i}>“{p.preview}” — {p.words} words</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ link checker
interface LinkCheckResult {
  href: string;
  text: string;
  state: 'ok' | 'warn' | 'unknown';
  note: string;
}

const STATIC_ROUTES = new Set([
  '/', '/about', '/contact', '/blog', '/services', '/tools', '/ai-tools', '/portfolio',
  '/free-templates', '/templates', '/privacy-policy', '/terms', '/termspolicy', '/cookiespolicy',
  '/disclaimer', '/faq',
]);

function checkLink(href: string, text: string): LinkCheckResult {
  const base = { href, text };
  if (!href || href === '#') return { ...base, state: 'warn', note: 'No destination — add a real URL.' };
  if (/^javascript:/i.test(href)) return { ...base, state: 'warn', note: 'javascript: link was removed by the sanitizer.' };
  if (href.startsWith('#')) return { ...base, state: 'ok', note: 'In-page anchor.' };

  if (href.startsWith('/')) {
    const [path] = href.split('#');
    const segs = path.replace(/\/+$/, '').split('/').filter(Boolean);
    const head = segs[0] ? `/${segs[0]}` : '/';
    if (segs.length === 0) return { ...base, state: 'ok', note: 'Homepage.' };
    if (head === '/services' && segs[1]) {
      return servicesRegistry.some((s) => s.slug === segs[1])
        ? { ...base, state: 'ok', note: 'Verified against the services registry.' }
        : { ...base, state: 'warn', note: `No service with slug “${segs[1]}”.` };
    }
    if (head === '/tools' && segs[1]) {
      return toolsRegistry.some((t) => t.slug === segs[1])
        ? { ...base, state: 'ok', note: 'Verified against the tools registry.' }
        : { ...base, state: 'warn', note: `No tool with slug “${segs[1]}”.` };
    }
    if (head === '/ai-tools' && segs[1]) {
      const slug = decodeURIComponent(segs[1]);
      return aiToolsDirectory.some((t) => t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slug)
        ? { ...base, state: 'ok', note: 'Verified against the AI tools directory.' }
        : { ...base, state: 'warn', note: `No AI tool matching “${slug}”.` };
    }
    if (head === '/blog' && segs[1]) {
      return blogPosts.some((p) => p.slug === segs[1])
        ? { ...base, state: 'ok', note: 'Verified against the blog registry.' }
        : { ...base, state: 'warn', note: `No published post with slug “${segs[1]}” (yet).` };
    }
    if (head === '/portfolio' && segs[1]) {
      return projectsData.some((p) => p.id === segs[1])
        ? { ...base, state: 'ok', note: 'Verified against the portfolio registry.' }
        : { ...base, state: 'warn', note: `No project with id “${segs[1]}”.` };
    }
    if (head === '/free-templates' && segs[1]) {
      return freeTemplates.some((t) => t.slug === segs[1])
        ? { ...base, state: 'ok', note: 'Verified against the free templates registry.' }
        : { ...base, state: 'warn', note: `No template with slug “${segs[1]}”.` };
    }
    if (STATIC_ROUTES.has(head)) return { ...base, state: 'ok', note: 'Known static route.' };
    return { ...base, state: 'warn', note: 'Unknown internal route — double-check the path.' };
  }

  if (/^https?:\/\//i.test(href)) {
    if (href.includes('branify.store')) {
      const path = href.replace(/^https?:\/\/branify\.store/, '');
      const inner = checkLink(path || '/', text);
      return { href, text, state: inner.state, note: `branify.store link — ${inner.note}` };
    }
    return { ...base, state: 'unknown', note: 'External URL — browsers cannot verify cross-origin links (CORS). Open it once manually.' };
  }
  if (/^(mailto|tel):/i.test(href)) return { ...base, state: 'ok', note: 'Contact link.' };
  return { ...base, state: 'warn', note: 'Unrecognized URL format.' };
}

export const LinkCheckPanel: React.FC<{ contentHtml: string }> = ({ contentHtml }) => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<LinkCheckResult[] | null>(null);

  const run = () => {
    setRunning(true);
    // Microtask so the spinner paints before the synchronous registry checks.
    setTimeout(() => {
      try {
        const doc = new DOMParser().parseFromString(contentHtml, 'text/html');
        const seen = new Set<string>();
        const out: LinkCheckResult[] = [];
        doc.querySelectorAll('a[href]').forEach((a) => {
          const href = a.getAttribute('href') || '';
          const key = href;
          if (seen.has(key)) return;
          seen.add(key);
          out.push(checkLink(href, (a.textContent || '').trim().slice(0, 60)));
        });
        setResults(out);
      } finally {
        setRunning(false);
      }
    }, 30);
  };

  const icon = (s: LinkCheckResult['state']) => s === 'ok' ? <Check size={12} className="text-emerald-600" /> : s === 'warn' ? <AlertTriangle size={12} className="text-amber-600" /> : <Info size={12} className="text-[#64748B]" />;

  return (
    <div className="flex flex-col gap-3">
      <Btn size="sm" variant="outline" icon={Link2} loading={running} onClick={run} disabled={!contentHtml}>
        Check links
      </Btn>
      {results === null ? (
        <p className="text-[11px] leading-relaxed text-[#64748B]">
          Validates internal links against the real BRANIFY route/content registries.
          External URLs are reported as “not verified” — cross-origin checks are blocked by browsers.
        </p>
      ) : results.length === 0 ? (
        <p className="text-[11px] text-[#64748B]">No links found in this article yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {results.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] leading-snug">
              {icon(r.state)}
              <span className="min-w-0">
                <span className="block truncate font-mono text-[10.5px] text-[#111827]" title={r.href}>{r.href}</span>
                <span className="text-[#64748B]">{r.note}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ search performance
export const SearchPerformancePanel: React.FC<{ slug: string; published: boolean; onOpenCenter: (deepLinkPath: string) => void }> = ({ slug, published, onOpenCenter }) => {
  const [views, setViews] = useState<{ total: number; byName: Array<{ name: string; count: number }>; loading: boolean; error: string }>({ total: 0, byName: [], loading: true, error: '' });
  const path = `/blog/${slug}`;

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!slug) { if (alive) setViews({ total: 0, byName: [], loading: false, error: '' }); return; }
      setViews((v) => ({ ...v, loading: true, error: '' }));
      try {
        const res = await listRows<EventRow>('analytics_events', { path, pageSize: 1, sort: 'created_at', dir: 'desc' });
        if (!alive) return;
        if (res.total === 0) {
          setViews({ total: 0, byName: [], loading: false, error: '' });
          return;
        }
        const detail = await listRows<EventRow>('analytics_events', { path, pageSize: 200, sort: 'created_at', dir: 'desc' });
        if (!alive) return;
        const byName = new Map<string, number>();
        detail.rows.forEach((r) => byName.set(r.name, (byName.get(r.name) || 0) + 1));
        setViews({
          total: res.total,
          byName: [...byName.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
          loading: false,
          error: '',
        });
      } catch (e) {
        if (alive) setViews({ total: 0, byName: [], loading: false, error: (e as Error).message });
      }
    })();
    return () => { alive = false; };
  }, [slug, path]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-[#E2E8F0] bg-white/[0.5] p-4">
        <GscMiniPanel path={`/blog/${slug}`} published={published} onOpenCenter={onOpenCenter} />
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white/[0.5] p-4">
        <p className="mb-2 flex items-center gap-2 text-[12px] font-bold text-[#111827]">
          <BarChart3 size={14} className="text-[#8F6B2D]" /> First-party events · {path}
        </p>
        {views.loading ? (
          <LoadingBlock label="Checking analytics events…" />
        ) : views.error ? (
          <p className="text-[11px] text-red-600">{views.error}</p>
        ) : views.total === 0 ? (
          <EmptyState
            icon={Gauge}
            title="No tracked events for this URL yet"
            hint={published ? 'Public interaction events (clicks, submissions) on this article will appear here.' : 'Publish the post to start collecting events.'}
          />
        ) : (
          <div>
            <p className="text-lg font-black tabular-nums text-[#111827]">{views.total}</p>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">events since tracking began</p>
            <ul className="flex flex-col gap-1">
              {views.byName.map((e) => (
                <li key={e.name} className="flex items-center justify-between text-[11px] text-[#475569]">
                  <span className="font-mono">{e.name}</span>
                  <span className="font-bold tabular-nums text-[#111827]">{e.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ combined runner
export function runAudit(input: Parameters<typeof analyzeArticle>[0]): BlogAuditReport {
  return analyzeArticle(input);
}

export const SeoScoreChip: React.FC<{ report: BlogAuditReport | null }> = ({ report }) => {
  if (!report) return null;
  const tone = report.score >= 80 ? 'green' : report.score >= 65 ? 'gold' : report.score >= 40 ? 'amber' : 'red';
  return (
    <Badge tone={tone as 'green' | 'gold' | 'amber' | 'red'}>
      <ListChecks size={10} /> SEO {report.score}/100
    </Badge>
  );
};
