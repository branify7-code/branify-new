-- ==============================================================================
-- BRANIFY — PRODUCTION SUPABASE DATABASE SCHEMA
-- Project Reference: uspshkegxhrglbpxqtil
-- URL: https://uspshkegxhrglbpxqtil.supabase.co
-- ==============================================================================

-- 1. Enable UUID Extension
create extension if not exists "pgcrypto";

-- 2. Client Project Inquiries & Leads Table
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text default 'Not specified',
  services text[] default '{}',
  budget text,
  timeline text,
  details text,
  status text default 'new',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table public.inquiries enable row level security;

-- 4. RLS Policy: Allow public anonymous and authenticated client-side form submissions
drop policy if exists "Allow public submissions to inquiries" on public.inquiries;
create policy "Allow public submissions to inquiries"
  on public.inquiries
  for insert
  to anon, authenticated
  with check (true);

-- 5. RLS Policy: Allow service_role full admin read & write access
drop policy if exists "Allow service_role full access to inquiries" on public.inquiries;
create policy "Allow service_role full access to inquiries"
  on public.inquiries
  for all
  to service_role
  using (true)
  with check (true);

-- 6. Inquiries Table Indexes
create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_email_idx on public.inquiries (email);

-- 7. Newsletter & Updates Subscription Table
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Allow public newsletter subscriptions" on public.newsletter_subscribers;
create policy "Allow public newsletter subscriptions"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow service_role full access to newsletter" on public.newsletter_subscribers;
create policy "Allow service_role full access to newsletter"
  on public.newsletter_subscribers
  for all
  to service_role
  using (true)
  with check (true);
