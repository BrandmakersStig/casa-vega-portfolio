/**
 * Central domain types for the portfolio.
 * Mirrors the Supabase schema in supabase/migrations/0001_init.sql.
 * Kept hand-written (not generated) so the local JSON dev-fallback
 * (lib/data/*) can share the exact same shapes as production.
 */

export type DownloadPolicy = 'none' | 'low' | 'original' | 'watermark'

export type InfoPanelMode = 'image-only' | 'title' | 'full'

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'top-rated'
  | 'most-viewed'
  | 'most-commented'
  | 'random'

export type LayoutMode = 'masonry' | 'justified' | 'grid' | 'pinterest'

export interface Exif {
  camera?: string | null
  lens?: string | null
  focalLength?: number | null
  iso?: number | null
  shutterSpeed?: string | null // formatted, e.g. "1/400"
  aperture?: number | null // f-number
  takenAt?: string | null // ISO date
  raw?: Record<string, unknown> | null
}

export interface GpsPosition {
  lat: number
  lng: number
}

export interface ImageDimensions {
  width: number
  height: number
}

export interface PortfolioImage {
  id: string
  collectionId: string
  /** Denormalized for stable /collections/[collectionSlug]/[slug] links regardless of backend. */
  collectionSlug: string
  slug: string
  title: string
  description: string | null // markdown
  keywords: string[]
  rating: number // 0-5, 0 = unrated
  location: string | null
  gps: GpsPosition | null
  exif: Exif
  dimensions: ImageDimensions
  isBlackAndWhite: boolean
  dominantColors: string[] // hex, extracted via node-vibrant
  blurhash: string | null
  visibility: 'public' | 'unlisted' | 'private'
  featured: boolean
  downloadPolicy: DownloadPolicy
  aiKeywords: string[] | null
  aiDescription: string | null
  aiGeneratedAt: string | null
  createdAt: string
  updatedAt: string
  sortOrder: number
  // Derived / joined at read time
  viewCount: number
  favoriteCount: number
  downloadCount: number
  shareCount: number
  commentCount: number
  urls: {
    original: string
    large: string // ~2560px, AVIF/WebP
    medium: string // ~1200px
    thumb: string // ~480px, for grids
  }
}

export interface Collection {
  id: string
  slug: string
  title: string
  description: string | null
  coverImageId: string | null
  coverImageUrl: string | null
  imageCount: number
  featured: boolean
  visibility: 'public' | 'unlisted' | 'private'
  passwordProtected: boolean
  isSmart: boolean
  smartRules: SmartCollectionRule[] | null
  createdAt: string
  updatedAt: string
  sortOrder: number
}

export interface SmartCollectionRule {
  field: 'rating' | 'keyword' | 'camera' | 'year' | 'isBlackAndWhite' | 'location'
  operator: 'eq' | 'gte' | 'lte' | 'contains'
  value: string | number | boolean
}

export interface Comment {
  id: string
  imageId: string
  parentId: string | null
  authorName: string
  authorEmail: string | null
  body: string
  likeCount: number
  status: 'pending' | 'approved' | 'rejected'
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export interface ClientGallery {
  id: string
  slug: string
  title: string
  clientName: string | null
  collectionIds: string[]
  imageIds: string[]
  passwordHash: string | null
  expiresAt: string | null
  allowFavorites: boolean
  allowDownload: boolean
  createdAt: string
}

export interface ImageStats {
  imageId: string
  views: number
  favorites: number
  downloads: number
  shares: number
  comments: number
}

export interface SiteSettings {
  heroMode: 'image' | 'slideshow' | 'video'
  heroImageIds: string[]
  heroVideoUrl: string | null
  siteTitle: string
  siteTagline: string
  aboutMarkdown: string
  contactEmail: string
  defaultInfoPanelMode: InfoPanelMode
  defaultLayoutMode: LayoutMode
  watermarkText: string | null
}

export interface FilterState {
  query: string
  ratingMin: number | null
  camera: string | null
  lens: string | null
  year: number | null
  location: string | null
  color: 'color' | 'bw' | null
  keywords: string[]
  collectionId: string | null
}
