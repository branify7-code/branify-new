-- ==============================================================================
-- BRANIFY — ADMIN DASHBOARD DATABASE SCHEMA (run in Supabase SQL Editor)
-- Project: uspshkegxhrglbpxqtil  ·  https://uspshkegxhrglbpxqtil.supabase.co
--
-- HOW TO APPLY:
--   1. Open https://supabase.com/dashboard/project/uspshkegxhrglbpxqtil/sql/new
--   2. Paste this ENTIRE file and run it. It is fully idempotent (safe to re-run).
--   3. (Optional, recommended) Then run supabase/admin-seed.sql to load the
--      current live site content into the admin tables.
--   4. CREATE YOUR ADMIN ACCOUNT (owner only - this app never creates accounts
--      and never ships default credentials):
--        a. Supabase Dashboard -> Authentication -> Users -> Add User
--           enter your email + a strong password -> Save (auto-confirms the user).
--        b. Make that email an admin (allowlist) - either edit the placeholder
--           below BEFORE running this file, or run it afterwards:
--              insert into public.admin_users (email, name, role)
--              values ('your-email@example.com','Your Name','super_admin')
--              on conflict (email) do update set role = 'super_admin';
--        c. Sign in at /admin with that email + password.
--      Authorization is enforced SERVER-SIDE: every admin table is protected by
--      RLS policies that grant access only to allowlisted (admin_users)
--      authenticated users. A non-admin Supabase user can authenticate but can
--      read and write nothing.
-- ==============================================================================

create extension if not exists "pgcrypto";

-- ==============================================================================
-- 1. ADMIN ALLOWLIST + AUTHORIZATION HELPER
-- ==============================================================================
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text default '',
  role text not null default 'admin',           -- 'admin' | 'super_admin'
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

-- Pre-allowlist the official business account (no-op when already present)
insert into public.admin_users (email, name, role)
values ('admin@branify.store', 'BRANIFY Admin', 'super_admin')
on conflict (email) do nothing;

-- SECURITY DEFINER so policies can consult the allowlist without recursion
create or replace function public.branify_is_admin()
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (
    select 1 from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and active
  );
$$;

grant execute on function public.branify_is_admin() to anon, authenticated;

-- Allowlist is readable only by its own members (email check) — never leaks other rows
drop policy if exists "admin_users self read" on public.admin_users;
create policy "admin_users self read" on public.admin_users
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) or public.branify_is_admin());

drop policy if exists "admin_users self update" on public.admin_users;
create policy "admin_users self update" on public.admin_users
  for update to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ==============================================================================
-- 2. GENERIC HELPER POLICY BUILDER (applied per table below)
--    Admin tables: full access for allowlisted authenticated admins only.
-- ==============================================================================

-- ==============================================================================
-- 3. CONTENT TABLES
-- ==============================================================================
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  number text default '',
  title text not null,
  subtitle text default '',
  description text default '',
  icon text default 'Sparkles',
  category text default '',
  technologies text[] not null default '{}',
  deliverables text[] not null default '{}',
  stat_label text default '',
  stat_value text default '',
  price_note text default '',
  active boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  seo jsonb not null default '{}'::jsonb,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text default '',
  client text default '',
  description text default '',
  hero_image text default '',
  gallery text[] not null default '{}',
  technologies text[] not null default '{}',
  challenge text default '',
  solution text default '',
  outcome text default '',
  live_url text default '',
  featured boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  seo jsonb not null default '{}'::jsonb,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text default '',
  description text default '',
  icon text default 'Wrench',
  url text default '',
  input_type text default 'text',
  active boolean not null default true,
  featured boolean not null default false,
  popular boolean not null default false,
  sort_order integer not null default 0,
  seo jsonb not null default '{}'::jsonb,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_tools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text default '',
  description text default '',
  icon text default 'Sparkles',
  url text default '',
  pricing text default 'Free',
  active boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  seo jsonb not null default '{}'::jsonb,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text default '',
  description text default '',
  image text default '',
  price numeric(12,2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'active',        -- 'active' | 'coming_soon' | 'archived'
  delivery_info text default '',
  file_url text default '',
  featured boolean not null default false,
  sort_order integer not null default 0,
  seo jsonb not null default '{}'::jsonb,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text default '',
  content text default '',
  cover_image text default '',
  author_name text default 'BRANIFY Team',
  author_role text default '',
  published_at timestamptz,
  category text default '',
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  featured boolean not null default false,
  seo jsonb not null default '{}'::jsonb,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 4. CRM — extend the existing public.inquiries table + contacts
-- ==============================================================================
alter table public.inquiries add column if not exists phone text default '';
alter table public.inquiries add column if not exists source text default 'contact_form';
alter table public.inquiries add column if not exists notes text default '';
alter table public.inquiries add column if not exists archived boolean not null default false;

-- Newsletter list stays as-is; admins gain read access below.

-- ==============================================================================
-- 5. SEO CENTER
-- ==============================================================================
create table if not exists public.seo_overrides (
  page_path text primary key,
  title text default '',
  description text default '',
  canonical text default '',
  robots text default 'index,follow',
  og jsonb not null default '{}'::jsonb,
  twitter jsonb not null default '{}'::jsonb,
  schema_json jsonb,
  updated_at timestamptz not null default now(),
  updated_by text default ''
);

create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  source text not null unique,
  destination text not null,
  status integer not null default 301 check (status in (301,302)),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.not_found_log (
  path text primary key,
  hits integer not null default 1,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

-- Public RPC so the SPA can record 404s without exposing the table
create or replace function public.branify_log_not_found(p_path text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.not_found_log (path, hits, first_seen, last_seen)
  values (left(p_path, 512), 1, now(), now())
  on conflict (path) do update
    set hits = public.not_found_log.hits + 1,
        last_seen = now();
$$;
grant execute on function public.branify_log_not_found(text) to anon, authenticated;

-- ==============================================================================
-- 6. FIRST-PARTY ANALYTICS EVENTS (real conversion tracking, no fake data)
-- ==============================================================================
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  path text default '',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_name_idx on public.analytics_events (name, created_at desc);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at desc);

-- ==============================================================================
-- ==============================================================================
-- 6b. CUSTOMERS - profile data for Supabase Auth users.
--     Passwords are NEVER stored here or anywhere: authentication stays
--     entirely inside Supabase Auth (auth.users). This table only holds the
--     admin-editable profile (status/notes); identity data (email, phone,
--     name, registration date, last login) is read live from auth.users via
--     the SECURITY DEFINER RPC below - admin-only.
-- ==============================================================================
create table if not exists public.customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  status text not null default 'active',          -- 'active' | 'blocked'
  notes text default '',
  created_at timestamptz not null default now()
);
alter table public.customers enable row level security;

drop policy if exists "admins full access customers" on public.customers;
create policy "admins full access customers" on public.customers
  for all to authenticated using (public.branify_is_admin()) with check (public.branify_is_admin());

-- Keep customers.email in sync with the auth user (owner may change email)
create or replace function public.branify_sync_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customers (user_id, email, status)
  values (new.id, coalesce(new.email, ''), 'active')
  on conflict (user_id) do update set email = coalesce(new.email, '');
  return new;
end $$;

drop trigger if exists on_auth_user_created_sync_customer on auth.users;
create trigger on_auth_user_created_sync_customer
  after insert on auth.users
  for each row execute function public.branify_sync_customer_profile();

-- Backfill any users created before this trigger existed
insert into public.customers (user_id, email, status)
select u.id, coalesce(u.email, ''), 'active' from auth.users u
on conflict (user_id) do nothing;

-- Admin-only RPC: list customer accounts with profile data from auth.users.
-- SECURITY DEFINER because auth.users is not exposed to clients; the explicit
-- admin guard makes it safe. Returns NO password / secret data.
create or replace function public.branify_list_customers(p_search text default null)
returns table (
  id uuid,
  email text,
  phone text,
  name text,
  status text,
  created_at timestamptz,
  last_login_at timestamptz
)
language sql
security definer
set search_path = public, auth
stable
as $$
  select
    u.id,
    u.email,
    coalesce(u.phone, ''),
    coalesce(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name', ''),
    coalesce(c.status, 'active'),
    u.created_at,
    u.last_sign_in_at
  from auth.users u
  left join public.customers c on c.user_id = u.id
  where public.branify_is_admin()
    and (
      p_search is null
      or u.email ilike '%' || p_search || '%'
      or coalesce(u.phone, '') ilike '%' || p_search || '%'
      or coalesce(u.raw_user_meta_data ->> 'name', '') ilike '%' || p_search || '%'
      or coalesce(u.raw_user_meta_data ->> 'full_name', '') ilike '%' || p_search || '%'
    )
  order by u.created_at desc
  limit 500;
$$;
grant execute on function public.branify_list_customers(text) to authenticated;
revoke execute on function public.branify_list_customers(text) from anon;

-- ==============================================================================
-- 6c. PAYMENTS - control structure for future payment integration.
--     No gateway is connected: the admin page shows "Payment Gateway Not
--     Connected". NEVER store card numbers, CVV, or gateway secrets here -
--     only provider references, transaction ids and statuses.
-- ==============================================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  provider text default '',                       -- 'stripe' | 'paypal' | 'payfast' | 'manual' | ...
  transaction_id text default '',
  customer_email text default '',
  customer_name text default '',
  amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'pending'          -- pending | paid | failed | refunded | cancelled
    check (status in ('pending','paid','failed','refunded','cancelled')),
  refund_status text default '',                  -- '' | 'requested' | 'refunded' | 'rejected'
  webhook_status text default '',                 -- '' | 'received' | 'verified' | 'failed'
  payment_date timestamptz,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists payments_created_idx on public.payments (created_at desc);
alter table public.payments enable row level security;

drop policy if exists "admins full access payments" on public.payments;
create policy "admins full access payments" on public.payments
  for all to authenticated using (public.branify_is_admin()) with check (public.branify_is_admin());

-- 7. MEDIA LIBRARY
-- ==============================================================================
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  url text not null,
  alt text default '',
  width integer,
  height integer,
  size_bytes bigint default 0,
  mime text default '',
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 8. SETTINGS (site name, brand, contact, social, SEO defaults, PWA prefs)
-- ==============================================================================
create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 9. ACTIVITY LOG (user, action, target, timestamp — never secrets)
-- ==============================================================================
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  user_email text default '',
  action text not null,
  target_type text default '',
  target_id text default '',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_log_created_idx on public.activity_log (created_at desc);

-- ==============================================================================
-- 10. ROW LEVEL SECURITY — enable everywhere
-- ==============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'services','portfolio_projects','tools','ai_tools','products','blog_posts',
    'seo_overrides','redirects','not_found_log','media_assets','settings',
    'activity_log','analytics_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Admin tables: full access for allowlisted admins only
do $$
declare t text;
begin
  foreach t in array array[
    'services','portfolio_projects','tools','ai_tools','products','blog_posts',
    'seo_overrides','redirects','media_assets','settings','activity_log'
  ] loop
    execute format('drop policy if exists "admins full access %1$s" on public.%1$I', t);
    execute format(
      'create policy "admins full access %1$s" on public.%1$I for all to authenticated
         using (public.branify_is_admin()) with check (public.branify_is_admin())', t);
  end loop;
end $$;

-- not_found_log: admins read/delete; public writes only via the RPC above
drop policy if exists "admins read not_found_log" on public.not_found_log;
create policy "admins read not_found_log" on public.not_found_log
  for select to authenticated using (public.branify_is_admin());
drop policy if exists "admins delete not_found_log" on public.not_found_log;
create policy "admins delete not_found_log" on public.not_found_log
  for delete to authenticated using (public.branify_is_admin());

-- analytics_events: public can INSERT (tracking pixels), admins can read/delete
drop policy if exists "public insert analytics_events" on public.analytics_events;
create policy "public insert analytics_events" on public.analytics_events
  for insert to anon, authenticated with check (true);
drop policy if exists "admins read analytics_events" on public.analytics_events;
create policy "admins read analytics_events" on public.analytics_events
  for select to authenticated using (public.branify_is_admin());
drop policy if exists "admins delete analytics_events" on public.analytics_events;
create policy "admins delete analytics_events" on public.analytics_events
  for delete to authenticated using (public.branify_is_admin());

-- inquiries: keep public insert (lead capture); admins get full CRM access
drop policy if exists "admins full access inquiries" on public.inquiries;
create policy "admins full access inquiries" on public.inquiries
  for all to authenticated using (public.branify_is_admin()) with check (public.branify_is_admin());

-- Public content overrides: anon may READ published content rows + SEO
-- overrides so the public site can apply admin-managed content/SEO without
-- exposing anything private (leads, subscribers, activity stay admin-only).
do $$
declare t text;
begin
  foreach t in array array['services','tools','ai_tools'] loop
    execute format('drop policy if exists "public read published %1$s" on public.%1$I', t);
    execute format(
      'create policy "public read published %1$s" on public.%1$I for select to anon
         using (active = true and archived = false)', t);
  end loop;
  execute 'drop policy if exists "public read published products" on public.products';
  execute 'create policy "public read published products" on public.products for select to anon
             using (archived = false)';
  execute 'drop policy if exists "public read published portfolio" on public.portfolio_projects';
  execute 'create policy "public read published portfolio" on public.portfolio_projects for select to anon
             using (published = true and archived = false)';
  execute 'drop policy if exists "public read published blog" on public.blog_posts';
  execute 'create policy "public read published blog" on public.blog_posts for select to anon
             using (status = ''published'' and archived = false)';
end $$;

drop policy if exists "public read seo_overrides" on public.seo_overrides;
create policy "public read seo_overrides" on public.seo_overrides
  for select to anon using (true);

-- Public site needs the GLOBAL SEO fallback (site name, default title/desc,
-- default OG image) - settings hold no secrets, so anon read is safe.
drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings
  for select to anon using (true);

drop policy if exists "public read active redirects" on public.redirects;
create policy "public read active redirects" on public.redirects
  for select to anon using (active = true);

-- newsletter_subscribers: admins read/delete (contacts module)
drop policy if exists "admins read newsletter" on public.newsletter_subscribers;
create policy "admins read newsletter" on public.newsletter_subscribers
  for select to authenticated using (public.branify_is_admin());
drop policy if exists "admins delete newsletter" on public.newsletter_subscribers;
create policy "admins delete newsletter" on public.newsletter_subscribers
  for delete to authenticated using (public.branify_is_admin());

-- ==============================================================================
-- 11. INDEXES
-- ==============================================================================
create index if not exists services_sort_idx on public.services (sort_order);
create index if not exists portfolio_sort_idx on public.portfolio_projects (sort_order);
create index if not exists tools_sort_idx on public.tools (sort_order);
create index if not exists ai_tools_sort_idx on public.ai_tools (sort_order);
create index if not exists products_sort_idx on public.products (sort_order);
create index if not exists blog_published_idx on public.blog_posts (status, published_at desc);
create index if not exists inquiries_status_idx on public.inquiries (status, created_at desc);
create index if not exists redirects_source_idx on public.redirects (source);

-- ==============================================================================
-- 11b. MEDIA STORAGE BUCKET (production uploads for the Media Library)
-- ==============================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media admin write" on storage.objects;
create policy "media admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'media' and public.branify_is_admin())
  with check (bucket_id = 'media' and public.branify_is_admin());

-- ==============================================================================
-- 12. updated_at touch trigger for content tables
-- ==============================================================================
create or replace function public.branify_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'services','portfolio_projects','tools','ai_tools','products','blog_posts'
  ] loop
    execute format('drop trigger if exists %1$s_touch on public.%1$I', t);
    execute format(
      'create trigger %1$s_touch before update on public.%1$I
         for each row execute function public.branify_touch_updated_at()', t);
  end loop;
end $$;

-- ==============================================================================
-- DONE. Next steps: run admin-seed.sql (optional), then sign in at /admin.
-- ==============================================================================

-- ==============================================================================
-- 13. TEMPLATE LIBRARY (public /templates — 16 canonical categories)
--     Appended section: mirrors the conventions above. Content tables avoid
--     FKs, so templates.category_slug is a plain text reference to
--     template_categories.slug kept in sync by the admin dashboard.
--     Templates hide from the public site via status='draft' (no archived
--     column); categories via active=false.
-- ==============================================================================
create table if not exists public.template_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tagline text default '',
  hero_description text default '',
  image text default '',
  seo_title text default '',
  seo_description text default '',
  og_image text default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_slug text not null,                  -- references template_categories(slug) logically (no FK, like the rest of the content tables)
  short_description text default '',
  description text default '',
  thumbnail text default '',
  preview_image text default '',
  demo_url text default '',
  tags text[] not null default '{}',
  featured boolean not null default false,
  status text not null default 'published' check (status in ('published','draft')),
  sort_order integer not null default 0,
  seo jsonb not null default '{}'::jsonb,       -- { title, description, og_image }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.template_categories enable row level security;
alter table public.templates enable row level security;

-- Admin-only writes/reads for the dashboard (allowlisted admins via the helper)
drop policy if exists "admins full access template_categories" on public.template_categories;
create policy "admins full access template_categories" on public.template_categories
  for all to authenticated using (public.branify_is_admin()) with check (public.branify_is_admin());

drop policy if exists "admins full access templates" on public.templates;
create policy "admins full access templates" on public.templates
  for all to authenticated using (public.branify_is_admin()) with check (public.branify_is_admin());

-- Public site: anon reads ALL template-library rows (drafts included). The
-- public site's boot-time override merge splices status='draft' templates and
-- active=false categories out of the compiled registry, so the anon client
-- must be able to SEE those rows to hide them. Template content ships in the
-- JS bundle regardless — drafts only remove rows from the live site lists.
drop policy if exists "public read active template_categories" on public.template_categories;
create policy "public read template_categories for override merge"
  on public.template_categories for select to anon using (true);

drop policy if exists "public read published templates" on public.templates;
create policy "public read templates for override merge"
  on public.templates for select to anon using (true);

create index if not exists template_categories_sort_idx on public.template_categories (sort_order);
create index if not exists templates_sort_idx on public.templates (sort_order);
create index if not exists templates_category_idx on public.templates (category_slug, sort_order);
create index if not exists templates_status_idx on public.templates (status, sort_order);

-- updated_at touch trigger (same helper as section 12)
drop trigger if exists template_categories_touch on public.template_categories;
create trigger template_categories_touch before update on public.template_categories
  for each row execute function public.branify_touch_updated_at();

drop trigger if exists templates_touch on public.templates;
create trigger templates_touch before update on public.templates
  for each row execute function public.branify_touch_updated_at();
