import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as { env?: Record<string, string> }).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://uspshkegxhrglbpxqtil.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'sb_publishable_X11QDwMSfS2ivSePRVDpLQ_xNFY_8vw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

