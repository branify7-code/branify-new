// =============================================================================
// BRANIFY — Meta "User Data Deletion Request" callback
// -----------------------------------------------------------------------------
// POST /api/data-deletion   (Meta App Settings → Basic → User data deletion)
//
// Contract (https://developers.facebook.com/docs/development/create-an-app/
// app-dashboard/data-deletion-callback):
//   · Meta POSTs application/x-www-form-urlencoded with one field:
//     signed_request = base64url(HMAC-SHA256(payload_b64)) + "." + base64url(payload JSON)
//     — SIGNATURE FIRST, payload second (opposite of JWT!), and the HMAC is
//     computed over the base64url-encoded payload STRING, keyed with the App
//     Secret (matches Meta's official parse_signed_request sample).
//   · payload = { algorithm: "HMAC-SHA256", issued_at, user_id }
//   · The endpoint MUST verify the signature, then respond 200 with JSON:
//       { "url": "<status page>", "confirmation_code": "<code>" }
//
// App Secret resolution reuses the WhatsApp CRM config store
// (WHATSAPP_APP_SECRET env > whatsapp_settings.app_secret). If no secret is
// configured the endpoint fails honestly with 503 so the gap is visible
// instead of silently accepting unverified deletion requests.
//
// Every verified request is recorded in the existing activity_log (admin
// Activity Log page) with the Meta user id + confirmation code, so the team
// can actually fulfil the deletion. No tokens or secrets are ever logged.
//
// Routing note (same pattern as /api/whatsapp/*): vercel.json rewrites
// /api/data-deletion into /api/ai/generate and the wrapper dispatches on the
// ORIGINAL request path — Vercel Hobby caps the project at 12 functions.
// =============================================================================
import crypto from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { HandlerResult } from '../lib/ai/routes';
import { loadConfig } from './whatsapp/store';
import { logActivityServer } from './whatsapp/activity';

const STATUS_PAGE_URL = 'https://branify.store/data-deletion';
const MAX_BODY_BYTES = 16 * 1024; // signed_request payloads are tiny

interface SignedRequest {
  userId: string;
  issuedAt: number;
}

function json(status: number, body: Record<string, unknown>): HandlerResult {
  return { status, json: { ok: status < 400, ...body } };
}

function b64urlDecode(part: string): Buffer {
  return Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/** Verify signature and decode the payload (constant-time compare).
 *  Meta format: signed_request = <sig_b64>.<payload_b64>; HMAC over the
 *  base64url payload string. Returns null on any mismatch. */
function parseSignedRequest(raw: string, appSecret: string): SignedRequest | null {
  const dot = raw.indexOf('.');
  if (dot <= 0) return null;
  const sigB64 = raw.slice(0, dot);          // FIRST part = signature
  const payloadB64 = raw.slice(dot + 1);     // SECOND part = payload
  if (!payloadB64 || !sigB64) return null;

  let expected: Buffer;
  let got: Buffer;
  try {
    expected = crypto.createHmac('sha256', appSecret).update(payloadB64, 'utf8').digest();
    got = b64urlDecode(sigB64);
  } catch {
    return null;
  }
  if (expected.length !== got.length) return null;
  try {
    if (!crypto.timingSafeEqual(expected, got)) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(b64urlDecode(payloadB64).toString('utf8')) as {
      algorithm?: string;
      user_id?: string;
      issued_at?: number;
    };
    if (payload.algorithm !== 'HMAC-SHA256' || !payload.user_id) return null;
    return { userId: String(payload.user_id), issuedAt: Number(payload.issued_at || 0) };
  } catch {
    return null;
  }
}

async function readFormBody(req: IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new Error('body_too_large');
    chunks.push(chunk as Buffer);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}

export async function handleDataDeletion(req: IncomingMessage): Promise<HandlerResult> {
  const method = (req.method || 'GET').toUpperCase();

  // Human/health check — describes the contract, accepts nothing.
  if (method === 'GET') {
    return json(200, {
      endpoint: 'Meta data deletion request callback',
      method: 'POST',
      content_type: 'application/x-www-form-urlencoded',
      field: 'signed_request',
      returns: { url: STATUS_PAGE_URL, confirmation_code: '<generated per request>' },
    });
  }

  if (method !== 'POST') {
    return json(405, { error: { code: 'method_not_allowed', message: 'Use POST with a signed_request form field.' } });
  }

  // The App Secret must be configured BEFORE Meta validates the callback.
  const cfg = await loadConfig();
  if (!cfg.appSecret) {
    return json(503, {
      error: {
        code: 'config',
        message: 'App secret is not configured yet. Add the Meta App Secret in BRANIFY Admin → WhatsApp CRM → Settings, then retry.',
      },
    });
  }

  let form: URLSearchParams;
  try {
    form = await readFormBody(req);
  } catch {
    return json(400, { error: { code: 'bad_request', message: 'Request body could not be read.' } });
  }
  const raw = (form.get('signed_request') || '').trim();
  if (!raw) {
    return json(400, { error: { code: 'bad_request', message: 'Missing signed_request form field.' } });
  }

  const parsed = parseSignedRequest(raw, cfg.appSecret);
  if (!parsed) {
    return json(401, { error: { code: 'invalid_signature', message: 'signed_request signature verification failed.' } });
  }

  const confirmationCode = `brn_${crypto.randomBytes(12).toString('hex')}`;
  // Audit trail in the existing activity_log (admin Activity Log page).
  // The Meta user id is required to fulfil the deletion — it is not a secret.
  await logActivityServer(
    'data_deletion_requested',
    'meta_user',
    parsed.userId,
    {
      confirmation_code: confirmationCode,
      issued_at: parsed.issuedAt || undefined,
      status_page: STATUS_PAGE_URL,
      note: 'Deletion requests are handled manually via the contact email on /data-deletion.',
    },
    'data-deletion-callback',
  );

  return json(200, { url: STATUS_PAGE_URL, confirmation_code: confirmationCode });
}
