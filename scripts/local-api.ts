// =============================================================================
// BRANIFY — local AI preview API (DEV ONLY, mirrors the /api/ai functions)
// -----------------------------------------------------------------------------
// On Vercel the serverless functions in /api/ai serve these routes. The Vite
// dev server (and the sandbox static preview) cannot run Vercel functions, so
// this small express server mounts the exact same handlers from lib/ai and is
// reached through the dev proxy (vite.config.ts → http://localhost:3033).
//
//   npm run api        (or: npx tsx scripts/local-api.ts)
//
// Reads .env via dotenv. Never logs Authorization headers or key material —
// all logging goes through the redacting logSafe helper.
// =============================================================================
import http from 'node:http';
import express from 'express';
import 'dotenv/config';

import { handleAiBlog, handleAiGenerate, handleAiStatus, sendJson, sendStream } from '../lib/ai/routes';
import { logSafe } from '../lib/ai/omniroute';

const PORT = Number(process.env.LOCAL_AI_API_PORT || 3033);
const app = express();

// NOTE: no body-parsing middleware here — lib/ai/routes reads and size-limits
// the raw stream itself (64 KB cap in readJsonBody). Parsing the body twice
// would leave the handlers with an empty stream.

const wrap = (fn: (req: http.IncomingMessage) => Promise<import('../lib/ai/routes').HandlerResult>, streaming = false) =>
  async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
    try {
      const result = await fn(req);
      if (streaming && result.stream) sendStream(res, result);
      else sendJson(res, result);
    } catch (err) {
      sendJson(res, {
        status: 500,
        json: { ok: false, error: { kind: 'internal', message: 'Something went wrong while handling the AI request.' } },
      });
      void err;
    }
  };

app.get('/api/ai/status', wrap(handleAiStatus));
app.post('/api/ai/blog', wrap(handleAiBlog));
app.post('/api/ai/generate', wrap(handleAiGenerate, true));

app.get('/healthz', (_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, service: 'branify-local-ai-api' }));
});

// Express needs the node-style handler signature; cast is safe for these routes.
const listenReq = app as unknown as http.RequestListener;

const server = http.createServer((req, res) => {
  // Only the AI routes + health are exposed; everything else 404s.
  if (req.url && (req.url.startsWith('/api/ai/') || req.url.startsWith('/healthz'))) {
    listenReq(req, res);
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: { kind: 'not_found', message: 'Unknown local AI route.' } }));
});

server.listen(PORT, '127.0.0.1', () => {
  logSafe(`local AI API listening on http://127.0.0.1:${PORT} (dev only — same handlers as /api/ai serverless functions)`);
});
