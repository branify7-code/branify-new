// =============================================================================
// Vercel serverless function — POST /api/ai/generate  (+ /api/ai/prompt)
// -----------------------------------------------------------------------------
// Vercel Hobby allows max 12 serverless functions per deployment and this
// project was already at the cap, so the public Free AI Prompt Generator
// endpoint is routed INTO this function:
//   vercel.json rewrite:  /api/ai/prompt → /api/ai/generate
// and the wrapper below dispatches on the ORIGINAL request URL:
//   /api/ai/prompt  → handleAiPrompt (public, its own rate limits)
//   anything else   → handleAiGenerate (admin-gated as before)
// Security note: the dispatch key is the real request path, so a direct call
// to /api/ai/generate can never reach the public handler, and /api/ai/prompt
// can never reach the admin generator.
// =============================================================================
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAiGenerate, errorResult, sendJson, sendStream } from '../../lib/ai/routes';
import { handleAiPrompt } from './prompt';

function requestPath(req: IncomingMessage): string {
  const raw = req.url || '/';
  return raw.split('?')[0].replace(/\/+$/, '') || '/';
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (requestPath(req) === '/api/ai/prompt') {
    try {
      sendJson(res, await handleAiPrompt(req));
    } catch (err) {
      // All expected failures are OmniRouteError → friendly mapped messages.
      sendJson(res, errorResult(err));
    }
    return;
  }
  try {
    const result = await handleAiGenerate(req);
    if (result.stream) sendStream(res, result);
    else sendJson(res, result);
  } catch (err) {
    sendJson(res, {
      status: 500,
      json: { ok: false, error: { kind: 'internal', message: 'Something went wrong while handling the AI request.' } },
    });
    void err;
  }
}
