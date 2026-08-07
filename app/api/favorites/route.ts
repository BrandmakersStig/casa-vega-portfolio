import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// Anonymous favorites are primarily tracked client-side (store/favorites-store.ts,
// persisted to localStorage). This route best-effort mirrors them server-side so
// aggregate favorite counts are available in Supabase mode; it's a silent no-op
// in dev-fallback mode (seed data already ships with plausible demo counts).

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true })
  const { imageId, visitorId } = await req.json()
  if (!imageId || !visitorId) return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  const supabase = await getSupabaseServerClient()
  await supabase!.from('favorites').upsert({ image_id: imageId, visitor_id: visitorId })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true })
  const { imageId, visitorId } = await req.json()
  if (!imageId || !visitorId) return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  const supabase = await getSupabaseServerClient()
  await supabase!.from('favorites').delete().eq('image_id', imageId).eq('visitor_id', visitorId)
  return NextResponse.json({ ok: true })
}
