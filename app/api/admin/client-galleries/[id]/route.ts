import { NextRequest, NextResponse } from 'next/server'
import { deleteClientGallery } from '@/lib/data/admin-client-galleries'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteClientGallery(id)
  return NextResponse.json({ ok: true })
}
