'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { PortfolioImage } from '@/types'
import { cn } from '@/lib/utils'

const MIN_SCALE = 1
const MAX_SCALE = 5
const DOUBLE_CLICK_SCALE = 2.5

interface Props {
  image: PortfolioImage
  onSwipeLeft: () => void
  onSwipeRight: () => void
  /** Reports current zoom scale so the parent can disable swipe-to-close etc. while zoomed. */
  onZoomChange?: (scale: number) => void
}

/** Fullscreen zoom/pan engine: scroll to zoom, double-click to zoom, drag to pan, pinch on touch, swipe to navigate when not zoomed. */
export function LightboxImage({ image, onSwipeLeft, onSwipeRight, onZoomChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [interacting, setInteracting] = useState(false)

  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number; pointerId: number } | null>(null)
  const pinchState = useRef<{ startDist: number; startScale: number } | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const swipeState = useRef<{ startX: number; startY: number } | null>(null)

  useEffect(() => {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }, [image.id])

  useEffect(() => {
    onZoomChange?.(scale)
  }, [scale, onZoomChange])

  const clampTranslate = useCallback((s: number, t: { x: number; y: number }) => {
    const el = containerRef.current
    if (!el) return t
    const rect = el.getBoundingClientRect()
    const maxX = Math.max(0, (rect.width * (s - 1)) / 2)
    const maxY = Math.max(0, (rect.height * (s - 1)) / 2)
    return { x: Math.min(maxX, Math.max(-maxX, t.x)), y: Math.min(maxY, Math.max(-maxY, t.y)) }
  }, [])

  const zoomAt = useCallback(
    (clientX: number, clientY: number, nextScaleRaw: number) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScaleRaw))
      const cx = clientX - rect.left - rect.width / 2
      const cy = clientY - rect.top - rect.height / 2
      setTranslate((prev) => {
        const ratio = nextScale / scale
        return clampTranslate(nextScale, { x: cx - (cx - prev.x) * ratio, y: cy - (cy - prev.y) * ratio })
      })
      setScale(nextScale)
    },
    [scale, clampTranslate]
  )

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    const delta = -e.deltaY * 0.0025
    zoomAt(e.clientX, e.clientY, scale * (1 + delta))
  }

  function handleDoubleClick(e: React.MouseEvent) {
    if (scale > 1) {
      setScale(1)
      setTranslate({ x: 0, y: 0 })
    } else {
      zoomAt(e.clientX, e.clientY, DOUBLE_CLICK_SCALE)
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 1) {
      swipeState.current = { startX: e.clientX, startY: e.clientY }
      if (scale > 1) {
        setInteracting(true)
        dragState.current = { startX: e.clientX, startY: e.clientY, originX: translate.x, originY: translate.y, pointerId: e.pointerId }
        ;(e.target as Element).setPointerCapture?.(e.pointerId)
      }
    } else if (pointers.current.size === 2) {
      setInteracting(true)
      swipeState.current = null
      const pts = [...pointers.current.values()]
      pinchState.current = { startDist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), startScale: scale }
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2 && pinchState.current) {
      const pts = [...pointers.current.values()]
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const nextScale = pinchState.current.startScale * (dist / pinchState.current.startDist)
      zoomAt((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2, nextScale)
      return
    }

    if (dragState.current?.pointerId === e.pointerId && scale > 1) {
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      setTranslate(clampTranslate(scale, { x: dragState.current.originX + dx, y: dragState.current.originY + dy }))
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)

    if (dragState.current?.pointerId === e.pointerId) dragState.current = null
    if (pointers.current.size < 2) pinchState.current = null
    setInteracting(false)

    if (scale === 1 && swipeState.current) {
      const dx = e.clientX - swipeState.current.startX
      const dy = e.clientY - swipeState.current.startY
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) onSwipeLeft()
        else onSwipeRight()
      }
    }
    swipeState.current = null
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none select-none overflow-hidden"
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className={cn('relative h-full w-full will-change-transform', !interacting && 'transition-transform duration-200 ease-out')}
        style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`, cursor: scale > 1 ? 'grab' : 'default' }}
      >
        <Image src={image.urls.original} alt={image.title} fill sizes="100vw" className="object-contain" priority draggable={false} />
      </div>
    </div>
  )
}
