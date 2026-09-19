// =============================================================================
// BRANIFY WHATSAPP CRM — shared frontend types
// =============================================================================

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified', proposal: 'Proposal', won: 'Won', lost: 'Lost',
};

export type ConversationStatus = 'open' | 'waiting' | 'closed' | 'archived';
export const CONVERSATION_STATUSES: ConversationStatus[] = ['open', 'waiting', 'closed', 'archived'];
export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  open: 'Open', waiting: 'Waiting', closed: 'Closed', archived: 'Archived',
};

export const CONTACT_TAGS = ['Website', 'Ecommerce', 'AI', 'SEO', 'Branding', 'Template', 'Support', 'Hot Lead', 'Follow-up'] as const;
export const LEAD_SOURCES = ['WhatsApp', 'Website', 'Facebook', 'Instagram', 'Blog', 'Templates', 'AI Tools', 'Free Tools'] as const;

export type MessageDirection = 'in' | 'out';
export type MessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'template' | 'unsupported';
export type MessageStatus = 'received' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WaContact {
  id: string;
  wa_id: string;
  name: string;
  email: string;
  company: string;
  tags: string[];
  lead_status: LeadStatus;
  assigned_to: string;
  source: string;
  opt_out: boolean;
  customer_user_id: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface WaConversation {
  id: string;
  contact_id: string;
  wa_id: string;
  status: ConversationStatus;
  unread_count: number;
  assigned_to: string;
  tags: string[];
  last_message_preview: string;
  last_message_at: string | null;
  last_in_at: string | null;
  last_out_at: string | null;
  window_expires_at: string | null;
  followup_due_at: string | null;
  followup_note: string;
}

export interface WaMessage {
  id: string;
  conversation_id: string;
  wa_id: string;
  wa_message_id: string | null;
  direction: MessageDirection;
  type: MessageType;
  body: string;
  media: { media_id?: string; mime?: string; filename?: string; caption?: string; link?: string };
  status: MessageStatus;
  error: { code?: number; title?: string; message?: string } | null;
  template_name: string | null;
  timestamp: string;
}

export interface WaTemplate {
  id: string;
  template_id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  quality: string;
  components: Array<{ type: string; text?: string; parameters?: unknown[]; format?: string }> | Record<string, unknown>;
  synced_at: string;
}

export interface WaNote {
  id: string;
  contact_id: string;
  body: string;
  author_email: string;
  created_at: string;
}

export interface WaQuickReply {
  id: string;
  title: string;
  body: string;
  sort_order: number;
}

export interface WaAutomation {
  id: string;
  name: string;
  trigger: 'new_conversation' | 'new_lead' | 'conversation_assigned' | 'lead_status_changed' | 'customer_inactive';
  actions: Array<{ type: string; params?: Record<string, unknown> }>;
  enabled: boolean;
  run_count: number;
  last_run_at: string | null;
}

export interface WaMaskedConfig {
  configured: boolean;
  waba_id: { set: boolean; value: string; source: string };
  phone_number_id: { set: boolean; value: string; source: string };
  access_token: { set: boolean; last4: string; source: string };
  verify_token: { set: boolean; last4: string; source: string };
  app_secret: { set: boolean; last4: string; source: string };
  mock_mode: boolean;
  schema_ready: boolean;
}

export interface WaStatusResponse {
  state: 'Connected' | 'Disconnected' | 'Configuration Required' | 'Webhook Error';
  detail: string;
  phone?: { id: string; display: string; verified_name: string; quality: string };
  config: WaMaskedConfig;
  webhook_url?: string;
}

export interface WaAnalytics {
  range: { label: string; start: string; end: string };
  conversations: number;
  new_contacts: number;
  messages_received: number;
  messages_sent: number;
  unread_now: number;
  response_time: string | null;
  qualified_leads: number;
  won_leads: number;
  failed_messages: number;
  templates_used: number;
  template_breakdown: Record<string, number>;
  lead_status_totals: Record<string, number>;
  team: Array<{ agent: string; conversations: number; resolved: number; qualified_leads: number; response_time: string | null }>;
}

export const TRIGGER_LABELS: Record<WaAutomation['trigger'], string> = {
  new_conversation: 'New WhatsApp conversation',
  new_lead: 'New lead (new contact)',
  conversation_assigned: 'Conversation assigned',
  lead_status_changed: 'Lead status changed',
  customer_inactive: 'Customer inactive (7+ days)',
};

export const ACTION_LABELS: Record<string, string> = {
  create_lead: 'Create lead (in existing Leads)',
  update_lead: 'Update lead status',
  add_tag: 'Add tag',
  assign_agent: 'Assign agent',
  ai_summary: 'Request AI summary (internal note)',
  create_followup: 'Create follow-up reminder',
};
