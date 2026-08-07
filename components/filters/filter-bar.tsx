'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { Facets } from '@/lib/data/images'

export function FilterBar({ facets }: { facets: Facets }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function update(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  const active = ['camera', 'lens', 'year', 'location', 'color', 'ratingMin', 'keyword'].filter((k) => searchParams.get(k))

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={searchParams.get('camera') ?? undefined} onValueChange={(v) => update('camera', v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Kamera" /></SelectTrigger>
        <SelectContent>
          {facets.cameras.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get('lens') ?? undefined} onValueChange={(v) => update('lens', v)}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Objektiv" /></SelectTrigger>
        <SelectContent>
          {facets.lenses.map((l) => (
            <SelectItem key={l} value={l}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get('year') ?? undefined} onValueChange={(v) => update('year', v)}>
        <SelectTrigger className="w-28"><SelectValue placeholder="År" /></SelectTrigger>
        <SelectContent>
          {facets.years.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get('location') ?? undefined} onValueChange={(v) => update('location', v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Lokation" /></SelectTrigger>
        <SelectContent>
          {facets.locations.map((l) => (
            <SelectItem key={l} value={l}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get('color') ?? undefined} onValueChange={(v) => update('color', v)}>
        <SelectTrigger className="w-32"><SelectValue placeholder="Farve" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="color">Farve</SelectItem>
          <SelectItem value="bw">Sort/hvid</SelectItem>
        </SelectContent>
      </Select>

      <Select value={searchParams.get('ratingMin') ?? undefined} onValueChange={(v) => update('ratingMin', v)}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Min. rating" /></SelectTrigger>
        <SelectContent>
          {[5, 4, 3, 2, 1].map((n) => (
            <SelectItem key={n} value={String(n)}>{n}+ stjerner</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {active.length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)} className="gap-1 text-muted-foreground">
          <X className="size-3.5" /> Ryd filtre
        </Button>
      )}
    </div>
  )
}
