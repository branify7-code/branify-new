-- =============================================================================
-- BRANIFY — Phase 3: AI image generation · media_assets extension
-- -----------------------------------------------------------------------------
-- Adds AI-provenance columns to the EXISTING media library table. Idempotent —
-- safe to re-run. Run in Supabase SQL Editor (like social-schema.sql).
--
--   source    'upload' (default, existing rows) | 'ai'
--   metadata  jsonb — provider/model/prompt/aspect data for AI assets
--
-- RLS is unchanged: media_assets is already admin-only via the existing
-- policies; the server-side insert uses the service role (bypasses RLS).
-- =============================================================================

alter table public.media_assets
  add column if not exists source text not null default 'upload';

alter table public.media_assets
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Index for the "AI Generated" filter in the Media Library
create index if not exists media_assets_source_idx
  on public.media_assets (source, created_at desc);
