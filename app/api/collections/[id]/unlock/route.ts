import { NextRequest, NextResponse } from 'next/server'
import { verifyCollectionPassword } from '@/lib/data/admin-collections'
import { grantCollectionAccess } from '@/lib/auth/collection-access'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { password } = await req.json()
  if (typeof password !== 'string') return NextResponse.json({ error: 'Adgangskode mangler' }, { status: 400 })

  const ok = await verifyCollectionPassword(id, password)
  if (!ok) return NextResponse.json({ error: 'Forkert adgangskode' }, { status: 401 })

  await grantCollectionAccess(id)
  return NextResponse.json({ ok: true })
}
