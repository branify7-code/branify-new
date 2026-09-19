// =============================================================================
// BRANIFY WHATSAPP CRM — AI assistant (internal support, human approval)
// -----------------------------------------------------------------------------
// Reuses the EXISTING BRANIFY AI provider system (resolveProvider/chatComplete
// from the admin AI writer — the same gemini provider already live on prod).
// Actions: summarize · extract · suggest · rewrite · translate · followup ·
//          classify
// HARD RULES enforced here:
//   · The AI never sends anything. Every action returns TEXT for a human to
//     review; the only write is an optional internal note (labelled) — never
//     an outbound message.
//   · Summaries/extractions may only use information present in the
//     conversation. Prompts forbid invention; extraction returns nulls.
// =============================================================================
import { resolveProvider, chatComplete } from '../admin-ai/blog-generate';
import { sbSelect, sbInsert } from './sb';
import { logActivityServer } from './activity';

export type AiAction = 'summarize' | 'extract' | 'suggest' | 'rewrite' | 'translate' | 'followup' | 'classify';

interface Msg { direction: 'in' | 'out'; type: string; body: string; template_name: string | null; timestamp: string; status: string }

const CATEGORIES = ['Website Development', 'Ecommerce', 'AI Solutions', 'SEO', 'Branding', 'Templates', 'Support', 'General Inquiry', 'Existing Client', 'Other'] as const;
const LEAD_FIELDS = ['name', 'company', 'email', 'phone', 'service', 'industry', 'project_type', 'urgency', 'requirements'] as const;

async function transcript(conversationId: string, max = 60): Promise<{ lines: string[]; waId: string; contactName: string }> {
  const conv = (await sbSelect<{ wa_id: string; contact_id: string }>(`/whatsapp_conversations?select=wa_id,contact_id&id=eq.${conversationId}`))[0];
  if (!conv) throw new Error('conversation not found');
  const rows = await sbSelect<Msg>(`/whatsapp_messages?select=direction,type,body,template_name,timestamp,status&conversation_id=eq.${conversationId}&order=timestamp.asc&limit=${max}`);
  const contact = (await sbSelect<{ name: string }>(`/whatsapp_contacts?select=name&id=eq.${conv.contact_id}`))[0];
  const lines = rows.map((m) => {
    const who = m.direction === 'in' ? 'Customer' : 'Agent';
    const kind = m.type === 'text' ? m.body : m.type === 'template' ? `[template ${m.template_name || ''}]` : `[${m.type} message]`;
    return `${who}: ${kind || '[empty]'}`;
  });
  return { lines, waId: conv.wa_id, contactName: contact?.name || '' };
}

function aiFail(e: unknown): never {
  const msg = e instanceof Error ? e.message : 'AI request failed';
  const err = new Error(msg) as Error & { statusCode?: number; code?: string };
  err.code = 'ai_failed';
  err.statusCode = 502;
  throw err;
}

async function complete(system: string, user: string, maxTokens = 900): Promise<string> {
  try {
    return (await chatComplete(resolveProvider(), [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ], 0.4, maxTokens)).trim();
  } catch (e) {
    aiFail(e);
  }
}

const BASE_RULES = 'You support the BRANIFY agency team inside their WhatsApp CRM. Use ONLY the information in the conversation. Never invent names, emails, prices, requirements or facts. Be concise and factual.';

export async function runAiAction(action: AiAction, conversationId: string, opts: { draft?: string; language?: string } = {}, agentEmail = ''): Promise<Record<string, unknown>> {
  const t = await transcript(conversationId);
  if (!t.lines.length) {
    const err = new Error('There are no messages in this conversation yet.') as Error & { statusCode?: number; code?: string };
    err.code = 'empty_conversation';
    err.statusCode = 400;
    throw err;
  }
  const convo = `Customer WhatsApp number: +${t.waId}${t.contactName ? ` (saved name: ${t.contactName})` : ''}\n\nConversation transcript:\n${t.lines.join('\n')}`;

  let result: Record<string, unknown>;
  switch (action) {
    case 'summarize': {
      const out = await complete(
        `${BASE_RULES} Produce an INTERNAL summary for the team in exactly this plain-text shape:\nCustomer wants:\n<one line or "Not stated">\n\nRequirements:\n<bullet list or "Not stated">\n\nUrgency:\n<High | Medium | Low | Not stated>\n\nNotes:\n<at most 2 short factual bullets>`,
        convo, 700);
      result = { text: out };
      break;
    }
    case 'extract': {
      const out = await complete(
        `${BASE_RULES} Extract lead information from the conversation. Return ONLY a JSON object with these keys, using null for anything not explicitly present in the conversation (never guess): ${LEAD_FIELDS.join(', ')}. urgency must be one of High|Medium|Low|null.`,
        convo, 700);
      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)) as Record<string, unknown>;
      } catch { parsed = null; }
      if (!parsed) {
        const err = new Error('The AI returned an unreadable extraction. Try again.') as Error & { statusCode?: number; code?: string };
        err.code = 'ai_failed';
        err.statusCode = 502;
        throw err;
      }
      const clean: Record<string, unknown> = {};
      for (const f of LEAD_FIELDS) clean[f] = parsed[f] ?? null;
      result = { fields: clean };
      break;
    }
    case 'suggest': {
      const out = await complete(
        `${BASE_RULES} Draft ONE short professional reply (max 120 words, plain text, no signature, no placeholders like [name]) from BRANIFY to the customer's last message. Match their language. Be helpful and concrete; ask at most one clarifying question if something essential is missing.`,
        convo, 500);
      result = { text: out, requires_approval: true };
      break;
    }
    case 'rewrite': {
      const draft = (opts.draft || '').trim();
      if (!draft) {
        const err = new Error('Write or select a draft first, then use Rewrite.') as Error & { statusCode?: number; code?: string };
        err.code = 'bad_request';
        err.statusCode = 400;
        throw err;
      }
      const out = await complete(
        `${BASE_RULES} Rewrite the AGENT'S draft reply below so it is clear, professional and friendly (max 120 words, plain text). Keep every factual claim exactly as written; fix tone and grammar only. Return the rewritten reply only.\n\nDraft:\n${draft}`,
        convo, 500);
      result = { text: out, requires_approval: true };
      break;
    }
    case 'translate': {
      const draft = (opts.draft || '').trim();
      if (!draft) {
        const err = new Error('Write the text to translate first.') as Error & { statusCode?: number; code?: string };
        err.code = 'bad_request';
        err.statusCode = 400;
        throw err;
      }
      const out = await complete(
        `${BASE_RULES} Translate the text below into ${opts.language || 'the customer\'s conversation language'}. Return the translation only, preserving meaning exactly.\n\nText:\n${draft}`,
        convo, 500);
      result = { text: out, requires_approval: true };
      break;
    }
    case 'followup': {
      const out = await complete(
        `${BASE_RULES} Write a short internal follow-up reminder for the team about this conversation: what to follow up on and why it matters (max 60 words, plain text). Internal only — never sent to the customer.`,
        convo, 300);
      result = { text: out };
      break;
    }
    case 'classify': {
      const out = await complete(
        `${BASE_RULES} Classify the customer's inquiry into exactly ONE of these BRANIFY categories: ${CATEGORIES.join(' | ')}. Return ONLY the category name.`,
        convo, 60);
      const category = CATEGORIES.find((c) => c.toLowerCase() === out.toLowerCase().trim()) || 'Other';
      result = { category };
      break;
    }
  }
  await logActivityServer(`whatsapp_ai_${action}`, 'whatsapp_conversation', conversationId, { action }, agentEmail);
  return result;
}

/** Persist an AI output as an INTERNAL NOTE (clearly labelled, never sendable). */
export async function saveAiNote(contactId: string, title: string, body: string, authorEmail: string): Promise<void> {
  await sbInsert('whatsapp_notes', {
    contact_id: contactId,
    body: `[AI · ${title}]\n${body}`,
    author_email: authorEmail || 'whatsapp-crm',
  });
}
