'use client'

import { createBrowserClient } from '@supabase/ssr'
import { isSupabaseConfigured } from './config'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

/** Browser Supabase client. Returns null when env vars aren't set (dev-fallback mode). */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}
