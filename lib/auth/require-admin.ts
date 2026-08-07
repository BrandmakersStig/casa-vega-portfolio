import 'server-only'
import { cookies } from 'next/headers'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { FALLBACK_SESSION_COOKIE, verifyFallbackSession } from './fallback-session'

/** True if the current request is authenticated as admin. Used in server components/route handlers (proxy.ts has its own copy for the edge-free nodejs runtime it runs in). */
export async function isAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const jar = await cookies()
    return verifyFallbackSession(jar.get(FALLBACK_SESSION_COOKIE)?.value)
  }
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase!.auth.getUser()
  return Boolean(user)
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error('Unauthorized')
}
