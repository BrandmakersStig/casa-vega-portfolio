import { NextRequest, NextResponse } from 'next/server'
import { createCollection } from '@/lib/data/admin-collections'

export async function POST(req: NextRequest) {
  const { title } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Titel mangler' }, { status: 400 })
  const collection = await createCollection(title.trim())
  return NextResponse.json({ collection })
}
