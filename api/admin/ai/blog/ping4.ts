// TEMP PROBE: module-load test — identical top-level code to generate.ts
// (constants, class, maps, prompt template) with a handler that returns OK
// without executing any generation logic.
const CORS_ORIGINS = ['https://branify.store', 'http://localhost:3000'];
const SB_URL = process.env.SUPABASE_URL || 'https://uspshkegxhrglbpxqtil.supabase.co';
const SB_ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_X11QDwMSfS2ivSePRVDpLQ_xNFY_8vw';
export const maxDuration = 60;
class AiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 12;
const rateBuckets = new Map<string, number[]>();
const GOALS = new Set(['informational', 'lead_generation', 'service_promotion', 'educational']);
const LENGTHS = new Set([1200, 1500, 2000, 2500]);
const GOAL_LABELS: Record<string, string> = { informational: 'x', lead_generation: 'y' };
const LENGTH_HINTS: Record<number, string> = { 1200: 'a', 1500: 'b' };
const TONE_LABELS: Record<string, string> = { professional: 'p' };
const PROMPT = `You are BRANIFY's senior SEO content strategist.

## Rules
- "BUILD. BRAND. GROW."
- test ${'interpolation'} value
- response contract: { "title": string, "slug": string }`;

export default async function handler(): Promise<void> {
  return impl.apply(null, arguments as unknown as any[]);
}
function impl(_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }): void {
  res.status(200).json({
    ok: true, probe: 'ping4-moduleload', promptLen: PROMPT.length,
    goals: GOALS.size, lengths: LENGTHS.size, buckets: rateBuckets.size,
    windowMs: RATE_WINDOW_MS, max: RATE_MAX, err: new AiError('t', 1, 'm').code,
    sb: Boolean(SB_URL && SB_ANON), origins: CORS_ORIGINS.length,
    goal0: GOAL_LABELS.informational, len0: LENGTH_HINTS[1200], tone0: TONE_LABELS.professional,
  });
}
