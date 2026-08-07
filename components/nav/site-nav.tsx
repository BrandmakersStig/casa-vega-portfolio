'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Heart, Menu, X } from 'lucide-react'
import { SearchCommand } from './search-command'
import { ThemeToggle } from './theme-toggle'
import { useFavoritesStore } from '@/store/favorites-store'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/', label: 'Forside' },
  { href: '/collections', label: 'Kollektioner' },
  { href: '/about', label: 'Om' },
  { href: '/contact', label: 'Kontakt' },
]

export function SiteNav({ siteTitle }: { siteTitle: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const favoriteCount = useFavoritesStore((s) => s.ids.length)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // In cinematic/lightbox-style routes the nav should stay out of the way entirely.
  if (pathname?.startsWith('/cinematic')) return null

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors duration-300',
        scrolled ? 'border-border bg-background' : 'border-transparent bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          {siteTitle}
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex" aria-label="Hovednavigation">
          {LINKS.filter((l, i, arr) => arr.findIndex((x) => x.label === l.label) === i).map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                'text-muted-foreground transition-colors hover:text-foreground',
                pathname === link.href && 'text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <SearchCommand />
          <Link
            href="/favorites"
            aria-label={`Favoritter (${favoriteCount})`}
            className="relative inline-flex size-9 items-center justify-center text-current hover:opacity-70"
          >
            <Heart className="size-4" />
            {favoriteCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
                {favoriteCount > 9 ? '9+' : favoriteCount}
              </span>
            )}
          </Link>
          <ThemeToggle />
          <button
            className="inline-flex size-9 items-center justify-center md:hidden"
            aria-label={mobileOpen ? 'Luk menu' : 'Åbn menu'}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t px-4 py-4 md:hidden" aria-label="Mobilnavigation">
          <ul className="flex flex-col gap-4 text-sm">
            {LINKS.filter((l, i, arr) => arr.findIndex((x) => x.label === l.label) === i).map((link) => (
              <li key={link.label}>
                <Link href={link.href} onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
