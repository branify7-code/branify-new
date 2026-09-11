-- =============================================================================
-- BRANIFY — Phase 2: AI Social Media Manager schema
-- -----------------------------------------------------------------------------
-- Idempotent paste-in migration (same convention as admin-schema.sql).
-- REQUIRES: admin-schema.sql already applied (branify_is_admin() exists).
--
-- Tables:
--   public.social_posts         content pipeline (draft → approval → schedule → publish)
--   public.social_connections   one row per connected platform. Token material is
--                               AES-256-GCM ciphertext (server-side key only) —
--                               rows are admin-readable but carry NO usable secret.
--
-- Security: RLS on both tables, admin-only (branify_is_admin), no anon access.
-- The server writes connections with the service-role key (bypasses RLS) from
-- the OAuth callback / publish endpoints; the browser never touches tokens.
-- =============================================================================

-- ---------------------------------------------------------------- social_posts
create table if not exists public.social_posts (
  id                uuid primary key default gen_random_uuid(),
  platform          text not null check (platform in ('facebook','instagram')),
  content_type      text not null default 'facebook_post'
                    check (content_type in ('facebook_post','instagram_image','instagram_carousel','instagram_reel_idea','instagram_story_idea')),
  title             text not null default '',
  caption           text not null default '',
  hashtags          text[] not null default '{}',
  media_url         text not null default '',
  media_type        text not null default '',            -- '' | 'image' | 'video' (future)
  status            text not null default 'draft'
                    check (status in ('draft','pending_approval','approved','scheduled','publishing','published','failed','cancelled')),
  scheduled_at      timestamptz,
  published_at      timestamptz,
  external_post_id  text,
  source_type       text not null default 'manual',      -- manual | ai | blog | service | weekly_plan
  source_id         text not null default '',            -- blog id / service slug / plan batch id
  approval_required boolean not null default true,
  approved_at       timestamptz,
  created_by        text not null default '',            -- admin email
  error_message     text,
  metadata          jsonb not null default '{}',         -- image_prompt, alt_text, cta, tone, model, blog_url, plan_day…
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists social_posts_status_sched_idx on public.social_posts (status, scheduled_at);
create index if not exists social_posts_platform_status_idx on public.social_posts (platform, status);
create index if not exists social_posts_created_idx on public.social_posts (created_at desc);

alter table public.social_posts enable row level security;

drop policy if exists "admins full access social_posts" on public.social_posts;
create policy "admins full access social_posts" on public.social_posts
  for all to authenticated
  using (public.branify_is_admin())
  with check (public.branify_is_admin());

-- ---------------------------------------------------------- social_connections
create table if not exists public.social_connections (
  id                uuid primary key default gen_random_uuid(),
  platform          text not null unique check (platform in ('facebook','instagram')),
  page_id           text not null default '',            -- FB page id (instagram rows: owning page id)
  page_name         text not null default '',
  ig_user_id        text not null default '',            -- instagram professional account id ('' for facebook rows)
  ig_username       text not null default '',
  token_encrypted   text not null default '',            -- base64(iv|tag|ciphertext), AES-256-GCM, server-side key
  token_kind        text not null default 'page',        -- page (long-lived page token covers FB + IG publishing)
  token_expires_at  timestamptz,                         -- null ≈ long-lived (60d) — refreshed on reconnect
  scopes            text[] not null default '{}',
  connected_by      text not null default '',            -- 'meta-oauth' (browser identity is not part of the callback)
  connected_at      timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  metadata          jsonb not null default '{}'
);

alter table public.social_connections enable row level security;

drop policy if exists "admins read social_connections" on public.social_connections;
create policy "admins read social_connections" on public.social_connections
  for select to authenticated
  using (public.branify_is_admin());

drop policy if exists "admins update social_connections" on public.social_connections;
create policy "admins update social_connections" on public.social_connections
  for update to authenticated
  using (public.branify_is_admin())
  with check (public.branify_is_admin());

drop policy if exists "admins insert social_connections" on public.social_connections;
create policy "admins insert social_connections" on public.social_connections
  for insert to authenticated
  with check (public.branify_is_admin());

drop policy if exists "admins delete social_connections" on public.social_connections;
create policy "admins delete social_connections" on public.social_connections
  for delete to authenticated
  using (public.branify_is_admin());
