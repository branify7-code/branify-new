// =============================================================================
// BRANIFY WHATSAPP CRM — automation engine (internal actions only)
// -----------------------------------------------------------------------------
// Triggers: new_conversation · new_lead · conversation_assigned ·
//           lead_status_changed · customer_inactive
// Actions:  create_lead · update_lead · add_tag · assign_agent ·
//           ai_summary · create_followup
// Nothing here ever sends a promotional WhatsApp message automatically.
// =============================================================================
import { sbSelect, sbInsert, sbUpdate } from './sb';
import { logActivityServer } from './activity';

export type WaTrigger = 'new_conversation' | 'new_lead' | 'conversation_assigned' | 'lead_status_changed' | 'customer_inactive';

export interface AutomationAction {
  type: 'create_lead' | 'update_lead' | 'add_tag' | 'assign_agent' | 'ai_summary' | 'create_followup';
  params?: { status?: string; tag?: string; agent?: string; days?: number; note?: string };
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: WaTrigger;
  actions: AutomationAction[];
  enabled: boolean;
}

export async function listRules(trigger?: WaTrigger): Promise<AutomationRule[]> {
  const q = trigger ? `/whatsapp_automations?select=*&trigger=eq.${trigger}&enabled=eq.true` : '/whatsapp_automations?select=*&enabled=eq.true';
  return sbSelect<AutomationRule>(q);
}

/** Run every enabled rule for a trigger. Called from the webhook + admin "Run now". */
export async function fireAutomation(trigger: WaTrigger | null, ctx: { contactId: string; conversationId: string; waId: string }): Promise<number> {
  if (!trigger) return 0;
  let rules: AutomationRule[];
  try {
    rules = await listRules(trigger);
  } catch {
    return 0; // schema not ready — automations silently off
  }
  let ran = 0;
  for (const rule of rules) {
    try {
      for (const action of rule.actions || []) await applyAction(action, ctx);
      await sbUpdate('whatsapp_automations', `id=eq.${rule.id}`, {
        run_count: await bumpRuns(rule.id), last_run_at: new Date().toISOString(),
      });
      await logActivityServer('whatsapp_automation_triggered', 'whatsapp_automation', rule.id, { trigger, name: rule.name, wa_id: ctx.waId });
      ran += 1;
    } catch {
      // One broken rule must not block the others (or the webhook).
    }
  }
  return ran;
}

async function bumpRuns(id: string): Promise<number> {
  const rows = await sbSelect<{ run_count: number }>(`/whatsapp_automations?select=run_count&id=eq.${id}`);
  return (rows[0]?.run_count || 0) + 1;
}

async function applyAction(action: AutomationAction, ctx: { contactId: string; conversationId: string; waId: string }): Promise<void> {
  const contact = (await sbSelect<{ name: string; email: string; company: string; wa_id: string; tags: string[]; assigned_to: string }>(`/whatsapp_contacts?select=name,email,company,wa_id,tags,assigned_to&id=eq.${ctx.contactId}`))[0];
  if (!contact) return;
  const now = new Date().toISOString();
  switch (action.type) {
    case 'create_lead': {
      // Reuses the EXISTING inquiries table (BRANIFY Leads) — no parallel lead DB.
      const existing = await sbSelect<{ id: string }>(`/inquiries?select=id&email=eq.${encodeURIComponent(contact.email || 'not-provided@whatsapp.local')}&order=created_at.desc&limit=1`);
      if (existing.length) break; // avoid duplicate leads for the same contact
      await sbInsert('inquiries', {
        name: contact.name || `WhatsApp +${contact.wa_id}`,
        email: contact.email || 'not-provided@whatsapp.local',
        company: contact.company || 'Not specified',
        services: [],
        budget: '',
        timeline: '',
        details: `Lead created automatically from WhatsApp conversation (+${contact.wa_id}) by the WhatsApp CRM automations.`,
        status: 'new',
      });
      await logActivityServer('whatsapp_lead_created', 'whatsapp_contact', ctx.contactId, { wa_id: contact.wa_id });
      break;
    }
    case 'update_lead': {
      const status = action.params?.status;
      if (status && ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].includes(status)) {
        await sbUpdate('whatsapp_contacts', `id=eq.${ctx.contactId}`, { lead_status: status, updated_at: now });
      }
      break;
    }
    case 'add_tag': {
      const tag = (action.params?.tag || '').trim();
      if (tag && !contact.tags.includes(tag)) {
        await sbUpdate('whatsapp_contacts', `id=eq.${ctx.contactId}`, { tags: [...contact.tags, tag], updated_at: now });
      }
      break;
    }
    case 'assign_agent': {
      const agent = (action.params?.agent || '').trim();
      if (agent) {
        await sbUpdate('whatsapp_contacts', `id=eq.${ctx.contactId}`, { assigned_to: agent, updated_at: now });
        await sbUpdate('whatsapp_conversations', `id=eq.${ctx.conversationId}`, { assigned_to: agent, updated_at: now });
      }
      break;
    }
    case 'ai_summary': {
      // Performed lazily by the admin AI endpoint on next open — here we only
      // create the follow-up note placeholder so the trigger is visible.
      await sbInsert('whatsapp_notes', {
        contact_id: ctx.contactId,
        body: 'AI summary requested by automation — open the conversation and run “Summarize” (human review required).',
        author_email: 'automation',
      });
      break;
    }
    case 'create_followup': {
      const days = Math.max(0, Number(action.params?.days ?? 1) || 1);
      const due = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      await sbUpdate('whatsapp_conversations', `id=eq.${ctx.conversationId}`, {
        followup_due_at: due.toISOString(),
        followup_note: action.params?.note || 'Follow up with this customer',
        updated_at: now,
      });
      break;
    }
  }
}
