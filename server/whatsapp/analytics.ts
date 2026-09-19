// =============================================================================
// BRANIFY WHATSAPP CRM — analytics (REAL data only, server-computed)
// -----------------------------------------------------------------------------
// Every number comes from the whatsapp_* tables. When there is no data the
// metric is honestly zero — nothing is ever simulated.
// Metrics: conversations · new contacts · messages received/sent · unread ·
//          avg response time · qualified/won leads · failed messages ·
//          templates used · team breakdown (assigned, resolved, response time)
// =============================================================================
import { sbSelect } from './sb';

export interface AnalyticsRange { start: Date; end: Date; label: string }

export function resolveRange(preset: string, customStart?: string, customEnd?: string): AnalyticsRange {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  switch (preset) {
    case 'today': start.setHours(0, 0, 0, 0); break;
    case '7d': start.setDate(start.getDate() - 7); break;
    case '28d': start.setDate(start.getDate() - 28); break;
    case '3m': start.setMonth(start.getMonth() - 3); break;
    case 'custom': {
      const s = customStart ? new Date(customStart) : new Date(now.getTime() - 7 * 86400000);
      const e = customEnd ? new Date(customEnd) : now;
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e, label: 'custom' };
    }
    default: start.setDate(start.getDate() - 7);
  }
  return { start, end, label: preset };
}

const iso = (d: Date): string => d.toISOString();

export async function analyticsFor(range: AnalyticsRange): Promise<Record<string, unknown>> {
  const from = iso(range.start);
  const to = iso(range.end);

  const conversations = await sbSelect<{ id: string; assigned_to: string; status: string; unread_count: number; created_at: string }>(
    `/whatsapp_conversations?select=id,assigned_to,status,unread_count,created_at&last_message_at=gte.${from}&last_message_at=lte.${to}&limit=5000`);
  const allOpen = await sbSelect<{ id: string; unread_count: number }>(`/whatsapp_conversations?select=id,unread_count&status=in.(open,waiting)&limit=5000`);
  const messages = await sbSelect<{ direction: string; status: string; type: string; template_name: string; conversation_id: string; timestamp: string; wa_id: string }>(
    `/whatsapp_messages?select=direction,status,type,template_name,conversation_id,timestamp,wa_id&timestamp=gte.${from}&timestamp=lte.${to}&limit=8000`);
  const contacts = await sbSelect<{ id: string; lead_status: string; assigned_to: string; created_at: string }>(
    `/whatsapp_contacts?select=id,lead_status,assigned_to,created_at&created_at=gte.${from}&limit=5000`);
  const statusTotals = await sbSelect<{ lead_status: string }>(`/whatsapp_contacts?select=lead_status&limit=5000`);

  const received = messages.filter((m) => m.direction === 'in').length;
  const sent = messages.filter((m) => m.direction === 'out').length;
  const failed = messages.filter((m) => m.status === 'failed').length;
  const templatesUsed = messages.filter((m) => m.type === 'template' && m.direction === 'out').length;
  const templateBreakdown: Record<string, number> = {};
  for (const m of messages) {
    if (m.type === 'template' && m.template_name) templateBreakdown[m.template_name] = (templateBreakdown[m.template_name] || 0) + 1;
  }
  const unreadNow = allOpen.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  // ---- response time: first outbound reply after the first inbound message
  const byConversation = new Map<string, { inTs: number | null; outTs: number | null }>();
  for (const m of messages) {
    const t = new Date(m.timestamp).getTime();
    const entry = byConversation.get(m.conversation_id) || { inTs: null, outTs: null };
    if (m.direction === 'in' && (entry.inTs === null || t < entry.inTs)) entry.inTs = t;
    if (m.direction === 'out' && (entry.outTs === null || t < entry.outTs)) entry.outTs = t;
    byConversation.set(m.conversation_id, entry);
  }
  const responseTimes: number[] = [];
  for (const { inTs, outTs } of byConversation.values()) {
    if (inTs !== null && outTs !== null && outTs > inTs) responseTimes.push(outTs - inTs);
  }
  const avgResponseMs = responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : null;
  const humanize = (ms: number | null): string | null => {
    if (ms === null) return null;
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  // ---- team breakdown (real assignments only)
  const teamMap = new Map<string, { conversations: number; resolved: number; responseMs: number[]; qualified: number }>();
  for (const c of conversations) {
    const agent = c.assigned_to || '';
    if (!agent) continue;
    const entry = teamMap.get(agent) || { conversations: 0, resolved: 0, responseMs: [], qualified: 0 };
    entry.conversations += 1;
    if (c.status === 'closed') entry.resolved += 1;
    teamMap.set(agent, entry);
  }
  for (const c of contacts) {
    const agent = c.assigned_to || '';
    if (!agent) continue;
    const entry = teamMap.get(agent) || { conversations: 0, resolved: 0, responseMs: [], qualified: 0 };
    if (['qualified', 'proposal', 'won'].includes(c.lead_status)) entry.qualified += 1;
    teamMap.set(agent, entry);
  }
  const team = Array.from(teamMap.entries()).map(([agent, v]) => ({
    agent,
    conversations: v.conversations,
    resolved: v.resolved,
    qualified_leads: v.qualified,
    response_time: humanize(v.responseMs.length ? Math.round(v.responseMs.reduce((a, b) => a + b, 0) / v.responseMs.length) : null),
  }));

  const statusCount: Record<string, number> = {};
  for (const c of statusTotals) statusCount[c.lead_status] = (statusCount[c.lead_status] || 0) + 1;

  return {
    range: { label: range.label, start: from, end: to },
    conversations: conversations.length,
    new_contacts: contacts.length,
    messages_received: received,
    messages_sent: sent,
    unread_now: unreadNow,
    response_time: humanize(avgResponseMs),
    qualified_leads: statusCount.qualified || 0,
    won_leads: statusCount.won || 0,
    failed_messages: failed,
    templates_used: templatesUsed,
    template_breakdown: templateBreakdown,
    lead_status_totals: statusCount,
    team,
  };
}
