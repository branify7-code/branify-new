// =============================================================================
// BRANIFY — API function bundler for ALL serverless entries
// -----------------------------------------------------------------------------
// Vercel's @vercel/node builder in this repo cannot run .ts functions: the root
// tsconfig (module: ESNext, moduleResolution: bundler) + package.json
// "type": "module" make every compiled .ts function crash at runtime with
// FUNCTION_INVOCATION_FAILED (verified in production for api/gsc, api/social/*,
// api/meta/*, api/admin/ai/* on 2026-09-13). The proven fix (first shipped for
// /api/ai in d96eb72): pre-bundle each entry with esbuild into a self-contained
// ESM .mjs file that the Node runtime executes directly, bypassing the broken
// TS pipeline entirely.
//
// Source of truth lives in server/ (thin HTTP wrappers + logic):
//   server/ai/{status,generate,blog}.ts      -> api/ai/*.mjs
//   server/gsc.ts                            -> api/gsc.mjs
//   server/social/{generate,publish,publish-due,connect-token}.ts
//                                            -> api/social/*.mjs
//   server/meta/{start,callback}.ts          -> api/meta/oauth/*.mjs
//   server/admin-ai/{blog,image}-generate.ts -> api/admin/ai/{blog,image}/generate.mjs
//
// URL paths are unchanged (Vercel filesystem functions): /api/gsc,
// /api/social/*, /api/meta/oauth/*, /api/admin/ai/*/generate — the vercel.json
// cron for /api/social/publish-due keeps working untouched.
//
// Usage:  node scripts/build-api.mjs   (wired into `npm run build` + `npm run api:build`)
// Output: api/**/*.mjs                 (committed; regenerated on every build)
// =============================================================================
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** entry: [source under server/, output path under api/ (no extension)] */
const entries = [
  ['server/ai/status.ts', 'ai/status'],
  ['server/ai/generate.ts', 'ai/generate'],
  ['server/ai/blog.ts', 'ai/blog'],
  ['server/gsc.ts', 'gsc'],
  ['server/social/generate.ts', 'social/generate'],
  ['server/social/publish.ts', 'social/publish'],
  ['server/social/publish-due.ts', 'social/publish-due'],
  ['server/social/connect-token.ts', 'social/connect-token'],
  ['server/meta/start.ts', 'meta/oauth/start'],
  ['server/meta/callback.ts', 'meta/oauth/callback'],
  ['server/admin-ai/blog-generate.ts', 'admin/ai/blog/generate'],
  ['server/admin-ai/image-generate.ts', 'admin/ai/image/generate'],
];

const outdir = path.join(root, 'api');
mkdirSync(outdir, { recursive: true });

const results = await build({
  entryPoints: entries.map(([src, out]) => ({ in: path.join(root, src), out })),
  outdir,
  // repo package.json has "type": "module" → a generated .js file would be
  // parsed as ESM while esbuild emitted CJS → silent export loss / crashes.
  // Emit unambiguous ESM .mjs files (first-class on Vercel's Node runtime).
  outExtension: { '.js': '.mjs' },
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  minify: false,
  sourcemap: false,
  legalComments: 'none',
  logLevel: 'info',
  banner: {
    js: '/* GENERATED FILE — do not edit by hand. Source: server/* (see scripts/build-api.mjs). Regenerate with `npm run api:build`. */',
  },
});

const errors = (results.errors || []).length;
if (errors > 0) {
  console.error(`api bundle FAILED with ${errors} error(s)`);
  process.exit(1);
}
console.log(`api/**/*.mjs generated: ${entries.length} self-contained ESM serverless functions.`);
