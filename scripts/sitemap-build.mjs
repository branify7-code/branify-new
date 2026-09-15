// =============================================================================
// BRANIFY — sitemap build step (wired into `npm run build`, before vite build)
// -----------------------------------------------------------------------------
// Compiles scripts/sitemap-gen.mts (imports the TS seoShared builder) into a
// self-contained ESM file with esbuild — the same proven pattern as
// scripts/build-api.mjs — then executes it with plain node.
//
// Contract: this step NEVER fails the build. If Supabase is unreachable or the
// bundle fails, it warns and exits 0 so Vercel keeps shipping the committed
// public/sitemap.xml (staleness is surfaced by the admin Sitemap Center).
// =============================================================================
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(root, 'scripts', 'sitemap-gen.mts');
const outfile = path.join(root, 'scripts', '.sitemap-gen.mjs');

try {
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    minify: false,
    sourcemap: false,
    legalComments: 'none',
    logLevel: 'silent',
  });
} catch (e) {
  console.warn(`[sitemap] WARN: bundle failed (${e instanceof Error ? e.message : e}) — keeping committed sitemap.xml`);
  process.exit(0);
}

try {
  const r = spawnSync(process.execPath, [outfile], { stdio: 'pipe', cwd: root, timeout: 90_000 });
  const out = (r.stdout || '').toString().trim();
  const errOut = (r.stderr || '').toString().trim();
  if (out) console.log(out);
  // The generator exits 0 even when it skips generation (warnings go to
  // stderr) — always surface stderr so the build log tells the whole story.
  if (errOut) console.warn(`[sitemap] generator stderr: ${errOut.slice(0, 2000)}`);
  if (r.status === 0) {
    // done — outputs above
  } else if (r.error) {
    console.warn(`[sitemap] WARN: generator spawn failed (${r.error}) — keeping committed sitemap.xml`);
  } else if (r.signal) {
    console.warn(`[sitemap] WARN: generator killed with signal ${r.signal} — keeping committed sitemap.xml`);
  } else {
    console.warn(`[sitemap] WARN: generator exited ${r.status} — keeping committed sitemap.xml`);
    if (errOut) console.warn(`[sitemap] generator stderr: ${errOut.slice(0, 2000)}`);
  }
} finally {
  try { fs.rmSync(outfile, { force: true }); } catch { /* best effort */ }
}
process.exit(0);
