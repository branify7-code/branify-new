// Probe: run the admin's own SEO audit engine and print duplicate-description
// groups with their full shared text (the UI truncates this to a preview).
import fs from 'node:fs';
import {
  buildPageInventory,
  resolveSeo,
  auditPages,
} from '../src/admin/pages/seoShared';

const ENV_FILE = '/home/z/my-project/.secrets.env';
const env = fs.readFileSync(ENV_FILE, 'utf8');
const secret = (k: string): string => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'));
  if (!m) throw new Error(`missing ${k}`);
  return m[1].trim().replace(/^["']|["']$/g, '');
};
const SB = secret('SUPABASE_URL');
const KEY = secret('SUPABASE_SERVICE_ROLE');

async function listAll(table: string): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  const page = 200;
  for (let from = 0; ; from += page) {
    const res = await fetch(`${SB}/rest/v1/${table}?select=*`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Range: `${from}-${from + page - 1}` },
    });
    const rows = (await res.json()) as Record<string, unknown>[];
    if (!Array.isArray(rows)) throw new Error(`${table}: ${JSON.stringify(rows).slice(0, 200)}`);
    out.push(...rows);
    const total = Number(res.headers.get('content-range')?.split('/')[1] || rows.length);
    if (rows.length === 0 || from + rows.length >= total) break;
  }
  return out;
}

const [services, tools, aiTools, products, blog, portfolio, overrides, settingsRows] =
  await Promise.all([
    listAll('services'), listAll('tools'), listAll('ai_tools'), listAll('products'),
    listAll('blog_posts'), listAll('portfolio_projects'), listAll('seo_overrides'), listAll('settings'),
  ]);

const settings = Object.fromEntries(settingsRows.map((r) => [String(r.key), r.value])) as never;
const rows = { services, tools, aiTools, products, blog, portfolio } as never;
const inventory = buildPageInventory(rows);
const byPath = new Map(
  (overrides as Array<{ page_path?: string }>).filter((o) => o?.page_path).map((o) => [String(o.page_path), o]),
);
const resolved = inventory.map((p) => resolveSeo(p, byPath.get(p.path) as never, settings));
const report = auditPages(resolved as never);

console.log(`resolved: ${resolved.length} · summary:`, JSON.stringify({ pass: report.summary.pass, warning: report.summary.warning, error: report.summary.error, score: report.summary.score }));
for (const g of report.summary.duplicateDescriptions) {
  console.log(`\nDUP-DESC group (${g.paths.length} pages) shared value:\n  "${g.value}"`);
  for (const p of g.paths) console.log('   -', p);
}
for (const g of report.summary.duplicateTitles) {
  console.log(`\nDUP-TITLE group (${g.paths.length} pages): "${g.value}"`);
  for (const p of g.paths) console.log('   -', p);
}

// print REAL shared texts for the dup groups
const byP = new Map(resolved.map((r) => [r.path as string, r as unknown as { title: string; description: string }]));
for (const g of report.summary.duplicateDescriptions) {
  const first = byP.get(g.paths[0]);
  console.log(`\n== shared description (${g.paths.length}):\n   "${first?.description?.slice(0, 220)}"`);
}
for (const g of report.summary.duplicateTitles) {
  const first = byP.get(g.paths[0]);
  console.log(`\n== shared title (${g.paths.length}):\n   "${first?.title}"`);
}
