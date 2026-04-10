import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'

export function createClient({ request }: { request: Request }) {


  return { supabase: createServerClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return parseCookieHeader(request.headers.get('Cookie') ?? '') as {
              name: string
              value: string
            }[]
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => new Headers().append('Set-Cookie', serializeCookieHeader(name, value, options))
            )
          },
        },
      }
    ), headers: new Headers() }
}
