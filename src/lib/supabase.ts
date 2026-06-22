import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables with fallback values to prevent build-time failures
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key-ensure-proper-env-is-set';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
