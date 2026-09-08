// =============================================================================
// BRANIFY ADMIN — Google Search Console client (browser side)
// -----------------------------------------------------------------------------
// Talks to the serverless integration at /api/gsc (api/gsc.ts — server-side
// OAuth + token vault). The browser only ever receives aggregated metrics;
// client secrets and Google tokens stay encrypted server-side.
// No sample data is ever produced: if Search Console returns nothing, the UI
// shows the real empty state.
// =============================================================================
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

// In local dev (sandbox preview) the static server has no /api route — use the
// live integration endpoint (CORS-allowlisted). Compiled out of production.
const DEV = Boolean((import.meta as { env?: Record<string, unknown> }).env?.DEV);
const BASE = DEV ? 'https://branify.store/api/gsc' : '/api/gsc';

export type GscRangeId = '7d' | '28d' | '3m' | '6m';

export const GSC_RANGES: Array<{ id: GscRangeId; label: string; days: number }> = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '28d', label: '28 days', days: 28 },
  { id: '3m', label: '3 months', days: 91 },
  { id: '6m', label: '6 months', days: 183 },
];

export interface GscMetric { key: string; clicks: number; impressions: number; ctr: number; position: number }
export interface GscTotals { clicks: number; impressions: number; ctr: number; position: number }

export interface GscStatus {
  configured: boolean;
  clientId: string | null;
  connected: boolean;
  needsReconnect: boolean;
  property: string | null;
  sites: Array<{ siteUrl: string; permissionLevel: string }>;
  googleEmail: string | null;
  connectedAt: string | null;
  redirectUri: string;
  propertyDefault: string;
}

export class GscClientError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/** Friendly copy per server error code (spec: clear messages, no fake data). */
export const GSC_ERROR_HINT: Record<string, string> = {
  unauthorized: 'Your admin session is missing or expired — sign in again.',
  forbidden: 'This account is not on the BRANIFY admin allowlist.',
  not_configured: 'Google OAuth client is not configured yet — finish the one-time setup below.',
  oauth_rejected: 'Google rejected the stored OAuth client credentials — re-check the Client ID / Secret in the setup panel.',
  not_connected: 'Google Search Console is not connected.',
  reconnect_required: 'The Google connection expired — reconnect Search Console.',
  permission_denied: 'The connected Google account lacks permission for this property.',
  no_property: 'This Google account has no verified Search Console properties.',
  invalid_property: 'That Search Console property is not available to the connected account.',
  rate_limited: 'Google API rate limit hit — wait a minute and retry.',
  vault_corrupt: 'Stored credentials could not be decrypted — reconnect the integration.',
  bad_request: 'Invalid request.',
  upstream: 'Google or the database returned an unexpected response — retry.',
};

async function adminToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new GscClientError('unauthorized', 401, 'Sign in to BRANIFY Admin first.');
  return token;
}

async function callOnce<T>(action: string, payload: unknown, token: string): Promise<T> {
  const res = await fetch(`${BASE}?action=${encodeURIComponent(action)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload || {}),
  });
  let json: { ok?: boolean; data?: T; error?: { code: string; message: string } } | null = null;
  try { json = await res.json(); } catch { /* non-JSON (e.g. HTML) */ }
  if (!res.ok || !json?.ok) {
    const code = json?.error?.code || (res.status === 404 ? 'service_missing' : 'upstream');
    const message = json?.error?.message
      || (code === 'service_missing'
        ? 'The Search Console service is not reachable yet — deploy the latest build or retry in a minute.'
        : 'Search Console request failed.');
    throw new GscClientError(code, res.status, message);
  }
  return json.data as T;
}

/** Authenticated GSC call with one automatic retry after session refresh. */
export async function gscCall<T>(action: string, payload?: Record<string, unknown>): Promise<T> {
  try {
    return await callOnce<T>(action, payload, await adminToken());
  } catch (e) {
    if (e instanceof GscClientError && (e.code === 'unauthorized' || e.status === 401)) {
      await supabase.auth.refreshSession();
      return callOnce<T>(action, payload, await adminToken());
    }
    throw e;
  }
}

// ------------------------------------------------------------------ status hook
export interface GscStatusState {
  status: GscStatus | null;
  loading: boolean;
  error: GscClientError | null;
  reload: () => void;
}

export function useGscStatus(): GscStatusState {
  const [status, setStatus] = useState<GscStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<GscClientError | null>(null);
  const [epoch, setEpoch] = useState(0);

  const reload = useCallback(() => setEpoch((e) => e + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    gscCall<GscStatus>('status')
      .then((s) => { if (alive) setStatus(s); })
      .catch((e: unknown) => { if (alive) setError(e instanceof GscClientError ? e : new GscClientError('upstream', 500, (e as Error).message)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [epoch]);

  return { status, loading, error, reload };
}

// ------------------------------------------------------------------ data hooks
export interface OverviewData {
  property: string;
  startDate: string;
  endDate: string;
  totals: GscTotals;
  trend: Array<{ date: string; clicks: number; impressions: number }>;
}

export interface PageData {
  url: string;
  property: string;
  startDate: string;
  endDate: string;
  totals: GscTotals;
  queries: GscMetric[];
}

export interface InspectData extends Record<string, unknown> {
  url: string;
  verdict: 'indexed' | 'not_indexed' | 'unknown';
  coverageState?: string;
  lastCrawlTime?: string;
  robotsTxtState?: string;
  indexingState?: string;
  userCanonical?: string;
  googleCanonical?: string;
}

export const fmtInt = (v: number): string => Math.round(v).toLocaleString('en-US');
export const fmtPct = (v: number): string => `${(v * 100).toFixed(v * 100 < 1 ? 2 : 1)}%`;
export const fmtPos = (v: number): string => (v > 0 ? v.toFixed(1) : '—');

/** Map a site property URI to its display label. */
export function propertyLabel(p: string): string {
  return p.startsWith('sc-domain:') ? p.slice('sc-domain:'.length) : p.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
