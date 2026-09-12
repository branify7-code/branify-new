// =============================================================================
// Vercel serverless function — POST /api/ai/blog
// Thin transport wrapper; all logic lives in lib/ai (server-side only).
// =============================================================================
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAiBlog, sendJson } from '../../lib/ai/routes';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    sendJson(res, await handleAiBlog(req));
  } catch (err) {
    sendJson(res, {
      status: 500,
      json: { ok: false, error: { kind: 'internal', message: 'Something went wrong while handling the AI request.' } },
    });
    void err;
  }
}
