import { NextRequest, NextResponse } from 'next/server'
import { updateCollection, deleteCollection } from '@/lib/data/admin-collections'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patch = await req.json()
  await updateCollection(id, patch)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteCollection(id)
  return NextResponse.json({ ok: true })
}
