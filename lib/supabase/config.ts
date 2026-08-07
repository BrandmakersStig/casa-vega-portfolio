/**
 * Whether Supabase env vars are present. When false, every function in
 * lib/data/* transparently falls back to the local JSON dataset in
 * lib/data/fallback/ (seeded from ~/Desktop/portfolio, see scripts/seed.ts)
 * so the site is fully browsable in local dev before a Supabase project
 * exists. This mirrors the fallback pattern used in the main casa-vega repo.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}
