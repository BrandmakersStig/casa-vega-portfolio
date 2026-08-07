import type { Exif } from '@/types'

export function formatDate(iso: string | null | undefined, locale = 'da-DK'): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatExifSummary(exif: Exif): string {
  const parts: string[] = []
  if (exif.focalLength) parts.push(`${Math.round(exif.focalLength)}mm`)
  if (exif.aperture) parts.push(`f/${exif.aperture}`)
  if (exif.shutterSpeed) parts.push(exif.shutterSpeed)
  if (exif.iso) parts.push(`ISO ${exif.iso}`)
  return parts.join(' · ')
}

export function aspectRatio(width: number, height: number): number {
  return width / height
}
