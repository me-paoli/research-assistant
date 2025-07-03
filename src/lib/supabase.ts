import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: SupabaseClient
let isMock = false

if (supabaseUrl && supabaseAnonKey) {
  // Real Supabase client
  supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)
} else {
  // Mock client for development/demo
  isMock = true
  supabase = {
    auth: {
      signUp: async () => ({ data: { user: { id: 'mock-user', email: 'demo@example.com' } }, error: null }),
      signInWithPassword: async () => ({ data: { user: { id: 'mock-user', email: 'demo@example.com' } }, error: null }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: { user: { id: 'mock-user', email: 'demo@example.com' } } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getUser: async () => ({ data: { user: { id: 'mock-user', email: 'demo@example.com' } }, error: null })
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null }),
      eq: () => ({ data: [], error: null }),
      textSearch: () => ({ data: [], error: null }),
      order: () => ({ data: [], error: null }),
      limit: () => ({ data: [], error: null })
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'mock/path/file.txt' }, error: null })
      })
    }
  } as unknown as SupabaseClient
}

export { supabase, isMock } 