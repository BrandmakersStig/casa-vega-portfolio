import { listClientGalleries } from '@/lib/data/admin-client-galleries'
import { getCollections } from '@/lib/data/collections'
import { ClientGalleriesManager } from '@/components/admin/client-galleries-manager'

export default async function AdminClientGalleriesPage() {
  const [galleries, collections] = await Promise.all([listClientGalleries(), getCollections({ includeAll: true })])
  return (
    <div>
      <h1 className="font-display text-3xl font-light">Klientgallerier</h1>
      <p className="mt-2 text-muted-foreground">Adgangskode-beskyttede sæt til individuelle kunder.</p>
      <div className="mt-6">
        <ClientGalleriesManager galleries={galleries} collections={collections} />
      </div>
    </div>
  )
}
