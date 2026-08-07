import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { isSupabaseAdminConfigured } from './config'

/**
 * Service-role client. Bypasses RLS — only ever import this from server-only
 * code (route handlers, server actions, admin pages). Never expose to the
 * client bundle. Null in dev-fallback mode (no Supabase project yet).
 */
export function getSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
