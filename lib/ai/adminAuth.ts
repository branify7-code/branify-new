// =============================================================================
// BRANIFY — AI ENDPOINT ADMIN GATE (SERVER-SIDE ONLY)
// -----------------------------------------------------------------------------
// Optional hardening for /api/ai/*, enabled by setting
//   OMNIROUTE_REQUIRE_AUTH="true"        (server environment)
//
// When enabled, every /api/ai/* request must carry the signed-in admin's own
// Supabase session token:
//   Authorization: Bearer <Supabase access_token>
//
// The browser client (src/lib/aiClient.ts) already attaches this token, so the
// hardening works without a second code path. Verification mirrors the proven
// pattern from server/admin-ai/image-generate.ts:
//   1. Supabase /auth/v1/user validates the JWT (signature + expiry) and
//      returns the user. No key material is involved — the anon key is public.
//   2. The admin_users allowlist row (active) proves the user is an admin —
//      regular customers can never pass, even with a valid session.
//
// With the flag unset or "false" the gate is a no-op (current open behaviour).
// The gate NEVER logs or echoes the incoming token (redactSecrets already
// guards the surrounding handlers).
// =============================================================================

import { OmniRouteError } from './omniroute';

// Same public config fallbacks as server/admin-ai/image-generate.ts (repo
// convention): project URL + anon key are publishable by design; the secret
// service_role key is deliberately NOT used or referenced here.
const SB_URL = (process.env.SUPABASE_URL || 'https://uspshkegxhrglbpxqtil.supabase.co').replace(/\/+$/, '');
const SB_ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_X11QDwMSfS2ivSePRVDpLQ_xNFY_8vw';

/** True when the admin gate is switched on in the server environment. */
export function adminAuthRequired(): boolean {
  return (process.env.OMNIROUTE_REQUIRE_AUTH || '').trim().toLowerCase() === 'true';
}

/** Extract the bearer token from an Authorization header, or ''. */
function bearerToken(req: { headers?: { authorization?: unknown } }): string {
  const raw = req.headers?.authorization;
  const value = Array.isArray(raw) ? String(raw[0] || '') : String(raw || '');
  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match ? match[1].trim() : '';
}

interface AdminIdentity {
  id: string;
  email: string;
}

/**
 * Validate an incoming /api/ai/* request against the admin gate.
 * Returns null when the request may proceed (gate off, or valid admin token).
 * Returns an OmniRouteError ready to be surfaced via errorResult() otherwise.
 */
export async function requireAdminAuth(
  req: { headers?: { authorization?: unknown } },
): Promise<OmniRouteError | null> {
  if (!adminAuthRequired()) return null;

  const token = bearerToken(req);
  if (!token) {
    return new OmniRouteError(
      'unauthorized',
      'Sign in to BRANIFY Admin to use AI features.',
      401,
    );
  }

  // Step 1 — is it a live Supabase session? (validates signature + expiry)
  let identity: AdminIdentity;
  try {
    const uRes = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!uRes.ok) {
      return new OmniRouteError(
        'unauthorized',
        'Your admin session is invalid or expired. Sign in again.',
        401,
      );
    }
    const user = (await uRes.json()) as { id?: string; email?: string };
    if (!user?.email) {
      return new OmniRouteError(
        'unauthorized',
        'Your admin session is invalid or expired. Sign in again.',
        401,
      );
    }
    identity = { id: user.id || user.email, email: user.email };
  } catch {
    // Network failure reaching Supabase — fail closed (safe default).
    return new OmniRouteError(
      'upstream',
      'Admin verification is temporarily unavailable. Try again shortly.',
      502,
    );
  }

  // Step 2 — is that account on the active admin allowlist?
  try {
    const aRes = await fetch(
      `${SB_URL}/rest/v1/admin_users?email=eq.${encodeURIComponent(identity.email)}&select=email,active,role`,
      { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8_000) },
    );
    if (!aRes.ok) {
      return new OmniRouteError('upstream', 'Admin verification failed.', 502);
    }
    const admins = (await aRes.json()) as Array<{ email: string; active: boolean }>;
    if (!admins.some((a) => a.active)) {
      return new OmniRouteError(
        'forbidden',
        'This account is not on the BRANIFY admin allowlist.',
        403,
      );
    }
  } catch {
    return new OmniRouteError('upstream', 'Admin verification failed.', 502);
  }

  return null; // verified admin — proceed
}
