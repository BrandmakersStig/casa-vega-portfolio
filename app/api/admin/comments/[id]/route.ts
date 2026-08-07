import { NextRequest, NextResponse } from 'next/server'
import { deleteComment, moderateComment } from '@/lib/data/comments'

// Auth is enforced by proxy.ts (matcher: /api/admin/:path*) — routes here
// only run for already-authenticated admin requests.

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patch = await req.json()
  await moderateComment(id, patch)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteComment(id)
  return NextResponse.json({ ok: true })
}
