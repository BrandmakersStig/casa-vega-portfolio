import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isSupabaseConfigured } from './config'

/** Server Component / Route Handler Supabase client (respects RLS as the anon role). Null in dev-fallback mode. */
export async function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component with no request context — safe to ignore,
          // middleware.ts refreshes the session cookie on navigations.
        }
      },
    },
  })
}
