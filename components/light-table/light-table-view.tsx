'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X, Search } from 'lucide-react'
import { useLightTableStore } from '@/store/light-table-store'
import type { PortfolioImage } from '@/types'
import { RatingStars } from '@/components/lightbox/rating-stars'
import { formatExifSummary } from '@/lib/utils/format'

interface SearchResult {
  id: string
  title: string
  thumb: string
}

export function LightTableView() {
  const ids = useLightTableStore((s) => s.ids)
  const remove = useLightTableStore((s) => s.remove)
  const toggle = useLightTableStore((s) => s.toggle)
  const clear = useLightTableStore((s) => s.clear)

  const [images, setImages] = useState<PortfolioImage[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (ids.length === 0) {
      setImages([])
      return
    }
    let cancelled = false
    fetch(`/api/images?ids=${ids.join(',')}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        // preserve the order the visitor pinned them in
        const byId = new Map<string, PortfolioImage>((d.images ?? []).map((i: PortfolioImage) => [i.id, i]))
        setImages(ids.map((id) => byId.get(id)).filter((i): i is PortfolioImage => Boolean(i)))
      })
    return () => {
      cancelled = true
    }
  }, [ids])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (!res.ok) return
      const data = await res.json()
      setResults(data.images ?? [])
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søg efter billeder at tilføje…"
            className="w-full border border-input bg-transparent py-2 pl-9 pr-3 text-sm focus:outline-none"
          />
          {results.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-80 w-full overflow-y-auto border border-border bg-popover shadow-md">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => {
                      toggle(r.id)
                      setQuery('')
                      setResults([])
                    }}
                    disabled={ids.includes(r.id)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-40"
                  >
                    <span className="relative size-10 shrink-0 overflow-hidden bg-muted">
                      <Image src={r.thumb} alt="" fill sizes="40px" className="object-cover" />
                    </span>
                    {r.title}
                    {ids.includes(r.id) && <span className="ml-auto text-xs text-muted-foreground">tilføjet</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {ids.length > 0 && (
          <button onClick={clear} className="text-sm text-muted-foreground hover:text-foreground">
            Ryd alle ({ids.length})
          </button>
        )}
      </div>

      {images.length === 0 ? (
        <p className="py-24 text-center text-muted-foreground">
          Søg efter billeder ovenfor, eller tilføj dem fra lightboxen (ikonet ved siden af favorit-hjertet) — de vises her side om side til sammenligning.
        </p>
      ) : (
        <div className="flex items-end gap-4 overflow-x-auto pb-4">
          {images.map((img) => (
            <div key={img.id} className="relative flex shrink-0 flex-col" style={{ width: 'max-content' }}>
              <button
                onClick={() => remove(img.id)}
                aria-label="Fjern fra lysbord"
                className="absolute right-2 top-2 z-10 inline-flex size-7 items-center justify-center bg-black/60 text-white hover:bg-black/80"
              >
                <X className="size-4" />
              </button>
              {/* Fixed height, width derived from the image's own aspect
                  ratio — never crops a portrait image into a landscape box
                  or vice versa, unlike a fixed aspect-ratio container would. */}
              <div
                className="relative max-w-[80vw] overflow-hidden bg-muted"
                style={{ height: 420, aspectRatio: `${img.dimensions.width} / ${img.dimensions.height}` }}
              >
                <Image src={img.urls.medium} alt={img.title} fill sizes="500px" className="object-contain" />
              </div>
              <div className="mt-2 max-w-[min(80vw,420px)] space-y-1">
                <p className="truncate text-sm font-medium">{img.title}</p>
                <RatingStars rating={img.rating} />
                {img.exif.camera && <p className="text-xs text-muted-foreground">{img.exif.camera}</p>}
                {formatExifSummary(img.exif) && <p className="text-xs text-muted-foreground">{formatExifSummary(img.exif)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
