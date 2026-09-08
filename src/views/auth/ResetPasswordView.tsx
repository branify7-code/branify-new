// =============================================================================
// BRANIFY — /reset-password
// Landing page for the link inside the Supabase password-reset email. The
// recovery link carries a secure one-time session (#access_token=…) that the
// customer Supabase client parses automatically (detectSessionInUrl), which
// then authorises supabase.auth.updateUser({ password }) below. Passwords
// never touch any custom storage — Supabase Auth handles them entirely.
// =============================================================================

import React, { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { authErrorMessage, customerSupabase, useCustomerAuth } from '../../lib/customerAuth';
import { AuthShell, ErrorAlert, PasswordField, SubmitButton, SuccessAlert } from './authUi';

interface ResetPasswordViewProps {
  onNavigate: (route: string) => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ onNavigate }) => {
  const { session, loading } = useCustomerAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  // Recovery links take a moment to exchange — allow a short grace period
  // before deciding the link is invalid (the session may still be parsing).
  const [graceElapsed, setGraceElapsed] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setGraceElapsed(true), 3500);
    return () => window.clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const fe: { password?: string; confirm?: string } = {};
    if (password.length < 8) fe.password = 'Password must be at least 8 characters.';
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      fe.password = 'Include at least one letter and one number.';
    }
    if (confirm !== password) fe.confirm = 'Passwords do not match.';
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) return;

    setSubmitting(true);
    try {
      const { error: err } = await customerSupabase.auth.updateUser({ password });
      if (err) {
        setError(authErrorMessage(err));
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError('Network error. Please check your internet connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthShell
        seoTitle="Set a New Password | BRANIFY Account"
        seoDescription="Choose a new password for your BRANIFY account."
        canonicalPath="/reset-password"
        heading={<>Password <span className="text-gold-gradient">Updated</span></>}
        subtitle="Your password has been changed successfully."
      >
        <div className="space-y-5">
          <SuccessAlert>
            <strong>Password updated.</strong> You can now use your new password to sign in.
          </SuccessAlert>
          <SubmitButton type="button" onClick={() => onNavigate('/account')}>
            <span>Go to My Account</span>
          </SubmitButton>
        </div>
      </AuthShell>
    );
  }

  if (loading || (!session && !graceElapsed)) {
    return (
      <AuthShell
        seoTitle="Set a New Password | BRANIFY Account"
        seoDescription="Choose a new password for your BRANIFY account."
        canonicalPath="/reset-password"
        heading={<>Set a <span className="text-gold-gradient">New Password</span></>}
        subtitle="Verifying your secure reset link…"
      >
        <div className="py-10 text-center text-xs font-mono uppercase tracking-widest text-[#8F6B2D]">
          Verifying link…
        </div>
      </AuthShell>
    );
  }

  if (!session) {
    return (
      <AuthShell
        seoTitle="Set a New Password | BRANIFY Account"
        seoDescription="Choose a new password for your BRANIFY account."
        canonicalPath="/reset-password"
        heading={<>Link <span className="text-gold-gradient">Expired</span></>}
        subtitle="This password reset link is invalid or has expired."
      >
        <div className="space-y-5">
          <ErrorAlert>
            For your security, password reset links are single-use and expire after a short time.
            Please request a fresh reset email and open the newest link.
          </ErrorAlert>
          <SubmitButton type="button" onClick={() => onNavigate('/forgot-password')}>
            <span>Request a New Link</span>
          </SubmitButton>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      seoTitle="Set a New Password | BRANIFY Account"
      seoDescription="Choose a new password for your BRANIFY account."
      canonicalPath="/reset-password"
      heading={<>Set a <span className="text-gold-gradient">New Password</span></>}
      subtitle="Choose a strong new password for your BRANIFY account."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <ErrorAlert>{error}</ErrorAlert>}
        <PasswordField
          id="reset-password"
          label="New Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          showHint
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <PasswordField
          id="reset-confirm"
          label="Confirm New Password"
          autoComplete="new-password"
          placeholder="Repeat your new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fieldErrors.confirm}
        />
        <SubmitButton loading={submitting} loadingLabel="Updating password…">
          <span>Update Password</span>
          <KeyRound size={15} strokeWidth={2} />
        </SubmitButton>
      </form>
    </AuthShell>
  );
};

export default ResetPasswordView;
