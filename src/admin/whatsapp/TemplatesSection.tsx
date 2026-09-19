// =============================================================================
// BRANIFY WHATSAPP CRM — Templates (synced from the connected WABA)
// Statuses ALWAYS reflect the actual API state (APPROVED/PENDING/REJECTED/…).
// Approved templates can be sent with validated variables (spec §18).
// =============================================================================
import React, { useEffect, useState } from 'react';
import { RefreshCw, Send } from 'lucide-react';
import { Badge, Btn, useToast } from '../ui';
import { DataTable } from '../ui/DataTable';
import type { Column } from '../ui/DataTable';
import * as wa from './waClient';
import type { WaTemplate } from './waTypes';

const STATUS_TONE: Record<string, 'green' | 'amber' | 'red' | 'steel' | 'zinc'> = {
  APPROVED: 'green', PENDING: 'amber', REJECTED: 'red', PAUSED: 'steel', ARCHIVED: 'steel', DELETED: 'zinc',
};

const bodyOf = (t: WaTemplate): string => {
  const comps = (Array.isArray(t.components) ? t.components : []) as Array<{ type?: string; text?: string }>;
  return comps.find((c) => c.type === 'body')?.text || '(no body)';
};

export const TemplatesSection: React.FC = () => {
  const { push } = useToast();
  const [rows, setRows] = useState<WaTemplate[] | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncInfo, setSyncInfo] = useState('');

  const load = () => { setRows(null); wa.listTemplates().then(setRows).catch((e) => { setRows([]); push('error', e.message || 'Could not load templates.'); }); };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sync = async () => {
    setSyncing(true);
    try {
      const { result } = await wa.syncTemplatesServer();
      setSyncInfo(`Synced ${result.synced} templates from the WhatsApp Business Account — ` +
        Object.entries(result.statuses).map(([k, v]) => `${v} ${k}`).join(', '));
      load();
      push('success', 'Template sync complete.');
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const columns: Column<WaTemplate>[] = [
    { key: 'name', label: 'Name', sortable: true, render: (r) => <span className="font-bold text-[#111827]">{r.name}</span> },
    { key: 'category', label: 'Category', hideOnMobile: true },
    { key: 'language', label: 'Language', hideOnMobile: true },
    { key: 'status', label: 'Status (API)', sortable: true, render: (r) => <Badge tone={STATUS_TONE[r.status] || 'zinc'}>{r.status}</Badge> },
    { key: 'preview', label: 'Preview', render: (r) => <span className="line-clamp-2 max-w-[320px] text-[11px] text-[#5B6B82]">{bodyOf(r)}</span> },
    { key: 'template_id', label: 'Template ID', hideOnMobile: true, render: (r) => <span className="font-mono text-[10px] text-[#94A3B8]">{r.template_id}</span> },
    { key: 'quality', label: 'Quality', hideOnMobile: true, render: (r) => r.quality || '—' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn variant="gold" size="sm" onClick={() => void sync()} disabled={syncing}>
          <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing…' : 'Sync from WhatsApp'}
        </Btn>
        <span className="text-[10.5px] text-[#7E8DA6]">
          Pulls the real template list from your WhatsApp Business Account. Sending is available in the Inbox once a template shows APPROVED.
        </span>
      </div>
      {syncInfo && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-700">{syncInfo}</p>}
      <DataTable<WaTemplate>
        columns={columns}
        rows={rows || []}
        loading={rows === null}
        total={(rows || []).length}
        page={1}
        pageSize={Math.max(1, (rows || []).length)}
        onPageChange={() => { /* full list */ }}
        emptyTitle="No templates yet"
        emptyHint="Add templates in Meta Business Manager, then press Sync from WhatsApp — statuses always mirror the API."
      />
      <p className="flex items-center gap-1.5 text-[10.5px] text-[#7E8DA6]"><Send size={11} /> Pending or rejected templates can never be sent — the Inbox only offers APPROVED ones.</p>
    </div>
  );
};
