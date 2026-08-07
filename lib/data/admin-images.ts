import 'server-only'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import sharp from 'sharp'
import exifr from 'exifr'
import { encode as encodeBlurhash } from 'blurhash'
import { nanoid } from 'nanoid'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils/slugify'
import { normalizeExif, extractGps, type RawExif } from '@/lib/exif'
import { extractDominantColors } from '@/lib/color-palette'
import type { Collection, PortfolioImage } from '@/types'

const FALLBACK_DIR = path.join(process.cwd(), 'lib/data/fallback')
const PUBLIC_SEED_DIR = path.join(process.cwd(), 'public/seed')

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(path.join(FALLBACK_DIR, file), 'utf-8'))
}
async function writeJson(file: string, data: unknown) {
  await writeFile(path.join(FALLBACK_DIR, file), JSON.stringify(data, null, 2))
}

async function isGrayscale(buffer: Buffer): Promise<boolean> {
  const stats = await sharp(buffer).resize(32, 32, { fit: 'inside' }).stats()
  const [r, g, b] = stats.channels
  return Math.max(Math.abs(r.mean - g.mean), Math.abs(g.mean - b.mean), Math.abs(r.mean - b.mean)) < 6
}

async function makeBlurhash(buffer: Buffer): Promise<string> {
  const { data, info } = await sharp(buffer).resize(32, 32, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return encodeBlurhash(new Uint8ClampedArray(data), info.width, info.height, 4, 4)
}

export interface UploadInput {
  buffer: Buffer
  collectionId: string
  /** Used when the collection doesn't exist yet (fallback mode) or to seed a new Supabase collection. */
  newCollectionTitle?: string
}

/**
 * Processes and stores one uploaded photo: EXIF extraction, WebP thumb/medium/large
 * derivatives, blurhash, dominant-colour palette, grayscale detection — then
 * persists it either to Supabase (Storage + DB) or the local dev-fallback
 * dataset, mirroring scripts/seed.ts so both paths produce identical shapes.
 */
export async function createImageFromUpload(input: UploadInput): Promise<PortfolioImage> {
  const { buffer } = input
  const meta = await sharp(buffer).metadata()
  const rawExif = (await exifr.parse(buffer, true).catch(() => null)) as RawExif | null
  const [dominantColors, grayscale, blurhash] = await Promise.all([
    extractDominantColors(buffer),
    isGrayscale(buffer),
    makeBlurhash(buffer),
  ])

  const width = meta.width ?? 1600
  const height = meta.height ?? 1067
  const now = new Date().toISOString()

  if (isSupabaseConfigured()) {
    const admin = getSupabaseAdminClient()!

    // Resolve the real collection UUID. When the visitor typed a new
    // collection name, `input.collectionId` is NOT a valid id at all (the
    // client sends the new title in its place) — this branch previously
    // ignored `newCollectionTitle` entirely and inserted straight into
    // `input.collectionId`, which either silently landed in whatever
    // collection happened to be selected in the dropdown, or crashed with
    // an invalid-UUID error if it wasn't one. Upsert-by-slug so re-uploads
    // into the same new collection name don't create duplicates.
    let collectionId = input.collectionId
    if (input.newCollectionTitle?.trim()) {
      const slug = slugify(input.newCollectionTitle.trim())
      const { data: collection, error: collectionError } = await admin
        .from('collections')
        .upsert({ slug, title: input.newCollectionTitle.trim() }, { onConflict: 'slug', ignoreDuplicates: false })
        .select('id')
        .single()
      if (collectionError) throw collectionError
      collectionId = collection.id
    }

    // Must be a real UUID — images.id is `uuid primary key`. nanoid()'s
    // output (used elsewhere for non-DB ids like storage-only filenames)
    // is NOT a valid UUID and Postgres rejects it outright (22P02).
    const id = randomUUID()
    const storagePath = `${collectionId}/${id}.${meta.format ?? 'jpg'}`

    const sizes: Array<{ name: 'thumb' | 'medium' | 'large'; width: number; quality: number }> = [
      { name: 'thumb', width: 480, quality: 72 },
      { name: 'medium', width: 1200, quality: 82 },
      { name: 'large', width: 2200, quality: 82 },
    ]
    await Promise.all([
      admin.storage.from('images-original').upload(storagePath, buffer, { contentType: `image/${meta.format}` }),
      ...sizes.map(async ({ name, width: w, quality }) => {
        const derived = await sharp(buffer).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality }).toBuffer()
        const derivedPath = `${collectionId}/${id}-${name}.webp`
        await admin.storage.from('images-derived').upload(derivedPath, derived, { contentType: 'image/webp' })
      }),
    ])

    const gps = extractGps(rawExif)
    const { data, error } = await admin
      .from('images')
      .insert({
        id,
        collection_id: collectionId,
        slug: slugify(id),
        title: 'Untitled',
        keywords: [],
        rating: 0,
        gps_lat: gps?.lat ?? null,
        gps_lng: gps?.lng ?? null,
        exif: normalizeExif(rawExif),
        width,
        height,
        is_black_and_white: grayscale,
        dominant_colors: dominantColors,
        blurhash,
        storage_path: storagePath,
      })
      // Two FK paths exist between images and collections (collection_id
      // and collections.cover_image_id), so PostgREST needs the explicit
      // !constraint_name hint — same fix as lib/data/images.ts.
      .select('*, collection:collections!images_collection_id_fkey(slug)')
      .single()
    if (error) throw error

    const { mapImageRow } = await import('./mappers')
    return mapImageRow(data)
  }

  // --- Dev-fallback path: write derivatives into public/seed, append JSON ---
  const collections = await readJson<Collection[]>('collections.json')
  let collection = collections.find((c) => c.id === input.collectionId)
  if (!collection && input.newCollectionTitle) {
    const slug = slugify(input.newCollectionTitle)
    collection = {
      id: slug,
      slug,
      title: input.newCollectionTitle,
      description: null,
      coverImageId: null,
      coverImageUrl: null,
      imageCount: 0,
      featured: false,
      visibility: 'public',
      passwordProtected: false,
      isSmart: false,
      smartRules: null,
      createdAt: now,
      updatedAt: now,
      sortOrder: collections.length,
    }
    collections.push(collection)
  }
  if (!collection) throw new Error('Collection not found')

  const imageId = nanoid()
  const outDir = path.join(PUBLIC_SEED_DIR, collection.slug)
  await mkdir(outDir, { recursive: true })

  const sizes: Array<{ name: 'thumb' | 'medium' | 'large'; width: number; quality: number }> = [
    { name: 'thumb', width: 480, quality: 72 },
    { name: 'medium', width: 1200, quality: 82 },
    { name: 'large', width: 2200, quality: 82 },
  ]
  for (const { name, width: w, quality } of sizes) {
    await sharp(buffer)
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality })
      .toFile(path.join(outDir, `${imageId}-${name}.webp`))
  }

  const gps = extractGps(rawExif)
  const images = await readJson<PortfolioImage[]>('images.json')
  const image: PortfolioImage = {
    id: imageId,
    collectionId: collection.id,
    collectionSlug: collection.slug,
    slug: imageId,
    title: 'Untitled',
    description: null,
    keywords: [],
    rating: 0,
    location: null,
    gps,
    exif: normalizeExif(rawExif),
    dimensions: { width, height },
    isBlackAndWhite: grayscale,
    dominantColors,
    blurhash,
    visibility: 'public',
    featured: false,
    downloadPolicy: 'low',
    aiKeywords: null,
    aiDescription: null,
    aiGeneratedAt: null,
    createdAt: rawExif?.DateTimeOriginal ? new Date(rawExif.DateTimeOriginal).toISOString() : now,
    updatedAt: now,
    sortOrder: images.filter((i) => i.collectionId === collection!.id).length,
    viewCount: 0,
    favoriteCount: 0,
    downloadCount: 0,
    shareCount: 0,
    commentCount: 0,
    urls: {
      original: `/seed/${collection.slug}/${imageId}-large.webp`,
      large: `/seed/${collection.slug}/${imageId}-large.webp`,
      medium: `/seed/${collection.slug}/${imageId}-medium.webp`,
      thumb: `/seed/${collection.slug}/${imageId}-thumb.webp`,
    },
  }
  images.push(image)

  collection.imageCount += 1
  if (!collection.coverImageId) {
    collection.coverImageId = image.id
    collection.coverImageUrl = image.urls.medium
  }

  await writeJson('images.json', images)
  await writeJson('collections.json', collections)

  return image
}

type ImagePatch = Partial<
  Pick<
    PortfolioImage,
    | 'title'
    | 'description'
    | 'keywords'
    | 'rating'
    | 'collectionId'
    | 'visibility'
    | 'featured'
    | 'downloadPolicy'
    | 'location'
    | 'aiKeywords'
    | 'aiDescription'
    | 'aiGeneratedAt'
  >
>

const PATCH_TO_COLUMN: Record<string, string> = {
  title: 'title',
  description: 'description',
  keywords: 'keywords',
  rating: 'rating',
  collectionId: 'collection_id',
  visibility: 'visibility',
  featured: 'featured',
  downloadPolicy: 'download_policy',
  location: 'location',
  aiKeywords: 'ai_keywords',
  aiDescription: 'ai_description',
  aiGeneratedAt: 'ai_generated_at',
}

export async function updateImage(id: string, patch: ImagePatch): Promise<void> {
  if (!isSupabaseConfigured()) {
    const images = await readJson<PortfolioImage[]>('images.json')
    const idx = images.findIndex((i) => i.id === id)
    if (idx === -1) return
    images[idx] = { ...images[idx], ...patch, updatedAt: new Date().toISOString() }
    await writeJson('images.json', images)
    return
  }
  const admin = getSupabaseAdminClient()!
  const row: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    row[PATCH_TO_COLUMN[key] ?? key] = value
  }
  await admin.from('images').update(row).eq('id', id)
}

export async function batchUpdateImages(ids: string[], patch: ImagePatch): Promise<void> {
  if (!isSupabaseConfigured()) {
    const images = await readJson<PortfolioImage[]>('images.json')
    const now = new Date().toISOString()
    const next = images.map((img) => (ids.includes(img.id) ? { ...img, ...patch, updatedAt: now } : img))
    await writeJson('images.json', next)
    return
  }
  const admin = getSupabaseAdminClient()!
  const row: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    row[PATCH_TO_COLUMN[key] ?? key] = value
  }
  await admin.from('images').update(row).in('id', ids)
}

export async function deleteImages(ids: string[]): Promise<void> {
  if (!isSupabaseConfigured()) {
    const images = await readJson<PortfolioImage[]>('images.json')
    await writeJson('images.json', images.filter((i) => !ids.includes(i.id)))
    return
  }
  const admin = getSupabaseAdminClient()!
  await admin.from('images').delete().in('id', ids)
}
