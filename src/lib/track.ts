// =============================================================================
// BRANIFY — public conversion event tracking (first-party, privacy-safe)
// -----------------------------------------------------------------------------
// Fires real events to the admin analytics store:
//   · PRODUCTION  → Supabase `analytics_events` (anon INSERT policy, no reads)
//   · SANDBOX     → local preview API (port 3032 via gateway)
// Never blocks the UI, never stores personal data beyond the event itself.
// =============================================================================
import { supabase } from './supabase';

const LOCAL_ENABLED = Boolean((import.meta as { env?: Record<string, unknown> }).env?.DEV);
let localApiAvailable: boolean | null = null;

async function postLocal(name: string, path: string, meta: Record<string, unknown>): Promise<boolean> {
  if (!LOCAL_ENABLED) return false;
  try {
    const res = await fetch(`/api/admin/events?XTransformPort=3032`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, path, meta }),
      signal: AbortSignal.timeout(1500),
      keepalive: true,
    });
    localApiAvailable = res.ok;
    return res.ok;
  } catch {
    localApiAvailable = false;
    return false;
  }
}

/** Track a real conversion/usage event. Fire-and-forget — never throws. */
export function trackEvent(name: string, meta: Record<string, unknown> = {}): void {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  try {
    if (LOCAL_ENABLED) {
      // Sandbox: local API first, Supabase as the durable copy.
      void postLocal(name, path, meta).then((ok) => {
        if (!ok) void supabase.from('analytics_events').insert({ name, path, meta }).then(() => {}, () => {});
      });
    } else {
      void supabase.from('analytics_events').insert({ name, path, meta }).then(() => {}, () => {});
    }
  } catch { /* never break UX */ }
}

/** Record a 404 hit (unknown SPA route). Fire-and-forget. */
export function trackNotFound(path: string): void {
  try {
    if (LOCAL_ENABLED) {
      void fetch(`/api/admin/notfound?XTransformPort=3032`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path }),
        signal: AbortSignal.timeout(1500),
      }).then(() => {}, () => {});
    }
    void supabase
      .rpc('branify_log_not_found', { p_path: path })
      .then(() => {}, () => { /* rpc absent until schema applied */ });
  } catch { /* never break UX */ }
}
