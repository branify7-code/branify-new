// =============================================================================
// BRANIFY ADMIN — SITEMAP CENTER (/admin/seo/sitemap)
// -----------------------------------------------------------------------------
// Live status of the SHIPPED /sitemap.xml (real fetch, real <loc> parse),
// coverage check against the real route inventory, and a Regenerate flow that
// builds the exact XML from live content rows (noindex/archived/draft excluded).
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, FileText, RefreshCw, ScrollText } from 'lucide-react';
import type { AdminPageProps } from '../lib/auth';
import { getSettings, listRows } from '../lib/backend';
import type {
  AiToolRow, BlogRow, CollectionKey, PortfolioRow, ProductRow, SeoOverrideRow,
  ServiceRow, SiteSettings, ToolRow,
} from '../lib/types';
import { Badge, Btn, Card, ErrorBlock, LoadingBlock, cx, useToast } from '../ui';
import { StatTile } from '../ui/charts';
import { fmtDateTime } from '../lib/format';
import {
  buildPageInventory, buildSitemapXml, parseSitemapXml, sitemapEntries,
} from './seoShared';
import type { ContentRowLike } from './seoShared';

async function countOf(key: CollectionKey, extra: Record<string, unknown> = {}): Promise<number> {
  const res = await listRows<Record<string, unknown>>(key, { page: 1, pageSize: 1, ...extra });
  return res.total;
}

async function listAll<T>(key: CollectionKey): Promise<T[]> {
  const pageSize = 200;
  let page = 1;
  const all: T[] = [];
  for (;;) {
    const res = await listRows<T>(key, { page, pageSize });
    all.push(...res.rows);
    if (res.rows.length === 0 || all.length >= res.total) break;
    page += 1;
    if (page > 6) break;
  }
  return all;
}

interface LiveSitemap {
  ok: boolean | null;
  httpStatus: number | null;
  urlCount: number;
  firstUrls: string[];
  lastmodSample: string | null;
  bytes: number;
  checkedAt: string;
}

export const SitemapPage: React.FC<AdminPageProps> = () => {
  const { push } = useToast();
  const [live, setLive] = useState<LiveSitemap | null>(null);
  const [liveErr, setLiveErr] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<number | null>(null);
  const [coverageErr, setCoverageErr] = useState<string | null>(null);
  const [gen, setGen] = useState<{ xml: string; count: number; bytes: number } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genErr, setGenErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchLive = useCallback(async () => {
    setLiveErr(null);
    try {
      const res = await fetch('/sitemap.xml');
      const txt = res.ok ? await res.text() : '';
      const parsed = parseSitemapXml(txt);
      setLive({
        ok: res.ok,
        httpStatus: res.status,
        urlCount: parsed.locs.length,
        firstUrls: parsed.locs.slice(0, 10),
        lastmodSample: parsed.lastmods[0] || null,
        bytes: new Blob([txt]).size,
        checkedAt: new Date().toISOString(),
      });
    } catch (e) {
      setLiveErr((e as Error).message || 'Failed to fetch /sitemap.xml');
    }
  }, []);

  const fetchCoverage = useCallback(async () => {
    setCoverageErr(null);
    try {
      const [services, tools, products, blogPublished, portfolio] = await Promise.all([
        countOf('services', { archived: false }),
        countOf('tools', { archived: false }),
        countOf('products', { archived: false }),
        countOf('blog_posts', { archived: false, status: 'published' }),
        countOf('portfolio_projects', { archived: false }),
      ]);
      // 9 statics (/, about, contact, pricing + 5 legal) + 6 hub/directory routes
      // (/services, /tools, /ai-tools, /free-templates, /blog, /portfolio) + detail
      // pages. AI-tool rows are EXTERNAL links — they are NOT site pages and must
      // not be counted (kept identical to buildPageInventory / the audit total).
      setCoverage(9 + 6 + services + tools + products + blogPublished + portfolio);
    } catch (e) {
      setCoverageErr((e as Error).message || 'Could not count content rows');
    }
  }, []);

  useEffect(() => { void fetchLive(); }, [fetchLive]);
  useEffect(() => { void fetchCoverage(); }, [fetchCoverage]);

  const regenerate = useCallback(async () => {
    setGenerating(true);
    setGenErr(null);
    try {
      const [services, tools, aiTools, products, blog, portfolio, overrides, settings] = await Promise.all([
        listAll<ServiceRow>('services'),
        listAll<ToolRow>('tools'),
        listAll<AiToolRow>('ai_tools'),
        listAll<ProductRow>('products'),
        listAll<BlogRow>('blog_posts'),
        listAll<PortfolioRow>('portfolio_projects'),
        listAll<SeoOverrideRow>('seo_overrides'),
        getSettings(),
      ]);
      const rows: Record<string, ContentRowLike[]> = { services, tools, aiTools, products, blog, portfolio };
      const inventory = buildPageInventory(rows);
      const entries = sitemapEntries(inventory, overrides, settings as SiteSettings);
      const xml = buildSitemapXml(entries);
      setGen({ xml, count: entries.length, bytes: new Blob([xml]).size });
      push('success', `Preview generated — ${entries.length} URLs`);
    } catch (e) {
      setGenErr((e as Error).message || 'Regeneration failed');
    } finally {
      setGenerating(false);
    }
  }, [push]);

  const copyXml = async () => {
    if (!gen) return;
    try {
      await navigator.clipboard.writeText(gen.xml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      push('success', 'sitemap.xml copied to clipboard');
    } catch {
      push('error', 'Clipboard unavailable in this browser context.');
    }
  };

  const downloadXml = () => {
    if (!gen) return;
    const blob = new Blob([gen.xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    push('info', 'Downloaded sitemap.xml — place it in /public and redeploy.');
  };

  const match = useMemo(() => (live && coverage !== null ? live.urlCount === coverage : null), [live, coverage]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[#F5F6F2]">Sitemap Center</h1>
          <p className="text-xs text-[#A7AFBA]">Live /sitemap.xml status · coverage vs real route inventory · regeneration preview</p>
        </div>
        <Btn variant="outline" size="sm" icon={RefreshCw} onClick={() => { void fetchLive(); void fetchCoverage(); }}>Refresh</Btn>
      </div>

      {/* LIVE status */}
      <Card
        title="Live sitemap.xml"
        subtitle="Fetched from this origin right now — no cached numbers"
        actions={live ? <Badge tone={live.ok && live.urlCount > 0 ? 'green' : 'amber'}>{live.ok ? `HTTP ${live.httpStatus}` : 'Unreachable'}</Badge> : undefined}
      >
        {liveErr ? (
          <ErrorBlock title="Could not load /sitemap.xml" message={liveErr} onRetry={() => void fetchLive()} />
        ) : !live ? (
          <LoadingBlock label="Fetching /sitemap.xml…" />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="URL count" value={live.urlCount} sub="<loc> entries parsed" />
              <StatTile label="File size" value={`${(live.bytes / 1024).toFixed(1)} KB`} sub="live document" />
              <StatTile label="Lastmod sample" value={<span className="font-mono text-sm">{live.lastmodSample || '—'}</span>} sub="first <lastmod> in file" />
              <StatTile label="Served" value={live.ok ? 'Yes' : 'No'} sub="static /public/sitemap.xml" />
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]">First 10 URLs</p>
              {live.firstUrls.length === 0 ? (
                <p className="text-xs text-[#566072]">No &lt;loc&gt; entries found in the document.</p>
              ) : (
                <ul className="flex flex-col gap-1 rounded-xl border border-white/[0.07] bg-black/25 p-3">
                  {live.firstUrls.map((u, i) => (
                    <li key={`${u}-${i}`} className="truncate font-mono text-[11px] text-[#8AB4C8]" title={u}>{u}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Coverage */}
      <Card title="Coverage check" subtitle="Live sitemap URL count vs the real indexable route inventory">
        {coverageErr ? (
          <ErrorBlock title="Coverage check failed" message={coverageErr} onRetry={() => void fetchCoverage()} />
        ) : coverage === null ? (
          <LoadingBlock label="Counting content routes…" />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile label="Live sitemap URLs" value={live?.urlCount ?? '—'} />
              <StatTile label="Indexable audited routes" value={coverage} sub="statics + hubs + live content" />
              <StatTile
                label="Status"
                value={
                  <Badge tone={match === null ? 'zinc' : match ? 'green' : 'amber'}>
                    {match === null ? 'Unknown' : match ? 'Match' : 'Mismatch'}
                  </Badge>
                }
                sub={match === false ? 'counts differ — see below' : 'counts equal'}
              />
            </div>
            {match === false && (
              <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-200">
                The shipped static sitemap ({live?.urlCount ?? 0} URLs) does not cover the current inventory ({coverage} routes).
                Regenerate below and replace <span className="font-mono">/public/sitemap.xml</span> to bring them back in sync — stale
                sitemaps slow down discovery of new tools and templates.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Regenerate */}
      <Card
        title="Regenerate sitemap"
        subtitle="Builds the exact XML from live content rows — noindex overrides, archived and draft pages excluded"
        actions={<Btn variant="gold" size="sm" icon={ScrollText} onClick={() => void regenerate()} loading={generating}>Regenerate</Btn>}
      >
        {genErr && <ErrorBlock title="Regeneration failed" message={genErr} onRetry={() => void regenerate()} />}
        {!gen && !genErr && (
          <p className="text-xs leading-relaxed text-[#A7AFBA]">
            Press <span className="font-semibold text-[#E8C97C]">Regenerate</span> to crawl the admin content collections
            (services, tools, AI directory, free templates, blog, portfolio) and emit a complete, standards-compliant
            <span className="font-mono"> urlset</span> you can inspect, copy and download.
          </p>
        )}
        {gen && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="gold">{gen.count} URLs</Badge>
              <Badge tone="zinc">{(gen.bytes / 1024).toFixed(1)} KB</Badge>
              <Badge tone="steel">{new Blob([gen.xml]).size} bytes</Badge>
              <div className="ml-auto flex items-center gap-2">
                <Btn size="sm" variant="outline" icon={copied ? Check : Copy} onClick={() => void copyXml()}>{copied ? 'Copied' : 'Copy'}</Btn>
                <Btn size="sm" variant="gold" icon={Download} onClick={downloadXml}>Download</Btn>
              </div>
            </div>
            <pre className={cx('max-h-96 overflow-auto rounded-xl border border-white/[0.07] bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-[#9fb3c8]')}>
              {gen.xml}
            </pre>
          </div>
        )}
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#C9A45C]/25 bg-[#C9A45C]/[0.06] px-3.5 py-3 text-[11px] leading-relaxed text-[#E8C97C]">
          <FileText size={13} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-bold uppercase tracking-wider">Honest deployment note. </span>
            This preview generates the exact file. In production, download it into
            <span className="font-mono"> /public/sitemap.xml</span> (or wire the build script to do it automatically) and redeploy —
            Vercel serves the static file. Nothing is written to the live site from this screen.
          </p>
        </div>
      </Card>

      <p className="text-[11px] text-[#566072]">
        Last live check: {live ? fmtDateTime(live.checkedAt) : '—'} · generated previews are never auto-deployed.
      </p>
    </div>
  );
};
