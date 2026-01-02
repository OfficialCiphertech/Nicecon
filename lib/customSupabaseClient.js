
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = '__SUPABASE_URL__';
const supabaseAnonKey = '__SUPABASE_ANON_KEY__';
const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
export default customSupabaseClient;
export { customSupabaseClient, customSupabaseClient as supabase };
