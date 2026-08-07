import { NextRequest, NextResponse } from 'next/server'
import { updateSettings } from '@/lib/data/admin-settings'

export async function PATCH(req: NextRequest) {
  const patch = await req.json()
  await updateSettings(patch)
  return NextResponse.json({ ok: true })
}
