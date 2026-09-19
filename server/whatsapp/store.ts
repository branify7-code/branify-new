// =============================================================================
// BRANIFY WHATSAPP CRM — configuration store (server-only)
// -----------------------------------------------------------------------------
// Credentials live in the whatsapp_settings singleton table (service-role only,
// zero client policies) with optional WHATSAPP_* environment overrides for
// infrastructure-level configuration. The browser NEVER receives tokens —
// maskedConfig() reduces secrets to presence + last 4 characters.
// =============================================================================
import { sbSelectOne, sbUpsert, sbUpdate, isSchemaMissing } from './sb';

export interface WaConfig {
  wabaId: string;
  phoneNumberId: string;
  displayNumber: string;
  accessToken: string;
  verifyToken: string;
  appSecret: string;
  mockMode: boolean;
  /** where the active value came from */
  sources: Record<string, 'env' | 'database' | 'none'>;
}

interface DbSettingsRow {
  waba_id: string | null;
  phone_number_id: string | null;
  display_number: string | null;
  access_token: string | null;
  verify_token: string | null;
  app_secret: string | null;
  mock_mode: boolean | null;
}

const env = (k: string): string => (process.env[k] || '').trim();

/** Full config with env > database precedence. Never leaves the server raw. */
export async function loadConfig(): Promise<WaConfig> {
  let db: Partial<DbSettingsRow> = {};
  try {
    db = (await sbSelectOne<DbSettingsRow>('/whatsapp_settings?select=*')) || {};
  } catch (e) {
    if (!isSchemaMissing(e)) throw e;
    db = {};
  }
  const pick = (envKey: string, dbValue: string | null | undefined): { value: string; source: 'env' | 'database' | 'none' } => {
    const e = env(envKey);
    if (e) return { value: e, source: 'env' };
    if (dbValue && dbValue.trim()) return { value: dbValue.trim(), source: 'database' };
    return { value: '', source: 'none' };
  };
  const waba = pick('WHATSAPP_WABA_ID', db.waba_id);
  const phone = pick('WHATSAPP_PHONE_NUMBER_ID', db.phone_number_id);
  const token = pick('WHATSAPP_ACCESS_TOKEN', db.access_token);
  const verify = pick('WHATSAPP_VERIFY_TOKEN', db.verify_token);
  const secret = pick('WHATSAPP_APP_SECRET', db.app_secret);
  return {
    wabaId: waba.value,
    phoneNumberId: phone.value,
    displayNumber: (db.display_number || '').trim(),
    accessToken: token.value,
    verifyToken: verify.value,
    appSecret: secret.value,
    mockMode: Boolean(db.mock_mode),
    sources: {
      waba_id: waba.source,
      phone_number_id: phone.source,
      access_token: token.source,
      verify_token: verify.source,
      app_secret: secret.source,
    },
  };
}

export interface MaskedConfig {
  configured: boolean;
  waba_id: { set: boolean; value: string; source: string };
  phone_number_id: { set: boolean; value: string; source: string };
  access_token: { set: boolean; last4: string; source: string };
  verify_token: { set: boolean; last4: string; source: string };
  app_secret: { set: boolean; last4: string; source: string };
  mock_mode: boolean;
  schema_ready: boolean;
}

const tail4 = (v: string): string => (v.length > 4 ? `••••${v.slice(-4)}` : v ? '••••' : '');

/** Masked view safe for the admin UI — presence + last4 only, never values. */
export function maskedConfig(cfg: WaConfig, schemaReady: boolean): MaskedConfig {
  return {
    configured: Boolean(cfg.phoneNumberId && cfg.accessToken),
    waba_id: { set: Boolean(cfg.wabaId), value: cfg.wabaId, source: cfg.sources.waba_id },
    phone_number_id: { set: Boolean(cfg.phoneNumberId), value: cfg.phoneNumberId, source: cfg.sources.phone_number_id },
    access_token: { set: Boolean(cfg.accessToken), last4: tail4(cfg.accessToken), source: cfg.sources.access_token },
    verify_token: { set: Boolean(cfg.verifyToken), last4: tail4(cfg.verifyToken), source: cfg.sources.verify_token },
    app_secret: { set: Boolean(cfg.appSecret), last4: tail4(cfg.appSecret), source: cfg.sources.app_secret },
    mock_mode: cfg.mockMode,
    schema_ready: schemaReady,
  };
}

/** Persist credentials to whatsapp_settings (service-role). Empty values keep the stored one. */
export async function saveConfig(patch: {
  wabaId?: string; phoneNumberId?: string; accessToken?: string;
  verifyToken?: string; appSecret?: string; mockMode?: boolean;
}, updatedBy: string): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: updatedBy };
  if (patch.wabaId !== undefined) row.waba_id = patch.wabaId.trim();
  if (patch.phoneNumberId !== undefined) row.phone_number_id = patch.phoneNumberId.trim();
  if (patch.accessToken !== undefined && patch.accessToken.trim() !== '') row.access_token = patch.accessToken.trim();
  if (patch.verifyToken !== undefined && patch.verifyToken.trim() !== '') row.verify_token = patch.verifyToken.trim();
  if (patch.appSecret !== undefined && patch.appSecret.trim() !== '') row.app_secret = patch.appSecret.trim();
  if (patch.mockMode !== undefined) row.mock_mode = patch.mockMode;
  const existing = await sbSelectOne<{ id: boolean }>('/whatsapp_settings?select=id');
  if (existing) await sbUpdate('whatsapp_settings', 'id=eq.true', row);
  else await sbUpsert('whatsapp_settings', { id: true, ...row }, 'id');
}

export async function setMockMode(on: boolean): Promise<void> {
  await saveConfig({ mockMode: on }, 'server');
}

export function configStatus(cfg: WaConfig): 'Configuration Required' | 'Ready' {
  return cfg.phoneNumberId && cfg.accessToken ? 'Ready' : 'Configuration Required';
}
