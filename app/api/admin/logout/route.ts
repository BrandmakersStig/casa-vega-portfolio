import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { FALLBACK_SESSION_COOKIE } from '@/lib/auth/fallback-session'

export async function POST() {
  if (!isSupabaseConfigured()) {
    const jar = await cookies()
    jar.delete(FALLBACK_SESSION_COOKIE)
    return NextResponse.json({ ok: true })
  }
  const supabase = await getSupabaseServerClient()
  await supabase!.auth.signOut()
  return NextResponse.json({ ok: true })
}
