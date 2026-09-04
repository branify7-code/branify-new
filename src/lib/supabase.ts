import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as { env?: Record<string, string> }).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://rvtroteglmcxjoqdnsvs.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'sb_publishable_CQ2ply3Q2VzNcswOnrfbbg_P9yHwD9C';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

