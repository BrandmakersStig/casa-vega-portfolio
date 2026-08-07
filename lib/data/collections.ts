import type { Collection } from '@/types'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { mapCollectionRow } from './mappers'
import fallbackCollections from './fallback/collections.json'

const FALLBACK = fallbackCollections as Collection[]
// Two FK paths exist between collections and images (images.collection_id
// and collections.cover_image_id), so PostgREST needs an explicit
// !constraint_name hint on each embed to disambiguate which one to use.
const SELECT = '*, images!images_collection_id_fkey(count), cover:images!collections_cover_image_fk(*)'

export async function getCollections(opts: { featuredOnly?: boolean; includeAll?: boolean } = {}): Promise<Collection[]> {
  if (!isSupabaseConfigured()) {
    let list = opts.includeAll ? FALLBACK : FALLBACK.filter((c) => c.visibility === 'public')
    if (opts.featuredOnly) list = list.filter((c) => c.featured)
    list = list.sort((a, b) => a.sortOrder - b.sortOrder)
    return resolveSmartCollectionCounts(list)
  }

  // Admin views (includeAll) bypass RLS via the service-role client — the
  // anon-role client only has a public-collections read policy.
  const supabase = opts.includeAll ? getSupabaseAdminClient()! : (await getSupabaseServerClient())!
  let q = supabase.from('collections').select(SELECT).order('sort_order', { ascending: true })
  if (!opts.includeAll) q = q.eq('visibility', 'public')
  if (opts.featuredOnly) q = q.eq('featured', true)

  const { data, error } = await q
  if (error) throw error
  const collections = (data ?? []).map(mapCollectionRow)
  return resolveSmartCollectionCounts(collections)
}

/**
 * Smart collections have no images directly assigned (collection_id), so
 * the FK-based `images(count)` embed and stored cover_image_id are always
 * empty/null for them — evaluate their rules once against the full image
 * set to get an accurate count and a cover image.
 */
async function resolveSmartCollectionCounts(collections: Collection[]): Promise<Collection[]> {
  const smartOnes = collections.filter((c) => c.isSmart)
  if (smartOnes.length === 0) return collections

  const { getImages } = await import('./images')
  const { evaluateSmartRules } = await import('./smart-collections')
  const allImages = await getImages()

  return collections.map((c) => {
    if (!c.isSmart) return c
    const matched = evaluateSmartRules(c.smartRules, allImages)
    return {
      ...c,
      imageCount: matched.length,
      coverImageUrl: c.coverImageUrl ?? matched[0]?.urls.medium ?? null,
    }
  })
}

export async function getCollectionBySlug(
  slug: string,
  opts: { includeProtected?: boolean } = {}
): Promise<Collection | null> {
  if (!isSupabaseConfigured()) {
    const found = FALLBACK.find((c) => c.slug === slug)
    if (!found) return null
    const [resolved] = await resolveSmartCollectionCounts([found])
    return resolved
  }

  // Password-protected collections are excluded from the anon read policy
  // entirely (see supabase/migrations/0001_init.sql). Pages that need to
  // show the password gate (or have already verified the cookie) fetch
  // with the service-role client instead.
  const supabase = opts.includeProtected ? getSupabaseAdminClient()! : (await getSupabaseServerClient())!
  const { data } = await supabase.from('collections').select(SELECT).eq('slug', slug).single()
  if (!data) return null
  const [resolved] = await resolveSmartCollectionCounts([mapCollectionRow(data)])
  return resolved
}
