import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X, Check, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, AlertCircle,
  Globe, Layout, ShoppingBag, TrendingUp, Search, Cpu, Zap, Terminal, Share2,
  CalendarCheck, Clock, User, Send,
} from 'lucide-react';
import { servicesData } from '../data/services';
import { supabase } from '../lib/supabase';
import { mirrorLeadToPreview } from '../lib/leadCapture';
import { trackEvent } from '../lib/track';

/* =============================================================================
   BRANIFY — START A PROJECT (4-step lead qualification)
   -----------------------------------------------------------------------------
   Step 1  Select services (multi-select cards, every live BRANIFY service)
   Step 2  Budget range (radio cards)
   Step 3  Timeline (radio cards)
   Step 4  Contact + review → save lead to Supabase `inquiries`
           → open official WhatsApp (wa.me) with a pre-filled summary.

   • Light visual system (white / soft gray / indigo / BRANIFY gold)
   • Lead row uses the EXISTING inquiries schema + status pipeline (no new table)
   • WhatsApp number is read from the central admin setting
     (settings.contact.whatsapp — single source of truth), never hardcoded new
   • No fake instant pricing — estimate is delivered by the team on the call
   ========================================================================== */

const BUDGET_OPTIONS = ['Under $100', '$500 – $1,000', '$1,000 – $3,000', '$3,000 – $5,000+'] as const;
const TIMELINE_OPTIONS = ['Urgent (1 day)', 'Standard (3–4 Weeks)', 'Flexible'] as const;

/** Exact setting key in Supabase `settings` (admin SettingsPage edits it). */
const WA_FALLBACK_DIGITS = '923321029333'; // matches Footer + admin contact setting today

/** Human-readable service names for the review chips + WhatsApp message. */
const SERVICE_LABELS: Record<string, string> = {
  'web-dev': 'Web Development',
  'ui-ux': 'UI / UX Design',
  ecommerce: 'E-Commerce',
  branding: 'Branding',
  'digital-marketing': 'Digital Marketing',
  seo: 'SEO',
  'ai-solutions': 'AI Solutions',
  automation: 'Automation',
  'software-dev': 'Software Development',
  'social-media': 'Social Media',
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Layout, ShoppingBag, Sparkles, TrendingUp, Search, Cpu, Zap, Terminal, Share2,
};

const serviceLabel = (id: string): string =>
  SERVICE_LABELS[id] ||
  servicesData.find((s) => s.id === id)?.title.toLowerCase() ||
  id;

/* ----------------------------- WhatsApp plumbing --------------------------- */

let cachedWaDigits: string | null = null;

/** Read the official WhatsApp number from the central contact setting. */
async function resolveWhatsAppDigits(): Promise<string> {
  if (cachedWaDigits) return cachedWaDigits;
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'contact')
      .single();
    const digits = String((data?.value as { whatsapp?: string } | null)?.whatsapp || '')
      .replace(/[^0-9]/g, '');
    cachedWaDigits = digits.length >= 8 ? digits : WA_FALLBACK_DIGITS;
  } catch {
    cachedWaDigits = WA_FALLBACK_DIGITS;
  }
  return cachedWaDigits;
}

interface LeadDraft {
  name: string;
  contact: string;
  services: string[];
  budget: string;
  timeline: string;
  note: string;
}

function buildWhatsAppMessage(d: LeadDraft): string {
  const serviceLines = d.services.map((id) => `• ${serviceLabel(id)}`).join('\n');
  return [
    "Hello BRANIFY! I'd like to discuss a new project.",
    '',
    `Name: ${d.name}`,
    `Contact: ${d.contact}`,
    '',
    'Services:',
    serviceLines,
    '',
    'Budget:',
    d.budget,
    '',
    'Timeline:',
    d.timeline,
    '',
    'Project Note:',
    d.note.trim() || '—',
    '',
    "I'd like to get a free estimate and strategy call.",
  ].join('\n');
}

/* --------------------------------- Component -------------------------------- */

interface ProjectInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: string;
}

type SubmitPhase = 'idle' | 'saving' | 'preparing' | 'opening';

export const ProjectInquiryModal: React.FC<ProjectInquiryModalProps> = ({
  isOpen,
  onClose,
  initialService,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<SubmitPhase>('idle');
  const [saved, setSaved] = useState(false);
  const [waBlocked, setWaBlocked] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const waDigitsRef = useRef<string>(WA_FALLBACK_DIGITS);

  const busy = phase !== 'idle';

  /* ---- boot / teardown whenever the modal opens ---- */
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSelectedServices(
      initialService && servicesData.some((s) => s.id === initialService)
        ? [initialService]
        : [],
    );
    setBudget('');
    setTimeline('');
    setName('');
    setContact('');
    setNote('');
    setErrors({});
    setPhase('idle');
    setSaved(false);
    setWaBlocked(false);
    setSubmitError(false);

    // Warm the central WhatsApp setting (fire-and-forget).
    void resolveWhatsAppDigits().then((d) => { waDigitsRef.current = d; });

    // Lock body scroll + focus the panel for keyboard users.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* ---- Escape to close + minimal focus trap ---- */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    },
    [busy, onClose],
  );

  /* ---- validation ---- */
  const validateStep = (s: 1 | 2 | 3 | 4): boolean => {
    const next: Record<string, string> = {};
    if (s === 1 && selectedServices.length === 0) {
      next.services = 'Please select at least one service to continue.';
    }
    if (s === 2 && !budget) next.budget = 'Please choose your budget range.';
    if (s === 3 && !timeline) next.timeline = 'Please choose a project timeline.';
    if (s === 4) {
      if (name.trim().length < 2) next.name = 'Please enter your full name.';
      const v = contact.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      const isPhone = /^\+?[0-9][0-9\s\-()]{6,19}$/.test(v);
      if (!v) next.contact = 'Please enter your email or WhatsApp number.';
      else if (!isEmail && !isPhone) next.contact = 'Enter a valid email address or WhatsApp number.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step < 4) {
      trackEvent(`project_form_step_${step}`, { services: selectedServices, budget, timeline });
      setStep((step + 1) as 1 | 2 | 3 | 4);
      setErrors({});
    }
  };
  const goBack = () => {
    setErrors({});
    if (step > 1) setStep((step - 1) as 1 | 2 | 3 | 4);
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
    if (errors.services) setErrors((p) => { const n = { ...p }; delete n.services; return n; });
  };

  /* ---- submit: validate → save lead → open WhatsApp ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || saved) return;
    if (!validateStep(4)) return;

    setPhase('saving');
    setSubmitError(false);

    const waDigits = await resolveWhatsAppDigits();
    waDigitsRef.current = waDigits;

    const pagePath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const source =
      pagePath === '/' || pagePath === ''
        ? 'Homepage → Start a Project'
        : `Start a Project — ${pagePath}`;

    const looksLikePhone = !contact.includes('@');
    const record = {
      name: name.trim(),
      email: contact.trim(),
      ...(looksLikePhone ? { phone: contact.trim() } : {}),
      services: selectedServices,
      budget,
      timeline,
      details: note.trim()
        ? `${note.trim()}\n\nSubmitted from: ${typeof window !== 'undefined' ? window.location.origin : ''}${pagePath}`
        : `Submitted from: ${typeof window !== 'undefined' ? window.location.origin : ''}${pagePath}`,
      source,
    };

    let insertOk = false;
    try {
      setPhase('preparing');
      const { error } = await supabase.from('inquiries').insert([record]);
      insertOk = !error;
      if (error) console.warn('[inquiry] insert error:', error.message);
      if (insertOk) mirrorLeadToPreview({ ...record, created_at: new Date().toISOString() });
    } catch (err) {
      console.warn('[inquiry] insert exception:', err);
      insertOk = false;
    }

    if (!insertOk) {
      // Real failure → tell the truth, never open WhatsApp, never fake success.
      setPhase('idle');
      setSubmitError(true);
      trackEvent('project_form_error', { step: 4, source });
      return;
    }

    trackEvent('project_form_completed', {
      services: selectedServices,
      budget,
      timeline,
      source,
    });

    const message = buildWhatsAppMessage({
      name: name.trim(),
      contact: contact.trim(),
      services: selectedServices,
      budget,
      timeline,
      note,
    });
    const waUrl = `https://wa.me/${waDigits}?text=${encodeURIComponent(message)}`;

    // Success screen takes over (it also says "Opening WhatsApp…").
    setSaved(true);
    setPhase('idle');

    // Try to hand the conversation to WhatsApp right away. If a popup blocker
    // stops it, the success screen shows a manual "Contact on WhatsApp" button.
    // NOTE: window.open(..., 'noopener') returns null BY SPEC, so we open
    // without the feature string and sever `opener` manually instead.
    const win = window.open(waUrl, '_blank');
    if (win) { try { win.opener = null; } catch { /* cross-origin */ } }
    setWaBlocked(!win);
    trackEvent('project_whatsapp_click', { auto: Boolean(win), digits: waDigits });
  };

  const openWhatsAppManually = () => {
    const message = buildWhatsAppMessage({
      name: name.trim(), contact: contact.trim(), services: selectedServices, budget, timeline, note,
    });
    trackEvent('project_whatsapp_click', { auto: false, digits: waDigitsRef.current });
    const win = window.open(`https://wa.me/${waDigitsRef.current}?text=${encodeURIComponent(message)}`, '_blank');
    if (win) { try { win.opener = null; } catch { /* cross-origin */ } }
  };

  const STEPS = useMemo(
    () => [
      { n: 1 as const, label: 'Services', title: 'STEP 1: SELECT YOUR SERVICES' },
      { n: 2 as const, label: 'Budget', title: 'STEP 2: YOUR BUDGET RANGE' },
      { n: 3 as const, label: 'Timeline', title: 'STEP 3: PROJECT TIMELINE' },
      { n: 4 as const, label: 'Contact', title: "STEP 4: LET'S GET YOUR PROJECT STARTED" },
    ],
    [],
  );
  const current = STEPS[step - 1];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 md:p-10 bg-[#0F172A]/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-inquiry-title"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-2xl max-h-[94dvh] sm:max-h-[88vh] overflow-y-auto bg-white border border-[#E2E8F0] rounded-t-3xl sm:rounded-3xl shadow-[0_30px_90px_rgba(15,23,42,0.35)] outline-none"
      >
        {/* gold ambient glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[220px] bg-[#D4AF37]/10 blur-[90px] rounded-full" />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full border border-[#E2E8F0] bg-white/80 text-[#64748B] hover:text-[#111827] hover:border-[#C9A45C]/50 transition-colors disabled:opacity-40 cursor-pointer"
          aria-label="Close project inquiry form"
        >
          <X className="w-[18px] h-[18px]" />
        </button>

        {/* ---------------- ERROR STATE (Supabase save failed) ---------------- */}
        {submitError ? (
          <div className="px-6 py-14 sm:px-12 text-center space-y-6" role="alert">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-2xl font-bold text-[#111827]">
                Something went wrong while submitting your request.
              </h3>
              <p className="text-[#64748B] text-sm">
                Your request was <strong>not</strong> sent. Please try again — your selections are still saved.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => { setSubmitError(false); setStep(4); }}
                className="btn-gold-primary px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
              >
                Try Again
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => { setSubmitError(false); onClose(); }}
                className="px-8 py-3.5 rounded-full border border-[#E2E8F0] bg-white text-[#334155] font-medium text-xs uppercase tracking-widest hover:border-[#5B5FEF]/50 hover:text-[#5B5FEF] transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : saved ? (
        /* --------------------- SUCCESS STATE --------------------- */
          <div className="px-6 py-14 sm:px-12 text-center space-y-5" aria-live="polite">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#F6F1E4] border border-[#C9A45C]/45 flex items-center justify-center text-[#B8923E]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#111827]">
                Thanks! Your project request has been received.
              </h3>
              <p className="text-[#64748B] text-sm sm:text-base max-w-md mx-auto">
                {waBlocked
                  ? 'Your request has been submitted successfully. Please contact BRANIFY on WhatsApp to continue.'
                  : 'Opening WhatsApp so we can continue the conversation.'}
              </p>
            </div>
            {waBlocked && (
              <button
                type="button"
                onClick={openWhatsAppManually}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs uppercase tracking-widest transition-all shadow-[0_8px_28px_rgba(37,211,102,0.35)] cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Contact on WhatsApp
              </button>
            )}
            <div>
              <button
                type="button"
                onClick={onClose}
                className="text-xs uppercase tracking-widest text-[#94A3B8] hover:text-[#5B5FEF] underline underline-offset-4 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
        /* --------------------- WIZARD --------------------- */
          <div className="px-5 pt-6 pb-6 sm:px-9 sm:pt-8 sm:pb-8">
            {/* Header + progress */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.22em] text-[#B8923E] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start a Project — Free Estimate &amp; Strategy Call</span>
              </div>

              {/* Progress rail */}
              <ol className="flex items-center gap-1.5 sm:gap-2" aria-label="Form progress">
                {STEPS.map((s) => {
                  const done = s.n < step;
                  const active = s.n === step;
                  return (
                    <li key={s.n} className="flex-1 min-w-0">
                      <div
                        className={`flex items-center gap-2 ${s.n === 4 ? '' : ''}`}
                        aria-current={active ? 'step' : undefined}
                      >
                        <span
                          className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all ${
                            done
                              ? 'bg-[#5B5FEF] border-[#5B5FEF] text-white'
                              : active
                                ? 'bg-[#F6F1E4] border-[#C9A45C] text-[#B8923E] shadow-[0_0_0_3px_rgba(201,164,92,0.15)]'
                                : 'bg-white border-[#E2E8F0] text-[#94A3B8]'
                          }`}
                        >
                          {done ? <Check className="w-3.5 h-3.5" /> : s.n}
                        </span>
                        <span
                          className={`hidden sm:block text-[11px] font-semibold uppercase tracking-wider truncate ${
                            active ? 'text-[#111827]' : done ? 'text-[#5B5FEF]' : 'text-[#94A3B8]'
                          }`}
                        >
                          {s.label}
                        </span>
                        {s.n !== 4 && (
                          <span
                            className={`flex-1 h-px mx-0.5 ${done ? 'bg-[#5B5FEF]/60' : 'bg-[#E2E8F0]'}`}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <p className="sr-only">{`Step ${step} of 4`}</p>

              <h2
                id="modal-inquiry-title"
                className="font-display text-xl sm:text-2xl md:text-[1.7rem] font-extrabold tracking-tight text-[#111827]"
              >
                {current.title}
              </h2>
            </div>

            {/* ============ STEP 1 — SERVICES ============ */}
            {step === 1 && (
              <fieldset className="mt-5">
                <legend className="text-sm text-[#64748B] mb-3.5">
                  Pick everything you need — multiple selections welcome.
                </legend>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {servicesData.map((svc) => {
                    const Icon = iconMap[svc.iconName] || Sparkles;
                    const active = selectedServices.includes(svc.id);
                    return (
                      <label
                        key={svc.id}
                        className={`relative flex flex-col gap-2 p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all min-h-[92px] ${
                          active
                            ? 'border-[#5B5FEF] bg-[#EEF2FF]/80 shadow-[0_6px_20px_rgba(91,95,239,0.12)]'
                            : 'border-[#E2E8F0] bg-white hover:border-[#C9A45C]/60 hover:bg-[#FFFDF6]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={active}
                          onChange={() => toggleService(svc.id)}
                          aria-describedby={errors.services ? 'err-services' : undefined}
                        />
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            active ? 'bg-[#5B5FEF] text-white' : 'bg-[#F6F1E4] text-[#B8923E]'
                          }`}
                        >
                          <Icon className="w-[18px] h-[18px]" />
                        </span>
                        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-[#111827] leading-snug">
                          {svc.title}
                        </span>
                        {active && (
                          <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#C9A45C] text-white flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
                {errors.services && (
                  <p id="err-services" role="alert" className="mt-2.5 flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.services}
                  </p>
                )}
              </fieldset>
            )}

            {/* ============ STEP 2 — BUDGET ============ */}
            {step === 2 && (
              <fieldset className="mt-5">
                <legend className="text-sm text-[#64748B] mb-3.5">
                  Choose the range that fits your project best.
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Budget range">
                  {BUDGET_OPTIONS.map((b) => {
                    const active = budget === b;
                    return (
                      <label
                        key={b}
                        className={`relative flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all min-h-[56px] ${
                          active
                            ? 'border-[#5B5FEF] bg-[#EEF2FF]/80 shadow-[0_6px_20px_rgba(91,95,239,0.12)]'
                            : 'border-[#E2E8F0] bg-white hover:border-[#C9A45C]/60 hover:bg-[#FFFDF6]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="budget"
                          className="sr-only"
                          checked={active}
                          onChange={() => { setBudget(b); if (errors.budget) setErrors((p) => { const n = { ...p }; delete n.budget; return n; }); }}
                        />
                        <span
                          className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            active ? 'border-[#5B5FEF]' : 'border-[#CBD5E1]'
                          }`}
                          aria-hidden="true"
                        >
                          {active && <span className="w-2.5 h-2.5 rounded-full bg-[#5B5FEF]" />}
                        </span>
                        <span className="font-display text-base sm:text-lg font-bold text-[#111827]">{b}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.budget && (
                  <p id="err-budget" role="alert" className="mt-2.5 flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.budget}
                  </p>
                )}
              </fieldset>
            )}

            {/* ============ STEP 3 — TIMELINE ============ */}
            {step === 3 && (
              <fieldset className="mt-5">
                <legend className="text-sm text-[#64748B] mb-3.5">When would you like to launch?</legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="radiogroup" aria-label="Project timeline">
                  {[
                    { label: TIMELINE_OPTIONS[0], Icon: Zap },
                    { label: TIMELINE_OPTIONS[1], Icon: CalendarCheck },
                    { label: TIMELINE_OPTIONS[2], Icon: Clock },
                  ].map(({ label, Icon }) => {
                    const active = timeline === label;
                    return (
                      <label
                        key={label}
                        className={`relative flex flex-col items-center gap-2.5 p-5 rounded-2xl border cursor-pointer transition-all text-center ${
                          active
                            ? 'border-[#5B5FEF] bg-[#EEF2FF]/80 shadow-[0_6px_20px_rgba(91,95,239,0.12)]'
                            : 'border-[#E2E8F0] bg-white hover:border-[#C9A45C]/60 hover:bg-[#FFFDF6]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="timeline"
                          className="sr-only"
                          checked={active}
                          onChange={() => { setTimeline(label); if (errors.timeline) setErrors((p) => { const n = { ...p }; delete n.timeline; return n; }); }}
                        />
                        <span
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            active ? 'bg-[#5B5FEF] text-white' : 'bg-[#F6F1E4] text-[#B8923E]'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className="text-sm font-bold text-[#111827] leading-snug">{label}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.timeline && (
                  <p id="err-timeline" role="alert" className="mt-2.5 flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.timeline}
                  </p>
                )}
              </fieldset>
            )}

            {/* ============ STEP 4 — CONTACT + REVIEW ============ */}
            {step === 4 && (
              <form id="inq-form" onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
                {/* compact review */}
                <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]/80 p-4 space-y-2.5">
                  <div className="flex items-start gap-2 text-xs">
                    <span className="shrink-0 font-bold uppercase tracking-wider text-[#94A3B8] w-16">Services</span>
                    <span className="flex flex-wrap gap-1.5">
                      {selectedServices.map((id) => (
                        <span key={id} className="px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] text-[11px] font-semibold">
                          {serviceLabel(id)}
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="shrink-0 font-bold uppercase tracking-wider text-[#94A3B8] w-16">Budget</span>
                    <span className="font-semibold text-[#334155]">{budget}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="shrink-0 font-bold uppercase tracking-wider text-[#94A3B8] w-16">Timeline</span>
                    <span className="font-semibold text-[#334155]">{timeline}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="inq-name" className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" aria-hidden="true" />
                      <input
                        id="inq-name"
                        type="text"
                        autoComplete="name"
                        placeholder="e.g. John Smith"
                        value={name}
                        onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => { const n = { ...p }; delete n.name; return n; }); }}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? 'err-name' : undefined}
                        disabled={busy}
                        className={`w-full pl-10 pr-4 py-3.5 rounded-xl bg-white border text-sm text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-4 disabled:opacity-60 ${
                          errors.name
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                            : 'border-[#E2E8F0] focus:border-[#5B5FEF] focus:ring-[#5B5FEF]/10'
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <p id="err-name" role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="inq-contact" className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                      Email / WhatsApp Number *
                    </label>
                    <div className="relative">
                      <Send className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" aria-hidden="true" />
                      <input
                        id="inq-contact"
                        type="text"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@company.com or +1 234…"
                        value={contact}
                        onChange={(e) => { setContact(e.target.value); if (errors.contact) setErrors((p) => { const n = { ...p }; delete n.contact; return n; }); }}
                        aria-invalid={Boolean(errors.contact)}
                        aria-describedby={errors.contact ? 'err-contact' : undefined}
                        disabled={busy}
                        className={`w-full pl-10 pr-4 py-3.5 rounded-xl bg-white border text-sm text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-4 disabled:opacity-60 ${
                          errors.contact
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                            : 'border-[#E2E8F0] focus:border-[#5B5FEF] focus:ring-[#5B5FEF]/10'
                        }`}
                      />
                    </div>
                    {errors.contact && (
                      <p id="err-contact" role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.contact}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="inq-note" className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                    Brief Note <span className="normal-case font-medium text-[#94A3B8]">(optional)</span>
                  </label>
                  <textarea
                    id="inq-note"
                    rows={3}
                    placeholder="Tell us a little about your project…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={busy}
                    className="w-full px-4 py-3.5 rounded-xl bg-white border border-[#E2E8F0] text-sm text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 resize-none disabled:opacity-60"
                  />
                </div>

                <p className="text-[11px] leading-relaxed text-[#94A3B8]">
                  Submitting opens WhatsApp with your request pre-filled — an estimate is prepared by our
                  team after a short strategy call. No payment is required.
                </p>
              </form>
            )}

            {/* ============ FOOTER NAV ============ */}
            <div className="mt-6 flex items-center justify-between gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[#E2E8F0] bg-white text-[#334155] font-semibold text-xs uppercase tracking-widest hover:border-[#5B5FEF]/50 hover:text-[#5B5FEF] transition-all disabled:opacity-40 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <span />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="btn-gold-primary px-7 py-3.5 rounded-full font-bold text-xs uppercase tracking-widest inline-flex items-center gap-2 cursor-pointer"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  form="inq-form"
                  disabled={busy}
                  className="btn-gold-primary px-5 sm:px-7 py-3.5 rounded-full font-bold text-[11px] sm:text-xs uppercase tracking-widest inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {phase === 'saving' && <span>Submitting…</span>}
                  {phase === 'preparing' && <span>Preparing your request…</span>}
                  {phase === 'opening' && <span>Opening WhatsApp…</span>}
                  {phase === 'idle' && (
                    <>
                      <span className="hidden sm:inline">GET MY FREE ESTIMATE &amp; STRATEGY CALL</span>
                      <span className="sm:hidden">GET FREE ESTIMATE</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
