// =============================================================================
// BRANIFY — /register (public customer sign-up)
// Creates the account with the EXISTING Supabase Auth (email + password).
// Name/phone go into the auth user's secure user_metadata — never into any
// custom table, and no password is ever stored outside Supabase Auth.
// The existing database trigger (on_auth_user_created_sync_customer) then
// mirrors the new auth user into Admin → Customers automatically.
// Respects the live Supabase email-confirmation setting:
//   • confirmation ON  → "Please check your email to verify your account."
//   • confirmation OFF → the user is signed in immediately and redirected.
// =============================================================================

import React, { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { authErrorMessage, customerSupabase, safeRedirectPath, useCustomerAuth } from '../../lib/customerAuth';
import { AuthShell, ErrorAlert, Field, PasswordField, SubmitButton, SuccessAlert, useAutoRedirect } from './authUi';

interface RegisterViewProps {
  onNavigate: (route: string) => void;
  redirect?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirm?: string;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigate, redirect }) => {
  const { user, loading } = useCustomerAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const target = useMemo(() => safeRedirectPath(redirect), [redirect]);

  useAutoRedirect(target, onNavigate, !loading && !!user);

  const validate = (): boolean => {
    const fe: FormErrors = {};
    if (fullName.trim().length < 2) fe.fullName = 'Please enter your full name.';
    if (!EMAIL_RE.test(email.trim())) fe.email = 'Please enter a valid email address.';
    if (phone.trim() && !/^[+()\-.\s\d]{6,20}$/.test(phone.trim())) {
      fe.phone = 'Please enter a valid phone number, or leave it empty.';
    }
    if (password.length < 8) fe.password = 'Password must be at least 8 characters.';
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      fe.password = 'Include at least one letter and one number.';
    }
    if (confirm !== password) fe.confirm = 'Passwords do not match.';
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { data, error: err } = await customerSupabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: fullName.trim(),
            ...(phone.trim() ? { phone: phone.trim() } : {}),
          },
        },
      });
      if (err) {
        setError(authErrorMessage(err));
        setSubmitting(false);
        return;
      }
      if (data.session) {
        // Email confirmation is disabled (or already satisfied) — signed in.
        onNavigate(target);
        return;
      }
      // Email confirmation is enabled — no session until the link is clicked.
      setCheckEmail(true);
    } catch {
      setError('Network error. Please check your internet connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checkEmail) {
    return (
      <AuthShell
        seoTitle="Create Your BRANIFY Account"
        seoDescription="Create a free BRANIFY customer account to manage your profile and project inquiries."
        canonicalPath="/register"
        heading={<>Check Your <span className="text-gold-gradient">Email</span></>}
        subtitle="One last step before your account is ready."
      >
        <div className="space-y-5">
          <SuccessAlert>
            <strong>Account created.</strong> Please check your email ({email.trim()}) to verify
            your account, then log in. The confirmation link may take a minute or two to arrive —
            remember to check your spam folder.
          </SuccessAlert>
          <SubmitButton
            type="button"
            onClick={() => onNavigate(`/login${target !== '/account' ? `?redirect=${encodeURIComponent(target)}` : ''}`)}
          >
            <span>Go to Login</span>
          </SubmitButton>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      seoTitle="Create Your BRANIFY Account"
      seoDescription="Create a free BRANIFY customer account to manage your profile and project inquiries."
      canonicalPath="/register"
      heading={<>Create Your <span className="text-gold-gradient">Account</span></>}
      subtitle="Join BRANIFY to manage your profile and project inquiries — it takes less than a minute."
    >
      {error && <div className="mb-5"><ErrorAlert>{error}</ErrorAlert></div>}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field
          id="reg-name"
          label="Full Name"
          type="text"
          autoComplete="name"
          placeholder="Alexander Vance"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={fieldErrors.fullName}
        />
        <Field
          id="reg-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <Field
          id="reg-phone"
          label="Phone Number"
          type="tel"
          autoComplete="tel"
          optional
          placeholder="+1 555 000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={fieldErrors.phone}
        />
        <PasswordField
          id="reg-password"
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          showHint
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <PasswordField
          id="reg-confirm"
          label="Confirm Password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fieldErrors.confirm}
        />

        <SubmitButton loading={submitting} loadingLabel="Creating your account…">
          <span>Create Account</span>
          <UserPlus size={15} strokeWidth={2} />
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-[11px] text-slate-400">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onNavigate(`/login${target !== '/account' ? `?redirect=${encodeURIComponent(target)}` : ''}`)}
          className="text-[#8F6B2D] font-bold hover:underline cursor-pointer"
        >
          Log in
        </button>
      </p>
    </AuthShell>
  );
};

export default RegisterView;
