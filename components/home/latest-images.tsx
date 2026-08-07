'use client'

import type { PortfolioImage } from '@/types'
import { PhotoThumb } from '@/components/shared/photo-thumb'
import { useLightboxStore } from '@/store/lightbox-store'
import { Lightbox } from '@/components/lightbox/lightbox'

export function LatestImages({ images }: { images: PortfolioImage[] }) {
  const open = useLightboxStore((s) => s.open)
  if (images.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-end justify-between">
        <h2 className="font-display text-3xl font-light">Seneste billeder</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {images.map((img) => (
          <button
            key={img.id}
            onClick={() => {
              open(
                images.map((i) => i.id),
                img.id
              )
              window.history.pushState(null, '', `/collections/${img.collectionSlug}/${img.slug}`)
            }}
            className="group relative block aspect-square overflow-hidden bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
            aria-label={`Åbn ${img.title}`}
          >
            <PhotoThumb image={img} variant="thumb" sizes="(min-width: 1024px) 16vw, 33vw" className="transition-transform duration-500 group-hover:scale-105" />
          </button>
        ))}
      </div>
      <Lightbox images={images} backHref="/" />
    </section>
  )
}
