import type { SiteSettings } from '@/types'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import fallback from './fallback/settings.json'

const DEFAULTS = fallback as SiteSettings

export async function getSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured()) return DEFAULTS

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!.from('settings').select('key, value')
  if (!data || data.length === 0) return DEFAULTS

  const overrides = Object.fromEntries(data.map((row) => [row.key, row.value]))
  return { ...DEFAULTS, ...overrides }
}
