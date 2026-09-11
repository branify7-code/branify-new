// =============================================================================
// BRANIFY ADMIN — AI Blog Generation client (browser side)
// -----------------------------------------------------------------------------
// Talks to the serverless endpoint at /api/admin/ai/blog/generate (mirrors the
// GSC client pattern in this folder). The browser sends only the generation
// brief; AI provider credentials stay server-side and the browser receives the
// generated draft only.
// =============================================================================

import { supabase } from '../../lib/supabase';

// In local dev (sandbox preview) there is no /api route — call the live
// endpoint (CORS-allowlisted). Compiled out of production builds.
const DEV = Boolean((import.meta as { env?: Record<string, unknown> }).env?.DEV);
const BASE = DEV ? 'https://branify.store/api/admin/ai/blog' : '/api/admin/ai/blog';

// ------------------------------------------------------------------ types
export type ContentGoalId = 'informational' | 'lead_generation' | 'service_promotion' | 'educational';
export type ContentToneId = 'professional' | 'expert' | 'conversational' | 'educational';

export interface ExistingPostRef {
  title: string;
  slug: string;
  category: string;
}

export interface GenerateBlogForm {
  topic: string;
  keyword: string;
  secondaryKeywords: string[];
  audience: string;
  goal: ContentGoalId;
  category: string;
  length: number;
  tone: ContentToneId;
  includeFaq: boolean;
  includeInternalLinks: boolean;
  generateImagePrompt: boolean;
  generateSeo: boolean;
}

export interface GeneratedSeoMeta {
  title: string;
  description: string;
  focus_keyword: string;
  keywords: string[];
}

export interface GeneratedBlogDraft {
  title: string;
  slug: string;
  excerpt: string;
  /** Semantic article HTML for the existing Blog Editor (visual + HTML modes). */
  contentHtml: string;
  category: string;
  tags: string[];
  authorName: string;
  authorRole: string;
  seo: GeneratedSeoMeta;
  coverImagePrompt: string;
  coverAlt: string;
  warnings: string[];
}

export interface GenerateBlogResult {
  draft: GeneratedBlogDraft;
  model: string;
  provider: string;
  durationMs: number;
  wordCount: number;
  repaired: boolean;
}

export class AiBlogError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ------------------------------------------------------------------ call
const REQUEST_TIMEOUT_MS = 180_000; // long articles take real time server-side

async function adminToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new AiBlogError('unauthorized', 401, 'Sign in to BRANIFY Admin first.');
  return token;
}

async function callOnce(form: GenerateBlogForm, existing: ExistingPostRef[], linkCandidates: string[], token: string): Promise<GenerateBlogResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, existing, linkCandidates }),
      signal: ctrl.signal,
    });
  } catch (e) {
    const aborted = e instanceof Error && (e.name === 'AbortError' || /abort/i.test(e.message || ''));
    throw new AiBlogError(aborted ? 'timeout' : 'network', aborted ? 504 : 502,
      aborted
        ? 'Generation took too long and was stopped. Try again — shorter articles generate faster.'
        : 'Could not reach the AI generation service. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }

  let json: { ok?: boolean; data?: GenerateBlogResult; error?: { code: string; message: string } } | null = null;
  try { json = await res.json(); } catch { /* non-JSON (e.g. HTML 404) */ }
  if (!res.ok || !json?.ok) {
    const code = json?.error?.code || (res.status === 404 ? 'service_missing' : 'upstream');
    const message = json?.error?.message
      || (code === 'service_missing'
        ? 'The AI generation service is not reachable yet — deploy the latest build or retry in a minute.'
        : 'AI generation failed.');
    throw new AiBlogError(code, res.status, message);
  }
  return json.data as GenerateBlogResult;
}

/** Authenticated generation call with one automatic retry after session refresh. */
export async function generateBlogDraft(form: GenerateBlogForm, existing: ExistingPostRef[], linkCandidates: string[]): Promise<GenerateBlogResult> {
  try {
    return await callOnce(form, existing, linkCandidates, await adminToken());
  } catch (e) {
    if (e instanceof AiBlogError && (e.code === 'unauthorized' || e.status === 401)) {
      await supabase.auth.refreshSession();
      return callOnce(form, existing, linkCandidates, await adminToken());
    }
    throw e;
  }
}

// ------------------------------------------------------------------ duplicate pre-check (client-side heuristic)
const STOP = new Set(['a', 'an', 'the', 'for', 'and', 'or', 'to', 'of', 'in', 'on', 'with', 'how', 'why', 'what', 'your', 'you', 'is', 'are', 'best', 'guide', 'tips']);

function tokensOf(s: string): Set<string> {
  return new Set(
    s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 2 && !STOP.has(t)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

export interface DuplicateHit {
  title: string;
  slug: string;
  score: number;
}

/** Cheap topic/title overlap check against existing posts (server prompt also guards). */
export function findSimilarPosts(topic: string, existing: ExistingPostRef[]): DuplicateHit[] {
  const t = tokensOf(topic);
  const hits: DuplicateHit[] = [];
  for (const p of existing) {
    const score = Math.max(jaccard(t, tokensOf(p.title)), jaccard(t, tokensOf(p.slug.replace(/-/g, ' '))));
    if (score >= 0.55) hits.push({ title: p.title, slug: p.slug, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 3);
}
