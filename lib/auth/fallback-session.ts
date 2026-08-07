import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Dev-fallback admin auth — used only when Supabase isn't configured
 * (lib/supabase/config.ts). In Supabase mode, /admin uses real Supabase
 * Auth instead (see lib/auth/require-admin.ts). This exists so the admin
 * dashboard is demonstrable and genuinely gated before a Supabase project
 * exists, not just in production.
 */
export const FALLBACK_SESSION_COOKIE = 'portfolio_admin_session'

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? 'dev-only-insecure-secret-change-me'
}

export function signFallbackSession(): string {
  return createHmac('sha256', secret()).update('admin').digest('hex')
}

export function verifyFallbackSession(token: string | undefined | null): boolean {
  if (!token) return false
  const expected = signFallbackSession()
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function checkFallbackPassword(password: string): boolean {
  const expected = process.env.ADMIN_FALLBACK_PASSWORD ?? 'portfolio-admin'
  const a = Buffer.from(password)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
