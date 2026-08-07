import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? 'dev-only-insecure-secret-change-me'
}

function sign(galleryId: string): string {
  return createHmac('sha256', secret()).update(`gallery:${galleryId}`).digest('hex')
}

export function galleryCookieName(galleryId: string): string {
  return `gap_${galleryId}`
}

export async function hasGalleryAccess(galleryId: string): Promise<boolean> {
  const jar = await cookies()
  const token = jar.get(galleryCookieName(galleryId))?.value
  if (!token) return false
  const expected = sign(galleryId)
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function grantGalleryAccess(galleryId: string): Promise<void> {
  const jar = await cookies()
  jar.set(galleryCookieName(galleryId), sign(galleryId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}
