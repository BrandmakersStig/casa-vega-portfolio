/**
 * snake_case DB row -> camelCase domain type mappers. Used only on the
 * Supabase path (lib/supabase/config.ts isSupabaseConfigured() === true) —
 * the dev-fallback JSON path already matches the domain types exactly.
 */
import type { Collection, Comment, Exif, PortfolioImage } from '@/types'

export interface ImageRow {
  id: string
  collection_id: string
  slug: string
  title: string
  description: string | null
  keywords: string[]
  rating: number
  location: string | null
  gps_lat: number | null
  gps_lng: number | null
  exif: Exif
  width: number
  height: number
  is_black_and_white: boolean
  dominant_colors: string[]
  blurhash: string | null
  visibility: 'public' | 'unlisted' | 'private'
  featured: boolean
  download_policy: PortfolioImage['downloadPolicy']
  ai_keywords: string[] | null
  ai_description: string | null
  ai_generated_at: string | null
  storage_path: string
  sort_order: number
  created_at: string
  updated_at: string
  image_stats?: { views: number; favorites: number; downloads: number; shares: number; comments: number }[] | null
  collection?: { slug: string } | null
}

const SUPABASE_STORAGE_BASE =
  process.env.NEXT_PUBLIC_SUPABASE_URL && `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`

function derivedUrl(storagePath: string, variant: 'thumb' | 'medium' | 'large' | 'original'): string {
  // Convention: admin upload writes <id>-<variant>.webp next to the
  // original inside the images-derived bucket. See lib/thumbnails.ts.
  const withoutExt = storagePath.replace(/\.[^/.]+$/, '')
  const bucket = variant === 'original' ? 'images-original' : 'images-derived'
  const file = variant === 'original' ? storagePath : `${withoutExt}-${variant}.webp`
  return `${SUPABASE_STORAGE_BASE}/${bucket}/${file}`
}

export function mapImageRow(row: ImageRow): PortfolioImage {
  const stats = row.image_stats?.[0]
  return {
    id: row.id,
    collectionId: row.collection_id,
    collectionSlug: row.collection?.slug ?? '',
    slug: row.slug,
    title: row.title,
    description: row.description,
    keywords: row.keywords ?? [],
    rating: row.rating,
    location: row.location,
    gps: row.gps_lat != null && row.gps_lng != null ? { lat: row.gps_lat, lng: row.gps_lng } : null,
    exif: row.exif ?? {},
    dimensions: { width: row.width, height: row.height },
    isBlackAndWhite: row.is_black_and_white,
    dominantColors: row.dominant_colors ?? [],
    blurhash: row.blurhash,
    visibility: row.visibility,
    featured: row.featured,
    downloadPolicy: row.download_policy,
    aiKeywords: row.ai_keywords,
    aiDescription: row.ai_description,
    aiGeneratedAt: row.ai_generated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sortOrder: row.sort_order,
    viewCount: stats?.views ?? 0,
    favoriteCount: stats?.favorites ?? 0,
    downloadCount: stats?.downloads ?? 0,
    shareCount: stats?.shares ?? 0,
    commentCount: stats?.comments ?? 0,
    urls: {
      original: derivedUrl(row.storage_path, 'original'),
      large: derivedUrl(row.storage_path, 'large'),
      medium: derivedUrl(row.storage_path, 'medium'),
      thumb: derivedUrl(row.storage_path, 'thumb'),
    },
  }
}

export interface CollectionRow {
  id: string
  slug: string
  title: string
  description: string | null
  cover_image_id: string | null
  featured: boolean
  visibility: 'public' | 'unlisted' | 'private'
  password_hash: string | null
  is_smart: boolean
  smart_rules: Collection['smartRules']
  sort_order: number
  created_at: string
  updated_at: string
  images?: { count: number }[]
  cover?: ImageRow | null
}

export function mapCollectionRow(row: CollectionRow): Collection {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    coverImageId: row.cover_image_id,
    coverImageUrl: row.cover ? mapImageRow(row.cover).urls.medium : null,
    imageCount: row.images?.[0]?.count ?? 0,
    featured: row.featured,
    visibility: row.visibility,
    passwordProtected: Boolean(row.password_hash),
    isSmart: row.is_smart,
    smartRules: row.smart_rules,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sortOrder: row.sort_order,
  }
}

export interface CommentRow {
  id: string
  image_id: string
  parent_id: string | null
  author_name: string
  author_email: string | null
  body: string
  like_count: number
  status: Comment['status']
  pinned: boolean
  created_at: string
  updated_at: string
}

export function mapCommentRow(row: CommentRow): Comment {
  return {
    id: row.id,
    imageId: row.image_id,
    parentId: row.parent_id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    body: row.body,
    likeCount: row.like_count,
    status: row.status,
    pinned: row.pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
