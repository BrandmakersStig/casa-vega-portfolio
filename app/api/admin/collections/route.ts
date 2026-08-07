import { NextRequest, NextResponse } from 'next/server'
import { createCollection } from '@/lib/data/admin-collections'

export async function POST(req: NextRequest) {
  const { title, isSmart, smartRules } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Titel mangler' }, { status: 400 })
  const collection = await createCollection(title.trim(), { isSmart, smartRules })
  return NextResponse.json({ collection })
}
