import { createClient } from "@supabase/supabase-js"

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Create clients with proper typing
let supabase: ReturnType<typeof createClient> | null = null
let supabaseAdmin: ReturnType<typeof createClient> | null = null

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'standards-app'
        }
      }
    })
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    supabase = null
  }
}

if (supabaseUrl && supabaseServiceRoleKey) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  } catch (error) {
    console.error("Failed to create Supabase admin client:", error)
    supabaseAdmin = null
  }
}

// Server-side client with proper typing
export const createServerClient = (accessToken?: string) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === "development") {
      console.error("Missing Supabase server configuration")
    }
    return null
  }

  try {
    const options = {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }

    const client = createClient(supabaseUrl, supabaseAnonKey, options)

    if (accessToken) {
      client.auth.setAuth(accessToken)
    }

    return client
  } catch (error) {
    console.error("Failed to create Supabase server client:", error)
    return null
  }
}

// Helper functions
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabase)
}

export const getServiceRoleClient = () => {
  if (!supabaseAdmin) {
    throw new Error("Service role client not initialized")
  }
  return supabaseAdmin
}

export { supabase }