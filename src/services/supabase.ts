
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types.ts'

// Live Supabase configuration
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

let supabaseClient;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and/or Anon Key are missing. Please check your environment variables. This is a critical error for the app to function.');
  // For debugging, create a dummy client to prevent crash
  supabaseClient = createClient<Database>('https://dummy.supabase.co', 'dummy-key');
} else {
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;
