'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PrintOrder, PrintOrderStatus } from '@/types'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<PrintOrderStatus, string> = {
  inquiry: 'Forespørgsel',
  confirmed: 'Bekræftet',
  shipped: 'Sendt',
  cancelled: 'Annulleret',
}

export function PrintOrdersManager({ orders }: { orders: PrintOrder[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(orders)

  async function setStatus(id: string, status: PrintOrderStatus) {
    setRows((r) => r.map((o) => (o.id === id ? { ...o, status } : o)))
    await fetch(`/api/admin/print-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  if (rows.length === 0) return <p className="text-muted-foreground">Ingen print-forespørgsler endnu.</p>

  return (
    <ul className="divide-y divide-border border-y border-border">
      {rows.map((o) => (
        <li key={o.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{o.customerName}</span>
              <span className="text-xs text-muted-foreground">{o.customerEmail}</span>
              <span className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm">
              {o.size}
              {o.material && ` · ${o.material}`}
            </p>
            {o.notes && <p className="mt-1 text-sm text-muted-foreground">{o.notes}</p>}
          </div>
          <select
            value={o.status}
            onChange={(e) => setStatus(o.id, e.target.value as PrintOrderStatus)}
            className={cn(
              'border border-input bg-transparent px-2 py-1.5 text-xs',
              o.status === 'inquiry' && 'text-amber-600',
              o.status === 'confirmed' && 'text-blue-600',
              o.status === 'shipped' && 'text-green-600',
              o.status === 'cancelled' && 'text-destructive'
            )}
          >
            {(Object.keys(STATUS_LABELS) as PrintOrderStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </li>
      ))}
    </ul>
  )
}
