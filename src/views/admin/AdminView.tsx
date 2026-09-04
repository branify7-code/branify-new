/* =========================================================
   AdminView — 1:1 replica of branify.store's /admin page.
   Supabase Auth (email + password) gate → Management
   Dashboard with SERVICE INQUIRIES / NEWSLETTER SUBSCRIBERS
   tabs reading the project's real `inquiries` and
   `newsletter_subscribers` tables. All Supabase calls are
   wrapped in try/catch — this component never throws.
========================================================= */

import React, { useCallback, useEffect, useState } from 'react';
import { Lock, LogOut, RefreshCw, Mail, Users, Inbox, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Seo } from '../../components/Seo';

type TabId = 'inquiries' | 'subscribers';

interface InquiryRow {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  company?: string | null;
  services?: string[] | string | null;
  budget?: string | null;
  timeline?: string | null;
  details?: string | null;
  status?: string | null;
  created_at?: string | null;
}

interface SubscriberRow {
  id?: string | null;
  email?: string | null;
  created_at?: string | null;
}

/* ---------- safe cell helpers (data comes back untyped) ---------- */

const asText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const asDate = (value: unknown): string => {
  const raw = asText(value);
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleString();
  } catch {
    return raw;
  }
};

const asServices = (value: unknown): string => {
  if (Array.isArray(value)) return value.map((s) => asText(s)).filter(Boolean).join(', ');
  return asText(value);
};

const inputClasses =
  'w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#C9A45C] focus:outline-none focus:ring-0 transition-colors';

export const AdminView: React.FC = () => {
  /* ---------- session / auth state ---------- */
  const [checkingSession, setCheckingSession] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  /* ---------- dashboard state ---------- */
  const [activeTab, setActiveTab] = useState<TabId>('inquiries');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);

  /* ---------- on mount: restore an existing Supabase session ---------- */
  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;
        const session = error ? null : data?.session ?? null;
        if (session) {
          setAdminEmail(session.user?.email ?? 'administrator');
        }
      } catch {
        // No session recoverable — stay on the login card.
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    };

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- fetch rows for the active tab ---------- */
  const fetchRows = useCallback(async (tab: TabId) => {
    setLoading(true);
    setFetchError(null);
    try {
      const table = tab === 'inquiries' ? 'inquiries' : 'newsletter_subscribers';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        setFetchError(error.message);
        if (tab === 'inquiries') setInquiries([]);
        else setSubscribers([]);
        return;
      }

      const rows = (data ?? []) as Record<string, unknown>[];
      if (tab === 'inquiries') setInquiries(rows as InquiryRow[]);
      else setSubscribers(rows as SubscriberRow[]);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Unknown Supabase error.');
      if (tab === 'inquiries') setInquiries([]);
      else setSubscribers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!adminEmail) return;
    void fetchRows(activeTab);
  }, [adminEmail, activeTab, fetchRows]);

  /* ---------- handlers ---------- */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    setAuthError(null);
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message);
      } else if (data?.session) {
        setAdminEmail(data.session.user?.email ?? email);
        setPassword('');
      } else {
        setAuthError('Authentication succeeded but no session was returned. Please try again.');
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unexpected authentication failure.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // signOut failures are non-fatal — clear local state regardless.
    }
    setAdminEmail(null);
    setAuthError(null);
    setFetchError(null);
    setInquiries([]);
    setSubscribers([]);
    setActiveTab('inquiries');
  };

  /* ---------- render ---------- */
  return (
    <div className="pt-28 pb-20 min-h-screen bg-[#050608]">
      <Seo
        title="Management Dashboard | BRANIFY"
        description="BRANIFY Admin Portal for managing leads, products, case studies, and articles."
        canonicalPath="/admin"
      />

      <div className="max-w-7xl mx-auto px-4">
        {checkingSession ? (
          /* Restoring session */
          <div className="flex items-center justify-center py-40">
            <Loader2 className="w-6 h-6 text-[#C9A45C] animate-spin" />
          </div>
        ) : !adminEmail ? (
          /* ================= AUTH CARD ================= */
          <div className="max-w-md mx-auto">
            <div className="bg-[#080B14]/90 border border-[#C9A45C]/25 rounded-3xl p-8 shadow-2xl backdrop-blur">
              <Lock className="w-8 h-8 text-[#E2C27B] mx-auto" />
              <h1 className="mt-5 font-black uppercase text-white text-2xl text-center tracking-tight">
                Admin Portal Access
              </h1>
              <p className="mt-2 text-xs text-zinc-400 text-center">
                Authenticate using your Supabase Auth Administrator Credentials.
              </p>

              {!isSupabaseConfigured && (
                <div className="mt-6 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                  Supabase is not configured on this deployment — authentication is unavailable.
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-8 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="admin-email" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Admin Email *
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="admin@branify.store"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClasses}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="admin-password" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Password *
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClasses}
                  />
                </div>

                {authError && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3" role="alert">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full btn-gold-primary rounded-full font-black uppercase text-xs py-3.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Authenticate & Login'
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ================= DASHBOARD ================= */
          <div className="space-y-8">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-black uppercase text-white text-2xl tracking-tight">
                Management Dashboard
              </h2>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#C9A45C]/25 text-xs font-mono text-[#E2C27B] max-w-[240px] truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{adminEmail}</span>
                </span>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white hover:border-red-500/40 hover:bg-red-500/10 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log Out
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {([
                { id: 'inquiries' as TabId, label: 'Service Inquiries', icon: Inbox },
                { id: 'subscribers' as TabId, label: 'Newsletter Subscribers', icon: Users },
              ]).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full transition-all text-xs uppercase tracking-wider font-extrabold cursor-pointer ${
                      isActive
                        ? 'btn-gradient-primary text-white shadow-lg shadow-[#C9A45C]/20'
                        : 'bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Table area */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-24 rounded-2xl bg-[#080B14] border border-white/[0.08]">
                  <Loader2 className="w-5 h-5 text-[#C9A45C] animate-spin" />
                </div>
              ) : fetchError ? (
                <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 leading-relaxed">
                  Supabase returned: {fetchError}. Your admin role may lack SELECT policies on this table.
                </div>
              ) : activeTab === 'inquiries' ? (
                inquiries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-24 rounded-2xl bg-[#080B14] border border-white/[0.08]">
                    <Inbox className="w-6 h-6 text-zinc-600" />
                    <span className="text-xs text-zinc-500">No rows found.</span>
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-auto rounded-2xl bg-[#080B14] border border-white/[0.08]">
                    <table className="w-full min-w-[980px]">
                      <thead className="sticky top-0 z-10 bg-[#080B14]">
                        <tr>
                          {['Created', 'Name', 'Email', 'Company', 'Services', 'Budget', 'Timeline', 'Status'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-zinc-400 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {inquiries.map((row, i) => (
                          <tr key={asText(row.id) || `inquiry-${i}`} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-xs text-zinc-300 border-t border-white/[0.06] whitespace-nowrap">{asDate(row.created_at)}</td>
                            <td className="px-4 py-3 text-xs text-zinc-300 border-t border-white/[0.06] whitespace-nowrap font-medium text-white">{asText(row.name) || '—'}</td>
                            <td className="px-4 py-3 text-xs text-zinc-300 border-t border-white/[0.06] whitespace-nowrap">{asText(row.email) || '—'}</td>
                            <td className="px-4 py-3 text-xs text-zinc-300 border-t border-white/[0.06] whitespace-nowrap">{asText(row.company) || '—'}</td>
                            <td className="px-4 py-3 text-xs text-zinc-300 border-t border-white/[0.06]">{asServices(row.services) || '—'}</td>
                            <td className="px-4 py-3 text-xs text-zinc-300 border-t border-white/[0.06] whitespace-nowrap">{asText(row.budget) || '—'}</td>
                            <td className="px-4 py-3 text-xs text-zinc-300 border-t border-white/[0.06] whitespace-nowrap">{asText(row.timeline) || '—'}</td>
                            <td className="px-4 py-3 text-xs text-zinc-300 border-t border-white/[0.06] whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  asText(row.status) === 'new'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
                                }`}
                              >
                                {asText(row.status) || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : subscribers.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 rounded-2xl bg-[#080B14] border border-white/[0.08]">
                  <Users className="w-6 h-6 text-zinc-600" />
                  <span className="text-xs text-zinc-500">No rows found.</span>
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-auto rounded-2xl bg-[#080B14] border border-white/[0.08]">
                  <table className="w-full min-w-[640px]">
                    <thead className="sticky top-0 z-10 bg-[#080B14]">
                      <tr>
                        {['Created', 'Email', 'ID'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-zinc-400 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((row, i) => {
                        const id = asText(row.id);
                        return (
                          <tr key={id || `subscriber-${i}`} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-xs text-zinc-300 border-t border-white/[0.06] whitespace-nowrap">{asDate(row.created_at)}</td>
                            <td className="px-4 py-3 text-xs text-zinc-300 border-t border-white/[0.06] whitespace-nowrap font-medium text-white">{asText(row.email) || '—'}</td>
                            <td className="px-4 py-3 text-xs text-zinc-500 border-t border-white/[0.06] whitespace-nowrap font-mono">
                              {id ? `${id.slice(0, 12)}${id.length > 12 ? '…' : ''}` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Refresh */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void fetchRows(activeTab)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white hover:border-white/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
