import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const VALID_KINDS = new Set(['view', 'download', 'share'])

/** Records a view/download/share event for stats. Fire-and-forget from the client; no-op in dev-fallback mode. */
export async function POST(req: NextRequest) {
  const { imageId, kind } = await req.json()
  if (!imageId || !VALID_KINDS.has(kind)) return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true })

  const supabase = await getSupabaseServerClient()
  await supabase!.from('image_events').insert({ image_id: imageId, kind })
  return NextResponse.json({ ok: true })
}
