// =============================================================================
// BRANIFY — Customer authentication context (PUBLIC website only)
// -----------------------------------------------------------------------------
// Uses the EXISTING Supabase project + Auth architecture (same URL / anon key
// as the rest of the site) — this is NOT a second auth provider. The only
// difference is an ISOLATED session storage key, so a customer session in the
// same browser can never overwrite — or be overwritten by — the admin session:
//   • Admin login keeps storage key "sb-<ref>-auth-token" (lib/supabase.ts)
//   • Customer login keeps storage key "branify-customer-auth" (below)
// Sign-out on the public site therefore never affects an admin login, and
// vice versa. Authorization remains fully separate:
//   • /admin requires an admin_users allowlist row (server-side policy, unchanged)
//   • customer pages only require a Supabase Auth session (email+password)
// No passwords, tokens or secrets are ever stored in public tables or
// localStorage by this module — Supabase Auth manages the session entirely.
// =============================================================================

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Session, User } from '@supabase/supabase-js';

const metaEnv = (import.meta as { env?: Record<string, string> }).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://uspshkegxhrglbpxqtil.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'sb_publishable_X11QDwMSfS2ivSePRVDpLQ_xNFY_8vw';

// Dedicated customer client — same Supabase Auth system, isolated storage key.
export const customerSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'branify-customer-auth',
    persistSession: true,       // session survives refresh (Supabase-managed)
    autoRefreshToken: true,
    detectSessionInUrl: true,   // parses password-recovery links on /reset-password
  },
});

/** Normalised, display-safe customer profile (read-only projection of the auth user). */
export interface CustomerUser {
  id: string;          // Supabase Auth user ID — the stable customer identity
  email: string;
  name: string;        // from user_metadata (falls back to full_name)
  phone: string;       // only if the customer provided one
  createdAt: string;   // registration date
  lastSignInAt: string; // last sign-in when available
  emailConfirmed: boolean;
}

function toCustomerUser(u: User): CustomerUser {
  const meta = (u.user_metadata || {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  return {
    id: u.id,
    email: u.email || '',
    name: str(meta.name) || str(meta.full_name),
    phone: str(meta.phone) || u.phone || '',
    createdAt: u.created_at || '',
    lastSignInAt: u.last_sign_in_at || '',
    emailConfirmed: Boolean(u.email_confirmed_at || u.confirmed_at),
  };
}

export interface CustomerAuthContextValue {
  /** True until the restored session has been checked once (guards protected routes). */
  loading: boolean;
  session: Session | null;
  user: CustomerUser | null;
  /** Re-read the session from Supabase (e.g. right after a profile update). */
  refresh: () => Promise<void>;
  /** Secure sign-out via Supabase Auth — never manual storage deletion. */
  signOut: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    // Restore the persisted session on mount (page refresh / new tab).
    customerSupabase.auth
      .getSession()
      .then(({ data }) => {
        if (alive) {
          setSession(data.session ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    // Safety valve: never keep protected routes hostage to a stalled network probe.
    const t = window.setTimeout(() => {
      if (alive) setLoading(false);
    }, 8000);

    // Live updates — header and pages react immediately to login / logout /
    // registration / token refresh without any page reload.
    const { data: sub } = customerSupabase.auth.onAuthStateChange((_event, s) => {
      if (alive) setSession(s ?? null);
    });

    return () => {
      alive = false;
      window.clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { data } = await customerSupabase.auth.getSession();
      setSession(data.session ?? null);
    } catch { /* keep current state */ }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await customerSupabase.auth.signOut();
    } finally {
      setSession(null);
    }
  }, []);

  const user = useMemo<CustomerUser | null>(
    () => (session?.user ? toCustomerUser(session.user) : null),
    [session],
  );

  const value = useMemo<CustomerAuthContextValue>(
    () => ({ loading, session, user, refresh, signOut }),
    [loading, session, user, refresh, signOut],
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth(): CustomerAuthContextValue {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used inside <CustomerAuthProvider>.');
  return ctx;
}

/**
 * Only allow SAME-SITE, relative redirect targets (no open redirects):
 * a safe path starts with a single "/" and never escapes the origin.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = '/account'): string {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
  if (trimmed.includes('://') || trimmed.includes('\\') || trimmed.includes('\n')) return fallback;
  return trimmed;
}

/**
 * Map Supabase Auth failures to human-readable, non-sensitive messages.
 * Never expose internal details, user existence or raw provider errors.
 */
export function authErrorMessage(err: { message?: string } | null | undefined): string {
  const code = (err?.message || '').toLowerCase();
  if (code.includes('invalid login credentials')) {
    return 'Invalid email or password. Please double-check and try again.';
  }
  if (code.includes('user already registered')) {
    return 'An account with this email already exists. Please log in instead.';
  }
  if (code.includes('email not confirmed')) {
    return 'Please verify your email address first — check your inbox for the confirmation link.';
  }
  if (code.includes('rate limit') || code.includes('too many requests') || code.includes('for security purposes')) {
    return 'Too many attempts right now. Please wait a few minutes and try again.';
  }
  if (code.includes('password should be at least') || code.includes('password')) {
    return 'This password does not meet the requirements. Please use at least 8 characters.';
  }
  if (code.includes('failed to fetch') || code.includes('network') || code.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (code.includes('signup requires a valid password')) {
    return 'Please choose a stronger password (at least 8 characters).';
  }
  if (code.includes('unable to validate email') || code.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  return 'Something went wrong. Please try again in a moment.';
}
