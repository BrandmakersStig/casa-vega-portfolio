'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Info, X } from 'lucide-react'
import type { PortfolioImage } from '@/types'
import { useLightboxStore } from '@/store/lightbox-store'
import { useViewerPrefsStore } from '@/store/viewer-prefs-store'
import { LightboxImage } from './lightbox-image'
import { InfoPanel } from './info-panel'
import { RatingStars } from './rating-stars'
import { FavoriteButton } from '@/components/favorites/favorite-button'
import { LightTableButton } from '@/components/light-table/light-table-button'
import { PrintOrderDialog } from './print-order-dialog'
import { ShareMenu } from './share-menu'
import { KeyboardShortcutsOverlay } from './keyboard-shortcuts-overlay'
import { cn } from '@/lib/utils'

const MODE_CYCLE: Array<'image-only' | 'title' | 'full'> = ['image-only', 'title', 'full']

export function Lightbox({ images, backHref }: { images: PortfolioImage[]; backHref: string }) {
  const isOpen = useLightboxStore((s) => s.isOpen)
  const currentId = useLightboxStore((s) => s.currentId)
  const close = useLightboxStore((s) => s.close)
  const next = useLightboxStore((s) => s.next)
  const prev = useLightboxStore((s) => s.prev)

  const infoPanelMode = useViewerPrefsStore((s) => s.infoPanelMode)
  const setInfoPanelMode = useViewerPrefsStore((s) => s.setInfoPanelMode)

  const [showShortcuts, setShowShortcuts] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)
  const trackedViewId = useRef<string | null>(null)

  const image = images.find((i) => i.id === currentId) ?? null

  const handleClose = useCallback(() => {
    close()
    window.history.pushState(null, '', backHref)
  }, [close, backHref])

  // Browser back button closes the lightbox instead of leaving the page.
  useEffect(() => {
    if (!isOpen) return
    function onPopState() {
      close()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [isOpen, close])

  useEffect(() => {
    if (!isOpen || !image) return
    if (trackedViewId.current === image.id) return
    trackedViewId.current = image.id
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId: image.id, kind: 'view' }),
    }).catch(() => {})
  }, [isOpen, image])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowShortcuts(false)
        handleClose()
      } else if (e.key === 'ArrowLeft') next2('prev')
      else if (e.key === 'ArrowRight') next2('next')
      else if (e.key.toLowerCase() === 'i') cycleInfoMode()
      else if (e.key === '?') setShowShortcuts((s) => !s)
    }
    function next2(dir: 'next' | 'prev') {
      if (dir === 'next') next()
      else prev()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, next, prev])

  function cycleInfoMode() {
    const idx = MODE_CYCLE.indexOf(infoPanelMode)
    setInfoPanelMode(MODE_CYCLE[(idx + 1) % MODE_CYCLE.length])
  }

  if (!isOpen || !image) return null

  const chromeVisible = zoomScale <= 1.01

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-black sm:flex-row"
        role="dialog"
        aria-modal="true"
        aria-label={image.title}
      >
        <div className="relative flex-1">
          <LightboxImage
            image={image}
            onSwipeLeft={next}
            onSwipeRight={prev}
            onZoomChange={setZoomScale}
          />

          {/* Chrome fades out while zoomed so nothing competes with the image. */}
          <div className={cn('pointer-events-none absolute inset-0 transition-opacity duration-300', chromeVisible ? 'opacity-100' : 'opacity-0')}>
            <div className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/60 to-transparent p-4">
              <button
                onClick={handleClose}
                aria-label="Luk"
                className="inline-flex size-9 items-center justify-center text-white hover:opacity-70"
              >
                <X className="size-5" />
              </button>
              <div className="flex items-center gap-1">
                <FavoriteButton imageId={image.id} className="text-white hover:bg-white/10" />
                <LightTableButton imageId={image.id} className="text-white hover:bg-white/10" />
                <PrintOrderDialog image={image} className="text-white" />
                <ShareMenu image={image} />
                <button
                  onClick={cycleInfoMode}
                  aria-label="Skift infopanel"
                  className={cn(
                    'inline-flex size-9 items-center justify-center hover:opacity-70',
                    infoPanelMode === 'full' ? 'text-white' : 'text-white/60'
                  )}
                >
                  <Info className="size-5" />
                </button>
              </div>
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="Forrige billede"
                  className="pointer-events-auto absolute left-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center text-white/70 hover:text-white"
                >
                  <ChevronLeft className="size-7" />
                </button>
                <button
                  onClick={next}
                  aria-label="Næste billede"
                  className="pointer-events-auto absolute right-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center text-white/70 hover:text-white"
                >
                  <ChevronRight className="size-7" />
                </button>
              </>
            )}

            {infoPanelMode === 'title' && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                <p className="font-display text-xl">{image.title}</p>
                <div className="mt-1 flex items-center gap-3">
                  <RatingStars rating={image.rating} />
                </div>
              </div>
            )}
          </div>

          <KeyboardShortcutsOverlay open={showShortcuts} />
        </div>

        {infoPanelMode === 'full' && <InfoPanel image={image} />}
      </motion.div>
    </AnimatePresence>
  )
}
