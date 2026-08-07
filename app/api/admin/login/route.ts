import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { FALLBACK_SESSION_COOKIE, checkFallbackPassword, signFallbackSession } from '@/lib/auth/fallback-session'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!isSupabaseConfigured()) {
    if (typeof password !== 'string' || !checkFallbackPassword(password)) {
      return NextResponse.json({ error: 'Forkert adgangskode' }, { status: 401 })
    }
    const jar = await cookies()
    jar.set(FALLBACK_SESSION_COOKIE, signFallbackSession(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return NextResponse.json({ ok: true })
  }

  if (!email || !password) return NextResponse.json({ error: 'Udfyld email og adgangskode' }, { status: 400 })
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase!.auth.signInWithPassword({ email, password })
  if (error) return NextResponse.json({ error: error.message }, { status: 401 })
  return NextResponse.json({ ok: true })
}
