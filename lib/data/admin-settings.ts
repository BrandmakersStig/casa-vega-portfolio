import 'server-only'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { SiteSettings } from '@/types'

const FALLBACK_PATH = path.join(process.cwd(), 'lib/data/fallback/settings.json')

export async function updateSettings(patch: Partial<SiteSettings>): Promise<void> {
  if (!isSupabaseConfigured()) {
    const current = JSON.parse(await readFile(FALLBACK_PATH, 'utf-8'))
    await writeFile(FALLBACK_PATH, JSON.stringify({ ...current, ...patch }, null, 2))
    return
  }
  const admin = getSupabaseAdminClient()!
  await Promise.all(
    Object.entries(patch).map(([key, value]) => admin.from('settings').upsert({ key, value }))
  )
}
