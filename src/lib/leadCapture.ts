// =============================================================================
// BRANIFY — lead capture mirror (SANDBOX PREVIEW ONLY)
// -----------------------------------------------------------------------------
// Production: lead forms write to Supabase `inquiries` (anon INSERT policy) and
// the admin CRM reads them via RLS-guarded SELECT — nothing extra needed.
// Sandbox:    the preview admin uses the local API's own database, so public
//             form submissions are MIRRORED (fire-and-forget, DEV builds only)
//             to the local lead endpoint. Production builds compile this out.
// =============================================================================
const LOCAL_ENABLED = Boolean((import.meta as { env?: Record<string, unknown> }).env?.DEV);

export function mirrorLeadToPreview(record: Record<string, unknown>): void {
  if (!LOCAL_ENABLED) return;
  void fetch(`/api/admin/leads?XTransformPort=3032`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(record),
    signal: AbortSignal.timeout(2000),
    keepalive: true,
  }).catch(() => { /* preview mirror is best-effort */ });
}
