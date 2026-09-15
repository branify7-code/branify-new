/* =========================================================
   FreePromptGenerator — interactive UI for the BRANIFY-owned
   "Free AI Prompt Generator" (/ai-tools/free-ai-prompt-generator)
   ---------------------------------------------------------
   · Real generation via POST /api/ai/prompt (existing OmniRoute
     gateway, server-side validation + rate limiting). No fake
     outputs, no fake counters — remaining usage comes from the
     server response.
   · Beginner-first: categories, plain-language idea box, optional
     tone/detail/language, clickable examples, copy/clear/again.
   · Light BRANIFY design system (white cards, indigo/gold accents).
   · Analytics: free_ai_prompt_tool_view / _generate / _copy /
     _limit_reached (existing trackEvent pipeline).
========================================================= */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, Eraser, RefreshCw, Sparkles, Wand2, AlertCircle, Lightbulb } from 'lucide-react';
import { trackEvent } from '../lib/track';

interface PromptResponse {
  ok: boolean;
  prompt?: string;
  remaining?: number | null;
  limit?: number;
  error?: { kind?: string; message?: string };
}

interface Category {
  id: string;
  label: string;
  emoji: string;
  placeholder: string;
}

const CATEGORIES: Category[] = [
  { id: 'image', label: 'Image', emoji: '🎨', placeholder: 'e.g. A realistic product photo of my handmade candle...' },
  { id: 'writing', label: 'Blog & Writing', emoji: '✍️', placeholder: 'e.g. A blog post about how to choose a wedding cake...' },
  { id: 'social', label: 'Social Media', emoji: '📱', placeholder: 'e.g. I want a luxury restaurant Instagram post...' },
  { id: 'marketing', label: 'Marketing', emoji: '📣', placeholder: 'e.g. An ad campaign for my 20%-off summer sale...' },
  { id: 'business', label: 'Business', emoji: '💼', placeholder: 'e.g. A professional email to reschedule a client meeting...' },
  { id: 'video', label: 'Video', emoji: '🎬', placeholder: 'e.g. A 30-second TikTok video idea for my bakery...' },
  { id: 'coding', label: 'Coding', emoji: '💻', placeholder: 'e.g. A React landing page for my SaaS product...' },
  { id: 'website', label: 'Website', emoji: '🌐', placeholder: 'e.g. A homepage for my interior design studio...' },
  { id: 'research', label: 'Research', emoji: '🔎', placeholder: 'e.g. Compare two laptops for video editing work...' },
];

const TONES = ['Professional', 'Creative', 'Friendly', 'Persuasive', 'Minimal'] as const;
const DETAILS = ['Simple', 'Detailed', 'Expert'] as const;
const LANGUAGES = ['English', 'Urdu', 'Arabic', 'Spanish', 'French', 'German', 'Hindi', 'Portuguese'] as const;

const EXAMPLES: Array<{ text: string; category: string }> = [
  { text: 'Create a premium restaurant Instagram campaign.', category: 'social' },
  { text: 'Create a realistic product photography prompt.', category: 'image' },
  { text: 'Write a professional homepage hero section.', category: 'writing' },
  { text: 'Create a React landing page prompt.', category: 'coding' },
  { text: 'Create a blog outline for a small business.', category: 'writing' },
];

type Status = 'idle' | 'loading' | 'done';

export const FreePromptGenerator: React.FC = () => {
  const [task, setTask] = useState<string>('social');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState<string>('Professional');
  const [detail, setDetail] = useState<string>('Detailed');
  const [language, setLanguage] = useState<string>('English');
  const [status, setStatus] = useState<Status>('idle');
  const [prompt, setPrompt] = useState('');
  const [remaining, setRemaining] = useState<number | null | undefined>(undefined);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const viewTracked = useRef(false);

  const activeCat = CATEGORIES.find((c) => c.id === task) || CATEGORIES[0];

  useEffect(() => {
    if (!viewTracked.current) {
      viewTracked.current = true;
      trackEvent('free_ai_prompt_tool_view');
    }
  }, []);

  const generate = useCallback(async () => {
    if (status === 'loading') return;
    setError(null);
    setLimitMsg(null);
    if (description.trim().length < 3) {
      setError('Please describe what you want to create.');
      return;
    }
    setStatus('loading');
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = window.setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch('/api/ai/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          description: description.trim().slice(0, 1200),
          tone: tone.toLowerCase(),
          detail: detail.toLowerCase(),
          language,
        }),
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => null)) as PromptResponse | null;
      if (res.status === 429) {
        const msg = data?.error?.message || "You've reached today's free limit. Please try again tomorrow.";
        setLimitMsg(msg);
        trackEvent('free_ai_prompt_limit_reached');
        setStatus('idle');
        return;
      }
      if (!res.ok || !data?.ok || !data.prompt) {
        setError(data?.error?.message || "We couldn't generate your prompt right now. Please try again.");
        setStatus('idle');
        return;
      }
      setPrompt(data.prompt);
      setRemaining(typeof data.remaining === 'number' ? data.remaining : null);
      setStatus('done');
      trackEvent('free_ai_prompt_generate', { task });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('The generation took too long. Please try again.');
      } else {
        setError("We couldn't reach the generator. Please check your connection and try again.");
      }
      setStatus('idle');
    } finally {
      window.clearTimeout(timer);
    }
  }, [description, status, task, tone, detail, language]);

  const copyPrompt = useCallback(async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* noop */ }
      ta.remove();
    }
    setCopied(true);
    trackEvent('free_ai_prompt_copy', { task });
    window.setTimeout(() => setCopied(false), 1800);
  }, [prompt, task]);

  const clearAll = useCallback(() => {
    setDescription('');
    setPrompt('');
    setError(null);
    setLimitMsg(null);
    setStatus('idle');
  }, []);

  const chip = (active: boolean) =>
    `px-3.5 py-2 rounded-full text-[11px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
      active
        ? 'bg-[#EEF2FF] text-[#4338CA] border-[#5B5FEF]/50 shadow-sm'
        : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#5B5FEF]/40 hover:text-[#4338CA]'
    }`;

  return (
    <section
      aria-labelledby="fpg-heading"
      className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_-18px_rgba(15,23,42,0.15)]"
    >
      {/* header */}
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5B5FEF] via-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#5B5FEF]/25 shrink-0">
          <Wand2 className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C9A45C]">Try the tool — it's free</p>
          <h2 id="fpg-heading" className="font-display text-xl sm:text-2xl font-extrabold text-[#111827] tracking-[-0.01em]">
            What do you want to create?
          </h2>
        </div>
      </div>

      {/* beginner note */}
      <div className="flex items-start gap-2.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl px-4 py-3 mb-6">
        <Lightbulb className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-[13px] text-[#4338CA] leading-relaxed">
          Not sure what to write?<br />
          Just describe your idea in simple words. BRANIFY will turn it into a more useful AI prompt.
        </p>
      </div>

      {/* step 1 — category */}
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#334155] mb-2.5">
        1 · What do you want to create?
      </p>
      <div className="flex flex-wrap gap-2 mb-6" role="radiogroup" aria-label="Task category">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={task === c.id}
            onClick={() => setTask(c.id)}
            className={chip(task === c.id)}
          >
            <span className="mr-1.5" aria-hidden="true">{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* step 2 — idea */}
      <label htmlFor="fpg-idea" className="block text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#334155] mb-2.5">
        2 · Describe what you want
      </label>
      <textarea
        id="fpg-idea"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        maxLength={1200}
        placeholder={activeCat.placeholder}
        aria-invalid={Boolean(error && description.trim().length < 3)}
        className="w-full rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#1E293B] placeholder-[#94A3B8] shadow-[0_2px_10px_rgba(15,23,42,0.04)] focus:outline-none focus:border-[#5B5FEF]/50 focus:shadow-[0_0_0_3px_rgba(91,95,239,0.12)] transition-colors resize-y min-h-[96px]"
      />

      {/* clickable examples */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3 mb-6">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#94A3B8] mr-1">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.text}
            type="button"
            onClick={() => {
              setDescription(ex.text);
              setTask(ex.category);
              setError(null);
            }}
            className="text-[11px] font-semibold text-[#4338CA] bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] rounded-full px-3 py-1.5 transition-colors cursor-pointer text-left"
          >
            "{ex.text}"
          </button>
        ))}
      </div>

      {/* step 3 — optional controls */}
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#334155] mb-2.5">
        3 · Optional — tone, detail &amp; language
      </p>
      <div className="space-y-3 mb-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] w-14 shrink-0">Tone</span>
          {TONES.map((t) => (
            <button key={t} type="button" aria-pressed={tone === t} onClick={() => setTone(t)} className={chip(tone === t) + ' !normal-case !font-semibold !tracking-normal'}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] w-14 shrink-0">Detail</span>
          {DETAILS.map((d) => (
            <button key={d} type="button" aria-pressed={detail === d} onClick={() => setDetail(d)} className={chip(detail === d) + ' !normal-case !font-semibold !tracking-normal'}>
              {d}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="fpg-lang" className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] w-14 shrink-0">Language</label>
          <select
            id="fpg-lang"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-full border border-[#E2E8F0] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#475569] focus:outline-none focus:border-[#5B5FEF]/50 cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* generate */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          type="button"
          onClick={generate}
          disabled={status === 'loading'}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-b from-[#F6DF84] via-[#D4AF37] to-[#B3841F] text-[#1A1206] text-xs font-extrabold uppercase tracking-[0.14em] shadow-lg shadow-[#D4AF37]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#D4AF37]/40 hover:brightness-[1.05] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2"
        >
          {status === 'loading' ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Generating your prompt…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Generate Prompt
            </>
          )}
        </button>
        {typeof remaining === 'number' && (
          <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider" aria-live="polite">
            Free generations remaining: <span className="text-[#111827]">{remaining}</span>
          </p>
        )}
      </div>

      {/* errors */}
      {error && (
        <div role="alert" className="flex items-start gap-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl px-4 py-3 mt-4">
          <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[13px] text-[#B91C1C] leading-relaxed">{error}</p>
        </div>
      )}
      {limitMsg && (
        <div role="alert" className="flex items-start gap-2.5 bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl px-4 py-3 mt-4">
          <AlertCircle className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[13px] text-[#C2410C] leading-relaxed">{limitMsg}</p>
        </div>
      )}

      {/* step 4 — output */}
      {status === 'done' && prompt && (
        <div className="mt-8 rounded-2xl border border-[#C7D2FE] bg-gradient-to-b from-[#F8FAFF] to-white p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#5B5FEF]" aria-hidden="true" />
            <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.18em] text-[#111827]">Your AI Prompt</h3>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-sm text-[#334155] leading-relaxed bg-white border border-[#E2E8F0] rounded-xl p-4 max-h-96 overflow-y-auto">{prompt}</pre>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 mt-4">
            <button
              type="button"
              onClick={copyPrompt}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[11px] font-extrabold uppercase tracking-[0.14em] border transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                  : 'bg-white text-[#4338CA] border-[#C7D2FE] hover:border-[#5B5FEF]/60 hover:bg-[#EEF2FF]'
              }`}
              aria-label="Copy prompt to clipboard"
            >
              {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
              {copied ? 'Copied ✓' : 'Copy Prompt'}
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={status === 'loading'}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[11px] font-extrabold uppercase tracking-[0.14em] border border-[#E2E8F0] bg-white text-[#475569] hover:border-[#5B5FEF]/40 hover:text-[#4338CA] transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
              Generate Again
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[11px] font-extrabold uppercase tracking-[0.14em] border border-transparent bg-transparent text-[#94A3B8] hover:text-[#475569] transition-colors cursor-pointer"
            >
              <Eraser className="w-4 h-4" aria-hidden="true" />
              Clear
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default FreePromptGenerator;
