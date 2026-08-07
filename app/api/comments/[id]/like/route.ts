import { NextResponse } from 'next/server'
import { likeComment } from '@/lib/data/comments'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await likeComment(id)
  return NextResponse.json({ ok: true })
}
