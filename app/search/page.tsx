import type { Metadata } from 'next'
import { getImages, getFacets } from '@/lib/data/images'
import { PhotoGrid } from '@/components/collections/photo-grid'
import { FilterBar } from '@/components/filters/filter-bar'
import { SortMenu } from '@/components/filters/sort-menu'
import { LayoutSwitcher } from '@/components/collections/layout-switcher'
import type { SortOption } from '@/types'

export const metadata: Metadata = { title: 'Søg & Filtre' }

interface SearchParams {
  q?: string
  keyword?: string
  camera?: string
  lens?: string
  year?: string
  location?: string
  color?: 'color' | 'bw'
  ratingMin?: string
  sort?: string
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const sort = (sp.sort as SortOption) ?? 'newest'

  const [images, facets] = await Promise.all([
    getImages({
      sort,
      filters: {
        query: sp.q,
        camera: sp.camera,
        location: sp.location,
        color: sp.color,
        ratingMin: sp.ratingMin ? Number(sp.ratingMin) : undefined,
        year: sp.year ? Number(sp.year) : undefined,
        keywords: sp.keyword ? [sp.keyword] : undefined,
      },
    }),
    getFacets(),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-light">Søg &amp; Filtre</h1>
        <p className="mt-2 text-muted-foreground">{images.length} billeder</p>
      </header>

      <div className="mb-10 flex flex-col gap-4 border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar facets={facets} />
        <div className="flex items-center gap-4">
          <SortMenu value={sort} />
          <LayoutSwitcher />
        </div>
      </div>

      <PhotoGrid images={images} backHref="/search" />
    </div>
  )
}
