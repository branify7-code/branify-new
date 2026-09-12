// =============================================================================
// Vercel serverless function — GET /api/ai/status
// Read-only readiness info for the admin Integrations card. Never returns
// key material — presence flags and model/combo names only.
// =============================================================================
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAiStatus, sendJson } from '../../lib/ai/routes';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    sendJson(res, await handleAiStatus(req));
  } catch (err) {
    sendJson(res, {
      status: 500,
      json: { ok: false, error: { kind: 'internal', message: 'Something went wrong while handling the AI request.' } },
    });
    void err;
  }
}
