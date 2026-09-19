// =============================================================================
// BRANIFY WHATSAPP CRM — server-side activity logging (existing activity_log)
// -----------------------------------------------------------------------------
// Same table the admin Activity Log page reads. Never logs tokens or secrets.
// =============================================================================
import { sbInsert } from './sb';

export async function logActivityServer(action: string, targetType: string, targetId: string, meta: Record<string, unknown> = {}, userEmail = 'whatsapp-crm'): Promise<void> {
  try {
    await sbInsert('activity_log', {
      user_email: userEmail,
      action,
      target_type: targetType,
      target_id: String(targetId || ''),
      meta,
    });
  } catch {
    // Logging must never break the main flow.
  }
}
