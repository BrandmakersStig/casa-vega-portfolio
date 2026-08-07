import { NextRequest, NextResponse } from 'next/server'
import { createComment } from '@/lib/data/comments'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { imageId, authorName, authorEmail, text, parentId, website } = body

  // Honeypot: a hidden field real visitors never fill in.
  if (website) return NextResponse.json({ ok: true })

  if (!imageId || !authorName?.trim() || !text?.trim()) {
    return NextResponse.json({ error: 'Udfyld navn og kommentar' }, { status: 400 })
  }
  if (authorName.length > 80 || text.length > 4000) {
    return NextResponse.json({ error: 'Tekst for lang' }, { status: 400 })
  }

  const comment = await createComment({
    imageId,
    parentId: parentId ?? null,
    authorName: authorName.trim(),
    authorEmail: authorEmail?.trim() || null,
    body: text.trim(),
  })

  return NextResponse.json({ comment })
}
