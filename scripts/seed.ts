/**
 * Local dev-fallback seed generator.
 *
 * Scans a source folder of collection subfolders (each subfolder = one
 * collection, each image inside = one photo), extracts EXIF, generates
 * WebP derivatives + blurhash + a dominant colour palette, and writes:
 *
 *   - public/seed/<collection>/<slug>-{thumb,medium,large}.webp
 *   - lib/data/fallback/{collections,images,settings}.json
 *
 * These fallback files are what the site reads from when Supabase env vars
 * are not configured (see lib/supabase/config.ts + lib/data/*), so the
 * portfolio is fully browsable in local dev without a backend.
 *
 * public/seed/ (binary WebP derivatives) is gitignored — regenerate it
 * locally any time. lib/data/fallback/*.json is tracked with safe empty
 * defaults out of the box; this script overwrites it locally with your real
 * photo metadata, and you decide whether to commit that. Re-run any time:
 *
 *   npm run seed -- /path/to/folder-of-collections
 *
 * Defaults to ~/Desktop/portfolio.
 */
import { readdirSync, statSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import { homedir } from 'node:os'
import sharp from 'sharp'
import exifr from 'exifr'
import { encode as encodeBlurhash } from 'blurhash'
import { slugify } from '../lib/utils/slugify'
import { normalizeExif, extractGps, type RawExif } from '../lib/exif'
import { extractDominantColors } from '../lib/color-palette'
import type { Collection, PortfolioImage, SiteSettings } from '../types'

const SOURCE_DIR = process.argv[2] ?? join(homedir(), 'Desktop', 'portfolio')
const ROOT = join(__dirname, '..')
const PUBLIC_SEED_DIR = join(ROOT, 'public', 'seed')
const FALLBACK_DIR = join(ROOT, 'lib', 'data', 'fallback')
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])

// Folder names that are real places worth showing on the world-map / as a
// location string. Everything else (people/subjects) gets location: null.
const PLACE_FOLDERS = new Set([
  'Sol over gudhjem',
  'Cape Wotn SE',
  'Santa Monica Beach',
  'Chicago',
  'Tokyo',
  'Italy',
  'Copenhagen',
])

// Approximate coordinates for seed folders so the world map has pins even
// before per-image GPS EXIF is present (real per-image GPS overrides this
// when found in EXIF). Purely a dev-seed convenience.
const PLACE_COORDS: Record<string, { lat: number; lng: number }> = {
  'Sol over gudhjem': { lat: 55.2263, lng: 14.9401 },
  'Cape Wotn SE': { lat: 34.0259, lng: -118.7798 },
  'Santa Monica Beach': { lat: 34.0195, lng: -118.4912 },
  Chicago: { lat: 41.8781, lng: -87.6298 },
  Tokyo: { lat: 35.6762, lng: 139.6503 },
  Italy: { lat: 43.7696, lng: 11.2558 },
  Copenhagen: { lat: 55.6761, lng: 12.5683 },
}

function hashCode(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

async function isGrayscale(buffer: Buffer): Promise<boolean> {
  const stats = await sharp(buffer).resize(32, 32, { fit: 'inside' }).stats()
  const [r, g, b] = stats.channels
  const maxDiff = Math.max(Math.abs(r.mean - g.mean), Math.abs(g.mean - b.mean), Math.abs(r.mean - b.mean))
  return maxDiff < 6
}

async function makeBlurhash(buffer: Buffer): Promise<string> {
  const { data, info } = await sharp(buffer)
    .resize(32, 32, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  // fit:'inside' preserves aspect ratio, so actual output dims can be < 32
  // on one axis — blurhash requires width*height*4 to exactly match the array.
  return encodeBlurhash(new Uint8ClampedArray(data), info.width, info.height, 4, 4)
}

async function main() {
  console.log(`Seeding from: ${SOURCE_DIR}`)
  const entries = readdirSync(SOURCE_DIR).filter((e) => statSync(join(SOURCE_DIR, e)).isDirectory())
  if (entries.length === 0) {
    console.error('No subfolders found — nothing to seed.')
    process.exit(1)
  }

  mkdirSync(PUBLIC_SEED_DIR, { recursive: true })
  mkdirSync(FALLBACK_DIR, { recursive: true })

  const collections: Collection[] = []
  const images: PortfolioImage[] = []
  const now = new Date().toISOString()

  for (const [folderIndex, folderName] of entries.entries()) {
    const folderPath = join(SOURCE_DIR, folderName)
    const files = readdirSync(folderPath)
      .filter((f) => IMAGE_EXT.has(extname(f).toLowerCase()))
      .sort()

    if (files.length === 0) continue

    const collectionSlug = slugify(folderName)
    const collectionId = collectionSlug
    const outDir = join(PUBLIC_SEED_DIR, collectionSlug)
    mkdirSync(outDir, { recursive: true })

    console.log(`\n${folderName} (${files.length} images) -> ${collectionSlug}`)

    let coverImageId: string | null = null

    for (const [fileIndex, fileName] of files.entries()) {
      const filePath = join(folderPath, fileName)
      const buffer = readFileSync(filePath)
      const num = String(fileIndex + 1).padStart(2, '0')
      const imageSlug = `${collectionSlug}-${num}`
      const imageId = imageSlug

      process.stdout.write(`  [${num}/${files.length}] ${fileName} ... `)

      const [meta, rawExif, dominantColors, grayscale, blurhash] = await Promise.all([
        sharp(buffer).metadata(),
        exifr.parse(buffer, true).catch(() => null) as Promise<RawExif | null>,
        extractDominantColors(buffer),
        isGrayscale(buffer),
        makeBlurhash(buffer),
      ])

      const width = meta.width ?? 1600
      const height = meta.height ?? 1067

      const sizes: Array<{ name: 'thumb' | 'medium' | 'large'; width: number }> = [
        { name: 'thumb', width: 480 },
        { name: 'medium', width: 1200 },
        { name: 'large', width: 2200 },
      ]
      for (const { name, width: w } of sizes) {
        const outPath = join(outDir, `${imageSlug}-${name}.webp`)
        await sharp(buffer)
          .rotate() // apply EXIF orientation
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: name === 'thumb' ? 72 : 82 })
          .toFile(outPath)
      }

      const urls = {
        original: `/seed/${collectionSlug}/${imageSlug}-large.webp`,
        large: `/seed/${collectionSlug}/${imageSlug}-large.webp`,
        medium: `/seed/${collectionSlug}/${imageSlug}-medium.webp`,
        thumb: `/seed/${collectionSlug}/${imageSlug}-thumb.webp`,
      }

      const seed = hashCode(imageId)
      const rating = seed % 10 === 0 ? 0 : (seed % 5) + 1 // ~10% unrated, else 1-5

      const gpsFromExif = extractGps(rawExif)
      const gps = gpsFromExif ?? (PLACE_FOLDERS.has(folderName) ? (PLACE_COORDS[folderName] ?? null) : null)

      const image: PortfolioImage = {
        id: imageId,
        collectionId,
        collectionSlug,
        slug: imageSlug,
        title: `${folderName} — ${num}`,
        description: null,
        keywords: [],
        rating,
        location: PLACE_FOLDERS.has(folderName) ? folderName : null,
        gps,
        exif: normalizeExif(rawExif),
        dimensions: { width, height },
        isBlackAndWhite: grayscale,
        dominantColors,
        blurhash,
        visibility: 'public',
        featured: fileIndex === 0,
        downloadPolicy: 'low',
        aiKeywords: null,
        aiDescription: null,
        aiGeneratedAt: null,
        createdAt: rawExif?.DateTimeOriginal ? new Date(rawExif.DateTimeOriginal).toISOString() : now,
        updatedAt: now,
        sortOrder: fileIndex,
        viewCount: (seed % 250) + 5,
        favoriteCount: seed % 30,
        downloadCount: seed % 12,
        shareCount: seed % 8,
        commentCount: 0,
        urls,
      }

      images.push(image)
      if (fileIndex === 0) coverImageId = imageId
      process.stdout.write('done\n')
    }

    collections.push({
      id: collectionId,
      slug: collectionSlug,
      title: folderName,
      description: null,
      coverImageId,
      coverImageUrl: coverImageId ? images.find((i) => i.id === coverImageId)!.urls.medium : null,
      imageCount: files.length,
      featured: folderIndex < 4,
      visibility: 'public',
      passwordProtected: false,
      isSmart: false,
      smartRules: null,
      createdAt: now,
      updatedAt: now,
      sortOrder: folderIndex,
    })
  }

  const topRated = [...images]
    .filter((i) => i.rating >= 4)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6)
    .map((i) => i.id)

  const settings: SiteSettings = {
    heroMode: 'slideshow',
    heroImageIds: topRated.length ? topRated : images.slice(0, 5).map((i) => i.id),
    heroVideoUrl: null,
    siteTitle: 'Portfolio',
    siteTagline: 'Øjeblikke, komponeret.',
    aboutMarkdown:
      '## Om\n\nEt kuratorisk udvalg af fotografier — rejser, mennesker og de stille øjeblikke imellem.',
    contactEmail: 'stig@brandmakers.dk',
    defaultInfoPanelMode: 'title',
    defaultLayoutMode: 'justified',
    watermarkText: null,
  }

  writeFileSync(join(FALLBACK_DIR, 'collections.json'), JSON.stringify(collections, null, 2))
  writeFileSync(join(FALLBACK_DIR, 'images.json'), JSON.stringify(images, null, 2))
  writeFileSync(join(FALLBACK_DIR, 'settings.json'), JSON.stringify(settings, null, 2))
  writeFileSync(join(FALLBACK_DIR, 'comments.json'), JSON.stringify([], null, 2))

  console.log(`\nDone. ${collections.length} collections, ${images.length} images.`)
  console.log(`Fallback data: ${FALLBACK_DIR}`)
  console.log(`Seed images:   ${PUBLIC_SEED_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
