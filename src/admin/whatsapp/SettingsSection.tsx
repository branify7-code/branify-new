// =============================================================================
// BRANIFY WHATSAPP CRM — Settings (official WhatsApp Business configuration)
// -----------------------------------------------------------------------------
// Credentials are stored server-side (whatsapp_settings — zero client policies)
// or in WHATSAPP_* environment variables. The browser only ever receives
// masked values (set/last-4). "Test Connection" performs a REAL Cloud API
// verification — Connected is shown only after an actual success (spec §3/§43).
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import { Badge, Btn, Card, Field, Input, Toggle, useToast } from '../ui';
import * as wa from './waClient';
import type { WaMaskedConfig } from './waTypes';

export const SettingsSection: React.FC<{ onChanged: () => void }> = ({ onChanged }) => {
  const { push } = useToast();
  const [config, setConfig] = useState<WaMaskedConfig | null>(null);
  const [wabaId, setWabaId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [official, setOfficial] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ state: string; detail: string } | null>(null);
  const [copied, setCopied] = useState('');

  const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;

  const load = useCallback(async () => {
    try {
      const { config: c } = await wa.getConfig();
      setConfig(c);
      setWabaId(c.waba_id.value || '');
      setPhoneNumberId(c.phone_number_id.value || '');
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not load configuration.');
    }
  }, [push]);
  useEffect(() => { void load(); wa.officialNumber().then(setOfficial); }, [load]);

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(''), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (wabaId !== (config?.waba_id.value || '')) payload.waba_id = wabaId;
      if (phoneNumberId !== (config?.phone_number_id.value || '')) payload.phone_number_id = phoneNumberId;
      if (accessToken.trim()) payload.access_token = accessToken.trim();
      if (verifyToken.trim()) payload.verify_token = verifyToken.trim();
      if (appSecret.trim()) payload.app_secret = appSecret.trim();
      if (!Object.keys(payload).length) {
        push('info', 'Nothing changed to save.');
        return;
      }
      const { config: c } = await wa.saveConfigServer(payload);
      setConfig(c);
      setAccessToken(''); setVerifyToken(''); setAppSecret('');
      push('success', 'Configuration saved server-side (tokens never reach the browser).');
      onChanged();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const s = await wa.getStatus();
      setTestResult({ state: s.state, detail: s.detail });
      onChanged();
    } catch (e) {
      setTestResult({ state: 'Disconnected', detail: e instanceof Error ? e.message : 'Test failed.' });
    } finally {
      setTesting(false);
    }
  };

  const toggleMock = async (on: boolean) => {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { error } = await supabase.from('whatsapp_settings').update({ mock_mode: on, updated_at: new Date().toISOString() }).eq('id', true);
      if (error) throw error;
      push(on ? 'info' : 'success', on
        ? 'DEVELOPMENT MOCK MODE enabled — every mock surface is labelled, never presented as real customer data.'
        : 'Development mock mode disabled.');
      await load();
      onChanged();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not change mock mode.');
    }
  };

  const stateBadge = (state: string): 'green' | 'amber' | 'red' =>
    state === 'Connected' ? 'green' : state === 'Configuration Required' ? 'amber' : 'red';

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-extrabold text-[#111827]">Connection</h3>
            <p className="text-[11px] text-[#5B6B82]">"Connected" appears only after a real verification against the WhatsApp Cloud API.</p>
          </div>
          {testResult && <Badge tone={stateBadge(testResult.state)}>{testResult.state}</Badge>}
          {config?.configured && !testResult && <Badge tone="amber">{config.configured ? 'Saved — run a test to verify' : 'Configuration Required'}</Badge>}
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={() => void test()} disabled={testing}><RefreshCw size={12} className={testing ? 'animate-spin' : ''} /> Test Connection</Btn>
          </div>
        </div>
        {testResult && <p className="mt-2 rounded-lg bg-white/[0.04] px-3 py-2 text-[11px] text-[#334155]">{testResult.detail}</p>}
      </Card>

      <Card className="p-4">
        <h3 className="font-display text-sm font-extrabold text-[#111827]">WhatsApp Business credentials</h3>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[#5B6B82]">
          Stored with server-side-only protection (RLS denies every client). Values written here override nothing — environment variables
          (<span className="font-mono text-[10px]">WHATSAPP_*</span>) take precedence when set. Tokens are shown masked after saving.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
          <Field label="WhatsApp Business Account ID" hint={config?.waba_id.source === 'env' ? 'Currently set via environment (read-only here)' : 'e.g. 102457896354789'}>
            <Input value={wabaId} onChange={(e) => setWabaId(e.target.value)} disabled={config?.waba_id.source === 'env'} className="font-mono text-xs" placeholder="WABA ID" />
          </Field>
          <Field label="Phone Number ID" hint={config?.phone_number_id.source === 'env' ? 'Currently set via environment (read-only here)' : 'From Meta → WhatsApp → API Setup'}>
            <Input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} disabled={config?.phone_number_id.source === 'env'} className="font-mono text-xs" placeholder="Phone Number ID" />
          </Field>
          <Field label="Access Token" hint={config?.access_token.set ? `Saved (${config.access_token.last4}) · source: ${config.access_token.source}` : 'Permanent System User token with whatsapp_business_messaging'}>
            <Input value={accessToken} onChange={(e) => setAccessToken(e.target.value)} type="password" className="font-mono text-xs" placeholder={config?.access_token.set ? '•••• leave blank to keep' : 'EAAG…'} autoComplete="new-password" />
          </Field>
          <Field label="Webhook Verify Token" hint={config?.verify_token.set ? `Saved (${config.verify_token.last4})` : 'Any strong random string — use the SAME value in Meta webhook setup'}>
            <Input value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} type="password" className="font-mono text-xs" placeholder={config?.verify_token.set ? '•••• leave blank to keep' : 'random string'} autoComplete="new-password" />
          </Field>
          <Field label="App Secret (optional)" hint={config?.app_secret.set ? `Saved (${config.app_secret.last4})` : 'Enables webhook signature verification (recommended)'} counter=" ">
            <Input value={appSecret} onChange={(e) => setAppSecret(e.target.value)} type="password" className="font-mono text-xs" placeholder={config?.app_secret.set ? '•••• leave blank to keep' : 'Meta App secret'} autoComplete="new-password" />
          </Field>
          <Field label="Official business WhatsApp number" hint="Single source of truth used by the public website CTAs (read-only)">
            <Input value={official ? `+${official}` : ''} readOnly className="font-mono text-xs bg-white/[0.04]" aria-readonly="true" />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Btn variant="gold" size="sm" onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save configuration'}</Btn>
          <a href="https://business.facebook.com/waManager/home/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8F6B2D] hover:underline">
            Open Meta Business Manager <ExternalLink size={11} />
          </a>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-display text-sm font-extrabold text-[#111827]">Webhook setup (Meta App dashboard)</h3>
        <ol className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-[#334155]">
          <li><b>1.</b> Meta App Dashboard → WhatsApp → Configuration → Callback URL — paste:</li>
        </ol>
        <div className="my-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-[#0F172A]/[0.05] px-2.5 py-1.5 font-mono text-[10.5px] text-[#334155]">{webhookUrl}</code>
          <Btn variant="outline" size="sm" onClick={() => void copy(webhookUrl, 'url')}>{copied === 'url' ? <Check size={12} /> : <Copy size={12} />} Copy</Btn>
        </div>
        <ol className="space-y-1.5 text-[11px] leading-relaxed text-[#334155]">
          <li><b>2.</b> Verify token — the exact value saved above (then press Verify and save).</li>
          <li><b>3.</b> Subscribe to the <b>messages</b> field (covers incoming messages + sent/delivered/read/failed statuses). Add <b>message_template_status_update</b> for template states.</li>
          <li><b>4.</b> Optional but recommended: add the App Secret above — webhook payloads are then signature-verified (X-Hub-Signature-256).</li>
        </ol>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <h3 className="font-display text-sm font-extrabold text-[#111827]">Development mock mode</h3>
            <p className="mt-0.5 text-[11px] leading-relaxed text-[#5B6B82]">
              For exploring the interface before Meta credentials exist. When on, every sample surface carries the
              red <b>DEVELOPMENT MOCK MODE</b> banner; mock data is labelled test data and never presented as real customer conversations.
            </p>
          </div>
          <Toggle checked={Boolean(config?.mock_mode)} onChange={(v) => void toggleMock(v)} label={config?.mock_mode ? 'ON' : 'OFF'} />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-[#7E8DA6]"><ShieldCheck size={12} /> Without configuration the module simply shows "Configuration Required" — no fake production data is ever created.</p>
      </Card>
    </div>
  );
};
