'use client'

import { useEffect, useState } from 'react'
import { useFavoritesStore } from '@/store/favorites-store'
import { PhotoGrid } from '@/components/collections/photo-grid'
import type { PortfolioImage } from '@/types'

export function FavoritesClient() {
  const ids = useFavoritesStore((s) => s.ids)
  const [images, setImages] = useState<PortfolioImage[] | null>(null)

  useEffect(() => {
    if (ids.length === 0) {
      setImages([])
      return
    }
    let cancelled = false
    fetch(`/api/images?ids=${ids.join(',')}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setImages(d.images))
    return () => {
      cancelled = true
    }
  }, [ids])

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="font-display text-4xl font-light">Favoritter</h1>
        <p className="mt-2 text-muted-foreground">{ids.length} gemte billeder</p>
      </header>

      {images === null ? (
        <p className="py-24 text-center text-muted-foreground">Indlæser…</p>
      ) : images.length === 0 ? (
        <p className="py-24 text-center text-muted-foreground">
          Du har endnu ikke markeret nogen billeder som favoritter — klik på hjertet ved et billede for at gemme det her.
        </p>
      ) : (
        <PhotoGrid images={images} backHref="/favorites" />
      )}
    </div>
  )
}
