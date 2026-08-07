import type { Metadata } from 'next'
import { getCollections } from '@/lib/data/collections'
import { CollectionCard } from '@/components/collections/collection-card'

export const metadata: Metadata = { title: 'Kollektioner' }

export default async function CollectionsPage() {
  const collections = await getCollections()

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-12">
        <h1 className="font-display text-4xl font-light">Kollektioner</h1>
        <p className="mt-2 text-muted-foreground">{collections.length} kollektioner</p>
      </header>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c, i) => (
          <CollectionCard key={c.id} collection={c} priority={i < 3} />
        ))}
      </div>
    </div>
  )
}
