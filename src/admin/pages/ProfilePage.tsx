// =============================================================================
// BRANIFY ADMIN — PROFILE (/admin/profile)
// -----------------------------------------------------------------------------
// Account card (name, avatar, role, mode), password change, session controls
// and an honest security note. All through the real auth data layer.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, KeyRound, LogOut, Save, ShieldCheck, UserCircle } from 'lucide-react';
import { changePassword, modeLabel, updateProfile } from '../lib/backend';
import type { AdminPageProps } from '../lib/auth';
import { useAdminAuth } from '../lib/auth';
import { Badge, Btn, Card, ConfirmDialog, Field, Input, cx, useToast } from '../ui';
import { initials } from '../lib/format';

export const ProfilePage: React.FC<AdminPageProps> = () => {
  const { user, mode, logout, refresh } = useAdminAuth();
  const { push } = useToast();

  // profile
  const [name, setName] = useState(user.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // password
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // logout
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    setName(user.name || '');
    setAvatarUrl(user.avatarUrl || '');
  }, [user.name, user.avatarUrl]);

  useEffect(() => { setAvatarBroken(false); }, [avatarUrl]);

  const pwError = useMemo(() => {
    if (!next && !confirm) return null;
    if (next.length > 0 && next.length < 8) return 'New password must be at least 8 characters.';
    if (next && confirm && next !== confirm) return 'New passwords do not match.';
    return null;
  }, [next, confirm]);

  const profileDirty = name !== (user.name || '') || avatarUrl !== (user.avatarUrl || '');

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile(name.trim(), avatarUrl.trim());
      push('success', 'Profile updated');
      refresh();
    } catch (e) {
      push('error', `Profile update failed: ${(e as Error).message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const changePw = async () => {
    if (pwError || next.length < 8) return;
    setSavingPassword(true);
    try {
      await changePassword(current, next);
      push('success', 'Password changed — use it on your next sign-in');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (e) {
      push('error', `Password change failed: ${(e as Error).message}`);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-xl font-extrabold text-[#F5F6F2]">Profile</h1>
        <p className="text-xs text-[#A7AFBA]">Your admin identity, password and session</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Profile card */}
        <Card title="Account" subtitle="Shown in the sidebar and on activity entries">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              {user.avatarUrl && !avatarBroken ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user.name || user.email} avatar`}
                  className="h-16 w-16 shrink-0 rounded-2xl border border-[#C9A45C]/40 object-cover"
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#C9A45C]/40 bg-gradient-to-b from-[#E8C97C]/15 to-transparent font-display text-lg font-extrabold text-[#E8C97C]">
                  {initials(user.name || user.email)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold text-[#F5F6F2]">{user.name || '—'}</p>
                <p className="truncate text-xs text-[#A7AFBA]">{user.email}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone="gold"><BadgeCheck size={10} /> {user.role || 'admin'}</Badge>
                  <Badge tone={mode === 'supabase' ? 'green' : mode === 'local' ? 'amber' : 'red'}>{modeLabel(mode)}</Badge>
                </div>
              </div>
            </div>

            <Field label="Display name" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />
            </Field>
            <Field label="Email" hint="Email is the allowlist identity — it cannot be changed here.">
              <Input value={user.email} readOnly disabled className="opacity-60" />
            </Field>
            <Field label="Avatar URL" hint="Optional image URL — leave empty to use initials.">
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…/avatar.jpg" className="font-mono text-xs" inputMode="url" />
            </Field>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-[#566072]">Member since: — <span className="opacity-70">(not exposed by the auth layer)</span></p>
              <Btn variant="gold" icon={Save} onClick={() => void saveProfile()} loading={savingProfile} disabled={!profileDirty || !name.trim()}>Save profile</Btn>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          {/* Password card */}
          <Card title="Change password" subtitle={mode === 'supabase' ? 'Uses Supabase Auth — applies immediately.' : 'Preview session store — local API sessions only.'}>
            <div className="flex flex-col gap-4">
              <Field label="Current password" required>
                <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" placeholder="••••••••••" />
              </Field>
              <Field label="New password" required error={pwError || undefined} hint="Minimum 8 characters.">
                <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" placeholder="••••••••••" />
              </Field>
              <Field label="Confirm new password" required>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" placeholder="••••••••••" />
              </Field>
              <Btn
                variant="gold"
                icon={KeyRound}
                onClick={() => void changePw()}
                loading={savingPassword}
                disabled={!current || next.length < 8 || next !== confirm}
                className="self-start"
              >
                Change password
              </Btn>
            </div>
          </Card>

          {/* Session card */}
          <Card title="Session" subtitle="Your current admin session">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Mode</p>
                  <p className="text-sm font-bold text-[#F5F6F2]">{modeLabel(mode)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Signed in as</p>
                  <p className="font-mono text-xs text-[#E8C97C]">{user.email}</p>
                </div>
              </div>
              <Btn
                variant="danger"
                icon={LogOut}
                onClick={() => setConfirmLogout(true)}
                className="self-start"
              >
                Log out
              </Btn>
              <p className="text-[11px] text-[#566072]">Logging out clears the stored session token immediately.</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Security note */}
      <Card title="Security model" subtitle="How admin access is protected" bodyClass="pt-0 px-0 sm:px-0 pb-0">
        <div className="grid gap-3 px-4 pb-4 sm:px-5 sm:pb-5 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: 'Supabase Auth + RLS', body: 'Production auth runs through Supabase with row-level security — every admin table is locked to authenticated admins.' },
            { icon: BadgeCheck, title: 'Email allowlist', body: 'Only allowlisted emails (admin_users) can ever hold admin rights; sign-ups outside the list are rejected at the gate.' },
            { icon: UserCircle, title: 'No stored passwords', body: 'Sessions never store passwords — tokens are managed by the auth provider and cleared on logout.' },
          ].map((item) => (
            <div key={item.title} className={cx('rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5')}>
              <item.icon size={16} className="text-[#C9A45C]" />
              <p className="mt-2 text-xs font-bold text-[#F5F6F2]">{item.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#A7AFBA]">{item.body}</p>
            </div>
          ))}
        </div>
      </Card>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => { setConfirmLogout(false); void logout(); }}
        title="Log out of the admin panel?"
        message="Your session token is cleared and you return to the sign-in screen. Unsaved work on other tabs is kept server-side only if already saved."
        confirmLabel="Log out"
        danger
      />
    </div>
  );
};
