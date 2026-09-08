// =============================================================================
// BRANIFY — /login (public customer sign-in)
// Uses the existing Supabase Auth (customer client). Supports a same-site
// ?redirect= path so visitors return to the page they came from (e.g. a
// template page) after signing in. Admin authentication lives separately
// at /admin and is completely unaffected by this page.
// =============================================================================

import React, { useMemo, useState } from 'react';
import { LogIn } from 'lucide-react';
import { authErrorMessage, customerSupabase, safeRedirectPath, useCustomerAuth } from '../../lib/customerAuth';
import { AuthShell, ErrorAlert, Field, PasswordField, SubmitButton, useAutoRedirect } from './authUi';

interface LoginViewProps {
  onNavigate: (route: string) => void;
  redirect?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, redirect }) => {
  const { user, loading } = useCustomerAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const target = useMemo(() => safeRedirectPath(redirect), [redirect]);

  // Already signed in? Go straight to the destination (no reload needed).
  useAutoRedirect(target, onNavigate, !loading && !!user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const fe: { email?: string; password?: string } = {};
    if (!EMAIL_RE.test(email.trim())) fe.email = 'Please enter a valid email address.';
    if (!password) fe.password = 'Please enter your password.';
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) return;

    setSubmitting(true);
    try {
      const { error: err } = await customerSupabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(authErrorMessage(err));
        setSubmitting(false);
        return;
      }
      // onAuthStateChange updates the header instantly; go to the destination.
      onNavigate(target);
    } catch {
      setError('Network error. Please check your internet connection and try again.');
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      seoTitle="Log In to Your BRANIFY Account"
      seoDescription="Secure login for BRANIFY customer accounts. Access your profile, project inquiries and saved details."
      canonicalPath="/login"
      heading={<>Welcome <span className="text-gold-gradient">Back</span></>}
      subtitle="Log in to your BRANIFY account to manage your profile and project inquiries."
    >
      {error && <div className="mb-5"><ErrorAlert>{error}</ErrorAlert></div>}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <PasswordField
          id="login-password"
          label="Password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => onNavigate(`/forgot-password${target !== '/account' ? `?redirect=${encodeURIComponent(target)}` : ''}`)}
            className="text-[11px] font-mono text-[#8F6B2D] hover:text-[#111827] transition-colors cursor-pointer"
          >
            Forgot password?
          </button>
          <button
            type="button"
            onClick={() => onNavigate(`/register${target !== '/account' ? `?redirect=${encodeURIComponent(target)}` : ''}`)}
            className="text-[11px] font-mono text-[#64748B] hover:text-[#8F6B2D] transition-colors cursor-pointer"
          >
            Create account →
          </button>
        </div>

        <SubmitButton loading={submitting} loadingLabel="Signing you in…">
          <span>Log In</span>
          <LogIn size={15} strokeWidth={2} />
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-[11px] text-slate-400 leading-relaxed">
        BRANIFY team member? The{' '}
        <button
          type="button"
          onClick={() => onNavigate('/admin')}
          className="text-[#8F6B2D] hover:underline cursor-pointer"
        >
          admin portal
        </button>{' '}
        is separate.
      </p>
    </AuthShell>
  );
};

export default LoginView;
