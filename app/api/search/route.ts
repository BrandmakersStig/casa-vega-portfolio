import { NextRequest, NextResponse } from 'next/server'
import { getImages } from '@/lib/data/images'
import { getCollections } from '@/lib/data/collections'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json({ images: [], collections: [] })

  const [images, collections] = await Promise.all([
    getImages({ filters: { query: q }, sort: 'newest', limit: 12 }),
    getCollections(),
  ])

  const qLower = q.toLowerCase()
  const matchedCollections = collections
    .filter((c) => c.title.toLowerCase().includes(qLower) || c.description?.toLowerCase().includes(qLower))
    .slice(0, 6)

  return NextResponse.json({
    images: images.map((i) => ({ id: i.id, title: i.title, slug: i.slug, collectionSlug: i.collectionSlug, thumb: i.urls.thumb })),
    collections: matchedCollections.map((c) => ({ id: c.id, title: c.title, slug: c.slug, cover: c.coverImageUrl })),
  })
}
