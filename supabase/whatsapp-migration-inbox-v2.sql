-- ==============================================================================
-- BRANIFY — WHATSAPP INBOX v2 MIGRATION (run in Supabase SQL Editor)
-- Project: uspshkegxhrglbpxqtil · https://uspshkegxhrglbpxqtil.supabase.co
--
-- HOW TO APPLY:
--   1. Open https://supabase.com/dashboard/project/uspshkegxhrglbpxqtil/sql/new
--   2. Paste this ENTIRE file and run it. Fully idempotent (safe to re-run).
--
-- Adds (professional inbox upgrade, spec §21/§27):
--   · conversations: pinned, muted, last_read_at (unread divider + sort)
--   · messages: reply_to_wamid + quoted snapshot (reply/quote threading)
--   · messages.type extended: sticker, location, contacts, interactive, reaction
--   · indexes: status+recency, pinned, reply lookups, pg_trgm search (body/name)
--   · private storage bucket whatsapp-media + admin-only storage policies
--     (server writes via service_role; admins upload/read via their own JWT)
-- No existing rows are modified or dropped.
-- ==============================================================================

-- 1. CONVERSATIONS: workspace state -------------------------------------------------
alter table public.whatsapp_conversations add column if not exists pinned boolean not null default false;
alter table public.whatsapp_conversations add column if not exists muted boolean not null default false;
alter table public.whatsapp_conversations add column if not exists last_read_at timestamptz;

-- 2. MESSAGES: reply threading + extended inbound types -----------------------------
alter table public.whatsapp_messages add column if not exists reply_to_wamid text;
alter table public.whatsapp_messages add column if not exists quoted jsonb not null default '{}'::jsonb;

alter table public.whatsapp_messages drop constraint if exists whatsapp_messages_type_check;
alter table public.whatsapp_messages add constraint whatsapp_messages_type_check
  check (type in ('text','image','document','audio','video','sticker','location','contacts','interactive','reaction','template','unsupported'));

-- 3. INDEXES (high-volume inbox operations) -----------------------------------------
create index if not exists whatsapp_conversations_status_recent_idx
  on public.whatsapp_conversations (status, last_message_at desc);
create index if not exists whatsapp_conversations_pinned_idx
  on public.whatsapp_conversations (pinned, last_message_at desc);
create index if not exists whatsapp_messages_reply_idx
  on public.whatsapp_messages (reply_to_wamid);

-- trigram search for message text + contact names (server-side search, §28)
create extension if not exists pg_trgm;
drop index if exists whatsapp_messages_body_trgm_idx;
create index whatsapp_messages_body_trgm_idx
  on public.whatsapp_messages using gin (body gin_trgm_ops);
drop index if exists whatsapp_contacts_name_trgm_idx;
create index whatsapp_contacts_name_trgm_idx
  on public.whatsapp_contacts using gin (name gin_trgm_ops);

-- 4. PRIVATE MEDIA STORAGE (inbound persistence + outbound uploads) -----------------
-- Bucket is PRIVATE: no anon access. The server (service_role) writes inbound
-- downloads and creates short-lived signed URLs; admins upload attachments with
-- their own JWT. Customer media never becomes a public URL (spec §8/§26).
insert into storage.buckets (id, name, public, file_size_limit)
values ('whatsapp-media', 'whatsapp-media', false, 104857600)
on conflict (id) do nothing;

drop policy if exists "admins manage whatsapp-media objects" on storage.objects;
create policy "admins manage whatsapp-media objects" on storage.objects
  for all to authenticated
  using (bucket_id = 'whatsapp-media' and public.branify_is_admin())
  with check (bucket_id = 'whatsapp-media' and public.branify_is_admin());

-- 5. KEEP-ALIVE for schema probe (no-op) ---------------------------------------------
select 1;
