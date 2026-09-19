// =============================================================================
// BRANIFY WHATSAPP CRM — Automations (internal actions only, never promo sends)
// Triggers: new conversation · new lead · assigned · lead status changed ·
//           customer inactive. Actions: create lead · update lead · add tag ·
//           assign agent · AI summary note · follow-up reminder.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { Play, Plus, Trash2 } from 'lucide-react';
import { Badge, Btn, Field, Input, Modal, Select, Toggle, useToast, cx } from '../ui';
import * as wa from './waClient';
import type { WaAutomation } from './waTypes';
import { TRIGGER_LABELS, ACTION_LABELS, LEAD_STATUSES, LEAD_STATUS_LABELS } from './waTypes';

const BLANK: WaAutomation = {
  id: '', name: '', trigger: 'new_conversation',
  actions: [{ type: 'add_tag', params: { tag: 'Follow-up' } }],
  enabled: true, run_count: 0, last_run_at: null,
};

export const AutomationsSection: React.FC = () => {
  const { push } = useToast();
  const [rules, setRules] = useState<WaAutomation[] | null>(null);
  const [editing, setEditing] = useState<WaAutomation | null>(null);
  const [running, setRunning] = useState(false);

  const load = () => { setRules(null); wa.listAutomations().then(setRules).catch((e) => { setRules([]); push('error', e.message || 'Could not load automations.'); }); };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runInactive = async () => {
    setRunning(true);
    try {
      const { checked, affected } = await wa.runInactiveAutomations();
      push('success', `Checked ${checked} inactive conversations — ${affected} automation run(s) executed.`);
      load();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Run failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn variant="gold" size="sm" onClick={() => setEditing({ ...BLANK })}><Plus size={13} /> New automation</Btn>
        <Btn variant="outline" size="sm" onClick={() => void runInactive()} disabled={running}><Play size={12} /> {running ? 'Running…' : 'Run “customer inactive” now'}</Btn>
      </div>

      <p className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[10.5px] leading-relaxed text-[#5B6B82]">
        Automations perform <b>internal CRM actions only</b> — they never send promotional WhatsApp messages. Marketing after an opt-out is blocked at the send layer.
      </p>

      {rules === null && <p className="text-xs text-[#7E8DA6]">Loading…</p>}
      {rules !== null && rules.length === 0 && (
        <p className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 text-center text-xs text-[#7E8DA6]">No automations yet — create one to route new conversations automatically.</p>
      )}

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {(rules || []).map((r) => (
          <div key={r.id} className={cx('rounded-xl border p-3', r.enabled ? 'border-[#C9A45C]/30 bg-[#C9A45C]/[0.05]' : 'border-white/[0.07] bg-white/[0.02]')}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold text-[#111827]">{r.name}</p>
                <p className="mt-0.5 text-[10.5px] text-[#5B6B82]">When: {TRIGGER_LABELS[r.trigger]}</p>
              </div>
              <Toggle checked={r.enabled} label="" onChange={(v) => { void wa.saveAutomation({ ...r, enabled: v }).then(load).catch((e) => push('error', e.message)); }} />
            </div>
            <ul className="mt-1.5 space-y-0.5">
              {(r.actions || []).map((a, i) => <li key={i} className="text-[10.5px] text-[#334155]">→ {ACTION_LABELS[a.type] || a.type}{a.params?.tag ? `: ${String(a.params.tag)}` : ''}{a.params?.status ? `: ${String(a.params.status)}` : ''}{a.params?.agent ? `: ${String(a.params.agent)}` : ''}{a.params?.days !== undefined ? ` (+${String(a.params.days)}d)` : ''}</li>)}
            </ul>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[9.5px] text-[#94A3B8]">Ran {r.run_count}×{r.last_run_at ? ` · last ${new Date(r.last_run_at).toLocaleString()}` : ''}</span>
              <div className="flex gap-1.5">
                <Btn variant="outline" size="sm" onClick={() => setEditing(r)}>Edit</Btn>
                <Btn variant="ghost" size="sm" className="text-red-600 hover:bg-red-500/10" onClick={() => { void wa.deleteAutomation(r.id).then(load).catch((e) => push('error', e.message)); }} aria-label="Delete automation"><Trash2 size={12} /></Btn>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && <EditRuleModal rule={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
};

// ==============================================================================
const EditRuleModal: React.FC<{ rule: WaAutomation; onClose: () => void; onSaved: () => void }> = ({ rule, onClose, onSaved }) => {
  const { push } = useToast();
  const [name, setName] = useState(rule.name);
  const [trigger, setTrigger] = useState(rule.trigger);
  const [actions, setActions] = useState<Array<{ type: string; params?: Record<string, unknown> }>>(rule.actions?.length ? rule.actions : [{ type: 'add_tag', params: { tag: '' } }]);
  const [agents, setAgents] = useState<Array<{ email: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { wa.listAgents().then(setAgents).catch(() => setAgents([])); }, []);

  const setParam = (i: number, key: string, value: unknown) => {
    setActions((prev) => prev.map((a, j) => (j === i ? { ...a, params: { ...(a.params || {}), [key]: value } } : a)));
  };

  const save = async () => {
    if (!name.trim()) { push('error', 'Give the automation a name.'); return; }
    setSaving(true);
    try {
      await wa.saveAutomation({ ...rule, name: name.trim(), trigger, actions: actions.filter((a) => a.type) });
      push('success', 'Automation saved.');
      onSaved();
      onClose();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not save the automation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={rule.id ? 'Edit automation' : 'New automation'} className="max-w-lg">
      <div className="flex flex-col gap-2.5">
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} className="text-xs" placeholder="e.g. Tag new conversations" /></Field>
        <Field label="Trigger">
          <Select value={trigger} onChange={(e) => setTrigger(e.target.value as WaAutomation['trigger'])} className="text-xs" aria-label="Trigger">
            {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7E8DA6]">Actions</p>
          {actions.map((a, i) => (
            <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5">
              <div className="flex gap-2">
                <Select value={a.type} onChange={(e) => setActions((prev) => prev.map((x, j) => (j === i ? { type: e.target.value, params: {} } : x)))} className="h-8 flex-1 text-xs" aria-label={`Action ${i + 1}`}>
                  {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
                {actions.length > 1 && (
                  <Btn variant="ghost" size="sm" className="text-red-600" onClick={() => setActions((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove action"><Trash2 size={12} /></Btn>
                )}
              </div>
              {a.type === 'update_lead' && (
                <Select value={String(a.params?.status || 'qualified')} onChange={(e) => setParam(i, 'status', e.target.value)} className="mt-1.5 h-8 text-xs" aria-label="New status">
                  {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
                </Select>
              )}
              {a.type === 'add_tag' && <Input value={String(a.params?.tag || '')} onChange={(e) => setParam(i, 'tag', e.target.value)} className="mt-1.5 h-8 text-xs" placeholder="Tag, e.g. Hot Lead" aria-label="Tag" />}
              {a.type === 'assign_agent' && (
                <Select value={String(a.params?.agent || '')} onChange={(e) => setParam(i, 'agent', e.target.value)} className="mt-1.5 h-8 text-xs" aria-label="Agent">
                  <option value="">Select team member…</option>
                  {agents.map((ag) => <option key={ag.email} value={ag.email}>{ag.name || ag.email}</option>)}
                </Select>
              )}
              {a.type === 'create_followup' && <Input type="number" min={0} value={String(a.params?.days ?? 1)} onChange={(e) => setParam(i, 'days', Number(e.target.value))} className="mt-1.5 h-8 text-xs" placeholder="Days ahead" aria-label="Days ahead" />}
            </div>
          ))}
          <Btn variant="outline" size="sm" onClick={() => setActions((prev) => [...prev, { type: 'add_tag', params: { tag: '' } }])}><Plus size={12} /> Add action</Btn>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Btn variant="outline" size="sm" onClick={onClose}>Cancel</Btn>
          <Btn variant="gold" size="sm" onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save automation'}</Btn>
        </div>
      </div>
    </Modal>
  );
};
