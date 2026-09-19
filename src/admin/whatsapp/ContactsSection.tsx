// =============================================================================
// BRANIFY WHATSAPP CRM — Contacts (WhatsApp number = primary matching key)
// Name/number/email/company/tags/lead status/assigned agent/source/last
// contact/created + search + edit + create (no duplicates — unique wa_id).
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Badge, Btn, EmptyState, Field, Input, LEAD_STATUS_TONE, Modal, ChipsInput, Select, useToast } from '../ui';
import { DataTable } from '../ui/DataTable';
import type { Column } from '../ui/DataTable';
import * as wa from './waClient';
import type { WaContact } from './waTypes';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_SOURCES } from './waTypes';

export const ContactsSection: React.FC = () => {
  const { push } = useToast();
  const [rows, setRows] = useState<WaContact[] | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<WaContact | null>(null);
  const [creating, setCreating] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');

  const load = () => { setRows(null); wa.listContacts().then(setRows).catch((e) => { setRows([]); push('error', e.message || 'Could not load contacts.'); }); };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows || [];
    return (rows || []).filter((r) =>
      [r.name, r.wa_id, r.email, r.company, r.assigned_to, r.source, r.lead_status, (r.tags || []).join(' ')]
        .join(' ').toLowerCase().includes(q));
  }, [rows, search]);

  const columns: Column<WaContact>[] = [
    { key: 'name', label: 'Name', sortable: true, render: (r) => (
      <div>
        <p className="font-bold text-[#111827]">{r.name || '—'}</p>
        <p className="text-[10.5px] text-[#7E8DA6]">+{r.wa_id}</p>
      </div>
    ) },
    { key: 'email', label: 'Email', hideOnMobile: true, render: (r) => r.email || '—' },
    { key: 'company', label: 'Company', hideOnMobile: true, render: (r) => r.company || '—' },
    { key: 'lead_status', label: 'Lead status', sortable: true, render: (r) => <Badge tone={LEAD_STATUS_TONE[r.lead_status] || 'zinc'}>{LEAD_STATUS_LABELS[r.lead_status]}</Badge> },
    { key: 'tags', label: 'Tags', hideOnMobile: true, render: (r) => (
      <div className="flex flex-wrap gap-1">{(r.tags || []).slice(0, 3).map((t) => <Badge key={t} tone="zinc">{t}</Badge>)}{(r.tags || []).length > 3 && <span className="text-[10px] text-[#7E8DA6]">+{r.tags.length - 3}</span>}</div>
    ) },
    { key: 'assigned_to', label: 'Agent', hideOnMobile: true, render: (r) => r.assigned_to ? r.assigned_to.split('@')[0] : '—' },
    { key: 'source', label: 'Source', hideOnMobile: true },
    { key: 'opt_out', label: 'Opt-out', render: (r) => r.opt_out ? <Badge tone="red">Opted out</Badge> : <Badge tone="green">Subscribed</Badge> },
    { key: 'last_message_at', label: 'Last contact', sortable: true, hideOnMobile: true, render: (r) => (r.last_message_at ? new Date(r.last_message_at).toLocaleString() : '—') },
    { key: 'created_at', label: 'Created', sortable: true, hideOnMobile: true, render: (r) => new Date(r.created_at).toLocaleDateString() },
  ];

  const createContact = async () => {
    const digits = newNumber.replace(/[^\d]/g, '');
    if (digits.length < 8) { push('error', 'Enter a full WhatsApp number in international format, e.g. 923321029333.'); return; }
    try {
      await wa.createContact({ wa_id: digits, name: newName.trim() });
      push('success', 'Contact created.');
      setCreating(false); setNewNumber(''); setNewName('');
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not create the contact.';
      push('error', /duplicate|unique/i.test(msg) ? 'A contact with this WhatsApp number already exists.' : msg);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <DataTable<WaContact>
        columns={columns}
        rows={filtered}
        loading={rows === null}
        total={filtered.length}
        page={1}
        pageSize={Math.max(1, filtered.length)}
        onPageChange={() => { /* full list, client-filtered */ }}
        onRowClick={(r) => setEditing(r)}
        emptyTitle="No contacts yet"
        emptyHint="Contacts appear automatically when someone messages your WhatsApp number, or create one now."
        emptyAction={<Btn variant="gold" size="sm" onClick={() => setCreating(true)}><Plus size={13} /> New contact</Btn>}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email, company, tag…" className="h-9 max-w-xs text-xs" aria-label="Search contacts" />
            <Btn variant="gold" size="sm" onClick={() => setCreating(true)}><Plus size={13} /> New contact</Btn>
            <Btn variant="ghost" size="sm" onClick={load} aria-label="Refresh"><RefreshCw size={13} /></Btn>
          </div>
        }
      />

      {creating && (
        <Modal open onClose={() => setCreating(false)} title="New WhatsApp contact" className="max-w-md">
          <div className="flex flex-col gap-3">
            <Field label="WhatsApp number" hint="International format, digits only — this is the matching key (no duplicates).">
              <Input value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="923321029333" className="font-mono text-xs" />
            </Field>
            <Field label="Name (optional)"><Input value={newName} onChange={(e) => setNewName(e.target.value)} className="text-xs" /></Field>
            <div className="flex justify-end gap-2">
              <Btn variant="outline" size="sm" onClick={() => setCreating(false)}>Cancel</Btn>
              <Btn variant="gold" size="sm" onClick={() => void createContact()}>Create</Btn>
            </div>
          </div>
        </Modal>
      )}

      {editing && <EditContactModal contact={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
};

// ==============================================================================
const EditContactModal: React.FC<{ contact: WaContact; onClose: () => void; onSaved: () => void }> = ({ contact, onClose, onSaved }) => {
  const { push } = useToast();
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email);
  const [company, setCompany] = useState(contact.company);
  const [tags, setTags] = useState<string[]>(contact.tags || []);
  const [leadStatus, setLeadStatus] = useState(contact.lead_status);
  const [assigned, setAssigned] = useState(contact.assigned_to);
  const [source, setSource] = useState(contact.source);
  const [optOut, setOptOut] = useState(contact.opt_out);
  const [agents, setAgents] = useState<Array<{ email: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { wa.listAgents().then(setAgents).catch(() => setAgents([])); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await wa.updateContact(contact.id, {
        name, email, company, tags, lead_status: leadStatus, assigned_to: assigned, source, opt_out: optOut,
      });
      push('success', 'Contact updated.');
      onSaved();
      onClose();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not update the contact.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Contact — +${contact.wa_id}`} className="max-w-md">
      <div className="flex flex-col gap-2.5">
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} className="text-xs" /></Field>
        <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} className="text-xs" /></Field>
        <Field label="Company"><Input value={company} onChange={(e) => setCompany(e.target.value)} className="text-xs" /></Field>
        <Field label="Lead status">
          <Select value={leadStatus} onChange={(e) => setLeadStatus(e.target.value as typeof leadStatus)} className="text-xs" aria-label="Lead status">
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
          </Select>
        </Field>
        <Field label="Assigned agent">
          <Select value={assigned} onChange={(e) => setAssigned(e.target.value)} className="text-xs" aria-label="Assigned agent">
            <option value="">Unassigned</option>
            {agents.map((a) => <option key={a.email} value={a.email}>{a.name || a.email}</option>)}
          </Select>
        </Field>
        <Field label="Source" hint="Only tracked where known — never invented.">
          <Select value={source} onChange={(e) => setSource(e.target.value)} className="text-xs" aria-label="Source">
            {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Tags"><ChipsInput value={tags} onChange={setTags} placeholder="Add tag" /></Field>
        <label className="flex items-center gap-2 text-xs font-semibold text-[#334155]">
          <input type="checkbox" checked={optOut} onChange={(e) => setOptOut(e.target.checked)} className="h-4 w-4 accent-[#C9A45C]" />
          Marketing opt-out — promotional automations must respect this
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <Btn variant="outline" size="sm" onClick={onClose}>Cancel</Btn>
          <Btn variant="gold" size="sm" onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
        </div>
      </div>
    </Modal>
  );
};
