import { NextRequest, NextResponse } from 'next/server'
import { createPrintOrder } from '@/lib/data/print-orders'
import { getImageById } from '@/lib/data/images'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { imageId, customerName, customerEmail, size, material, notes } = body

  if (!imageId || !customerName?.trim() || !customerEmail?.trim() || !size) {
    return NextResponse.json({ error: 'Udfyld navn, email og størrelse' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return NextResponse.json({ error: 'Ugyldig email' }, { status: 400 })
  }
  const image = await getImageById(imageId)
  if (!image) return NextResponse.json({ error: 'Billede ikke fundet' }, { status: 404 })

  const order = await createPrintOrder({
    imageId,
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim(),
    size,
    material: material || null,
    notes: notes?.trim() || null,
  })

  return NextResponse.json({ order })
}
