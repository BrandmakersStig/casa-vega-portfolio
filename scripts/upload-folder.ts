/**
 * Uploads every image in a single folder into a (possibly new) Supabase
 * collection, using the exact same processing steps as the admin upload
 * route (lib/data/admin-images.ts createImageFromUpload) — EXIF, WebP
 * thumb/medium/large, blurhash, dominant-colour palette, grayscale
 * detection. Useful for bulk-adding a new folder without going through the
 * browser one file at a time, and doubles as an end-to-end verification of
 * that same pipeline.
 *
 * Usage: npx tsx scripts/upload-folder.ts "/path/to/folder" "Collection Title"
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import sharp from 'sharp'
import exifr from 'exifr'
import { encode as encodeBlurhash } from 'blurhash'
import { createClient } from '@supabase/supabase-js'
import { slugify } from '../lib/utils/slugify'
import { normalizeExif, extractGps, type RawExif } from '../lib/exif'
import { extractDominantColors } from '../lib/color-palette'

const ROOT = path.join(__dirname, '..')

function loadEnvLocal() {
  const envPath = path.join(ROOT, '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    const value = t.slice(eq + 1).trim()
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

const folderPath = process.argv[2]
const collectionTitle = process.argv[3]
if (!folderPath || !collectionTitle) {
  console.error('Brug: npx tsx scripts/upload-folder.ts "/sti/til/mappe" "Collection Titel"')
  process.exit(1)
}

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])

async function isGrayscale(buffer: Buffer): Promise<boolean> {
  const stats = await sharp(buffer).resize(32, 32, { fit: 'inside' }).stats()
  const [r, g, b] = stats.channels
  return Math.max(Math.abs(r.mean - g.mean), Math.abs(g.mean - b.mean), Math.abs(r.mean - b.mean)) < 6
}

async function makeBlurhash(buffer: Buffer): Promise<string> {
  const { data, info } = await sharp(buffer).resize(32, 32, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return encodeBlurhash(new Uint8ClampedArray(data), info.width, info.height, 4, 4)
}

async function main() {
  const files = readdirSync(folderPath)
    .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
    .sort()
  if (files.length === 0) {
    console.error('Ingen billeder fundet i', folderPath)
    process.exit(1)
  }
  console.log(`Uploader ${files.length} billeder fra "${folderPath}" til collection "${collectionTitle}"...\n`)

  const slug = slugify(collectionTitle)
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .upsert({ slug, title: collectionTitle }, { onConflict: 'slug' })
    .select('id')
    .single()
  if (collectionError) throw collectionError
  console.log(`Collection klar: ${collectionTitle} -> ${collection.id}\n`)

  let uploaded = 0
  let failed = 0

  for (const [i, file] of files.entries()) {
    const filePath = path.join(folderPath, file)
    const buffer = readFileSync(filePath)
    process.stdout.write(`  [${i + 1}/${files.length}] ${file} ... `)

    try {
      const meta = await sharp(buffer).metadata()
      const rawExif = (await exifr.parse(buffer, true).catch(() => null)) as RawExif | null
      const [dominantColors, grayscale, blurhash] = await Promise.all([
        extractDominantColors(buffer),
        isGrayscale(buffer),
        makeBlurhash(buffer),
      ])

      const id = randomUUID() // must be a real UUID — images.id is `uuid primary key`
      const storagePath = `${collection.id}/${id}.${meta.format ?? 'jpg'}`

      const sizes: Array<{ name: 'thumb' | 'medium' | 'large'; width: number; quality: number }> = [
        { name: 'thumb', width: 480, quality: 72 },
        { name: 'medium', width: 1200, quality: 82 },
        { name: 'large', width: 2200, quality: 82 },
      ]
      const uploads = await Promise.all([
        supabase.storage.from('images-original').upload(storagePath, buffer, { contentType: `image/${meta.format}` }),
        ...sizes.map(async ({ name, width: w, quality }) => {
          const derived = await sharp(buffer).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality }).toBuffer()
          return supabase.storage.from('images-derived').upload(`${collection.id}/${id}-${name}.webp`, derived, { contentType: 'image/webp' })
        }),
      ])
      const uploadError = uploads.find((u) => u.error)?.error
      if (uploadError) throw uploadError

      const gps = extractGps(rawExif)
      const { error } = await supabase.from('images').insert({
        id,
        collection_id: collection.id,
        slug: slugify(id),
        title: 'Untitled',
        keywords: [],
        rating: 0,
        gps_lat: gps?.lat ?? null,
        gps_lng: gps?.lng ?? null,
        exif: normalizeExif(rawExif),
        width: meta.width ?? 1600,
        height: meta.height ?? 1067,
        is_black_and_white: grayscale,
        dominant_colors: dominantColors,
        blurhash,
        storage_path: storagePath,
      })
      if (error) throw error

      // Same fix as lib/data/admin-images.ts: a collection's cover_image_id
      // is never auto-set — without this the collection card stays a blank
      // grey placeholder forever. Only set it once, for the first image.
      await supabase.from('collections').update({ cover_image_id: id }).eq('id', collection.id).is('cover_image_id', null)

      uploaded++
      process.stdout.write('done\n')
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : JSON.stringify(err)
      process.stdout.write(`FEJL: ${message}\n`)
    }
  }

  console.log(`\nFærdig. ${uploaded}/${files.length} uploadet${failed ? `, ${failed} fejlede` : ''}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
