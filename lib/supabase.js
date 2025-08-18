import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in environment variables')
}

if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables')
}

// Create Supabase client for client-side operations
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Create Supabase admin client for server-side operations
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseAnonKey && supabase)
}

// Auth helpers
export const auth = {
  signIn: async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured')
    return await supabase.auth.signInWithPassword({ email, password })
  },
  
  signOut: async () => {
    if (!supabase) throw new Error('Supabase not configured')
    return await supabase.auth.signOut()
  },
  
  getSession: async () => {
    if (!supabase) return { data: { session: null } }
    return await supabase.auth.getSession()
  },
  
  getUser: async () => {
    if (!supabase) return { data: { user: null } }
    return await supabase.auth.getUser()
  }
}
