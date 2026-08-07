import type { SiteSettings } from '@/types'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import fallback from './fallback/settings.json'

// Dev-fallback mode: fallback/settings.json IS the settings store, seeded
// with real demo hero image IDs by scripts/seed.ts.
const FALLBACK_DEFAULTS = fallback as SiteSettings

// Supabase mode, empty/partial `settings` table: generic, safe defaults.
// Must NOT reference dev-fallback seed image ids (they're slugs like
// "buddy-02", not UUIDs, and don't exist in a real Supabase project) — the
// homepage crashed on exactly this before this fix.
const SUPABASE_DEFAULTS: SiteSettings = {
  heroMode: 'image',
  heroImageIds: [],
  heroVideoUrl: null,
  siteTitle: 'Portfolio',
  siteTagline: 'Øjeblikke, komponeret.',
  aboutMarkdown: '## Om\n\nSkriv en introduktion her fra /admin/settings.',
  contactEmail: 'kontakt@example.com',
  contactHeading: 'Kontakt',
  contactIntro: 'Interesseret i et samarbejde, print eller en klientgalleri? Skriv endelig.',
  defaultInfoPanelMode: 'title',
  defaultLayoutMode: 'justified',
  watermarkText: null,
}

export async function getSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured()) return FALLBACK_DEFAULTS

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!.from('settings').select('key, value')
  const overrides = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]))
  return { ...SUPABASE_DEFAULTS, ...overrides }
}
