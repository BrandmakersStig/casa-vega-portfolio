import type { Metadata } from 'next'
import { getImages } from '@/lib/data/images'
import { WorldMapLoader } from '@/components/map/world-map-loader'

export const metadata: Metadata = { title: 'Kort' }

export default async function MapPage() {
  const images = await getImages()
  const withGps = images.filter((i) => i.gps)

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-light">Kort</h1>
        <p className="mt-2 text-muted-foreground">{withGps.length} billeder med GPS-data</p>
      </header>
      <WorldMapLoader images={images} />
    </div>
  )
}
