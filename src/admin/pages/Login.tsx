// =============================================================================
// BRANIFY ADMIN — login gate (Supabase Auth email/password)
// -----------------------------------------------------------------------------
// SECURITY MODEL (per spec):
//   · Admin accounts are created ONLY by the owner via Supabase Dashboard
//     → Authentication → Users → Add User. This app never creates accounts,
//     never offers a signup flow, and never ships default credentials.
//   · After a successful password sign-in the session is authorized against
//     the admin_users allowlist (RLS + SECURITY DEFINER function); a valid
//     auth user who is not allowlisted is signed out immediately.
//   · Production uses Supabase Auth. The optional sandbox preview API is a
//     development harness only — it is compiled out of production builds and
//     never displays credentials.
// =============================================================================
import React, { useState } from 'react';
import { KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import { adminLogin } from '../lib/backend';
import type { AdminMode } from '../lib/types';
import { Btn, Field, Input, cx } from '../ui';

export const LoginScreen: React.FC<{
  mode: AdminMode;
  onSuccess: () => void;
}> = ({ mode, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await adminLogin(email, password);
      onSuccess();
    } catch (err) {
      setError((err as Error).message || 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C9A45C]/40 bg-gradient-to-b from-[#E8C97C]/15 to-transparent shadow-[0_0_40px_-12px_rgba(201,164,92,0.55)]">
            <img src="/branify-icon.svg" alt="BRANIFY" className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-[0.22em] text-[#F5F6F2]">BRANIFY</h1>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.34em] text-[#C9A45C]">Admin Panel</p>
        </div>

        <div className="rounded-2xl border border-[rgba(201,164,92,0.2)] bg-[#07101A]/85 p-6 shadow-2xl backdrop-blur">
          {mode === 'none' ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4 text-xs leading-relaxed text-amber-200">
              <p className="mb-1 font-bold uppercase tracking-wider">Admin database not connected</p>
              Run <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono">supabase/admin-schema.sql</code> in the Supabase SQL editor,
              create your admin user under <span className="font-semibold">Authentication → Users → Add User</span>, then reload this page.
              Full instructions are at the top of that file.
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <Field label="Admin email" required>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourdomain.com" autoComplete="email" />
              </Field>
              <Field label="Password" required>
                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" autoComplete="current-password" />
              </Field>

              {error && (
                <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/[0.07] px-3 py-2 text-xs font-semibold text-red-300">
                  <ShieldAlert size={14} className="mt-0.5 shrink-0" /> {error}
                </p>
              )}

              <Btn type="submit" variant="gold" loading={busy} className="mt-1 h-11 w-full" aria-busy={busy}>
                {!busy && <KeyRound size={15} />}
                {busy ? (
                  <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Signing in…</span>
                ) : (
                  'Sign in to dashboard'
                )}
              </Btn>
            </form>
          )}

          {mode === 'local' && (
            <div className="mt-5 rounded-xl border border-[#C9A45C]/25 bg-[#C9A45C]/[0.06] px-3.5 py-3 text-[11px] leading-relaxed text-[#E8C97C]">
              <p className="font-bold uppercase tracking-wider">Preview mode</p>
              This sandbox uses a local development API. Production authenticates against Supabase with RLS-protected admin authorization.
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-[10.5px] leading-relaxed text-[#566072]">
          Protected area · all actions are logged · unauthorized access attempts are recorded.
        </p>
      </div>
    </div>
  );
};
