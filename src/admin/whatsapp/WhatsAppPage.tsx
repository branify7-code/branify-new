// =============================================================================
// BRANIFY WHATSAPP CRM — module hub (admin nav item + section tabs)
// -----------------------------------------------------------------------------
// Top of module: honest connection strip (Connected / Disconnected /
// Configuration Required / Webhook Error — "Connected" ONLY after a real
// Cloud API verification, spec §43). Tab bar = the module submenu
// (Inbox · Contacts · Leads · Templates · Automations · Analytics · Settings).
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3, ClipboardList, Inbox, LayoutTemplate, MessageCircle, RefreshCw,
  Settings, ShieldAlert, Sparkles, Users,
} from 'lucide-react';
import { Badge, Btn, LoadingBlock, cx } from '../ui';
import type { AdminPageProps } from '../lib/auth';
import * as wa from './waClient';
import type { WaStatusResponse } from './waTypes';
import { SetupPanel } from './SetupPanel';
import { InboxSection } from './InboxSection';
import { ContactsSection } from './ContactsSection';
import { LeadsSection } from './LeadsSection';
import { TemplatesSection } from './TemplatesSection';
import { AutomationsSection } from './AutomationsSection';
import { AnalyticsSection } from './AnalyticsSection';
import { SettingsSection } from './SettingsSection';

export type WaSection = 'inbox' | 'contacts' | 'leads' | 'templates' | 'automations' | 'analytics' | 'settings';

const TABS: Array<{ id: WaSection; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }> }> = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'leads', label: 'Leads', icon: ClipboardList },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'automations', label: 'Automations', icon: Sparkles },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const WhatsAppPage: React.FC<AdminPageProps & { section: WaSection }> = ({ section, navigate }) => {
  const [status, setStatus] = useState<WaStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [ready, setReady] = useState<boolean | null>(null); // null = probing schema

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const s = await wa.getStatus();
      setStatus(s);
      setReady(s.config.schema_ready);
    } catch (e) {
      // Server unreachable → never claim connected.
      setStatus({
        state: e instanceof wa.WaError && e.code === 'unauthorized' ? 'Configuration Required' : 'Disconnected',
        detail: e instanceof Error ? e.message : 'Status unavailable.',
        config: { configured: false, waba_id: { set: false, value: '', source: 'none' }, phone_number_id: { set: false, value: '', source: 'none' }, access_token: { set: false, last4: '', source: 'none' }, verify_token: { set: false, last4: '', source: 'none' }, app_secret: { set: false, last4: '', source: 'none' }, mock_mode: false, schema_ready: false },
      });
      setReady(false);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setReady(await wa.schemaReady());
      } catch {
        setReady(false);
      }
      void refreshStatus();
    })();
  }, [refreshStatus, section]);

  const stateTone = useMemo(() => {
    switch (status?.state) {
      case 'Connected': return 'green' as const;
      case 'Configuration Required': return 'amber' as const;
      case 'Webhook Error': return 'red' as const;
      default: return 'red' as const;
    }
  }, [status?.state]);

  const tabTo = (id: WaSection): string => (id === 'inbox' ? '/whatsapp' : `/whatsapp/${id}`);

  return (
    <div className="flex min-h-[60vh] flex-col gap-4">
      {/* connection strip */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9A45C]/30 bg-[#C9A45C]/10">
          <MessageCircle size={15} className="text-[#8F6B2D]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#334155]">WhatsApp Business Cloud API</p>
          <p className="truncate text-[11px] text-[#7E8DA6]">{status ? status.detail : 'Checking connection…'}</p>
        </div>
        {status && <Badge tone={stateTone}>{status.state}</Badge>}
        <Btn variant="ghost" size="sm" onClick={() => void refreshStatus()} disabled={statusLoading} aria-label="Re-check connection">
          <RefreshCw size={13} className={statusLoading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Re-check</span>
        </Btn>
      </div>

      {/* development mock mode banner (never presented as real data) */}
      {status?.config.mock_mode && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5" role="alert">
          <ShieldAlert size={15} className="shrink-0 text-amber-700" />
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
            DEVELOPMENT MOCK MODE — sample conversations below are clearly labelled test data, not customer chats. Turn off in Settings.
          </p>
        </div>
      )}

      {/* tab bar (module submenu) */}
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="WhatsApp CRM sections">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={section === id}
            className={cx(
              'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors',
              section === id
                ? 'border border-[#C9A45C]/40 bg-[#C9A45C]/15 text-[#8F6B2D]'
                : 'border border-transparent text-[#5B6B82] hover:bg-white/[0.05] hover:text-[#111827]',
            )}
            onClick={() => navigate(tabTo(id))}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* body */}
      {ready === null ? (
        <LoadingBlock label="Checking WhatsApp CRM schema…" />
      ) : !ready && section !== 'settings' ? (
        <SetupPanel />
      ) : (
        <div className="flex flex-col gap-4">
          {section === 'settings' && ready === false && <SetupPanel />}
          {section === 'inbox' && ready && <InboxSection onOpenSettings={() => navigate(tabTo('settings'))} />}
          {section === 'contacts' && ready && <ContactsSection />}
          {section === 'leads' && ready && <LeadsSection />}
          {section === 'templates' && ready && <TemplatesSection />}
          {section === 'automations' && ready && <AutomationsSection />}
          {section === 'analytics' && ready && <AnalyticsSection />}
          {section === 'settings' && <SettingsSection onChanged={refreshStatus} />}
        </div>
      )}
    </div>
  );
};
