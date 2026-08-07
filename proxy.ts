import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { FALLBACK_SESSION_COOKIE, verifyFallbackSession } from '@/lib/auth/fallback-session'

// Next.js 16 renamed `middleware.ts` -> `proxy.ts` (export `proxy`, not
// `middleware`). This runs on the nodejs runtime, so it's safe to use the
// full Supabase SSR client here (no edge-runtime constraints).
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isLoginPage = pathname === '/admin/login'
  const isAuthEndpoint = pathname === '/api/admin/login' || pathname === '/api/admin/logout'
  const isGuardedPage = pathname.startsWith('/admin') && !isLoginPage
  const isGuardedApi = pathname.startsWith('/api/admin') && !isAuthEndpoint

  if (!isGuardedPage && !isGuardedApi) return NextResponse.next()

  if (!isSupabaseConfigured()) {
    const authed = verifyFallbackSession(req.cookies.get(FALLBACK_SESSION_COOKIE)?.value)
    if (!authed) return denyOrRedirect(req, isGuardedApi)
    return NextResponse.next()
  }

  let response = NextResponse.next({ request: req })
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        response = NextResponse.next({ request: req })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return denyOrRedirect(req, isGuardedApi)
  return response
}

function denyOrRedirect(req: NextRequest, isApi: boolean) {
  if (isApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.redirect(new URL('/admin/login', req.url))
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
