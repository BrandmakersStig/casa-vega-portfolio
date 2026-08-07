import { NextRequest, NextResponse } from 'next/server'
import { createClientGallery } from '@/lib/data/admin-client-galleries'

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.title?.trim()) return NextResponse.json({ error: 'Titel mangler' }, { status: 400 })
  if (!body.password?.trim()) return NextResponse.json({ error: 'Adgangskode mangler' }, { status: 400 })
  if (!Array.isArray(body.collectionIds) || body.collectionIds.length === 0) {
    return NextResponse.json({ error: 'Vælg mindst én collection' }, { status: 400 })
  }
  const gallery = await createClientGallery({
    title: body.title.trim(),
    clientName: body.clientName?.trim() || null,
    collectionIds: body.collectionIds,
    password: body.password,
    allowFavorites: body.allowFavorites ?? true,
    allowDownload: body.allowDownload ?? false,
  })
  return NextResponse.json({ gallery })
}
