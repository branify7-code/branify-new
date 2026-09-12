// =============================================================================
// Vercel serverless function — POST /api/ai/generate
// Generic OpenAI-compatible completion through OmniRoute (model comes from env
// unless explicitly allowlisted via OMNIROUTE_ALLOWED_MODELS).
// =============================================================================
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAiGenerate, sendJson, sendStream } from '../../lib/ai/routes';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
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
