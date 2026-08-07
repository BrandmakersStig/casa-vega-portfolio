import type { ClientGallery, PortfolioImage } from '@/types'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getImages } from './images'
import fallbackGalleries from './fallback/client-galleries.json'

// Client galleries are only ever read/written through the service-role
// client (they're not RLS-public — access is gated by the password cookie
// in lib/auth/client-gallery-access.ts, not Postgres row security), so
// there's no separate anon-role code path here like the other lib/data/*
// modules have.
interface GalleryRowWithSecret {
  id: string
  slug: string
  title: string
  client_name: string | null
  collection_ids: string[]
  image_ids: string[]
  password_hash: string | null
  expires_at: string | null
  allow_favorites: boolean
  allow_download: boolean
  created_at: string
}

function mapRow(row: GalleryRowWithSecret): ClientGallery {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    clientName: row.client_name,
    collectionIds: row.collection_ids ?? [],
    imageIds: row.image_ids ?? [],
    passwordProtected: Boolean(row.password_hash),
    expiresAt: row.expires_at,
    allowFavorites: row.allow_favorites,
    allowDownload: row.allow_download,
    createdAt: row.created_at,
  }
}

export async function getClientGalleryBySlug(slug: string): Promise<ClientGallery | null> {
  if (!isSupabaseConfigured()) {
    const galleries = fallbackGalleries as unknown as GalleryRowWithSecret[]
    const found = galleries.find((g) => g.slug === slug)
    return found ? mapRow(found) : null
  }
  const admin = getSupabaseAdminClient()!
  const { data } = await admin.from('client_galleries').select('*').eq('slug', slug).single()
  return data ? mapRow(data) : null
}

/** Resolves the union of images belonging to a gallery's collections plus its individually-picked images, deduped. */
export async function getClientGalleryImages(gallery: ClientGallery): Promise<PortfolioImage[]> {
  const seen = new Map<string, PortfolioImage>()

  for (const collectionId of gallery.collectionIds) {
    const images = await getImages({ collectionId, includeAll: true })
    images.forEach((i) => seen.set(i.id, i))
  }
  if (gallery.imageIds.length > 0) {
    const images = await getImages({ ids: gallery.imageIds, includeAll: true })
    images.forEach((i) => seen.set(i.id, i))
  }

  return [...seen.values()]
}
