import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Browser Supabase client.
 *
 * IMPORTANT:
 * - This file is imported by many client components.
 * - It MUST always have a stable, consistent TypeScript type.
 *
 * In the previous version we returned a "mock" object when env vars were missing.
 * That made `supabase` a union type (real client | mock), which breaks TS builds
 * for chained methods like `.delete().in(...)`.
 *
 * To keep builds 100% stable, we always return a real SupabaseClient type.
 * If env vars are missing, we create a client with safe placeholder values.
 * Runtime calls will fail fast (network/auth), but the app will still compile.
 */
export function createClient(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321"
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key-not-set"

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn(
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not found. " +
        "Using placeholder client (requests will fail until env vars are configured).",
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}

export const supabase: SupabaseClient<any> = createClient()
