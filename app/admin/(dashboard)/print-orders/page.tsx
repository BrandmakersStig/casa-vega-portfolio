import { listPrintOrders } from '@/lib/data/print-orders'
import { PrintOrdersManager } from '@/components/admin/print-orders-manager'

export default async function AdminPrintOrdersPage() {
  const orders = await listPrintOrders()
  return (
    <div>
      <h1 className="font-display text-3xl font-light">Print-bestillinger</h1>
      <p className="mt-2 text-muted-foreground">{orders.filter((o) => o.status === 'inquiry').length} nye forespørgsler</p>
      <div className="mt-6">
        <PrintOrdersManager orders={orders} />
      </div>
    </div>
  )
}
