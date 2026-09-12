// =============================================================================
// BRANIFY — regenerate public/sitemap.xml from the REAL route inventory
// -----------------------------------------------------------------------------
// Runs the exact same builder the admin Sitemap Center uses
// (seoShared.buildPageInventory + sitemapEntries + buildSitemapXml) against the
// live Supabase content tables, diffs the result against the shipped static
// /public/sitemap.xml, prints the diff, and rewrites the file only when needed.
//
// Usage:  npx tsx scripts/regen-sitemap.mts
// Needs:  SUPABASE_URL + SUPABASE_SERVICE_ROLE in /home/z/my-project/.secrets.env
// =============================================================================
import fs from 'node:fs';
import {
  buildPageInventory,
  sitemapEntries,
  buildSitemapXml,
  parseSitemapXml,
} from '../src/admin/pages/seoShared';

const ENV_FILE = '/home/z/my-project/.secrets.env';
const env = fs.readFileSync(ENV_FILE, 'utf8');
const secret = (k: string): string => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'));
  if (!m) throw new Error(`missing ${k} in ${ENV_FILE}`);
  return m[1].trim().replace(/^["']|["']$/g, '');
};
const SB = secret('SUPABASE_URL');
const KEY = secret('SUPABASE_SERVICE_ROLE');

async function listAll(table: string): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  const page = 200;
  for (let from = 0; ; from += page) {
    const res = await fetch(`${SB}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        Range: `${from}-${from + page - 1}`,
      },
    });
    const rows = (await res.json()) as Record<string, unknown>[];
    if (!Array.isArray(rows)) throw new Error(`${table}: ${JSON.stringify(rows).slice(0, 300)}`);
    out.push(...rows);
    const total = Number(res.headers.get('content-range')?.split('/')[1] || rows.length);
    if (rows.length === 0 || from + rows.length >= total) break;
  }
  return out;
}

const [services, tools, aiTools, products, blog, portfolio, overrides, settingsRows] =
  await Promise.all([
    listAll('services'),
    listAll('tools'),
    listAll('ai_tools'),
    listAll('products'),
    listAll('blog_posts'),
    listAll('portfolio_projects'),
    listAll('seo_overrides'),
    listAll('settings'),
  ]);

const settings = Object.fromEntries(
  settingsRows.map((r) => [String(r.key), r.value]),
) as never;

const rows = { services, tools, aiTools, products, blog, portfolio } as never;
const inventory = buildPageInventory(rows);
const today = new Date().toISOString().slice(0, 10);

// Previous <loc> → <lastmod> map (per-<url> block parse, order-safe).
const cur = fs.readFileSync('public/sitemap.xml', 'utf8');
const prevLastmod = new Map<string, string>();
for (const block of cur.match(/<url>[\s\S]*?<\/url>/g) || []) {
  const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1];
  const lm = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1];
  if (loc && lm) prevLastmod.set(loc, lm);
}

const entries = sitemapEntries(inventory, overrides as never, settings, today);
// Distinguish REAL lastmods (from content rows' updated_at) from fallback
// lastmods (static pages → today). Static pages reuse the previously shipped
// value so unchanged URLs never falsely claim a fresh update; content rows
// always keep their real updated_at, and genuinely new URLs keep today.
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

const curLocs = parseSitemapXml(cur).locs;
const newLocs = entries.map((e) => e.loc);
const curSet = new Set(curLocs);
const newSet = new Set(newLocs);
const removed = curLocs.filter((l) => !newSet.has(l));
const added = newLocs.filter((l) => !curSet.has(l));
const lastmodChanged = entries.filter((e) => prevLastmod.has(e.loc) && prevLastmod.get(e.loc) !== e.lastmod).length;

console.log(`inventory pages: ${inventory.length}`);
console.log(`indexable sitemap entries: ${entries.length}`);
console.log(`shipped file URLs:       ${curLocs.length}`);
console.log(`in file but NOT indexable: ${removed.length}`);
console.log(`indexable but missing from file: ${added.length}`);
console.log(`lastmod changed on existing URLs: ${lastmodChanged}`);
if (removed.length) {
  console.log('\n-- REMOVED (stale URLs in current file) --');
  for (const l of removed) console.log('  -', l);
}
if (added.length) {
  console.log('\n-- ADDED (missing from current file) --');
  for (const l of added) console.log('  +', l);
}

if (removed.length === 0 && added.length === 0 && lastmodChanged === 0 && cur.includes('<lastmod>')) {
  console.log('\nNo changes — shipped sitemap already matches the live inventory.');
} else {
  fs.writeFileSync('public/sitemap.xml', xml);
  console.log(`\nWROTE public/sitemap.xml (${entries.length} URLs, ${xml.length} bytes)`);
}
