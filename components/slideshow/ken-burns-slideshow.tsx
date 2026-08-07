'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { PortfolioImage } from '@/types'

const SLIDE_DURATION = 6000
// Cap on how far a portrait image is allowed to zoom to reach "fills the
// screen" — an extreme aspect-ratio mismatch (very tall/thin photo in a
// near-square window) would otherwise demand a huge, disorienting zoom.
const MAX_PORTRAIT_ZOOM = 1.9

/** Tracks the viewport in state so the zoom target can be computed per photo. */
function useViewportSize() {
  const [size, setSize] = useState({ width: 1600, height: 900 })
  useEffect(() => {
    function update() {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}

/**
 * Full-viewport, chrome-free slideshow — "Cinematic View". Auto-advances with
 * a slow Ken Burns zoom; arrow keys / click navigate manually and pause
 * auto-advance briefly. This is the "one image at a time, near-invisible UI"
 * premium mode from the brief, distinct from the lightbox (which has an
 * info panel, comments, etc.).
 */
export function KenBurnsSlideshow({ images, exitHref = '/' }: { images: PortfolioImage[]; exitHref?: string }) {
  const [index, setIndex] = useState(0)
  const [showCaption, setShowCaption] = useState(false)
  const viewport = useViewportSize()

  useEffect(() => {
    if (images.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), SLIDE_DURATION)
    return () => clearInterval(id)
  }, [images.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length])

  const current = images[index]
  if (!current) return null

  // The photo below is object-contain, i.e. it starts fully visible,
  // letterboxed on whichever axis doesn't match the viewport. For a
  // portrait photo (the common case that used to get cropped) we then
  // animate it up to the scale where it exactly fills the screen edge to
  // edge — the ratio between the "cover" and "contain" fit factors for
  // this image's real dimensions against the current viewport. The scale
  // transform is centered by default, so this zooms straight into the
  // middle of the frame (where the subject usually is) rather than
  // drifting toward an edge.
  const { width: iw, height: ih } = current.dimensions
  const isPortrait = ih > iw
  let targetScale = 1.06
  if (isPortrait && iw > 0 && ih > 0) {
    const containFit = Math.min(viewport.width / iw, viewport.height / ih)
    const coverFit = Math.max(viewport.width / iw, viewport.height / ih)
    if (containFit > 0) targetScale = Math.min(coverFit / containFit, MAX_PORTRAIT_ZOOM)
  }

  return (
    <div
      className="relative h-svh w-full overflow-hidden bg-black"
      onMouseMove={() => setShowCaption(true)}
      onMouseLeave={() => setShowCaption(false)}
      onClick={() => setIndex((i) => (i + 1) % images.length)}
    >
      {/* Decorative blurred backdrop only — fills the viewport behind the
          real image so portrait photos in a wide viewport (or vice versa)
          don't leave stark black bars. This layer is allowed to crop; the
          foreground photo below never is. */}
      <div className="absolute inset-0" aria-hidden>
        <Image
          key={`bg-${current.id}`}
          src={current.urls.medium}
          alt=""
          fill
          sizes="100vw"
          className="scale-110 object-cover opacity-40 blur-3xl"
        />
      </div>

      {/* The actual photo — object-contain so the full, uncropped frame is
          always visible, exactly as shot. Previously used object-cover
          full-bleed, which aggressively cropped any image whose aspect
          ratio didn't match the viewport (reported: crops way too much). */}
      <AnimatePresence mode="sync">
        <motion.div
          key={current.id}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: targetScale }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.6, ease: 'easeInOut' }, scale: { duration: SLIDE_DURATION / 1000, ease: 'linear' } }}
        >
          <Image src={current.urls.large} alt={current.title} fill priority sizes="100vw" className="object-contain" />
        </motion.div>
      </AnimatePresence>

      <Link
        href={exitHref}
        onClick={(e) => e.stopPropagation()}
        aria-label="Afslut filmisk visning"
        className="absolute right-4 top-4 z-10 inline-flex size-9 items-center justify-center text-white/70 transition-opacity hover:text-white"
      >
        <X className="size-5" />
      </Link>

      <AnimatePresence>
        {showCaption && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-6 left-6 z-10 font-display text-lg text-white/80"
          >
            {current.title}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
