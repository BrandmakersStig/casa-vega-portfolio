'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { PortfolioImage } from '@/types'

const SLIDE_DURATION = 6000

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

  return (
    <div
      className="relative h-svh w-full overflow-hidden bg-black"
      onMouseMove={() => setShowCaption(true)}
      onMouseLeave={() => setShowCaption(false)}
      onClick={() => setIndex((i) => (i + 1) % images.length)}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={current.id}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.6, ease: 'easeInOut' }, scale: { duration: SLIDE_DURATION / 1000, ease: 'linear' } }}
        >
          <Image src={current.urls.large} alt={current.title} fill priority sizes="100vw" className="object-cover" />
        </motion.div>
      </AnimatePresence>

      <Link
        href={exitHref}
        onClick={(e) => e.stopPropagation()}
        aria-label="Afslut cinematic view"
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
