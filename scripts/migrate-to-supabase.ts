/**
 * One-off migration: pushes the local dev-fallback dataset
 * (lib/data/fallback/{collections,images}.json + the WebP derivatives in
 * public/seed/) into a real Supabase project — Storage buckets + DB rows.
 *
 * Uses the already-generated `large` WebP (2200px) as the "original" bucket
 * content too, matching how dev-fallback mode already treats
 * `urls.original === urls.large` — no need to re-touch the source photo
 * folder. Safe to re-run: collections upsert on slug, images upsert on
 * (collection_id, slug).
 *
 * Usage: npm run migrate:supabase
 */
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Collection, PortfolioImage } from '../types'

const ROOT = path.join(__dirname, '..')

function loadEnvLocal() {
  const envPath = path.join(ROOT, '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}
loadEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Mangler NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY i .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const collections: Collection[] = JSON.parse(readFileSync(path.join(ROOT, 'lib/data/fallback/collections.json'), 'utf-8'))
const images: PortfolioImage[] = JSON.parse(readFileSync(path.join(ROOT, 'lib/data/fallback/images.json'), 'utf-8'))

async function main() {
  console.log(`Migrerer ${collections.length} collections og ${images.length} billeder til Supabase...\n`)

  const collectionIdMap = new Map<string, string>() // old (slug) id -> new uuid

  for (const c of collections) {
    const { data, error } = await supabase
      .from('collections')
      .upsert(
        {
          slug: c.slug,
          title: c.title,
          description: c.description,
          featured: c.featured,
          visibility: c.visibility,
          sort_order: c.sortOrder,
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single()

    if (error || !data) {
      console.error(`  ✗ collection "${c.title}":`, error?.message)
      continue
    }
    collectionIdMap.set(c.id, data.id)
    console.log(`  ✓ collection "${c.title}" -> ${data.id}`)
  }

  console.log('')
  let uploaded = 0
  let failed = 0

  for (const [i, img] of images.entries()) {
    const newCollectionId = collectionIdMap.get(img.collectionId)
    if (!newCollectionId) {
      console.warn(`  [${i + 1}/${images.length}] springer over ${img.id} — collection ikke fundet`)
      failed++
      continue
    }

    const seedDir = path.join(ROOT, 'public', 'seed', img.collectionSlug)
    const files = {
      large: path.join(seedDir, `${img.slug}-large.webp`),
      medium: path.join(seedDir, `${img.slug}-medium.webp`),
      thumb: path.join(seedDir, `${img.slug}-thumb.webp`),
    }
    if (!existsSync(files.large) || !existsSync(files.medium) || !existsSync(files.thumb)) {
      console.warn(`  [${i + 1}/${images.length}] springer over ${img.id} — mangler fil i public/seed/${img.collectionSlug}/`)
      failed++
      continue
    }

    const largeBuf = readFileSync(files.large)
    const mediumBuf = readFileSync(files.medium)
    const thumbBuf = readFileSync(files.thumb)
    const storagePath = `${img.collectionSlug}/${img.slug}.webp`

    const uploads = await Promise.all([
      supabase.storage.from('images-original').upload(storagePath, largeBuf, { contentType: 'image/webp', upsert: true }),
      supabase.storage
        .from('images-derived')
        .upload(`${img.collectionSlug}/${img.slug}-large.webp`, largeBuf, { contentType: 'image/webp', upsert: true }),
      supabase.storage
        .from('images-derived')
        .upload(`${img.collectionSlug}/${img.slug}-medium.webp`, mediumBuf, { contentType: 'image/webp', upsert: true }),
      supabase.storage
        .from('images-derived')
        .upload(`${img.collectionSlug}/${img.slug}-thumb.webp`, thumbBuf, { contentType: 'image/webp', upsert: true }),
    ])
    const uploadError = uploads.find((u) => u.error)?.error
    if (uploadError) {
      console.error(`  [${i + 1}/${images.length}] ✗ upload ${img.id}:`, uploadError.message)
      failed++
      continue
    }

    const { data: inserted, error } = await supabase
      .from('images')
      .upsert(
        {
          collection_id: newCollectionId,
          slug: img.slug,
          title: img.title,
          description: img.description,
          keywords: img.keywords,
          rating: img.rating,
          location: img.location,
          gps_lat: img.gps?.lat ?? null,
          gps_lng: img.gps?.lng ?? null,
          exif: img.exif,
          width: img.dimensions.width,
          height: img.dimensions.height,
          is_black_and_white: img.isBlackAndWhite,
          dominant_colors: img.dominantColors,
          blurhash: img.blurhash,
          visibility: img.visibility,
          featured: img.featured,
          download_policy: img.downloadPolicy,
          storage_path: storagePath,
          sort_order: img.sortOrder,
          created_at: img.createdAt,
        },
        { onConflict: 'collection_id,slug' }
      )
      .select('id')
      .single()

    if (error || !inserted) {
      console.error(`  [${i + 1}/${images.length}] ✗ db-insert ${img.id}:`, error?.message)
      failed++
      continue
    }

    // Preserve the cover image relationship from the fallback data.
    const parentCollection = collections.find((c) => c.id === img.collectionId)
    if (parentCollection?.coverImageId === img.id) {
      await supabase.from('collections').update({ cover_image_id: inserted.id }).eq('id', newCollectionId)
    }

    uploaded++
    if (uploaded % 20 === 0 || i === images.length - 1) {
      console.log(`  [${i + 1}/${images.length}] ${uploaded} migreret, ${failed} fejlet...`)
    }
  }

  console.log(`\nFærdig. ${uploaded}/${images.length} billeder migreret${failed ? `, ${failed} fejlede` : ''}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
