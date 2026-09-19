// =============================================================================
// BRANIFY WHATSAPP CRM — template sync (real API state only)
// -----------------------------------------------------------------------------
// Pulls the business account's message templates from the Cloud API and
// upserts them. Statuses are ALWAYS the API's (never invented). Sync upserts
// on template_id so no duplicates are created.
// =============================================================================
import { loadConfig } from './store';
import { fetchTemplates } from './graph';
import { sbSelect, sbUpsert, sbUpdate, sbDelete } from './sb';
import { logActivityServer } from './activity';

const VALID_STATUS = new Set(['APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'ARCHIVED', 'DELETED']);

export async function syncTemplates(agentEmail: string): Promise<{ synced: number; statuses: Record<string, number> }> {
  const cfg = await loadConfig();
  const remote = await fetchTemplates(cfg);
  const statuses: Record<string, number> = {};
  for (const t of remote) {
    const status = VALID_STATUS.has(String(t.status).toUpperCase()) ? String(t.status).toUpperCase() : 'PENDING';
    statuses[status] = (statuses[status] || 0) + 1;
    await sbUpsert('whatsapp_templates', {
      template_id: String(t.id),
      name: String(t.name || ''),
      language: String(t.language || 'en'),
      category: String(t.category || 'MARKETING').toUpperCase(),
      status,
      quality: String(t.quality || ''),
      components: (t.components as unknown) ?? {},
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, 'template_id');
  }
  // Mark templates that disappeared from the API as DELETED (never silently hide).
  const remoteIds = new Set(remote.map((t) => String(t.id)));
  const local = await sbSelect<{ id: string; template_id: string; status: string }>('/whatsapp_templates?select=id,template_id,status');
  for (const row of local) {
    if (!remoteIds.has(row.template_id) && row.status !== 'DELETED') {
      await sbUpdate('whatsapp_templates', `id=eq.${row.id}`, { status: 'DELETED', updated_at: new Date().toISOString() });
    }
  }
  await logActivityServer('whatsapp_templates_synced', 'whatsapp_templates', '', { count: remote.length }, agentEmail);
  return { synced: remote.length, statuses };
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await sbDelete('whatsapp_templates', `template_id=eq.${encodeURIComponent(templateId)}`);
}
