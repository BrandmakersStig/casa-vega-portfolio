import { NextRequest, NextResponse } from 'next/server'
import { updateImage, deleteImages } from '@/lib/data/admin-images'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patch = await req.json()
  await updateImage(id, patch)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteImages([id])
  return NextResponse.json({ ok: true })
}
