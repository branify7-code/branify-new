// =============================================================================
// BRANIFY WHATSAPP CRM — Leads pipeline (optional Kanban over lead status)
// Columns = the EXISTING BRANIFY lead statuses. Moving a card updates the real
// whatsapp_contacts.lead_status (desktop: drag & drop · mobile: move buttons).
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, RefreshCw } from 'lucide-react';
import { Badge, Btn, Select, useToast, cx } from '../ui';
import * as wa from './waClient';
import type { WaContact, LeadStatus } from './waTypes';
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from './waTypes';

const STATUS_TONE: Record<string, 'gold' | 'steel' | 'green' | 'violet' | 'red'> = {
  new: 'gold', contacted: 'steel', qualified: 'green', proposal: 'violet', won: 'green', lost: 'red',
};

export const LeadsSection: React.FC = () => {
  const { push } = useToast();
  const [contacts, setContacts] = useState<WaContact[] | null>(null);
  const [dragId, setDragId] = useState('');
  const [mobilePicker, setMobilePicker] = useState<{ id: string; status: LeadStatus } | null>(null);

  const load = () => { setContacts(null); wa.listContacts().then(setContacts).catch((e) => { setContacts([]); push('error', e.message || 'Could not load leads.'); }); };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(LEAD_STATUSES.map((s) => [s, [] as WaContact[]])) as Record<LeadStatus, WaContact[]>;
    for (const c of contacts || []) map[c.lead_status]?.push(c);
    return map;
  }, [contacts]);

  const move = async (id: string, status: LeadStatus) => {
    const current = (contacts || []).find((c) => c.id === id);
    if (!current || current.lead_status === status) return;
    // optimistic
    setContacts((prev) => (prev || []).map((c) => (c.id === id ? { ...c, lead_status: status } : c)));
    try {
      await wa.updateContact(id, { lead_status: status });
      push('success', `Lead moved to ${LEAD_STATUS_LABELS[status]}.`);
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not move the lead.');
      setContacts((prev) => (prev || []).map((c) => (c.id === id ? { ...c, lead_status: current.lead_status } : c)));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[#5B6B82]">Drag cards between columns (desktop) or use the move control (mobile) — every move updates the real lead status.</p>
        <Btn variant="ghost" size="sm" onClick={load} aria-label="Refresh"><RefreshCw size={13} /></Btn>
      </div>

      {contacts === null && <p className="text-xs text-[#7E8DA6]">Loading pipeline…</p>}
      {contacts !== null && contacts.length === 0 && (
        <p className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 text-center text-xs text-[#7E8DA6]">
          No leads yet — WhatsApp contacts appear here automatically (or add contacts first).
        </p>
      )}

      <div className="adm-scroll grid grid-cols-2 gap-2 overflow-x-auto pb-2 sm:grid-cols-3 lg:grid-cols-6 lg:overflow-visible">
        {LEAD_STATUSES.map((status) => (
          <div key={status}
            className={cx('flex min-h-[220px] flex-col rounded-xl border bg-white/[0.02] p-2',
              dragId ? 'border-dashed border-[#C9A45C]/50' : 'border-white/[0.07]')}
            onDragOver={(e) => { if (dragId) e.preventDefault(); }}
            onDrop={() => { if (dragId) { void move(dragId, status); setDragId(''); } }}>
            <div className="mb-2 flex items-center justify-between px-1">
              <Badge tone={STATUS_TONE[status]}>{LEAD_STATUS_LABELS[status]}</Badge>
              <span className="text-[10px] font-bold text-[#7E8DA6]">{byStatus[status].length}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {byStatus[status].map((c) => (
                <div key={c.id}
                  draggable
                  onDragStart={() => setDragId(c.id)}
                  onDragEnd={() => setDragId('')}
                  className="cursor-grab rounded-lg border border-white/[0.08] bg-white p-2 shadow-sm active:cursor-grabbing"
                  data-testid={`lead-card-${c.wa_id}`}>
                  <p className="truncate text-[11px] font-extrabold text-[#111827]">{c.name || `+${c.wa_id}`}</p>
                  <p className="truncate text-[10px] text-[#7E8DA6]">+{c.wa_id}</p>
                  {(c.tags || []).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">{c.tags.slice(0, 2).map((t) => <Badge key={t} tone="zinc">{t}</Badge>)}</div>
                  )}
                  {c.assigned_to && <p className="mt-1 text-[9.5px] text-[#94A3B8]">→ {c.assigned_to.split('@')[0]}</p>}
                  <button className="mt-1 flex items-center gap-1 text-[9.5px] font-bold text-[#8F6B2D] lg:hidden"
                    onClick={() => setMobilePicker({ id: c.id, status })}
                    aria-label={`Move ${c.name || c.wa_id}`}>
                    <ArrowLeftRight size={10} /> Move
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {mobilePicker && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-white p-3 shadow-2xl lg:hidden" role="dialog" aria-label="Move lead">
          <p className="mb-1.5 text-[11px] font-extrabold text-[#111827]">Move lead to…</p>
          <Select value={mobilePicker.status} onChange={(e) => { void move(mobilePicker.id, e.target.value as LeadStatus); setMobilePicker(null); }} aria-label="New lead status">
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
          </Select>
          <Btn variant="outline" size="sm" className="mt-2 w-full" onClick={() => setMobilePicker(null)}>Cancel</Btn>
        </div>
      )}
    </div>
  );
};
