'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'

interface SearchImage {
  id: string
  title: string
  slug: string
  collectionSlug: string
  thumb: string
}
interface SearchCollection {
  id: string
  title: string
  slug: string
  cover: string | null
}

export function SearchCommand() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [images, setImages] = useState<SearchImage[]>([])
  const [collections, setCollections] = useState<SearchCollection[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === '/' && !open && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setImages([])
      setCollections([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (!res.ok) return
      const data = await res.json()
      setImages(data.images)
      setCollections(data.collections)
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function go(href: string) {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Søg (⌘K)"
        onClick={() => setOpen(true)}
        className="text-current"
      >
        <Search className="size-4" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Søg i portfolio" description="Søg efter billeder, kollektioner, kamera eller lokation">
        <CommandInput placeholder="Søg efter titel, keyword, kamera, lokation…" value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>{query ? 'Ingen resultater.' : 'Begynd at skrive for at søge.'}</CommandEmpty>
          {collections.length > 0 && (
            <CommandGroup heading="Kollektioner">
              {collections.map((c) => (
                <CommandItem key={c.id} value={`collection-${c.id}`} onSelect={() => go(`/collections/${c.slug}`)}>
                  {c.cover && (
                    <span className="relative mr-2 size-8 overflow-hidden bg-muted">
                      <Image src={c.cover} alt="" fill sizes="32px" className="object-cover" />
                    </span>
                  )}
                  {c.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {images.length > 0 && (
            <CommandGroup heading="Billeder">
              {images.map((img) => (
                <CommandItem
                  key={img.id}
                  value={`image-${img.id}`}
                  onSelect={() => go(`/collections/${img.collectionSlug}/${img.slug}`)}
                >
                  <span className="relative mr-2 size-8 overflow-hidden bg-muted">
                    <Image src={img.thumb} alt="" fill sizes="32px" className="object-cover" />
                  </span>
                  {img.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
