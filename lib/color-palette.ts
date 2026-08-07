import sharp from 'sharp'

/**
 * Lightweight dominant-colour extractor: downsamples the image, quantizes
 * pixels into coarse RGB buckets, and returns the most frequent buckets as
 * hex colours (most frequent first). No native canvas / heavier vibrant
 * libs needed — this runs fine in the seed script and in a server route.
 */
export async function extractDominantColors(input: Buffer | string, count = 5): Promise<string[]> {
  const { data, info } = await sharp(input)
    .resize(64, 64, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>()
  const channels = info.channels
  const step = 32 // quantize step per channel (0-255 -> 8 buckets)

  for (let i = 0; i + channels <= data.length; i += channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // Skip near-white/near-black extremes so the palette reflects the
    // image's actual colour, not paper-white backgrounds or crushed blacks.
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    if (lum > 245 || lum < 10) continue

    const key = `${Math.floor(r / step)}-${Math.floor(g / step)}-${Math.floor(b / step)}`
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.r += r
      bucket.g += g
      bucket.b += b
      bucket.n += 1
    } else {
      buckets.set(key, { r, g, b, n: 1 })
    }
  }

  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, count)
  if (sorted.length === 0) return ['#888888']

  return sorted.map(({ r, g, b, n }) => toHex(r / n, g / n, b / n))
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(v).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}
