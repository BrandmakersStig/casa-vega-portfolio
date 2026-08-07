import { NextRequest, NextResponse } from 'next/server'
import { createImageFromUpload } from '@/lib/data/admin-images'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  const collectionId = form.get('collectionId') as string | null
  const newCollectionTitle = (form.get('newCollectionTitle') as string | null) ?? undefined

  if (!file || !collectionId) return NextResponse.json({ error: 'Mangler fil eller collection' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const image = await createImageFromUpload({ buffer, collectionId, newCollectionTitle })
    return NextResponse.json({ image })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Upload fejlede' }, { status: 500 })
  }
}
