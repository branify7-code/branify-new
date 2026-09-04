// =============================================================================
// BRANIFY ADMIN — auth context (provided by AdminApp after successful login)
// =============================================================================
import { createContext, useContext } from 'react';
import type { AdminMode, AdminUser } from './types';

export interface AdminAuthContextValue {
  user: AdminUser;
  mode: AdminMode;
  logout: () => Promise<void>;
  /** Re-check the session (e.g. after profile update) */
  refresh: () => void;
}

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminApp (authenticated area).');
  return ctx;
}

export interface AdminPageProps {
  /** Query params of the current admin route (?new=1, ?edit=<id>, ?page=/ …) */
  query: URLSearchParams;
  /** Navigate to another admin route (path under /admin, leading slash) */
  navigate: (pathUnderAdmin: string) => void;
  /** Refresh sidebar badge counts (call after mutating leads/404s) */
  refreshBadges: () => void;
}
