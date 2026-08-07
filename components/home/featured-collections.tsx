import Link from 'next/link'
import type { Collection } from '@/types'
import { CollectionCard } from '@/components/collections/collection-card'

export function FeaturedCollections({ collections }: { collections: Collection[] }) {
  if (collections.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-end justify-between">
        <h2 className="font-display text-3xl font-light">Udvalgte kollektioner</h2>
        <Link href="/collections" className="text-sm text-muted-foreground hover:text-foreground">
          Se alle →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {collections.map((c, i) => (
          <CollectionCard key={c.id} collection={c} priority={i === 0} />
        ))}
      </div>
    </section>
  )
}
