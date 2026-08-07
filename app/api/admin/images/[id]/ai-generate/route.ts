import { NextResponse } from 'next/server'
import { generateAiMetadata } from '@/lib/ai-keywords'
import { getImageById } from '@/lib/data/images'
import { updateImage } from '@/lib/data/admin-images'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const image = await getImageById(id)
  if (!image) return NextResponse.json({ error: 'Billede ikke fundet' }, { status: 404 })

  try {
    const result = await generateAiMetadata(image.urls.medium)
    const now = new Date().toISOString()
    await updateImage(id, { aiDescription: result.description, aiKeywords: result.keywords, aiGeneratedAt: now })
    return NextResponse.json({ aiDescription: result.description, aiKeywords: result.keywords })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI-generering fejlede'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
