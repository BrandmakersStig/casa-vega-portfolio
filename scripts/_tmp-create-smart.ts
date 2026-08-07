import { readFileSync } from 'node:fs'
import path from 'node:path'
function loadEnvLocal() {
  for (const line of readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    process.env[t.slice(0, eq).trim()] ||= t.slice(eq + 1).trim()
  }
}
loadEnvLocal()
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
async function main() {
  const { data, error } = await supabase
    .from('collections')
    .upsert({ slug: 'top-rated-test', title: 'Top Rated (test)', is_smart: true, smart_rules: [{ field: 'rating', operator: 'gte', value: 4 }], sort_order: 99 }, { onConflict: 'slug' })
    .select()
    .single()
  if (error) throw error
  console.log('created', data.id)
}
main()
