import type { Collection, PortfolioImage, SortOption } from '@/types'
import { PhotoGrid } from './photo-grid'
import { LayoutSwitcher } from './layout-switcher'
import { SortMenu } from '@/components/filters/sort-menu'

export function CollectionDetail({
  collection,
  images,
  sort,
  initialImageId,
}: {
  collection: Collection
  images: PortfolioImage[]
  sort: SortOption
  initialImageId?: string
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-light">{collection.title}</h1>
          {collection.description && <p className="mt-2 max-w-xl text-muted-foreground">{collection.description}</p>}
          <p className="mt-1 text-sm text-muted-foreground">{collection.imageCount} billeder</p>
        </div>
        <div className="flex items-center gap-4">
          <SortMenu value={sort} />
          <LayoutSwitcher />
        </div>
      </header>

      <PhotoGrid images={images} backHref={`/collections/${collection.slug}`} initialImageId={initialImageId} />
    </div>
  )
}
