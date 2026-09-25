// =============================================================================
// BRANIFY WHATSAPP CRM — customer details panel (spec §23) + conversation
// actions (pin/mute/status, §2/§20). Reuses the existing CRM integration:
// contacts fields, lead status, tags, assignment, INTERNAL notes (never sent),
// quick actions, AI assistant, follow-ups.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Clock, Mail, Pin, PinOff, Plus, Sparkles, Tag } from 'lucide-react';
import { Badge, Btn, ChipsInput, Field, Input, Select, LoadingBlock, Textarea, useToast, cx } from '../../ui';
import { useAdminAuth } from '../../lib/auth';
import * as wa from '../waClient';
import type { WaContact, WaConversation, WaNote } from '../waTypes';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, CONVERSATION_STATUSES, CONVERSATION_STATUS_LABELS } from '../waTypes';

const listTime = (iso: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const ProfilePane: React.FC<{
  className?: string;
  contact: WaContact;
  conversation: WaConversation;
  onMutate: () => void;
}> = ({ className, contact, conversation, onMutate }) => {
  const { user } = useAdminAuth();
  const { push } = useToast();
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email);
  const [company, setCompany] = useState(contact.company);
  const [tags, setTags] = useState<string[]>(contact.tags || []);
  const [leadStatus, setLeadStatus] = useState(contact.lead_status);
  const [assigned, setAssigned] = useState(contact.assigned_to);
  const [convStatus, setConvStatus] = useState(conversation.status);
  const [agents, setAgents] = useState<Array<{ email: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<WaNote[] | null>(null);
  const [noteText, setNoteText] = useState('');
  const [aiBusy, setAiBusy] = useState('');
  const [lastAiAction, setLastAiAction] = useState('summarize');
  const [aiOutput, setAiOutput] = useState<{ title: string; text: string } | null>(null);

  useEffect(() => { setName(contact.name); setEmail(contact.email); setCompany(contact.company); setTags(contact.tags || []); setLeadStatus(contact.lead_status); setAssigned(contact.assigned_to); setConvStatus(conversation.status); }, [contact, conversation.status]);
  useEffect(() => { wa.listAgents().then(setAgents).catch(() => setAgents([])); }, []);
  useEffect(() => { setNotes(null); wa.listNotes(contact.id).then(setNotes).catch(() => setNotes([])); }, [contact.id]);

  const save = async () => {
    setSaving(true);
    try {
      const changed: Partial<WaContact> = {};
      if (name !== contact.name) changed.name = name;
      if (email !== contact.email) changed.email = email;
      if (company !== contact.company) changed.company = company;
      if (JSON.stringify(tags) !== JSON.stringify(contact.tags)) changed.tags = tags;
      if (leadStatus !== contact.lead_status) changed.lead_status = leadStatus;
      if (assigned !== contact.assigned_to) changed.assigned_to = assigned;
      if (Object.keys(changed).length) {
        await wa.updateContact(contact.id, changed);
        if (changed.assigned_to !== undefined) await wa.updateConversation(conversation.id, { assigned_to: assigned });
        push('success', 'Contact updated.');
      }
      if (convStatus !== conversation.status) {
        await wa.updateConversation(conversation.id, { status: convStatus });
        push('success', `Conversation marked ${CONVERSATION_STATUS_LABELS[convStatus].toLowerCase()}.`);
      }
      onMutate();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not update.');
    } finally {
      setSaving(false);
    }
  };

  const patchConversation = async (patch: Partial<WaConversation>, okMsg: string) => {
    try {
      await wa.updateConversation(conversation.id, patch);
      push('success', okMsg);
      onMutate();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not update the conversation.');
    }
  };

  const addNote = async () => {
    const body = noteText.trim();
    if (!body) return;
    try {
      await wa.createNote(contact.id, body, user.email);
      setNoteText('');
      setNotes(await wa.listNotes(contact.id));
      push('success', 'Internal note saved — never sent to the customer.');
      onMutate();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not save the note.');
    }
  };

  const createLead = async () => {
    try {
      const { supabase } = await import('../../../lib/supabase');
      const { error } = await supabase.from('inquiries').insert({
        name: contact.name || `WhatsApp +${contact.wa_id}`,
        email: contact.email || 'not-provided@whatsapp.local',
        company: contact.company || 'Not specified',
        services: [], budget: '', timeline: '',
        details: `Lead created from WhatsApp conversation (+${contact.wa_id}) in the WhatsApp CRM.`,
        status: 'new',
      });
      if (error) throw error;
      push('success', 'Lead created in the existing Leads CRM.');
      onMutate();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not create the lead.');
    }
  };

  const scheduleFollowup = async (preset: string) => {
    const base = new Date();
    if (preset === 'today') base.setHours(base.getHours() + 4);
    else if (preset === 'tomorrow') base.setDate(base.getDate() + 1);
    else if (preset === '3d') base.setDate(base.getDate() + 3);
    else base.setDate(base.getDate() + 7);
    await patchConversation({ followup_due_at: base.toISOString(), followup_note: `Follow up with ${contact.name || `+${contact.wa_id}`}` }, `Follow-up due ${base.toLocaleString()}`);
  };

  const runAi = async (action: string, title: string, extra: Record<string, unknown> = {}) => {
    setAiBusy(action);
    setLastAiAction(action);
    setAiOutput(null);
    try {
      const res = await wa.aiAction({ action, conversation_id: conversation.id, ...extra });
      const data = res.result as Record<string, unknown>;
      if (action === 'extract') {
        const fields = (data.fields || {}) as Record<string, string | null>;
        setAiOutput({ title, text: Object.entries(fields).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v ?? '— not stated —'}`).join('\n') });
      } else if (action === 'classify') {
        setAiOutput({ title, text: String(data.category || 'Other') });
      } else {
        setAiOutput({ title, text: String(data.text || '') });
      }
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'AI request failed.');
    } finally {
      setAiBusy('');
    }
  };

  return (
    <aside className={cx('adm-scroll flex max-h-[660px] min-h-0 flex-col gap-3 overflow-y-auto rounded-xl border border-white/[0.07] bg-white/[0.02] p-3', className)} aria-label="Customer details">
      {/* header + conversation actions */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7E8DA6]">Customer</p>
        <p className="mt-0.5 text-sm font-extrabold text-[#111827]">{contact.name || 'Unnamed'}</p>
        <p className="text-[11px] text-[#5B6B82]">+{contact.wa_id}</p>
        {contact.opt_out && <Badge tone="red" className="mt-1">Marketing opt-out</Badge>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Btn variant={conversation.pinned ? 'gold' : 'outline'} size="sm" onClick={() => void patchConversation({ pinned: !conversation.pinned }, conversation.pinned ? 'Unpinned.' : 'Pinned to top.')}>
            {conversation.pinned ? <PinOff size={12} /> : <Pin size={12} />} {conversation.pinned ? 'Unpin' : 'Pin'}
          </Btn>
          <Btn variant={conversation.muted ? 'gold' : 'outline'} size="sm" onClick={() => void patchConversation({ muted: !conversation.muted }, conversation.muted ? 'Unmuted.' : 'Muted — badge greyed.')}>
            {conversation.muted ? <Bell size={12} /> : <BellOff size={12} />} {conversation.muted ? 'Unmute' : 'Mute'}
          </Btn>
          <a href={`https://wa.me/${contact.wa_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-[#0F172A]/10 px-2.5 py-1.5 text-[11px] font-bold text-[#334155] hover:border-[#C9A45C]/40">
            <Mail size={12} /> Contact
          </a>
        </div>
        <p className="mt-2 text-[10px] text-[#7E8DA6]">Last inbound {listTime(conversation.last_in_at)} · last outbound {listTime(conversation.last_out_at)}</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" /></Field>
        <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 text-xs" placeholder="—" /></Field>
        <Field label="Company"><Input value={company} onChange={(e) => setCompany(e.target.value)} className="h-8 text-xs" placeholder="—" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Lead status">
            <Select value={leadStatus} onChange={(e) => setLeadStatus(e.target.value as typeof leadStatus)} className="h-8 text-xs" aria-label="Lead status">
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
            </Select>
          </Field>
          <Field label="Conversation">
            <Select value={convStatus} onChange={(e) => setConvStatus(e.target.value as typeof convStatus)} className="h-8 text-xs" aria-label="Conversation status">
              {CONVERSATION_STATUSES.map((s) => <option key={s} value={s}>{CONVERSATION_STATUS_LABELS[s]}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Assigned to">
          <Select value={assigned} onChange={(e) => setAssigned(e.target.value)} className="h-8 text-xs" aria-label="Assigned agent">
            <option value="">Unassigned</option>
            {agents.map((a) => <option key={a.email} value={a.email}>{a.name || a.email}</option>)}
          </Select>
        </Field>
        <Field label="Tags" hint="Website · Ecommerce · AI · SEO · Branding · Hot Lead …">
          <ChipsInput value={tags} onChange={setTags} placeholder="Add tag" />
        </Field>
        <p className="text-[10px] text-[#7E8DA6]">Source: {contact.source || 'WhatsApp'} · Created {new Date(contact.created_at).toLocaleDateString()}</p>
        <Btn variant="gold" size="sm" onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Btn>
      </div>

      <div className="border-t border-white/[0.06] pt-2">
        <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#7E8DA6]">Quick actions</p>
        <div className="flex flex-wrap gap-1.5">
          <Btn variant="outline" size="sm" onClick={() => void createLead()}><Plus size={12} /> Create Lead</Btn>
          {contact.customer_user_id && (
            <Btn variant="outline" size="sm" onClick={() => { window.history.pushState({}, '', '/admin/customers'); window.dispatchEvent(new Event('branify:admin-nav')); }}><Mail size={12} /> Open Customer</Btn>
          )}
          <Btn variant="outline" size="sm" onClick={() => { if (!tags.includes('Hot Lead')) { setTags([...tags, 'Hot Lead']); push('info', 'Tag added — press Save changes to persist.'); } }}><Tag size={12} /> Add Hot Lead</Btn>
        </div>
      </div>

      <div className="border-t border-white/[0.06] pt-2">
        <p className="mb-1.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#7E8DA6]"><Sparkles size={11} /> AI assistant (internal)</p>
        <div className="flex flex-wrap gap-1.5">
          <Btn variant="outline" size="sm" onClick={() => void runAi('summarize', 'Summary')} disabled={Boolean(aiBusy)}>{aiBusy === 'summarize' ? '…' : 'Summarize'}</Btn>
          <Btn variant="outline" size="sm" onClick={() => void runAi('extract', 'Lead information')} disabled={Boolean(aiBusy)}>{aiBusy === 'extract' ? '…' : 'Extract info'}</Btn>
          <Btn variant="outline" size="sm" onClick={() => void runAi('classify', 'Intent')} disabled={Boolean(aiBusy)}>{aiBusy === 'classify' ? '…' : 'Classify'}</Btn>
          <Btn variant="outline" size="sm" onClick={() => void runAi('followup', 'Follow-up reminder')} disabled={Boolean(aiBusy)}>{aiBusy === 'followup' ? '…' : 'Follow-up text'}</Btn>
        </div>
        {aiOutput && (
          <div className="mt-2 rounded-xl border border-[#C9A45C]/30 bg-[#C9A45C]/[0.07] p-2.5">
            <p className="text-[9.5px] font-black uppercase tracking-[0.16em] text-[#8F6B2D]">{aiOutput.title} — internal, review before use</p>
            <p className="mt-1 whitespace-pre-wrap text-[11px] text-[#334155]">{aiOutput.text}</p>
            <div className="mt-1.5 flex gap-1.5">
              <Btn variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(aiOutput.text).then(() => push('success', 'Copied.')); }}>Copy</Btn>
              <Btn variant="ghost" size="sm" onClick={() => { void runAi(lastAiAction, aiOutput.title); }}>Regenerate</Btn>
              <Btn variant="gold" size="sm" onClick={() => { void navigator.clipboard.writeText(aiOutput.text); void wa.createNote(contact.id, `[AI · ${aiOutput.title}]\n${aiOutput.text}`, user.email).then(() => { setNotes(null); wa.listNotes(contact.id).then(setNotes).catch(() => setNotes([])); push('success', 'Saved as an internal note.'); }); }} disabled={aiBusy !== ''}>Save as note</Btn>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] pt-2">
        <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-red-700">Internal notes — NEVER sent to the customer</p>
        {notes === null && <LoadingBlock label="Loading notes…" />}
        {notes !== null && notes.length === 0 && <p className="text-[10.5px] text-[#7E8DA6]">No internal notes yet.</p>}
        {notes?.map((n) => (
          <div key={n.id} className="mb-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-2">
            <p className="whitespace-pre-wrap text-[11px] text-[#334155]">{n.body}</p>
            <p className="mt-0.5 text-[9px] text-[#94A3B8]">{n.author_email} · {listTime(n.created_at)}</p>
          </div>
        ))}
        <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} placeholder="Add an internal note…" className="mt-1 text-xs" aria-label="New internal note" />
        <Btn variant="outline" size="sm" className="mt-1" onClick={() => void addNote()} disabled={!noteText.trim()}><Plus size={12} /> Add note</Btn>
      </div>

      {conversation.followup_due_at ? (
        <div className="rounded-lg border border-[#C9A45C]/30 bg-[#C9A45C]/[0.07] p-2">
          <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#8F6B2D]"><Clock size={11} /> Follow-up due {new Date(conversation.followup_due_at).toLocaleString()}</p>
          {conversation.followup_note && <p className="mt-0.5 text-[10.5px] text-[#5B6B82]">{conversation.followup_note}</p>}
          <Btn variant="ghost" size="sm" className="mt-1" onClick={() => void patchConversation({ followup_due_at: null, followup_note: '' }, 'Follow-up cleared.')}>Clear follow-up</Btn>
        </div>
      ) : (
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#7E8DA6]">Schedule follow-up (internal reminder — nothing auto-sends)</p>
          <div className="flex flex-wrap gap-1.5">
            {['today', 'tomorrow', '3d', 'week'].map((p) => (
              <Btn key={p} variant="outline" size="sm" onClick={() => void scheduleFollowup(p)}>
                {p === 'today' ? 'Today' : p === 'tomorrow' ? 'Tomorrow' : p === '3d' ? 'In 3 days' : 'Next week'}
              </Btn>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
