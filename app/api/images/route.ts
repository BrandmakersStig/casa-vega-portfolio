import { NextRequest, NextResponse } from 'next/server'
import { getImages } from '@/lib/data/images'

/** Fetches a specific set of images by id — used by the (client-only) favorites page. */
export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get('ids')?.split(',').filter(Boolean) ?? []
  if (ids.length === 0) return NextResponse.json({ images: [] })
  const images = await getImages({ ids })
  return NextResponse.json({ images })
}
