import type { SupabaseClient } from '@supabase/supabase-js'
import type { FilterState, PortfolioImage, SortOption } from '@/types'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { mapImageRow } from './mappers'
import fallbackImages from './fallback/images.json'
import fallbackCollections from './fallback/collections.json'
import type { Collection } from '@/types'

const FALLBACK = fallbackImages as PortfolioImage[]
const PROTECTED_COLLECTION_IDS = new Set(
  (fallbackCollections as Collection[]).filter((c) => c.passwordProtected).map((c) => c.id)
)

// image_stats is a view (not a table with an FK to images), so PostgREST
// can't auto-detect it for `select('*, image_stats(*)')` embedding — fetch
// it as a separate query and merge instead.
async function attachStats(supabase: SupabaseClient, images: PortfolioImage[]): Promise<PortfolioImage[]> {
  if (images.length === 0) return images
  const { data } = await supabase
    .from('image_stats')
    .select('image_id, views, favorites, downloads, shares, comments')
    .in(
      'image_id',
      images.map((i) => i.id)
    )
  const byId = new Map((data ?? []).map((s) => [s.image_id, s]))
  return images.map((img) => {
    const s = byId.get(img.id)
    return s
      ? { ...img, viewCount: s.views, favoriteCount: s.favorites, downloadCount: s.downloads, shareCount: s.shares, commentCount: s.comments }
      : img
  })
}

export interface ImageQuery {
  collectionId?: string
  ids?: string[]
  featured?: boolean
  filters?: Partial<FilterState>
  sort?: SortOption
  limit?: number
  offset?: number
  /** Admin views only — bypasses the public-visibility filter (and RLS, via the service-role client in Supabase mode). */
  includeAll?: boolean
}

function matchesFilters(image: PortfolioImage, filters?: Partial<FilterState>): boolean {
  if (!filters) return true
  if (filters.query) {
    const q = filters.query.toLowerCase()
    const haystack = [
      image.title,
      image.description ?? '',
      image.location ?? '',
      image.exif.camera ?? '',
      ...image.keywords,
    ]
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(q)) return false
  }
  if (filters.ratingMin != null && image.rating < filters.ratingMin) return false
  if (filters.camera && image.exif.camera !== filters.camera) return false
  if (filters.lens && image.exif.lens !== filters.lens) return false
  if (filters.year != null) {
    const year = image.exif.takenAt ? new Date(image.exif.takenAt).getFullYear() : new Date(image.createdAt).getFullYear()
    if (year !== filters.year) return false
  }
  if (filters.location && image.location !== filters.location) return false
  if (filters.color === 'bw' && !image.isBlackAndWhite) return false
  if (filters.color === 'color' && image.isBlackAndWhite) return false
  if (filters.keywords?.length) {
    const hasAll = filters.keywords.every((k) => image.keywords.includes(k))
    if (!hasAll) return false
  }
  if (filters.collectionId && image.collectionId !== filters.collectionId) return false
  return true
}

function sortImages(images: PortfolioImage[], sort?: SortOption): PortfolioImage[] {
  const list = [...images]
  switch (sort) {
    case 'oldest':
      return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    case 'top-rated':
      return list.sort((a, b) => b.rating - a.rating)
    case 'most-viewed':
      return list.sort((a, b) => b.viewCount - a.viewCount)
    case 'most-commented':
      return list.sort((a, b) => b.commentCount - a.commentCount)
    case 'random':
      return list.sort(() => Math.random() - 0.5)
    case 'newest':
    default:
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}

export async function getImages(query: ImageQuery = {}): Promise<PortfolioImage[]> {
  if (!isSupabaseConfigured()) {
    let list = query.includeAll ? FALLBACK : FALLBACK.filter((i) => i.visibility === 'public' && !PROTECTED_COLLECTION_IDS.has(i.collectionId))
    if (query.collectionId) list = list.filter((i) => i.collectionId === query.collectionId)
    if (query.ids) list = list.filter((i) => query.ids!.includes(i.id))
    if (query.featured) list = list.filter((i) => i.featured)
    list = list.filter((i) => matchesFilters(i, query.filters))
    list = sortImages(list, query.sort)
    if (query.offset) list = list.slice(query.offset)
    if (query.limit) list = list.slice(0, query.limit)
    return list
  }

  const supabase = query.includeAll ? getSupabaseAdminClient()! : (await getSupabaseServerClient())!
  let q = supabase.from('images').select('*, collection:collections!images_collection_id_fkey(slug)')
  if (!query.includeAll) q = q.eq('visibility', 'public')

  if (query.collectionId) q = q.eq('collection_id', query.collectionId)
  if (query.ids) q = q.in('id', query.ids)
  if (query.featured) q = q.eq('featured', true)
  if (query.filters?.ratingMin != null) q = q.gte('rating', query.filters.ratingMin)
  if (query.filters?.camera) q = q.eq('exif->>camera', query.filters.camera)
  if (query.filters?.location) q = q.eq('location', query.filters.location)
  if (query.filters?.color === 'bw') q = q.eq('is_black_and_white', true)
  if (query.filters?.color === 'color') q = q.eq('is_black_and_white', false)
  if (query.filters?.keywords?.length) q = q.contains('keywords', query.filters.keywords)
  if (query.filters?.query) {
    q = q.textSearch('title', query.filters.query, { type: 'websearch', config: 'simple' })
  }

  switch (query.sort) {
    case 'oldest':
      q = q.order('created_at', { ascending: true })
      break
    case 'top-rated':
      q = q.order('rating', { ascending: false })
      break
    case 'newest':
      q = q.order('created_at', { ascending: false })
      break
    default:
      q = q.order('sort_order', { ascending: true })
  }

  if (query.limit) q = q.range(query.offset ?? 0, (query.offset ?? 0) + query.limit - 1)

  const { data, error } = await q
  if (error) throw error
  let mapped = await attachStats(supabase, (data ?? []).map(mapImageRow))
  if (query.sort === 'most-viewed' || query.sort === 'most-commented' || query.sort === 'random') {
    mapped = sortImages(mapped, query.sort)
  }
  return mapped
}

export async function getImageBySlug(collectionSlug: string, imageSlug: string): Promise<PortfolioImage | null> {
  if (!isSupabaseConfigured()) {
    const image = FALLBACK.find((i) => i.slug === imageSlug && i.collectionSlug === collectionSlug)
    return image ?? null
  }
  const supabase = (await getSupabaseServerClient())!
  const { data: collection } = await supabase.from('collections').select('id').eq('slug', collectionSlug).single()
  if (!collection) return null
  const { data } = await supabase
    .from('images')
    .select('*, collection:collections!images_collection_id_fkey(slug)')
    .eq('collection_id', collection.id)
    .eq('slug', imageSlug)
    .single()
  if (!data) return null
  const [withStats] = await attachStats(supabase, [mapImageRow(data)])
  return withStats
}

export async function getImageById(id: string): Promise<PortfolioImage | null> {
  if (!isSupabaseConfigured()) return FALLBACK.find((i) => i.id === id) ?? null
  const supabase = (await getSupabaseServerClient())!
  const { data } = await supabase.from('images').select('*, collection:collections!images_collection_id_fkey(slug)').eq('id', id).single()
  if (!data) return null
  const [withStats] = await attachStats(supabase, [mapImageRow(data)])
  return withStats
}

export interface Facets {
  cameras: string[]
  lenses: string[]
  locations: string[]
  years: number[]
  keywords: string[]
}

export async function getFacets(): Promise<Facets> {
  const images = await getImages()
  const cameras = new Set<string>()
  const lenses = new Set<string>()
  const locations = new Set<string>()
  const years = new Set<number>()
  const keywords = new Set<string>()

  for (const img of images) {
    if (img.exif.camera) cameras.add(img.exif.camera)
    if (img.exif.lens) lenses.add(img.exif.lens)
    if (img.location) locations.add(img.location)
    const year = img.exif.takenAt ? new Date(img.exif.takenAt).getFullYear() : new Date(img.createdAt).getFullYear()
    years.add(year)
    img.keywords.forEach((k) => keywords.add(k))
  }

  return {
    cameras: [...cameras].sort(),
    lenses: [...lenses].sort(),
    locations: [...locations].sort(),
    years: [...years].sort((a, b) => b - a),
    keywords: [...keywords].sort(),
  }
}
