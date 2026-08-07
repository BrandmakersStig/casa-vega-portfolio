'use client'

import dynamic from 'next/dynamic'
import type { PortfolioImage } from '@/types'

// Leaflet touches `window` at import time, so it must never be part of the
// server bundle — load it client-only.
const WorldMap = dynamic(() => import('./world-map').then((m) => m.WorldMap), {
  ssr: false,
  loading: () => <div className="flex h-[75vh] w-full items-center justify-center text-muted-foreground">Indlæser kort…</div>,
})

export function WorldMapLoader({ images }: { images: PortfolioImage[] }) {
  return <WorldMap images={images} />
}
