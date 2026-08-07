'use client'

/**
 * Downscales an image file in the browser before upload. Real camera
 * photos are routinely 10-50MB — well past Vercel's hard ~4.5MB request
 * body limit for serverless functions, so a raw upload silently never
 * reaches the server at all (no error, no log entry — the fetch just
 * fails at the network layer). We already treat a 2200px derivative as
 * the effective "original" everywhere else in this app (see
 * scripts/seed.ts, lib/data/admin-images.ts), so resizing to that same
 * ceiling client-side is consistent, not a new limitation — and keeps
 * every upload comfortably under the platform limit regardless of the
 * source file's size.
 */
export async function resizeImageForUpload(file: File, maxDimension = 2200, quality = 0.88): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file // canvas unsupported — fall back to the original file rather than failing the upload

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob) return file

  // Nothing to gain — the resize made it bigger (rare, tiny/simple images) or barely helped.
  if (blob.size >= file.size) return file

  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() })
}
