import { NextRequest, NextResponse } from 'next/server'
import { updatePrintOrderStatus } from '@/lib/data/print-orders'
import type { PrintOrderStatus } from '@/types'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status } = (await req.json()) as { status: PrintOrderStatus }
  await updatePrintOrderStatus(id, status)
  return NextResponse.json({ ok: true })
}
