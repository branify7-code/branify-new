// =============================================================================
// Vercel serverless function — POST /api/ai/prompt
// Thin HTTP wrapper: logic lives in lib/ai + server/ai/prompt.ts so the
// esbuild bundler (scripts/build-api.mjs) produces api/ai/prompt.mjs.
// =============================================================================
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAiPrompt } from '../../server/ai/prompt';
import { errorResult, sendJson } from '../../lib/ai/routes';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const result = await handleAiPrompt(req);
    sendJson(res, result);
  } catch (err) {
    // All expected failures are OmniRouteError → friendly mapped messages.
    sendJson(res, errorResult(err));
  }
}
