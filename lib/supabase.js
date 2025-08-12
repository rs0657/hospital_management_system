import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in environment variables')
}

if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables')
}

// Create Supabase client with error handling
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// For server-side operations, we'll use the same client with anon key
// We'll disable RLS or use proper policies for API access
export const supabaseAdmin = supabase

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseAnonKey && supabase)
}
