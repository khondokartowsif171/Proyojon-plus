import { createBrowserClient } from '@supabase/ssr'

export function createClient(): import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any> {
  return createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!
  )
}
