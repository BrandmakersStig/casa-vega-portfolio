'use client'

import Image from 'next/image'
import { Blurhash } from 'react-blurhash'
import { cn } from '@/lib/utils'
import type { PortfolioImage } from '@/types'

interface PhotoThumbProps {
  image: Pick<PortfolioImage, 'title' | 'blurhash' | 'urls' | 'dimensions'>
  variant?: 'thumb' | 'medium' | 'large'
  sizes?: string
  className?: string
  priority?: boolean
  fill?: boolean
}

/**
 * Grid/card thumbnail with a blurhash placeholder behind it.
 *
 * Deliberately does NOT gate the <Image> behind a JS "loaded" state + fade:
 * with cached/already-loaded images (very common here — the same photo
 * often appears in multiple grids on one page, e.g. hero + featured
 * collections), the DOM <img> can already be `complete` before React
 * attaches its onLoad listener during hydration, so the event is missed
 * and the image gets stuck invisible. The blurhash sits behind at all
 * times (via stacking order) as the loading state; the browser paints the
 * real image on top the moment it has pixels, no state tracking needed.
 */
export function PhotoThumb({ image, variant = 'thumb', sizes = '400px', className, priority, fill = true }: PhotoThumbProps) {
  return (
    <div className={cn('relative size-full overflow-hidden bg-muted', className)}>
      {image.blurhash && <Blurhash hash={image.blurhash} width="100%" height="100%" className="absolute inset-0" />}
      <Image
        src={image.urls[variant]}
        alt={image.title}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className="relative object-cover"
      />
    </div>
  )
}
