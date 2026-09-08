// =============================================================================
// BRANIFY — /account (protected customer area)
// Requires a Supabase Auth session; unauthenticated visitors are redirected
// to /login?redirect=/account (server-verified session — never a client-side
// boolean alone). Shows the customer's real profile from Supabase Auth only.
// No fake orders/projects/activity are displayed — those modules do not exist
// yet, and the layout is ready to add them when real data exists.
// =============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, LogOut, Mail, Phone, Pencil, ShieldCheck, UserCircle, X } from 'lucide-react';
import { authErrorMessage, customerSupabase, useCustomerAuth } from '../../lib/customerAuth';
import { AuthShell, ErrorAlert, Field, SubmitButton, SuccessAlert } from './authUi';

interface AccountViewProps {
  onNavigate: (route: string) => void;
}

const fmtDate = (iso: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const initialsOf = (name: string, email: string): string => {
  const n = name.trim();
  if (n) {
    const parts = n.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() || '').join('') || 'B';
  }
  return email.slice(0, 2).toUpperCase() || 'B';
};

export const AccountView: React.FC<AccountViewProps> = ({ onNavigate }) => {
  const { user, loading, refresh, signOut } = useCustomerAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Protect the route: once the session check is done, unauthenticated
  // visitors go to /login (returning here after sign-in).
  useEffect(() => {
    if (!loading && !user) {
      onNavigate('/login?redirect=%2Faccount');
    }
  }, [loading, user, onNavigate]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
    }
  }, [user]);

  const avatar = useMemo(
    () => (user ? initialsOf(user.name, user.email) : 'B'),
    [user],
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    const fe: { name?: string; phone?: string } = {};
    if (name.trim().length < 2) fe.name = 'Please enter your full name.';
    if (phone.trim() && !/^[+()\-.\s\d]{6,20}$/.test(phone.trim())) {
      fe.phone = 'Please enter a valid phone number, or leave it empty.';
    }
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) return;

    setSaving(true);
    try {
      const { error: err } = await customerSupabase.auth.updateUser({
        data: { name: name.trim(), phone: phone.trim() },
      });
      if (err) {
        setError(authErrorMessage(err));
        return;
      }
      await refresh();
      setSaved(true);
      setEditOpen(false);
    } catch {
      setError('Network error. Please check your internet connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onNavigate('/');
  };

  if (loading || !user) {
    return (
      <AuthShell
        seoTitle="My BRANIFY Account"
        seoDescription="Your BRANIFY customer account."
        canonicalPath="/account"
        heading={<>My <span className="text-gold-gradient">Account</span></>}
        subtitle="Loading your secure BRANIFY account…"
      >
        <div className="py-10 text-center text-xs font-mono uppercase tracking-widest text-[#8F6B2D]">
          {loading ? 'Loading…' : 'Redirecting to login…'}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      seoTitle="My BRANIFY Account"
      seoDescription="Your BRANIFY customer account."
      canonicalPath="/account"
      wide
      heading={<>Welcome, <span className="text-gold-gradient">{user.name ? user.name.split(/\s+/)[0] : 'Partner'}</span></>}
      subtitle="Your BRANIFY profile and account information."
    >
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
        {/* Profile summary card */}
        <div className="rounded-2xl bg-gradient-to-b from-[#F0F6FF] to-white border border-[#E2E8F0] p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/40 flex items-center justify-center text-lg font-black text-[#8F6B2D] shadow-[0_10px_25px_-12px_rgba(201,164,92,0.55)]">
            {avatar}
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-bold text-[#111827] truncate">
              {user.name || 'BRANIFY Customer'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setEditOpen((v) => !v); setSaved(false); }}
              className="w-full py-2.5 rounded-xl bg-[#C9A45C]/15 border border-[#C9A45C]/40 text-[#8F6B2D] text-[11px] font-bold uppercase tracking-widest hover:bg-[#C9A45C]/25 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Pencil size={13} strokeWidth={2} />
              {editOpen ? 'Close Editor' : 'Edit Profile'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-slate-600 text-[11px] font-bold uppercase tracking-widest hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut size={13} strokeWidth={2} />
              Logout
            </button>
          </div>
        </div>

        {/* Account information */}
        <div className="space-y-5 min-w-0">
          {saved && (
            <SuccessAlert>
              <strong>Profile updated.</strong> Your changes have been saved to your secure account.
            </SuccessAlert>
          )}
          {error && <ErrorAlert>{error}</ErrorAlert>}

          {editOpen ? (
            <form onSubmit={handleSave} className="rounded-2xl bg-white border border-[#E2E8F0] p-6 space-y-4" noValidate>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-[#111827]">Edit Profile</h2>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  aria-label="Close profile editor"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
              <Field
                id="acc-name"
                label="Full Name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={fieldErrors.name}
              />
              <Field
                id="acc-phone"
                label="Phone Number"
                type="tel"
                autoComplete="tel"
                optional
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={fieldErrors.phone}
              />
              <div className="pt-1">
                <SubmitButton loading={saving} loadingLabel="Saving changes…">
                  <span>Save Changes</span>
                </SubmitButton>
              </div>
              <p className="text-[11px] text-slate-400">
                Your email address is the identity of this account and cannot be changed here.
                Contact support if you need to change it.
              </p>
            </form>
          ) : (
            <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 space-y-4">
              <h2 className="font-display text-base font-bold text-[#111827]">Account Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <Mail size={15} strokeWidth={2} className="text-[#8F6B2D] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">Email</p>
                    <p className="text-[#111827] font-bold truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <Phone size={15} strokeWidth={2} className="text-[#8F6B2D] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">Phone</p>
                    <p className="text-[#111827] font-bold truncate">{user.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <Calendar size={15} strokeWidth={2} className="text-[#8F6B2D] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">Member Since</p>
                    <p className="text-[#111827] font-bold">{fmtDate(user.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <UserCircle size={15} strokeWidth={2} className="text-[#8F6B2D] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">Last Login</p>
                    <p className="text-[#111827] font-bold">{fmtDate(user.lastSignInAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#475569] leading-relaxed">
            <ShieldCheck size={14} strokeWidth={2} className="text-[#8F6B2D] mt-0.5 shrink-0" />
            <span>
              This account is protected by secure Supabase authentication. BRANIFY never stores or
              displays your password, and your profile data is only accessible to you.
            </span>
          </div>
        </div>
      </div>
    </AuthShell>
  );
};

export default AccountView;
