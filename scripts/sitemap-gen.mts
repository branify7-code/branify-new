// =============================================================================
// BRANIFY — build-time sitemap generator (runs on every `npm run build`)
// -----------------------------------------------------------------------------
// Builds public/sitemap.xml from the REAL route inventory: static pages + hubs
// + LIVE content rows (services, tools, ai_tools, products, blog, portfolio)
// fetched from Supabase at build time, then excludes noindex overrides,
// archived/inactive/draft rows — the exact same builder the admin Sitemap
// Center uses (seoShared.buildPageInventory + sitemapEntries + buildSitemapXml).
//
// Why: the shipped static sitemap went stale (349 URLs vs 176 live routes).
// The Sitemap Center's "Honest deployment note" says it: wire the build script
// to do it automatically. This file IS that wiring — every Vercel deploy now
// ships a sitemap that matches the live inventory.
//
// Safety design (deploy must NEVER break because of this script):
//   - Anonymous/publishable key is used by default (RLS hides drafts — exactly
//     what a public sitemap wants). Service role is used only if provided.
//   - Sequential fetching + retries (parallel bursts get blocked by proxies).
//   - ANY failure => warn and keep the committed sitemap.xml, exit 0.
//
// Env resolution order (all optional):
//   SUPABASE_URL  || VITE_SUPABASE_URL  || hardcoded public project URL
//   SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY || VITE_SUPABASE_ANON_KEY
//   || hardcoded publishable key (identical fallback as src/lib/supabase.ts)
//   Local dev bonus: /home/z/my-project/.secrets.env (service role) if present.
//
// Usage: node scripts/.sitemap-gen.mjs   (compiled from this file by
//        scripts/sitemap-build.mjs — or run directly via `npx tsx`)
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildPageInventory,
  sitemapEntries,
  buildSitemapXml,
  parseSitemapXml,
} from '../src/admin/pages/seoShared';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ------------------------------------------------------------------ env setup
const readEnvFile = (p: string): Record<string, string> => {
  try {
    const out: Record<string, string> = {};
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
    return out;
  } catch {
    return {};
  }
};

const envFile = { ...readEnvFile(path.join(root, '.env')), ...readEnvFile('/home/z/my-project/.secrets.env') };
const pick = (...keys: string[]): string | undefined => {
  for (const k of keys) {
    const v = process.env[k] || envFile[k];
    if (v) return v;
  }
  return undefined;
};

const SB =
  pick('SUPABASE_URL', 'VITE_SUPABASE_URL') || 'https://uspshkegxhrglbpxqtil.supabase.co';
const KEY =
  pick('SUPABASE_SERVICE_ROLE', 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY') ||
  'sb_publishable_X11QDwMSfS2ivSePRVDpLQ_xNFY_8vw';
const USING_SERVICE_ROLE = Boolean(pick('SUPABASE_SERVICE_ROLE'));

// ------------------------------------------------------------------ fetching
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Build containers occasionally hang on outbound REST calls (observed on
// Vercel: the whole child process hit the 90s spawn kill before any fetch
// resolved). Bound every request AND the whole run so this step stays a
// fast, clean no-op instead of eating the build budget.
const FETCH_TIMEOUT_MS = 10_000;
const RUN_DEADLINE_MS = 60_000;
const runStartedAt = Date.now();

/** GET one table, ALL rows, sequentially paged. Retries transient junk (proxies
 *  occasionally answer bursts with an HTML block page — retries fix that). */
async function listAll(table: string): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  const page = 200;
  for (let from = 0; ; from += page) {
    if (Date.now() - runStartedAt > RUN_DEADLINE_MS) {
      throw new Error(`run deadline exceeded before ${table} (build egress to Supabase likely blocked)`);
    }
    let rows: Record<string, unknown>[] | null = null;
    let total = 0;
    let lastErr = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(`${SB}/rest/v1/${table}?select=*`, {
          headers: {
            apikey: KEY,
            Authorization: `Bearer ${KEY}`,
            ...(USING_SERVICE_ROLE ? { Range: `${from}-${from + page - 1}` } : {}),
          },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        const ct = res.headers.get('content-type') || '';
        const text = await res.text();
        if (!ct.includes('json')) throw new Error(`non-JSON response (${ct})`);
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error(`unexpected body: ${text.slice(0, 200)}`);
        rows = parsed;
        total = Number(res.headers.get('content-range')?.split('/')[1] || rows.length);
        break;
      } catch (e) {
        lastErr = String(e instanceof Error ? e.message : e).slice(0, 200);
        if (attempt < 3) await sleep(600 * attempt);
      }
    }
    if (!rows) throw new Error(`${table}: ${lastErr}`);
    out.push(...rows);
    if (rows.length === 0 || from + rows.length >= total) break;
  }
  return out;
}

// ------------------------------------------------------------------- generate
const SITEMAP_PATH = path.join(root, 'public', 'sitemap.xml');

try {
  // Sequential on purpose — one table at a time is proxy-friendly and fast
  // enough at build time (~1s total).
  const services = await listAll('services');
  const tools = await listAll('tools');
  const aiTools = await listAll('ai_tools');
  const products = await listAll('products');
  const blog = await listAll('blog_posts');
  const portfolio = await listAll('portfolio_projects');
  const overrides = await listAll('seo_overrides');
  const settingsRows = await listAll('settings');

  const settings = Object.fromEntries(
    settingsRows.map((r) => [String(r.key), r.value]),
  ) as never;
  const rows = { services, tools, aiTools, products, blog, portfolio } as never;

  const inventory = buildPageInventory(rows);
  const today = new Date().toISOString().slice(0, 10);

  // Previous <loc> -> <lastmod> map so static pages (no source row) don't
  // falsely claim a fresh lastmod on every build.
  const prevLastmod = new Map<string, string>();
  try {
    const cur = fs.readFileSync(SITEMAP_PATH, 'utf8');
    for (const block of cur.match(/<url>[\s\S]*?<\/url>/g) || []) {
      const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1];
      const lm = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1];
      if (loc && lm) prevLastmod.set(loc, lm);
    }
  } catch {
    /* first run, no previous file */
  }

  const entries = sitemapEntries(inventory, overrides as never, settings, today);
  const origin = entries.length ? new URL(entries[0].loc).origin : '';
  const realLastmod = new Set<string>(
    (inventory as Array<{ path: string; sourceUpdated?: string }>)
      .filter((p) => p.sourceUpdated)
      .map((p) => `${origin}${p.path}`),
  );
  for (const e of entries) {
    if (!realLastmod.has(e.loc) && prevLastmod.has(e.loc)) e.lastmod = prevLastmod.get(e.loc);
  }
  const xml = buildSitemapXml(entries);

  const newLocs = entries.map((e) => e.loc);
  const curLocs = [...prevLastmod.keys()];
  const curSet = new Set(curLocs);
  const newSet = new Set(newLocs);
  const removed = curLocs.filter((l) => !newSet.has(l));
  const added = newLocs.filter((l) => !curSet.has(l));

  console.log(
    `[sitemap] live content: ${services.length} services, ${tools.length} tools, ${aiTools.length} ai-tools, ${products.length} products, ${blog.length} blog, ${portfolio.length} portfolio`,
  );
  console.log(
    `[sitemap] inventory pages: ${inventory.length} -> indexable entries: ${entries.length} (prev file: ${curLocs.length}; +${added.length} new / -${removed.length} stale)`,
  );
  if (removed.length) console.log(`[sitemap] removed stale: ${removed.slice(0, 10).join(', ')}${removed.length > 10 ? ` +${removed.length - 10} more` : ''}`);
  if (added.length) console.log(`[sitemap] added new: ${added.slice(0, 10).join(', ')}${added.length > 10 ? ` +${added.length - 10} more` : ''}`);

  const unchanged =
    removed.length === 0 &&
    added.length === 0 &&
    curLocs.length === newLocs.length &&
    fs.existsSync(SITEMAP_PATH) &&
    fs.readFileSync(SITEMAP_PATH, 'utf8').includes('<lastmod>');
  if (unchanged) {
    console.log('[sitemap] no changes — committed sitemap already matches live inventory.');
  } else {
    fs.writeFileSync(SITEMAP_PATH, xml);
    console.log(`[sitemap] WROTE public/sitemap.xml (${entries.length} URLs, ${(xml.length / 1024).toFixed(1)} KB)`);
  }
} catch (err) {
  // NEVER fail the deploy because of sitemap generation — Vercel keeps serving
  // the committed file; the admin Sitemap Center will flag the staleness.
  console.warn(
    `[sitemap] WARN: generation skipped (${err instanceof Error ? err.message : err}). Keeping committed public/sitemap.xml.`,
  );
}
