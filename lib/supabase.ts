import { createClient } from "@supabase/supabase-js"

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""

// Create client only if both variables exist
let supabase: ReturnType<typeof createClient> | null = null

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    supabase = null
  }
} else {
  // Only warn in development, not in production builds
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "Supabase environment variables not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.",
    )
  }
}

export { supabase }

// Server-side client
export const createServerClient = () => {
  const serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!serverUrl || !serverKey) {
    if (process.env.NODE_ENV === "development") {
      console.error("Missing Supabase server configuration")
    }
    return null
  }

  try {
    return createClient(serverUrl, serverKey)
  } catch (error) {
    console.error("Failed to create Supabase server client:", error)
    return null
  }
}

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabase)
}
