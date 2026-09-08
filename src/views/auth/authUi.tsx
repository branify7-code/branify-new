// =============================================================================
// BRANIFY — shared UI for customer auth pages (/login /register /account …)
// Matches the approved BRANIFY LIGHT design: white cards, slate text,
// #C9A45C gold borders, .input-light fields, gold submit buttons.
// All auth pages are utility pages → robots "noindex, nofollow", no sitemap.
// =============================================================================

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import Seo from '../../components/Seo';

/* ------------------------------------------------------------------ shell */

interface AuthShellProps {
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  heading: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
  /** Narrower card for forms, wider for the account page. */
  wide?: boolean;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  seoTitle, seoDescription, canonicalPath, heading, subtitle, children, wide,
}) => (
  <div className="min-h-[70vh] pt-28 pb-20 px-4 sm:px-6 lg:px-8">
    <Seo
      title={seoTitle}
      description={seoDescription}
      keywords={['BRANIFY account', 'BRANIFY login', 'BRANIFY register', 'customer account']}
      canonicalPath={canonicalPath}
      robots="noindex, nofollow"
      breadcrumbs={[]}
    />
    <div className={`${wide ? 'max-w-3xl' : 'max-w-md'} mx-auto space-y-8`}>
      <div className="space-y-5 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.04)] text-xs font-mono text-[#8F6B2D]">
          <span>Account</span>
          <span className="text-[#CBD5E1]">/</span>
          <span className="text-[#64748B]">Secure BRANIFY Access</span>
        </div>
        <img
          src="/branify-icon.png"
          alt="BRANIFY"
          className="w-12 h-12 mx-auto drop-shadow-[0_6px_16px_rgba(201,164,92,0.35)]"
        />
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-[#111827]">
          {heading}
        </h1>
        <p className="text-sm text-[#475569] font-light leading-relaxed max-w-sm mx-auto">
          {subtitle}
        </p>
      </div>
      <div className="rounded-3xl bg-white border border-[#E2E8F0] p-6 sm:p-8 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.15)]">
        {children}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ field */

interface FieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
}

export const Field: React.FC<FieldProps> = ({ id, label, optional, error, hint, ...inputProps }) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-[11px] font-mono uppercase tracking-wider text-[#64748B]">
      {label}
      {optional ? ' (optional)' : ' *'}
    </label>
    <input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      {...inputProps}
      className={`w-full px-4 py-3 rounded-xl input-light text-xs placeholder-[#94A3B8] ${
        error ? 'border-red-300 focus:border-red-400' : ''
      } ${inputProps.type === 'password' ? 'pr-11' : ''} ${inputProps.className || ''}`}
    />
    {error && (
      <p id={`${id}-error`} role="alert" className="text-[11px] text-red-600">
        {error}
      </p>
    )}
    {!error && hint && (
      <p id={`${id}-hint`} className="text-[11px] text-slate-400">
        {hint}
      </p>
    )}
  </div>
);

/* -------------------------------------------------------- password field */

export const PasswordField: React.FC<
  Omit<FieldProps, 'type'> & { showHint?: boolean }
> = ({ id, label, error, showHint, className, ...inputProps }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative space-y-1">
      <Field
        id={id}
        label={label}
        error={error}
        hint={showHint ? 'Use at least 8 characters.' : undefined}
        {...inputProps}
        type={visible ? 'text' : 'password'}
        autoComplete={inputProps.autoComplete || 'current-password'}
        className={className ? `${className} pr-11` : 'pr-11'}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-[30px] p-1 text-slate-400 hover:text-[#8F6B2D] transition-colors cursor-pointer"
      >
        {visible ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ alerts */

export const ErrorAlert: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    role="alert"
    className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[#7F1D1D] text-xs leading-relaxed"
  >
    <AlertCircle size={15} strokeWidth={2} className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
    <span>{children}</span>
  </div>
);

export const SuccessAlert: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    role="status"
    className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#C9A45C]/[0.08] border border-[#C9A45C]/35 text-[#334155] text-xs leading-relaxed"
  >
    <CheckCircle2 size={15} strokeWidth={2} className="w-4 h-4 mt-0.5 shrink-0 text-[#8F6B2D]" />
    <span>{children}</span>
  </div>
);

/* ------------------------------------------------------------------ submit */

export const SubmitButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; loadingLabel?: string }
> = ({ loading, loadingLabel = 'Please wait…', children, disabled, ...rest }) => (
  <button
    type="submit"
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...rest}
    className={`w-full py-3.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] disabled:opacity-50 disabled:cursor-not-allowed text-[#05080D] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_14px_30px_-12px_rgba(201,164,92,0.55)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A45C] focus-visible:ring-offset-2 ${rest.className || ''}`}
  >
    {loading ? (
      <>
        <Loader2 size={15} className="animate-spin" />
        <span>{loadingLabel}</span>
      </>
    ) : (
      children
    )}
  </button>
);

/* -------------------------------------------------------------- redirects */

/**
 * Client-side redirect used by the auth pages. Runs `onNavigate` (SPA nav,
 * no reload) once `when` turns true.
 */
export const useAutoRedirect = (
  to: string,
  onNavigate: (route: string) => void,
  when: boolean,
) => {
  useEffect(() => {
    if (when) onNavigate(to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [when]);
};
