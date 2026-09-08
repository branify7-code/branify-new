// =============================================================================
// BRANIFY — /forgot-password
// Sends the password-reset email through the EXISTING Supabase Auth
// (resetPasswordForEmail). No passwords are stored or transmitted manually.
// The response never reveals whether the address has an account.
// =============================================================================

import React, { useState } from 'react';
import { MailQuestion } from 'lucide-react';
import { authErrorMessage, customerSupabase } from '../../lib/customerAuth';
import { AuthShell, ErrorAlert, Field, SubmitButton, SuccessAlert } from './authUi';

interface ForgotPasswordViewProps {
  onNavigate: (route: string) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email.trim())) {
      setFieldError('Please enter a valid email address.');
      return;
    }
    setFieldError('');
    setSubmitting(true);
    try {
      const { error: err } = await customerSupabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) {
        setError(authErrorMessage(err));
        setSubmitting(false);
        return;
      }
      setSent(true);
    } catch {
      setError('Network error. Please check your internet connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      seoTitle="Reset Your BRANIFY Password"
      seoDescription="Forgot your BRANIFY password? Request a secure password reset email."
      canonicalPath="/forgot-password"
      heading={<>Reset Your <span className="text-gold-gradient">Password</span></>}
      subtitle="Enter the email linked to your BRANIFY account and we'll send you a secure reset link."
    >
      {sent ? (
        <div className="space-y-5">
          <SuccessAlert>
            <strong>Reset link sent.</strong> If an account exists for {email.trim()}, a password
            reset email is on its way. Please check your inbox — and your spam folder — and follow
            the secure link to choose a new password.
          </SuccessAlert>
          <div className="flex flex-col gap-2">
            <SubmitButton type="button" onClick={() => onNavigate('/login')}>
              <span>Back to Login</span>
            </SubmitButton>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail(''); }}
              className="text-[11px] font-mono text-[#64748B] hover:text-[#8F6B2D] transition-colors cursor-pointer py-1"
            >
              Use a different email
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && <ErrorAlert>{error}</ErrorAlert>}
          <Field
            id="forgot-email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldError}
          />
          <SubmitButton loading={submitting} loadingLabel="Sending reset link…">
            <span>Send Reset Link</span>
            <MailQuestion size={15} strokeWidth={2} />
          </SubmitButton>
          <p className="text-center text-[11px] text-slate-400">
            Remembered it?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="text-[#8F6B2D] font-bold hover:underline cursor-pointer"
            >
              Back to login
            </button>
          </p>
        </form>
      )}
    </AuthShell>
  );
};

export default ForgotPasswordView;
