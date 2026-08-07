import { NextRequest, NextResponse } from 'next/server'
import { getClientGalleryBySlug } from '@/lib/data/client-galleries'
import { verifyClientGalleryPassword } from '@/lib/data/admin-client-galleries'
import { grantGalleryAccess } from '@/lib/auth/client-gallery-access'

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { password } = await req.json()
  if (typeof password !== 'string') return NextResponse.json({ error: 'Adgangskode mangler' }, { status: 400 })

  const gallery = await getClientGalleryBySlug(slug)
  if (!gallery) return NextResponse.json({ error: 'Galleri ikke fundet' }, { status: 404 })

  const ok = await verifyClientGalleryPassword(gallery.id, password)
  if (!ok) return NextResponse.json({ error: 'Forkert adgangskode' }, { status: 401 })

  await grantGalleryAccess(gallery.id)
  return NextResponse.json({ ok: true })
}
