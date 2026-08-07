import type { Exif, GpsPosition } from '@/types'

/** Raw shape returned by exifr.parse(file, true). Only the fields we use. */
export interface RawExif {
  Make?: string
  Model?: string
  LensModel?: string
  LensMake?: string
  FocalLength?: number
  FocalLengthIn35mmFormat?: number
  ISO?: number
  ExposureTime?: number
  FNumber?: number
  DateTimeOriginal?: Date | string
  CreateDate?: Date | string
  latitude?: number
  longitude?: number
  GPSLatitude?: number
  GPSLongitude?: number
}

function formatShutterSpeed(exposureTime?: number): string | null {
  if (!exposureTime || exposureTime <= 0) return null
  if (exposureTime >= 1) return `${exposureTime}s`
  const denominator = Math.round(1 / exposureTime)
  return `1/${denominator}`
}

function formatCamera(make?: string, model?: string): string | null {
  if (!make && !model) return null
  if (model?.toLowerCase().includes((make ?? '').toLowerCase())) return model
  return [make, model].filter(Boolean).join(' ')
}

export function normalizeExif(raw: RawExif | null | undefined): Exif {
  if (!raw) return {}
  const takenAt = raw.DateTimeOriginal ?? raw.CreateDate
  return {
    camera: formatCamera(raw.Make, raw.Model),
    lens: raw.LensModel ?? null,
    focalLength: raw.FocalLengthIn35mmFormat ?? raw.FocalLength ?? null,
    iso: raw.ISO ?? null,
    shutterSpeed: formatShutterSpeed(raw.ExposureTime),
    aperture: raw.FNumber ?? null,
    takenAt: takenAt ? new Date(takenAt).toISOString() : null,
    raw: null,
  }
}

export function extractGps(raw: RawExif | null | undefined): GpsPosition | null {
  if (!raw) return null
  const lat = raw.latitude ?? raw.GPSLatitude
  const lng = raw.longitude ?? raw.GPSLongitude
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  return { lat, lng }
}
