// =============================================================================
// BRANIFY ADMIN — UI primitives (shared design system)
// Palette: bg #020407 · surface #07101A/#080D14 · gold #C9A45C · text #F5F6F2/#A7AFBA
// =============================================================================
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, Info, Loader2, X } from 'lucide-react';

export const cx = (...parts: Array<string | false | null | undefined>): string => parts.filter(Boolean).join(' ');

// ------------------------------------------------------------------ Buttons
type BtnVariant = 'gold' | 'ghost' | 'outline' | 'danger' | 'subtle';
export const Btn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: BtnVariant;
    size?: 'sm' | 'md';
    loading?: boolean;
    icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  }
> = ({ variant = 'outline', size = 'md', loading, icon: Icon, className, children, disabled, ...rest }) => {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';
  const sizes = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm';
  const variants: Record<BtnVariant, string> = {
    gold: 'bg-gradient-to-b from-[#E8C97C] to-[#C9A45C] text-[#1A1206] hover:brightness-110 shadow-[0_2px_14px_-4px_rgba(201,164,92,0.5)] border border-[#E8C97C]/60',
    ghost: 'text-[#A7AFBA] hover:text-[#F5F6F2] hover:bg-white/[0.05]',
    outline: 'border border-[rgba(201,164,92,0.25)] text-[#D8DCE2] hover:border-[rgba(201,164,92,0.55)] hover:text-[#F3D27A] bg-white/[0.02]',
    danger: 'border border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/60',
    subtle: 'bg-white/[0.05] text-[#D8DCE2] hover:bg-white/[0.09] border border-transparent',
  };
  return (
    <button className={cx(base, sizes, variants[variant], className)} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : Icon ? <Icon size={size === 'sm' ? 13 : 15} /> : null}
      {children}
    </button>
  );
};

// ------------------------------------------------------------------ Cards
export const Card: React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClass?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, actions, className, bodyClass, children }) => (
  <section className={cx('rounded-2xl border border-[rgba(201,164,92,0.16)] bg-[#07101A]/85 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)]', className)}>
    {(title || actions) && (
      <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
        <div className="min-w-0">
          {title && <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#E9DCBF]">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-xs text-[#A7AFBA]">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className={cx('px-4 pb-4 sm:px-5 sm:pb-5', !title && 'pt-4 sm:pt-5', bodyClass)}>{children}</div>
  </section>
);

// ------------------------------------------------------------------ Badges
export type BadgeTone = 'gold' | 'green' | 'amber' | 'red' | 'steel' | 'zinc' | 'violet';
const BADGE_TONES: Record<BadgeTone, string> = {
  gold: 'bg-[#C9A45C]/15 text-[#E8C97C] border-[#C9A45C]/35',
  green: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/30',
  amber: 'bg-amber-500/12 text-amber-300 border-amber-500/30',
  red: 'bg-red-500/12 text-red-300 border-red-500/30',
  steel: 'bg-slate-400/12 text-slate-300 border-slate-400/25',
  zinc: 'bg-white/[0.06] text-[#A7AFBA] border-white/10',
  violet: 'bg-purple-500/12 text-purple-300 border-purple-500/30',
};
export const Badge: React.FC<{ tone?: BadgeTone; className?: string; children: React.ReactNode }> = ({ tone = 'zinc', className, children }) => (
  <span className={cx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider', BADGE_TONES[tone], className)}>
    {children}
  </span>
);

export const LEAD_STATUS_TONE: Record<string, BadgeTone> = {
  new: 'gold', contacted: 'steel', qualified: 'green', proposal: 'violet', won: 'green', lost: 'red',
};

// ------------------------------------------------------------------ Form fields
export const Field: React.FC<{ label: string; hint?: string; error?: string; counter?: string; required?: boolean; className?: string; children: React.ReactNode }> = ({ label, hint, error, counter, required, className, children }) => (
  <label className={cx('block', className)}>
    <span className="mb-1.5 flex items-center justify-between gap-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]">
        {label} {required && <span className="text-[#C9A45C]">*</span>}
      </span>
      {counter && <span className="text-[10px] tabular-nums text-[#6B7280]">{counter}</span>}
    </span>
    {children}
    {error ? (
      <span className="mt-1 block text-[11px] font-medium text-red-300">{error}</span>
    ) : hint ? (
      <span className="mt-1 block text-[11px] text-[#6B7280]">{hint}</span>
    ) : null}
  </label>
);

const inputCls =
  'w-full rounded-lg border border-white/10 bg-[#04070C]/80 px-3 py-2 text-sm text-[#F5F6F2] placeholder-[#5A6472] outline-none transition-colors focus:border-[#C9A45C]/60 focus:ring-2 focus:ring-[#C9A45C]/15 disabled:opacity-50';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...rest }) => (
  <input className={cx(inputCls, 'h-10', className)} {...rest} />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...rest }) => (
  <textarea className={cx(inputCls, 'min-h-[90px] resize-y', className)} {...rest} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, children, ...rest }) => (
  <select className={cx(inputCls, 'h-10 appearance-none bg-[color]', className)} {...rest}>
    {children}
  </select>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cx(
      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50',
      checked ? 'border-[#C9A45C]/60 bg-[#C9A45C]/30' : 'border-white/10 bg-white/[0.06]',
    )}
  >
    <span className={cx('inline-block h-4 w-4 transform rounded-full transition-transform', checked ? 'translate-x-6 bg-[#E8C97C]' : 'translate-x-1 bg-[#8B93A1]')} />
  </button>
);

export const ChipsInput: React.FC<{ value: string[]; onChange: (v: string[]) => void; placeholder?: string; label?: string; hint?: string }> = ({ value, onChange, placeholder, label, hint }) => {
  const [draft, setDraft] = useState('');
  const commit = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft('');
  };
  return (
    <Field label={label || 'Tags'} hint={hint}>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-[#04070C]/80 p-2">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-[#C9A45C]/15 px-2 py-0.5 text-xs text-[#E8C97C]">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="text-[#A7AFBA] hover:text-red-300">
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
            if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={commit}
          placeholder={placeholder || 'Type and press Enter'}
          className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-sm text-[#F5F6F2] outline-none placeholder-[#5A6472]"
        />
      </div>
    </Field>
  );
};

// ------------------------------------------------------------------ states
export const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <Loader2 className={cx('animate-spin text-[#C9A45C]', className || 'h-5 w-5')} />
);

export const LoadingBlock: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-2 py-14 text-sm text-[#A7AFBA]">
    <Spinner /> {label}
  </div>
);

export const ErrorBlock: React.FC<{ title?: string; message?: string; onRetry?: () => void }> = ({ title = 'Something went wrong', message, onRetry }) => (
  <div className="flex flex-col items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.05] px-6 py-10 text-center">
    <AlertTriangle className="text-red-300" size={22} />
    <p className="text-sm font-bold text-red-200">{title}</p>
    {message && <p className="max-w-md text-xs text-[#A7AFBA]">{message}</p>}
    {onRetry && <Btn size="sm" variant="outline" className="mt-2" onClick={onRetry}>Try again</Btn>}
  </div>
);

export const EmptyState: React.FC<{ icon?: React.ComponentType<{ size?: number | string; className?: string }>; title: string; hint?: string; action?: React.ReactNode }> = ({ icon: Icon, title, hint, action }) => (
  <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
    {Icon && <Icon size={26} className="text-[#C9A45C]/60" />}
    <p className="text-sm font-bold text-[#D8DCE2]">{title}</p>
    {hint && <p className="max-w-md text-xs leading-relaxed text-[#A7AFBA]">{hint}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

// ------------------------------------------------------------------ Modal
export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, width = 'md', footer, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[width];
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div
        className={cx('flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[rgba(201,164,92,0.22)] bg-[#07101A] shadow-2xl sm:rounded-2xl', w)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold text-[#F5F6F2]">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-[#A7AFBA]">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="rounded-lg p-1.5 text-[#A7AFBA] transition-colors hover:bg-white/[0.06] hover:text-white">
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex items-center justify-end gap-2 border-t border-white/[0.06] bg-black/20 px-5 py-3">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
};

export const ConfirmDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}> = ({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger, loading }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    width="sm"
    footer={
      <>
        <Btn variant="ghost" onClick={onClose} disabled={loading}>Cancel</Btn>
        <Btn variant={danger ? 'danger' : 'gold'} onClick={onConfirm} loading={loading}>{confirmLabel}</Btn>
      </>
    }
  >
    <div className="flex items-start gap-3">
      <AlertTriangle size={18} className={danger ? 'mt-0.5 shrink-0 text-red-300' : 'mt-0.5 shrink-0 text-[#C9A45C]'} />
      <div className="text-sm leading-relaxed text-[#C9CED6]">{message}</div>
    </div>
  </Modal>
);

// ------------------------------------------------------------------ Tabs
export const Tabs: React.FC<{ tabs: Array<{ id: string; label: string; badge?: React.ReactNode }>; active: string; onChange: (id: string) => void; className?: string }> = ({ tabs, active, onChange, className }) => (
  <div className={cx('flex flex-wrap items-center gap-1 rounded-xl border border-white/[0.07] bg-black/25 p-1', className)} role="tablist">
    {tabs.map((t) => (
      <button
        key={t.id}
        role="tab"
        aria-selected={active === t.id}
        onClick={() => onChange(t.id)}
        className={cx(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
          active === t.id ? 'bg-gradient-to-b from-[#E8C97C] to-[#C9A45C] text-[#1A1206] shadow' : 'text-[#A7AFBA] hover:bg-white/[0.05] hover:text-[#F5F6F2]',
        )}
      >
        {t.label}
        {t.badge}
      </button>
    ))}
  </div>
);

// ------------------------------------------------------------------ Toasts
interface ToastMsg { id: number; kind: 'success' | 'error' | 'info'; text: string }
const ToastCtx = createContext<{ push: (kind: ToastMsg['kind'], text: string) => void }>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastMsg[]>([]);
  const seq = useRef(0);
  const push = useCallback((kind: ToastMsg['kind'], text: string) => {
    const id = ++seq.current;
    setItems((prev) => [...prev.slice(-3), { id, kind, text }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[300] flex w-[min(92vw,340px)] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cx(
              'pointer-events-auto flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm shadow-2xl backdrop-blur-md',
              t.kind === 'success' && 'border-emerald-500/30 bg-[#07140d]/95 text-emerald-200',
              t.kind === 'error' && 'border-red-500/30 bg-[#160a0a]/95 text-red-200',
              t.kind === 'info' && 'border-[#C9A45C]/30 bg-[#0d0b06]/95 text-[#E8C97C]',
            )}
          >
            {t.kind === 'success' ? <Check size={15} className="mt-0.5 shrink-0" /> : t.kind === 'error' ? <AlertTriangle size={15} className="mt-0.5 shrink-0" /> : <Info size={15} className="mt-0.5 shrink-0" />}
            <span className="leading-snug">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

// ------------------------------------------------------------------ misc
export const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-[#A7AFBA]">{children}</kbd>
);

export const MetricDelta: React.FC<{ value: number | null; suffix?: string }> = ({ value, suffix = '%' }) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <span className="text-[11px] text-[#6B7280]">— no baseline yet</span>;
  }
  const up = value >= 0;
  return (
    <span className={cx('text-[11px] font-bold tabular-nums', up ? 'text-emerald-400' : 'text-red-400')}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}{suffix}
      <span className="ml-1 font-medium text-[#6B7280]">vs prev 30d</span>
    </span>
  );
};
