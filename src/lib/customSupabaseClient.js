import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hdgissmyeisovtzinrkl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ2lzc215ZWlzb3Z0emlucmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNTc5NzAsImV4cCI6MjA4MjkzMzk3MH0.OzUV42ye9kcI6NveKRHSh9jC3Tw2tYACl2q5tT8fug0';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
