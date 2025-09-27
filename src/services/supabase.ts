
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types.ts'

// Live Supabase configuration
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and/or Anon Key are missing. Please check your environment variables. This is a critical error for the app to function.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
