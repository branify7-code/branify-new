// =============================================================================
// BRANIFY — API function bundler for /api/ai/*
// -----------------------------------------------------------------------------
// Vercel's @vercel/node builder in this repo cannot run multi-file TypeScript
// function bundles: the root tsconfig (module: ESNext, moduleResolution:
// bundler, allowImportingTsExtensions) makes compiled functions crash at
// runtime with FUNCTION_INVOCATION_FAILED. This mirrors the hard-won finding
// already embedded in api/gsc.ts + api/admin/ai/*: every serverless function
// here MUST be a single self-contained file with zero relative imports.
//
// This script keeps a single source of truth anyway:
//   * the real logic lives in lib/ai/{omniroute,blog,routes}.ts (shared with
//     the local dev API — scripts/local-api.ts), and
//   * the thin HTTP wrappers live in server/ai/{status,generate,blog}.ts.
// esbuild bundles each wrapper (entry) with its whole dependency graph into a
// self-contained CommonJS file in api/ai/<name>.js — plain JS, so @vercel/node
// never touches the broken TS pipeline at all.
//
// Usage:  node scripts/build-api-ai.mjs     (also wired into `npm run build`)
// Output: api/ai/{status,generate,blog}.js  (committed; regenerated on build)
// =============================================================================
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entries = ['status', 'generate', 'blog'].map((n) => path.join(root, 'server', 'ai', `${n}.ts`));
const outdir = path.join(root, 'api', 'ai');
mkdirSync(outdir, { recursive: true });

const results = await build({
  entryPoints: entries,
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
    js: '/* GENERATED FILE — do not edit by hand. Source: server/ai/*.ts + lib/ai/*. Regenerate with `npm run api:build`. */',
  },
});

const errors = (results.errors || []).length;
if (errors > 0) {
  console.error(`api-ai bundle FAILED with ${errors} error(s)`);
  process.exit(1);
}
console.log('api/ai/*.mjs generated (self-contained ESM serverless functions).');
