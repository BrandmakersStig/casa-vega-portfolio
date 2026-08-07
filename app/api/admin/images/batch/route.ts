import { NextRequest, NextResponse } from 'next/server'
import { batchUpdateImages, deleteImages } from '@/lib/data/admin-images'

export async function PATCH(req: NextRequest) {
  const { ids, patch } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'Ingen billeder valgt' }, { status: 400 })
  await batchUpdateImages(ids, patch)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'Ingen billeder valgt' }, { status: 400 })
  await deleteImages(ids)
  return NextResponse.json({ ok: true })
}
