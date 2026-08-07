import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? 'dev-only-insecure-secret-change-me'
}

function sign(collectionId: string): string {
  return createHmac('sha256', secret()).update(`collection:${collectionId}`).digest('hex')
}

export function collectionCookieName(collectionId: string): string {
  return `cap_${collectionId}`
}

export async function hasCollectionAccess(collectionId: string): Promise<boolean> {
  const jar = await cookies()
  const token = jar.get(collectionCookieName(collectionId))?.value
  if (!token) return false
  const expected = sign(collectionId)
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function grantCollectionAccess(collectionId: string): Promise<void> {
  const jar = await cookies()
  jar.set(collectionCookieName(collectionId), sign(collectionId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}
