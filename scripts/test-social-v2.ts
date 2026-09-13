// =============================================================================
// BRANIFY — local e2e test for the Social Content Agent v2 (31-rule upgrade)
// -----------------------------------------------------------------------------
// Stubs the Supabase admin verification (fetch interception) and calls the REAL
// server/social/generate.ts handler, which then talks to the owner's OmniRoute
// gateway through the public ngrok tunnel. Verifies the additive v2 contract:
//   - request accepts cta_goal + brand_voice
//   - response posts carry pillar / alt_hooks / suggested_time / link_preview_text
//   - FB/IG differentiation + Smart CTA behavior
// Run:  npx tsx scripts/test-social-v2.ts
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- 1. load .env into process.env (tsx does not auto-load it) ----------
const envPath = path.resolve(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*?)"?\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
}

// ---------- 2. provider config: point the social endpoint at the gateway ----------
process.env.AI_PROVIDER = 'custom';
process.env.AI_API_BASE_URL = process.env.OMNIROUTE_BASE_URL;
process.env.AI_API_KEY = process.env.OMNIROUTE_API_KEY;
process.env.AI_MODEL = process.env.AI_MODEL_OVERRIDE || 'auto/best-chat';
process.env.AI_TIMEOUT_MS = '120000';

// ---------- 3. stub Supabase admin verification ----------
const realFetch = global.fetch;
const SB = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
global.fetch = async (input: unknown, init?: unknown): Promise<Response> => {
  const url = typeof input === 'string' ? input : (input as RequestInfo).toString();
  if (SB && url.startsWith(`${SB}/auth/v1/user`)) {
    return new Response(JSON.stringify({ id: 'test-admin-id', email: 'owner@branify.store' }), { status: 200 });
  }
  if (SB && url.startsWith(`${SB}/rest/v1/admin_users`)) {
    return new Response(JSON.stringify([{ email: 'owner@branify.store', active: true, role: 'owner' }]), { status: 200 });
  }
  return realFetch(input as RequestInfo, init as RequestInit | undefined);
};

// ---------- 4. call the real handler ----------
interface TestRes {
  status: number;
  body: Record<string, unknown>;
  status(code: number): TestRes;
  json(b: unknown): void;
  send(b: string): void;
  setHeader(): TestRes;
}
function makeRes(): TestRes {
  const r: TestRes = {
    status: 0,
    body: {},
    status(c) { r.status = c; return r; },
    json(b) { r.body = b as Record<string, unknown>; },
    send() { /* noop */ },
    setHeader() { return r; },
  };
  return r;
}

async function callHandler(body: Record<string, unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  // dynamic import AFTER env + fetch stub are in place
  const mod = await import('../server/social/generate');
  const req = {
    method: 'POST',
    headers: { authorization: 'Bearer fake-test-token', origin: 'https://branify.store' },
    body,
  };
  const res = makeRes();
  await (mod.default as (rq: unknown, rs: unknown) => Promise<void>)(req, res);
  return { status: res.status, body: res.body };
}

interface Post {
  platform: string; content_type: string; caption: string; hashtags: string[]; cta: string;
  pillar?: string; alt_hooks?: string[]; suggested_time?: string; link_preview_text?: string; day?: string;
}

let failures = 0;
function check(name: string, cond: boolean, detail = ''): void {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
}

async function main(): Promise<void> {
  const only = process.argv[2] || ''; // e.g. `tsx scripts/test-social-v2.ts 2` runs TEST 2 only

  // ---------------- Test 1: single / both platforms + Smart CTA (conversion) ----------------
  if (!only || only === '1') {
  console.log('\n=== TEST 1 · single, both platforms, cta_goal=conversion, brand_voice ===');
  const t1 = await callHandler({
    mode: 'single', platform: 'both',
    topic: 'Why slow websites kill premium brand perception',
    audience: 'founders planning a rebrand',
    cta: '', cta_goal: 'conversion',
    tone: 'professional',
    brand_voice: 'Premium, confident, zero fluff. Short punchy sentences.',
    recentCaptions: ['Your website is your best salesperson. Is it pulling its weight?'],
    recentTitles: [],
    include_hashtags: true, include_creative_prompt: false,
  });
  check('HTTP 200', t1.status === 200, `status=${t1.status} body=${JSON.stringify(t1.body).slice(0, 200)}`);
  const posts1 = ((t1.body.data as { posts?: Post[] })?.posts) || [];
  check('2 posts (facebook + instagram)', posts1.length === 2, `got ${posts1.length}`);
  const fb = posts1.find((p) => p.platform === 'facebook');
  const ig = posts1.find((p) => p.platform === 'instagram');
  check('FB pillar tagged', Boolean(fb?.pillar), fb?.pillar || '(none)');
  check('IG pillar tagged', Boolean(ig?.pillar), ig?.pillar || '(none)');
  check('FB alt_hooks ≤ 2', (fb?.alt_hooks?.length || 0) <= 2, JSON.stringify(fb?.alt_hooks || []));
  check('IG alt_hooks ≤ 2', (ig?.alt_hooks?.length || 0) <= 2, JSON.stringify(ig?.alt_hooks || []));
  check('FB hashtags ≤ 3 (platform playbook)', (fb?.hashtags?.length || 0) <= 3, `count=${fb?.hashtags?.length}`);
  check('IG hashtags 5–10 (platform playbook)', (ig?.hashtags?.length || 5) >= 5 && (ig?.hashtags?.length || 0) <= 10, `count=${ig?.hashtags?.length}`);
  check('CTA present (Smart CTA filled the empty CTA)', Boolean(fb?.cta) && Boolean(ig?.cta), `fb="${fb?.cta}" ig="${ig?.cta}"`);
  const words = fb?.caption.split(/\s+/).length || 0;
  check('FB caption in 40–130 word band', words >= 40 && words <= 130, `words=${words}`);
  const noRepeatHook = !fb?.caption.toLowerCase().includes('your website is your best salesperson');
  check('did not reuse the recent hook', noRepeatHook);
  check('durationMs reported', typeof (t1.body.data as { durationMs?: number })?.durationMs === 'number');

  }

  // ---------------- Test 2: from_blog (alt_hooks + link_preview_text) ----------------
  if (!only || only === '2') {
  console.log('\n=== TEST 2 · from_blog: takeaway-first + link_preview_text ===');
  const t2 = await callHandler({
    mode: 'from_blog', cta_goal: 'traffic', tone: 'expert',
    blog: {
      title: '7 Conversion Killers Hiding in Your Website Copy',
      url: 'https://branify.store/blog/conversion-killers-website-copy',
      excerpt: 'Most websites leak conversions in the same five places. Here is how to find and fix them.',
    },
    recentCaptions: [], recentTitles: [],
    include_hashtags: true, include_creative_prompt: false,
  });
  check('HTTP 200', t2.status === 200, `status=${t2.status} body=${JSON.stringify(t2.body).slice(0, 200)}`);
  const posts2 = ((t2.body.data as { posts?: Post[] })?.posts) || [];
  check('4 posts returned', posts2.length === 4, `got ${posts2.length}`);
  const fbBlog = posts2.find((p) => p.platform === 'facebook');
  check('FB link_preview_text present (≤ 220 chars)', Boolean(fbBlog?.link_preview_text) && (fbBlog?.link_preview_text?.length || 0) <= 220, `"${fbBlog?.link_preview_text}"`);
  check('FB uses blog URL verbatim', Boolean(fbBlog?.caption.includes('https://branify.store/blog/conversion-killers-website-copy')));
  check('FB alt_hooks present', (fbBlog?.alt_hooks?.length || 0) >= 1, JSON.stringify(fbBlog?.alt_hooks || []));
  check('all posts pillar-tagged', posts2.every((p) => Boolean(p.pillar)), posts2.map((p) => p.pillar).join(','));

  }

  // ---------------- Test 3: weekly (suggested_time per post) ----------------
  if (!only || only === '3') {
  console.log('\n=== TEST 3 · weekly plan: 7 posts + suggested_time ===');
  const t3 = await callHandler({
    mode: 'weekly', cta_goal: 'auto', tone: 'professional',
    recentCaptions: [], recentTitles: [],
    include_hashtags: true, include_creative_prompt: false,
  });
  check('HTTP 200', t3.status === 200, `status=${t3.status} body=${JSON.stringify(t3.body).slice(0, 200)}`);
  const posts3 = ((t3.body.data as { posts?: Post[] })?.posts) || [];
  check('7 posts returned', posts3.length === 7, `got ${posts3.length}`);
  check('every post has day', posts3.every((p) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(p.day || '')));
  const withTime = posts3.filter((p) => /^\d{2}:\d{2}$/.test(p.suggested_time || '')).length;
  check('≥ 5 posts carry suggested_time (advisory)', withTime >= 5, `${withTime}/7`);
  check('every post pillar-tagged', posts3.every((p) => Boolean(p.pillar)), posts3.map((p) => p.pillar).join(','));

  }

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
