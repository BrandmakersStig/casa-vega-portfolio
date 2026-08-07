import { NextRequest, NextResponse } from 'next/server'
import { getApprovedComments } from '@/lib/data/comments'

export async function GET(req: NextRequest) {
  const imageId = req.nextUrl.searchParams.get('imageId')
  if (!imageId) return NextResponse.json({ error: 'missing imageId' }, { status: 400 })
  const comments = await getApprovedComments(imageId)
  return NextResponse.json({ comments })
}
