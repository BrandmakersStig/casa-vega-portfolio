'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import type { PortfolioImage } from '@/types'

interface HeroProps {
  mode: 'image' | 'slideshow' | 'video'
  images: PortfolioImage[]
  videoUrl: string | null
  title: string
  tagline: string
}

const SLIDE_DURATION = 7000

export function Hero({ mode, images, videoUrl, title, tagline }: HeroProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (mode !== 'slideshow' || images.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), SLIDE_DURATION)
    return () => clearInterval(id)
  }, [mode, images.length])

  const current = images[index]

  return (
    <section className="relative h-[92svh] w-full overflow-hidden bg-black">
      {mode === 'video' && videoUrl ? (
        <video
          className="absolute inset-0 size-full object-cover"
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <AnimatePresence mode="sync">
          {current && (
            <motion.div
              key={current.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: 1, scale: mode === 'slideshow' ? 1.08 : 1 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 1.4, ease: 'easeInOut' },
                scale: { duration: SLIDE_DURATION / 1000, ease: 'linear' },
              }}
            >
              <Image
                src={current.urls.large}
                alt={current.title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-display text-lg italic text-white/80"
        >
          {tagline}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35 }}
          className="mt-4 font-display text-5xl font-light tracking-tight sm:text-7xl"
        >
          {title}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8"
        >
          <Link
            href="/collections"
            className="border border-white/40 px-8 py-3 text-sm uppercase tracking-widest transition-colors hover:bg-white hover:text-black"
          >
            Se portfolio
          </Link>
        </motion.div>
      </div>

      <motion.div
        aria-hidden
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/70"
      >
        <ChevronDown className="size-5" />
      </motion.div>
    </section>
  )
}
