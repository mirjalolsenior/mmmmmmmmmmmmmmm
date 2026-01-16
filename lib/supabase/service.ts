import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Server-side Supabase client using SERVICE_ROLE key.
 * Use this ONLY in server routes/functions (never in the browser).
 */
export function createServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
