import 'server-only'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { PrintOrder, PrintOrderStatus } from '@/types'

// print_orders has RLS enabled with no policies (same reasoning as
// client_galleries — see supabase/migrations/0001_init.sql), so both the
// public "submit an inquiry" write and the admin reads/updates go through
// the service-role client. Never expose this module to a client bundle.

const FALLBACK_PATH = path.join(process.cwd(), 'lib/data/fallback/print-orders.json')

interface RawPrintOrder {
  id: string
  image_id: string
  customer_name: string
  customer_email: string
  size: string
  material: string | null
  status: PrintOrderStatus
  notes: string | null
  created_at: string
}

async function readAll(): Promise<RawPrintOrder[]> {
  return JSON.parse(await readFile(FALLBACK_PATH, 'utf-8'))
}
async function writeAll(orders: RawPrintOrder[]) {
  await writeFile(FALLBACK_PATH, JSON.stringify(orders, null, 2))
}

function mapRow(row: RawPrintOrder): PrintOrder {
  return {
    id: row.id,
    imageId: row.image_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    size: row.size,
    material: row.material,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

export interface PrintOrderInput {
  imageId: string
  customerName: string
  customerEmail: string
  size: string
  material?: string | null
  notes?: string | null
}

export async function createPrintOrder(input: PrintOrderInput): Promise<PrintOrder> {
  const now = new Date().toISOString()

  if (!isSupabaseConfigured()) {
    const orders = await readAll()
    const row: RawPrintOrder = {
      id: nanoid(),
      image_id: input.imageId,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      size: input.size,
      material: input.material ?? null,
      status: 'inquiry',
      notes: input.notes ?? null,
      created_at: now,
    }
    orders.push(row)
    await writeAll(orders)
    return mapRow(row)
  }

  const admin = getSupabaseAdminClient()!
  const { data, error } = await admin
    .from('print_orders')
    .insert({
      image_id: input.imageId,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      size: input.size,
      material: input.material ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return mapRow(data)
}

export async function listPrintOrders(): Promise<PrintOrder[]> {
  if (!isSupabaseConfigured()) {
    const orders = await readAll()
    return orders.map(mapRow).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  const admin = getSupabaseAdminClient()!
  const { data } = await admin.from('print_orders').select('*').order('created_at', { ascending: false })
  return (data ?? []).map(mapRow)
}

export async function updatePrintOrderStatus(id: string, status: PrintOrderStatus): Promise<void> {
  if (!isSupabaseConfigured()) {
    const orders = await readAll()
    const idx = orders.findIndex((o) => o.id === id)
    if (idx === -1) return
    orders[idx].status = status
    await writeAll(orders)
    return
  }
  const admin = getSupabaseAdminClient()!
  await admin.from('print_orders').update({ status }).eq('id', id)
}
