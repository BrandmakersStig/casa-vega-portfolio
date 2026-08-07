'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { GripVertical } from 'lucide-react'

interface BeforeAfterSliderProps {
  beforeSrc: string
  afterSrc: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
}

/** Drag (or touch-drag) the divider to compare two images. */
export function BeforeAfterSlider({ beforeSrc, afterSrc, beforeLabel = 'Før', afterLabel = 'Efter', className }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  function setFromClientX(clientX: number) {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.min(100, Math.max(0, pct)))
  }

  return (
    <div
      ref={containerRef}
      className={`relative aspect-[3/2] w-full touch-none select-none overflow-hidden ${className ?? ''}`}
      onPointerDown={(e) => {
        dragging.current = true
        setFromClientX(e.clientX)
        ;(e.target as Element).setPointerCapture?.(e.pointerId)
      }}
      onPointerMove={(e) => dragging.current && setFromClientX(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
    >
      {/* "After" — full-size base layer. */}
      <Image src={afterSrc} alt={afterLabel} fill sizes="800px" className="object-cover" draggable={false} />

      {/* "Before" — same full-size layer, clipped (not resized) to the divider position so it never distorts. */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <Image src={beforeSrc} alt={beforeLabel} fill sizes="800px" className="object-cover" draggable={false} />
      </div>

      <div className="pointer-events-none absolute inset-x-2 top-2 flex justify-between text-xs uppercase tracking-wider text-white/80">
        <span className="bg-black/50 px-2 py-1">{beforeLabel}</span>
        <span className="bg-black/50 px-2 py-1">{afterLabel}</span>
      </div>

      <div className="pointer-events-none absolute inset-y-0 flex w-0.5 -translate-x-1/2 items-center bg-white" style={{ left: `${position}%` }}>
        <div className="flex size-8 -translate-x-1/2 items-center justify-center rounded-full bg-white text-black shadow-md">
          <GripVertical className="size-4" />
        </div>
      </div>
    </div>
  )
}
