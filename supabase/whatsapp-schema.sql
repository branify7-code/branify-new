-- ==============================================================================
-- BRANIFY — WHATSAPP CRM MODULE SCHEMA (run in Supabase SQL Editor)
-- Project: uspshkegxhrglbpxqtil · https://uspshkegxhrglbpxqtil.supabase.co
--
-- HOW TO APPLY:
--   1. Open https://supabase.com/dashboard/project/uspshkegxhrglbpxqtil/sql/new
--   2. Paste this ENTIRE file and run it. Fully idempotent (safe to re-run).
--
-- SECURITY MODEL (matches supabase/admin-schema.sql):
--   · Every table has Row Level Security enabled.
--   · Client tables (contacts, conversations, messages, templates, notes,
--     quick replies, automations, events) are readable/writable ONLY by
--     allowlisted BRANIFY admins (public.branify_is_admin() — same helper as
--     the rest of the admin dashboard). A signed-in customer or anonymous
--     visitor can read and write nothing.
--   · whatsapp_settings holds WhatsApp Business credentials (access token,
--     verify token, app secret). RLS is enabled with NO client policies at
--     all — only the server (service_role) may ever read or write it, so a
--     token can never reach any browser, not even an admin's. The admin UI
--     manages credentials exclusively through the server API, which returns
--     masked values only.
-- ==============================================================================

-- ==============================================================================
-- 1. WHATSAPP CONNECTION SETTINGS (server-only; never exposed to any client)
-- ==============================================================================
create table if not exists public.whatsapp_settings (
  id boolean primary key default true check (id = true),   -- singleton row
  waba_id text default '',                                  -- WhatsApp Business Account ID
  phone_number_id text default '',                          -- Phone Number ID
  display_number text default '',                           -- official business number (display)
  access_token text default '',                             -- permanent System User token (secret)
  verify_token text default '',                             -- webhook verify token (secret)
  app_secret text default '',                               -- Meta App Secret for webhook signature (secret, optional)
  mock_mode boolean not null default false,                 -- DEVELOPMENT MOCK MODE (sandbox labelling)
  updated_at timestamptz not null default now(),
  updated_by text default ''
);
alter table public.whatsapp_settings enable row level security;
-- Deliberately NO policies: anon/authenticated have zero access.
-- The server (service_role key, Vercel functions only) reads and writes it.

-- ==============================================================================
-- 2. CONTACTS (WhatsApp number is the primary matching key)
-- ==============================================================================
create table if not exists public.whatsapp_contacts (
  id uuid primary key default gen_random_uuid(),
  wa_id text not null unique,                               -- WhatsApp number, digits only
  name text default '',
  email text default '',
  company text default '',
  tags text[] not null default '{}',
  lead_status text not null default 'new'
    check (lead_status in ('new','contacted','qualified','proposal','won','lost')),
  assigned_to text default '',                              -- admin_users.email
  source text not null default 'WhatsApp',                  -- WhatsApp | Website | Facebook | Instagram | Blog | Templates | AI Tools | Free Tools
  opt_out boolean not null default false,                   -- marketing opt-out
  customer_user_id uuid,                                    -- matched public.customers (auth.users) row, if any
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists whatsapp_contacts_wa_id_idx on public.whatsapp_contacts (wa_id);
create index if not exists whatsapp_contacts_status_idx on public.whatsapp_contacts (lead_status);
create index if not exists whatsapp_contacts_assigned_idx on public.whatsapp_contacts (assigned_to);
alter table public.whatsapp_contacts enable row level security;

drop policy if exists "admins full access whatsapp_contacts" on public.whatsapp_contacts;
create policy "admins full access whatsapp_contacts" on public.whatsapp_contacts
  for all to authenticated using (public.branify_is_admin()) with check (public.branify_is_admin());

-- ==============================================================================
-- 3. CONVERSATIONS (one per contact; CRM state + customer-service window)
-- ==============================================================================
create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.whatsapp_contacts (id) on delete cascade,
  wa_id text not null,
  status text not null default 'open'
    check (status in ('open','waiting','closed','archived')),
  unread_count integer not null default 0,
  assigned_to text default '',                              -- admin_users.email
  tags text[] not null default '{}',
  last_message_preview text default '',
  last_message_at timestamptz,
  last_in_at timestamptz,                                   -- last INBOUND (customer) message
  last_out_at timestamptz,                                  -- last OUTBOUND (agent) message
  window_expires_at timestamptz,                            -- last_in_at + 24h (customer service window)
  followup_due_at timestamptz,
  followup_note text default '',
  pinned boolean not null default false,                    -- inbox v2: pinned to top
  muted boolean not null default false,                     -- inbox v2: notification mute
  last_read_at timestamptz,                                 -- inbox v2: unread divider anchor
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists whatsapp_conversations_contact_idx on public.whatsapp_conversations (contact_id);
create index if not exists whatsapp_conversations_last_msg_idx on public.whatsapp_conversations (last_message_at desc);
create index if not exists whatsapp_conversations_assigned_idx on public.whatsapp_conversations (assigned_to);
create index if not exists whatsapp_conversations_status_recent_idx on public.whatsapp_conversations (status, last_message_at desc);
create index if not exists whatsapp_conversations_pinned_idx on public.whatsapp_conversations (pinned, last_message_at desc);
alter table public.whatsapp_conversations enable row level security;

drop policy if exists "admins full access whatsapp_conversations" on public.whatsapp_conversations;
create policy "admins full access whatsapp_conversations" on public.whatsapp_conversations
  for all to authenticated using (public.branify_is_admin()) with check (public.branify_is_admin());

-- ==============================================================================
-- 4. MESSAGES (actual WhatsApp messages only — never internal notes)
-- ==============================================================================
create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.whatsapp_conversations (id) on delete cascade,
  wa_id text not null,
  wa_message_id text unique,                                -- Meta wamid (dedupe key for webhook retries)
  direction text not null check (direction in ('in','out')),
  type text not null default 'text'
    check (type in ('text','image','document','audio','video','sticker','location','contacts','interactive','reaction','template','unsupported')),
  body text default '',
  media jsonb not null default '{}'::jsonb,                 -- {media_id, mime, filename, caption, size, storage_path}
  reply_to_wamid text,                                      -- inbox v2: WhatsApp context message id (reply/quote)
  quoted jsonb not null default '{}'::jsonb,                -- inbox v2: {body,type,direction,ts} snapshot for bubble render
  status text not null default 'received'
    check (status in ('received','queued','sent','delivered','read','failed')),
  error jsonb default '{}',                                 -- {code,title,message} on failed
  template_name text default '',
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists whatsapp_messages_conversation_idx on public.whatsapp_messages (conversation_id, timestamp desc);
create index if not exists whatsapp_messages_wamid_idx on public.whatsapp_messages (wa_message_id);
create index if not exists whatsapp_messages_ts_idx on public.whatsapp_messages (timestamp desc);
create index if not exists whatsapp_messages_reply_idx on public.whatsapp_messages (reply_to_wamid);
create extension if not exists pg_trgm;
create index if not exists whatsapp_messages_body_trgm_idx on public.whatsapp_messages using gin (body gin_trgm_ops);
create index if not exists whatsapp_contacts_name_trgm_idx on public.whatsapp_contacts using gin (name gin_trgm_ops);

-- inbox v2: private media storage (inbound persistence + outbound uploads)
insert into storage.buckets (id, name, public, file_size_limit)
values ('whatsapp-media', 'whatsapp-media', false, 104857600)
on conflict (id) do nothing;
drop policy if exists "admins manage whatsapp-media objects" on storage.objects;
create policy "admins manage whatsapp-media objects" on storage.objects
  for all to authenticated
  using (bucket_id = 'whatsapp-media' and public.branify_is_admin())
  with check (bucket_id = 'whatsapp-media' and public.branify_is_admin());
alter table public.whatsapp_messages enable row level security;

drop policy if exists "admins full access whatsapp_messages" on public.whatsapp_messages;
create policy "admins full access whatsapp_messages" on public.whatsapp_messages
  for all to authenticated using (public.branify_is_admin()) with check (public.branify_is_admin());

-- ==============================================================================
-- 5. TEMPLATES (synced from the WhatsApp Business Account — real API state)
-- ==============================================================================
create table if not exists public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  template_id text not null unique,                         -- Meta template id
  name text not null,
  language text not null default 'en',
  category text not null default 'MARKETING',               -- MARKETING | UTILITY | AUTHENTICATION
  status text not null default 'PENDING'                    -- APPROVED | PENDING | REJECTED | PAUSED | ARCHIVED | DELETED
    check (status in ('APPROVED','PENDING','REJECTED','PAUSED','ARCHIVED','DELETED')),
  quality text default '',
  components jsonb not null default '{}'::jsonb,            -- Meta components (body/header/buttons)
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists whatsapp_templates_status_idx on public.whatsapp_templates (status);
alter table public.whatsapp_templates enable row level security;

drop policy if exists "admins full access whatsapp_templates" on public.whatsapp_templates;
create policy "admins full access whatsapp_templates" on public.whatsapp_templates
  for all to authenticated using (public.branify_is_admin()) with check (public.branify_is_admin());

-- ==============================================================================
-- 6. INTERNAL NOTES (never sent to customers; contact-level)
-- ==============================================================================
create table if not exists public.whatsapp_notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.whatsapp_contacts (id) on delete cascade,
  body text not null,
  author_email text default '',
  created_at timestamptz not null default now()
);
create index if not exists whatsapp_notes_contact_idx on public.whatsapp_notes (contact_id, created_at desc);
alter table public.whatsapp_notes enable row level security;

drop policy if exists "admins full access whatsapp_notes" on public.whatsapp_notes;
create policy "admins full access whatsapp_notes" on public.whatsapp_notes
  for all to authenticated using (public.branify_is_admin()) with check (public.branify_is_admin());

-- ==============================================================================
-- 7. QUICK REPLIES (internal reusable responses — separate from WA templates)
-- ==============================================================================
create table if not exists public.whatsapp_quick_replies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.whatsapp_quick_replies enable row level security;

drop policy if exists "admins full access whatsapp_quick_replies" on public.whatsapp_quick_replies;
create policy "admins full access whatsapp_quick_replies" on public.whatsapp_quick_replies
  for all to authenticated using (public.branify_is_admin()) with check (public.branify_is_admin());

-- ==============================================================================
-- 8. AUTOMATION RULES (internal actions only — never auto-send promotional text)
-- ==============================================================================
create table if not exists public.whatsapp_automations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger text not null
    check (trigger in ('new_conversation','new_lead','conversation_assigned','lead_status_changed','customer_inactive')),
  actions jsonb not null default '[]'::jsonb,               -- [{type, params}] types: create_lead|update_lead|add_tag|assign_agent|ai_summary|create_followup
  enabled boolean not null default true,
  run_count integer not null default 0,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.whatsapp_automations enable row level security;

drop policy if exists "admins full access whatsapp_automations" on public.whatsapp_automations;
create policy "admins full access whatsapp_automations" on public.whatsapp_automations
  for all to authenticated using (public.branify_is_admin()) with check (public.branify_is_admin());

-- ==============================================================================
-- 9. WEBHOOK EVENTS (duplicate protection + processing audit)
-- ==============================================================================
create table if not exists public.whatsapp_events (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,                          -- msg:<wamid> | status:<wamid>:<status> | tpl:<id>:<status>
  event_type text default '',
  payload jsonb not null default '{}'::jsonb,               -- trimmed summary (never tokens/headers)
  processed_at timestamptz not null default now()
);
create index if not exists whatsapp_events_type_idx on public.whatsapp_events (event_type, processed_at desc);
alter table public.whatsapp_events enable row level security;

-- Webhook inserts via service_role; admins may inspect + clean up.
drop policy if exists "admins read whatsapp_events" on public.whatsapp_events;
create policy "admins read whatsapp_events" on public.whatsapp_events
  for select to authenticated using (public.branify_is_admin());
drop policy if exists "admins delete whatsapp_events" on public.whatsapp_events;
create policy "admins delete whatsapp_events" on public.whatsapp_events
  for delete to authenticated using (public.branify_is_admin());
