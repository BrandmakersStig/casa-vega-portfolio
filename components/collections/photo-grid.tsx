'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { PortfolioImage } from '@/types'
import { useViewerPrefsStore } from '@/store/viewer-prefs-store'
import { useLightboxStore } from '@/store/lightbox-store'
import { useInfiniteReveal } from '@/hooks/use-infinite-reveal'
import { PhotoThumb } from '@/components/shared/photo-thumb'
import { Lightbox } from '@/components/lightbox/lightbox'
import { cn } from '@/lib/utils'

interface PhotoGridProps {
  images: PortfolioImage[]
  /** URL to restore when the lightbox closes (the grid this roll belongs to). */
  backHref: string
  /** Opens the lightbox on this image immediately — used for deep-linked /collections/[slug]/[imageSlug] URLs. */
  initialImageId?: string
}

const JUSTIFIED_ROW_HEIGHT = 280

export function PhotoGrid({ images, backHref, initialImageId }: PhotoGridProps) {
  const layoutMode = useViewerPrefsStore((s) => s.layoutMode)
  const { visible, sentinelRef, hasMore } = useInfiniteReveal(images, 30)
  const openLightbox = useLightboxStore((s) => s.open)
  const openedInitial = useRef(false)

  useEffect(() => {
    if (initialImageId && !openedInitial.current) {
      openedInitial.current = true
      openLightbox(
        images.map((i) => i.id),
        initialImageId
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImageId])

  const handleOpen = useCallback(
    (image: PortfolioImage) => {
      openLightbox(
        images.map((i) => i.id),
        image.id
      )
      window.history.pushState(null, '', `/collections/${image.collectionSlug}/${image.slug}`)
    },
    [images, openLightbox]
  )

  if (images.length === 0) {
    return <p className="py-24 text-center text-muted-foreground">Ingen billeder endnu.</p>
  }

  return (
    <div>
      {layoutMode === 'grid' && (
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((img) => (
            <button
              key={img.id}
              onClick={() => handleOpen(img)}
              className="group relative block aspect-square overflow-hidden bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
              aria-label={`Åbn ${img.title}`}
            >
              <PhotoThumb image={img} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="transition-transform duration-500 group-hover:scale-105" />
            </button>
          ))}
        </div>
      )}

      {(layoutMode === 'masonry' || layoutMode === 'pinterest') && (
        <div
          className={cn(
            layoutMode === 'masonry'
              ? 'columns-2 gap-1 sm:columns-3 lg:columns-4'
              : 'columns-2 gap-4 sm:columns-3 lg:columns-4'
          )}
        >
          {visible.map((img) => (
            <button
              key={img.id}
              onClick={() => handleOpen(img)}
              className={cn(
                'group relative mb-1 block w-full overflow-hidden bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground',
                layoutMode === 'pinterest' && 'mb-4 rounded-lg shadow-sm'
              )}
              style={{ breakInside: 'avoid', aspectRatio: `${img.dimensions.width} / ${img.dimensions.height}` }}
              aria-label={`Åbn ${img.title}`}
            >
              <PhotoThumb
                image={img}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {layoutMode === 'justified' && (
        <div className="flex flex-wrap gap-1">
          {visible.map((img) => (
            <button
              key={img.id}
              onClick={() => handleOpen(img)}
              className="group relative block shrink-0 overflow-hidden bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
              // Height fixed, width derived purely from the image's own
              // aspect-ratio (no flex-grow stretching) — a row's items line
              // up at a shared height without ever distorting a portrait
              // image wider than its true shape. object-cover below then
              // never has anything to crop, since the box already is the
              // image's exact proportions.
              style={{ height: JUSTIFIED_ROW_HEIGHT, aspectRatio: `${img.dimensions.width} / ${img.dimensions.height}` }}
              aria-label={`Åbn ${img.title}`}
            >
              <PhotoThumb
                image={img}
                sizes="600px"
                className="transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {hasMore && <div ref={sentinelRef} className="h-1" aria-hidden />}

      <Lightbox images={images} backHref={backHref} />
    </div>
  )
}
