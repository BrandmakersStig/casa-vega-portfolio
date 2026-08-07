import { getCollections } from '@/lib/data/collections'
import { CollectionsManager } from '@/components/admin/collections-manager'

export default async function AdminCollectionsPage() {
  const collections = await getCollections({ includeAll: true })
  return (
    <div>
      <h1 className="font-display text-3xl font-light">Collections</h1>
      <div className="mt-6">
        <CollectionsManager collections={collections} />
      </div>
    </div>
  )
}
