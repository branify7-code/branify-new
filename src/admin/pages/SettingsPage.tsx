// =============================================================================
// BRANIFY ADMIN — SETTINGS (/admin/settings)
// -----------------------------------------------------------------------------
// Section-scoped editing over the real settings store: General · Brand ·
// Contact · Social · SEO Defaults · Performance · Integrations (read-only).
// Every section saves independently with dirty tracking + confirm on tab switch.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check, Database, ExternalLink, Info, Link2, Plus, RotateCcw, Save, ShieldCheck, Trash2, X,
} from 'lucide-react';
import type { AdminPageProps } from '../lib/auth';
import { getSettings, LOCAL_API_PORT, modeLabel, updateSettings } from '../lib/backend';
import type { SiteSettings } from '../lib/types';
import {
  Badge, Btn, Card, ConfirmDialog, ErrorBlock, Field, Input, LoadingBlock, Select,
  Textarea, cx, useToast,
} from '../ui';
import { useAdminAuth } from '../lib/auth';
import { PwaPage } from './PwaPage';

// ------------------------------------------------------------------ section model
type SectionKey = 'general' | 'brand' | 'contact' | 'social' | 'seo_defaults' | 'performance';

const SECTION_LABELS: Array<{ id: string; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'brand', label: 'Brand' },
  { id: 'contact', label: 'Contact' },
  { id: 'social', label: 'Social' },
  { id: 'seo_defaults', label: 'SEO Defaults' },
  { id: 'performance', label: 'Performance' },
  { id: 'pwa', label: 'PWA' },
  { id: 'integrations', label: 'Integrations' },
];

interface GeneralDraft { site_name: string; site_url: string; tagline: string }
interface BrandDraft { logo_url: string; favicon_url: string; default_og_image: string }
interface ContactDraft {
  email: string; phone: string; whatsapp: string; whatsapp_display: string;
  offices: Array<{ label: string; lines: string[] }>;
}
interface SeoDraft {
  title_template: string; default_title: string; default_description: string;
  default_og_image: string; title_max_length: number; description_max_length: number;
}

interface Drafts {
  general: GeneralDraft;
  brand: BrandDraft;
  contact: ContactDraft;
  social: Record<string, string>;
  seo_defaults: SeoDraft;
  performance: { analytics_provider: string };
}

const envOf = (): Record<string, string | undefined> =>
  ((import.meta as unknown as { env?: Record<string, string | undefined> }).env as Record<string, string | undefined>) || {};

function draftsFrom(s: SiteSettings): Drafts {
  const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
  return {
    general: {
      site_name: s.general?.site_name || '',
      site_url: s.general?.site_url || '',
      tagline: s.general?.tagline || '',
    },
    brand: {
      logo_url: s.brand?.logo_url || '',
      favicon_url: s.brand?.favicon_url || '',
      default_og_image: s.brand?.default_og_image || '',
    },
    contact: {
      email: s.contact?.email || '',
      phone: s.contact?.phone || '',
      whatsapp: s.contact?.whatsapp || '',
      whatsapp_display: s.contact?.whatsapp_display || '',
      offices: (s.contact?.offices || []).map((o) => ({ label: o.label || '', lines: [...(o.lines || [])] })),
    },
    social: { ...(s.social || {}) },
    seo_defaults: {
      title_template: s.seo_defaults?.title_template || '%s | BRANIFY',
      default_title: s.seo_defaults?.default_title || '',
      default_description: s.seo_defaults?.default_description || '',
      default_og_image: s.seo_defaults?.default_og_image || '',
      title_max_length: num(s.seo_defaults?.title_max_length, 60),
      description_max_length: num(s.seo_defaults?.description_max_length, 160),
    },
    performance: { analytics_provider: s.performance?.analytics_provider || 'first_party' },
  };
}

const SOCIAL_FIELDS: Array<{ key: string; label: string; placeholder: string }> = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/branify' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/branify' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/company/branify' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://www.youtube.com/@branify' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@branify' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/branify' },
];

const UrlPreview: React.FC<{ url: string; label: string; size?: 'sm' | 'md' }> = ({ url, label, size = 'sm' }) => {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [url]);
  if (!url) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/25 p-2">
      <div className={cx('flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/[0.04]', size === 'sm' ? 'h-10 w-10' : 'h-14 w-14')}>
        {broken ? <X size={14} className="text-red-400" /> : <img src={url} alt={`${label} preview`} className="h-full w-full object-contain p-1" onError={() => setBroken(true)} />}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">{label}</p>
        <p className="truncate font-mono text-[11px] text-[#A7AFBA]" title={url}>{url}</p>
      </div>
    </div>
  );
};

export const SettingsPage: React.FC<AdminPageProps> = () => {
  const { push } = useToast();
  const { mode } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [drafts, setDrafts] = useState<Drafts | null>(null);
  const [tab, setTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [confirmSwitch, setConfirmSwitch] = useState<string | null>(null);
  const originalRef = useRef<Drafts | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getSettings();
      const d = draftsFrom(s);
      originalRef.current = d;
      setDrafts(d);
    } catch (e) {
      setError({ title: 'Could not load settings', message: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const dirtyOf = useCallback((key: SectionKey): boolean => {
    if (!drafts || !originalRef.current) return false;
    return JSON.stringify(drafts[key]) !== JSON.stringify(originalRef.current[key]);
  }, [drafts]);

  const anyDirty = useMemo(
    () => (['general', 'brand', 'contact', 'social', 'seo_defaults', 'performance'] as SectionKey[]).some((k) => dirtyOf(k)),
    [dirtyOf],
  );

  // Guard against closing the tab with unsaved changes
  useEffect(() => {
    if (!anyDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [anyDirty]);

  const switchTab = (id: string) => {
    if (id === tab) return;
    if (anyDirty) setConfirmSwitch(id);
    else setTab(id);
  };

  const patch = <K extends SectionKey>(key: K, value: Partial<Drafts[K]>) => {
    setDrafts((d) => (d ? { ...d, [key]: { ...d[key], ...value } } : d));
  };

  const saveSection = async (key: SectionKey) => {
    if (!drafts) return;
    setSaving(true);
    try {
      await updateSettings({ [key]: drafts[key] });
      const fresh = await getSettings();
      const d = draftsFrom(fresh);
      originalRef.current = d;
      setDrafts((prev) => (prev ? { ...d, [key]: prev[key] } : d));
      push('success', `${SECTION_LABELS.find((s) => s.id === key)?.label || key} settings saved`);
    } catch (e) {
      push('error', `Save failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetSection = (key: SectionKey) => {
    if (!originalRef.current) return;
    setDrafts((d) => (d ? { ...d, [key]: JSON.parse(JSON.stringify(originalRef.current![key])) } : d));
    push('info', 'Section reset to saved values');
  };

  if (loading) return <LoadingBlock label="Loading settings…" />;
  if (error) return <ErrorBlock title={error.title} message={error.message} onRetry={() => void load()} />;
  if (!drafts) return <ErrorBlock title="Settings unavailable" message="The settings store returned no data." onRetry={() => void load()} />;

  const sectionActions = (key: SectionKey) => (
    <div className="flex items-center gap-2">
      {dirtyOf(key) && <Badge tone="amber">Unsaved</Badge>}
      <Btn size="sm" variant="ghost" icon={RotateCcw} onClick={() => resetSection(key)} disabled={!dirtyOf(key)}>Reset</Btn>
      <Btn size="sm" variant="gold" icon={Save} onClick={() => void saveSection(key)} loading={saving} disabled={!dirtyOf(key)}>Save</Btn>
    </div>
  );

  // ------------------------------------------------------------- integrations data
  const supabaseUrl = envOf().VITE_SUPABASE_URL || 'https://uspshkegxhrglbpxqtil.supabase.co';
  let supabaseHost = supabaseUrl;
  let projectRef = '—';
  try {
    const u = new URL(supabaseUrl);
    supabaseHost = u.host;
    projectRef = u.host.split('.')[0];
  } catch { /* keep raw */ }
  const gemini = envOf().VITE_GEMINI_API_KEY;
  const geminiConfigured = typeof gemini === 'string' && gemini.length > 0 ? true : typeof gemini === 'undefined' ? null : false;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[#F5F6F2]">Settings</h1>
          <p className="text-xs text-[#A7AFBA]">Stored in the settings table — each section saves independently</p>
        </div>
        {anyDirty && <Badge tone="amber">Unsaved changes somewhere</Badge>}
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Settings sections">
        {SECTION_LABELS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={tab === s.id}
            onClick={() => switchTab(s.id)}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-all',
              tab === s.id
                ? 'border-[#C9A45C]/60 bg-gradient-to-b from-[#E8C97C]/20 to-[#C9A45C]/[0.06] text-[#E9CF79]'
                : 'border-white/[0.07] bg-white/[0.02] text-[#A7AFBA] hover:border-white/15 hover:text-[#F5F6F2]',
            )}
          >
            {s.label}
            {s.id !== 'integrations' && dirtyOf(s.id as SectionKey) && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-label="unsaved changes" />}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------ PWA */}
      {tab === 'pwa' && <PwaPage query={new URLSearchParams()} navigate={() => {}} refreshBadges={() => {}} />}

      {/* ------------------------------------------------------ GENERAL */}
      {tab === 'general' && (
        <Card title="General" subtitle="Site identity" actions={sectionActions('general')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Site name" required>
              <Input value={drafts.general.site_name} onChange={(e) => patch('general', { site_name: e.target.value })} placeholder="BRANIFY" />
            </Field>
            <Field label="Site URL" hint="Used for canonical URLs and sitemap generation.">
              <Input value={drafts.general.site_url} onChange={(e) => patch('general', { site_url: e.target.value })} placeholder="https://branify-new.vercel.app" className="font-mono text-xs" />
            </Field>
            <Field label="Tagline" className="sm:col-span-2">
              <Input value={drafts.general.tagline} onChange={(e) => patch('general', { tagline: e.target.value })} placeholder="Luxury Digital Studio & Futuristic Technology" />
            </Field>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------ BRAND */}
      {tab === 'brand' && (
        <Card title="Brand" subtitle="Logo, favicon and the default social-share image" actions={sectionActions('brand')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Logo URL">
              <Input value={drafts.brand.logo_url} onChange={(e) => patch('brand', { logo_url: e.target.value })} placeholder="/branify-logo-horizontal.svg" className="font-mono text-xs" />
            </Field>
            <Field label="Favicon URL">
              <Input value={drafts.brand.favicon_url} onChange={(e) => patch('brand', { favicon_url: e.target.value })} placeholder="/branify-icon.svg" className="font-mono text-xs" />
            </Field>
            <Field label="Default OG image" className="sm:col-span-2" hint="Fallback social-share image when a page defines none.">
              <Input value={drafts.brand.default_og_image} onChange={(e) => patch('brand', { default_og_image: e.target.value })} placeholder="/og/home.jpg" className="font-mono text-xs" />
            </Field>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <UrlPreview url={drafts.brand.logo_url} label="Logo" />
            <UrlPreview url={drafts.brand.favicon_url} label="Favicon" />
            <UrlPreview url={drafts.brand.default_og_image} label="Default OG" size="md" />
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------ CONTACT */}
      {tab === 'contact' && (
        <Card title="Contact" subtitle="Public contact channels and office blocks" actions={sectionActions('contact')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email"><Input type="email" value={drafts.contact.email} onChange={(e) => patch('contact', { email: e.target.value })} placeholder="admin@branify.store" /></Field>
            <Field label="Phone"><Input value={drafts.contact.phone} onChange={(e) => patch('contact', { phone: e.target.value })} placeholder="+8801879176373" /></Field>
            <Field label="WhatsApp number" hint="Digits only — used to build wa.me links.">
              <Input value={drafts.contact.whatsapp} onChange={(e) => patch('contact', { whatsapp: e.target.value })} placeholder="923321029333" className="font-mono text-xs" />
            </Field>
            <Field label="WhatsApp display">
              <Input value={drafts.contact.whatsapp_display} onChange={(e) => patch('contact', { whatsapp_display: e.target.value })} placeholder="+92 332 1029333" />
            </Field>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]">Offices</p>
              <Btn
                size="sm"
                variant="outline"
                icon={Plus}
                onClick={() => patch('contact', { offices: [...drafts.contact.offices, { label: 'New Office', lines: [] }] })}
              >
                Add office
              </Btn>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {drafts.contact.offices.map((office, i) => (
                <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Input
                      value={office.label}
                      onChange={(e) => {
                        const offices = drafts.contact.offices.map((o, j) => (j === i ? { ...o, label: e.target.value } : o));
                        patch('contact', { offices });
                      }}
                      placeholder="Office label"
                      aria-label={`Office ${i + 1} label`}
                    />
                    <Btn
                      size="sm"
                      variant="ghost"
                      icon={Trash2}
                      aria-label={`Remove ${office.label || `office ${i + 1}`}`}
                      className="text-red-300/80"
                      onClick={() => patch('contact', { offices: drafts.contact.offices.filter((_, j) => j !== i) })}
                    />
                  </div>
                  <Textarea
                    value={office.lines.join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n');
                      const offices = drafts.contact.offices.map((o, j) => (j === i ? { ...o, lines } : o));
                      patch('contact', { offices });
                    }}
                    rows={3}
                    placeholder={'One line per row\ne.g. Dhaka\nBangladesh'}
                    aria-label={`${office.label || `Office ${i + 1}`} address lines`}
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------ SOCIAL */}
      {tab === 'social' && (
        <Card title="Social profiles" subtitle="Full URLs — rendered in the site footer" actions={sectionActions('social')}>
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((f) => (
              <Field key={f.key} label={f.label}>
                <div className="relative">
                  <Link2 size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#566072]" />
                  <Input
                    value={drafts.social[f.key] || ''}
                    onChange={(e) => patch('social', { [f.key]: e.target.value } as Partial<Record<string, string>>)}
                    placeholder={f.placeholder}
                    className="pl-8 font-mono text-xs"
                    inputMode="url"
                  />
                </div>
              </Field>
            ))}
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------ SEO DEFAULTS */}
      {tab === 'seo_defaults' && (
        <Card title="SEO defaults" subtitle="Global fallbacks used by the SEO resolution chain" actions={sectionActions('seo_defaults')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title template" hint="%s is replaced by the page title.">
              <Input value={drafts.seo_defaults.title_template} onChange={(e) => patch('seo_defaults', { title_template: e.target.value })} placeholder="%s | BRANIFY" className="font-mono text-xs" />
            </Field>
            <Field label="Default OG image">
              <Input value={drafts.seo_defaults.default_og_image} onChange={(e) => patch('seo_defaults', { default_og_image: e.target.value })} placeholder="/og/home.jpg" className="font-mono text-xs" />
            </Field>
            <Field label="Default title" counter={`${drafts.seo_defaults.default_title.length}/60`}>
              <Input value={drafts.seo_defaults.default_title} onChange={(e) => patch('seo_defaults', { default_title: e.target.value })} maxLength={120} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Title max length">
                <Input
                  type="number" min={20} max={120}
                  value={drafts.seo_defaults.title_max_length}
                  onChange={(e) => patch('seo_defaults', { title_max_length: Number(e.target.value) || 60 })}
                />
              </Field>
              <Field label="Description max">
                <Input
                  type="number" min={60} max={400}
                  value={drafts.seo_defaults.description_max_length}
                  onChange={(e) => patch('seo_defaults', { description_max_length: Number(e.target.value) || 160 })}
                />
              </Field>
            </div>
            <Field label="Default description" counter={`${drafts.seo_defaults.default_description.length}/160`} className="sm:col-span-2">
              <Textarea
                value={drafts.seo_defaults.default_description}
                onChange={(e) => patch('seo_defaults', { default_description: e.target.value })}
                rows={3}
                maxLength={400}
              />
            </Field>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#C9A45C]/25 bg-[#C9A45C]/[0.06] px-3.5 py-3 text-[11px] leading-relaxed text-[#E8C97C]">
            <Info size={13} className="mt-0.5 shrink-0" />
            <p>
              <span className="font-bold uppercase tracking-wider">How these are used. </span>
              Global defaults are fallbacks — they NEVER overwrite page-specific SEO (seo_overrides) or content SEO fields
              stored on each service, tool, template, post or case study. The SEO Center audit shows exactly which source every page resolves to.
            </p>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------ PERFORMANCE */}
      {tab === 'performance' && (
        <Card title="Performance & analytics" subtitle="Measurement provider" actions={sectionActions('performance')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Analytics provider" hint="first_party uses the built-in analytics_events store.">
              <Select
                value={drafts.performance.analytics_provider}
                onChange={(e) => patch('performance', { analytics_provider: e.target.value })}
                aria-label="Analytics provider"
              >
                <option value="first_party">first_party — built-in event store</option>
                <option value="google_analytics">google_analytics</option>
              </Select>
            </Field>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3.5 py-3 text-[11px] leading-relaxed text-amber-200">
            <Info size={13} className="mt-0.5 shrink-0" />
            <p>
              <span className="font-bold uppercase tracking-wider">Honesty note. </span>
              Selecting google_analytics records the intent only — no GA script ships until a measurement ID integration is built.
              Events keep flowing into the first-party analytics_events store either way.
            </p>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------ INTEGRATIONS */}
      {tab === 'integrations' && (
        <Card title="Integrations" subtitle="Read-only — real connection status, no secrets are ever displayed">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]"><Database size={12} /> Supabase project</p>
                <Badge tone={mode === 'supabase' ? 'green' : 'zinc'}>{mode === 'supabase' ? 'Connected' : 'Standby'}</Badge>
              </div>
              <p className="mt-2 truncate font-mono text-xs text-[#E8C97C]" title={supabaseHost}>{supabaseHost}</p>
              <p className="mt-0.5 text-[11px] text-[#6B7280]">Project ref: <span className="font-mono">{projectRef}</span></p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]"><ShieldCheck size={12} /> Admin mode</p>
                <Badge tone={mode === 'supabase' ? 'green' : mode === 'local' ? 'amber' : 'red'}>{modeLabel(mode)}</Badge>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[#6B7280]">
                {mode === 'local'
                  ? `Local preview API is serving the dashboard (dev only, port ${LOCAL_API_PORT} via the gateway).`
                  : mode === 'supabase'
                    ? 'Production data layer — RLS protects every admin table.'
                    : 'No backend connected — apply supabase/admin-schema.sql.'}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]"><ExternalLink size={12} /> Local preview API</p>
              <p className="mt-2 text-xs font-bold text-[#F5F6F2]">{mode === 'local' ? 'Online' : 'Not used in this mode'}</p>
              <p className="mt-0.5 text-[11px] text-[#6B7280]">Dev-only Bun + SQLite API · compiled out of production builds.</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#A7AFBA]">Gemini API key</p>
                {geminiConfigured === null ? (
                  <Badge tone="zinc">—</Badge>
                ) : geminiConfigured ? (
                  <Badge tone="green"><Check size={10} /> Configured</Badge>
                ) : (
                  <Badge tone="zinc">Not detected</Badge>
                )}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[#6B7280]">
                Presence only, derived from the build environment. Key values are NEVER read, stored or displayed here.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab-switch confirm */}
      <ConfirmDialog
        open={Boolean(confirmSwitch)}
        onClose={() => setConfirmSwitch(null)}
        onConfirm={() => {
          if (originalRef.current) setDrafts(JSON.parse(JSON.stringify(originalRef.current)));
          setTab(confirmSwitch || 'general');
          setConfirmSwitch(null);
          push('info', 'Unsaved changes discarded');
        }}
        title="Discard unsaved changes?"
        message="One or more settings sections have unsaved edits. Switching tabs now discards them (the saved values stay untouched)."
        confirmLabel="Discard & switch"
        danger
      />
    </div>
  );
};
