'use client'

import { useEffect, useRef, useState } from 'react'

/** Reveals `items` in batches as a sentinel element scrolls into view — simple infinite scroll without pagination APIs. */
export function useInfiniteReveal<T>(items: T[], batchSize = 24) {
  const [count, setCount] = useState(Math.min(batchSize, items.length))
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCount(Math.min(batchSize, items.length))
  }, [items, batchSize])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCount((c) => Math.min(c + batchSize, items.length))
        }
      },
      { rootMargin: '800px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [items.length, batchSize])

  return { visible: items.slice(0, count), sentinelRef, hasMore: count < items.length }
}
