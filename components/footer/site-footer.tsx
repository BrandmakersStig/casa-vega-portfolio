import Link from 'next/link'

const EXPLORE = [
  { href: '/collections', label: 'Kollektioner' },
  { href: '/map', label: 'Kort' },
  { href: '/cinematic', label: 'Filmisk visning' },
  { href: '/light-table', label: 'Lysbord' },
]

const INFO = [
  { href: '/about', label: 'Om' },
  { href: '/contact', label: 'Kontakt' },
  { href: '/favorites', label: 'Favoritter' },
]

export function SiteFooter({ siteTitle, contactEmail }: { siteTitle: string; contactEmail: string }) {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg">{siteTitle}</p>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Et kuratorisk udvalg af fotografier — rejser, mennesker og de stille øjeblikke imellem.
            </p>
          </div>
          <nav aria-label="Udforsk">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Udforsk</p>
            <ul className="mt-3 space-y-2 text-sm">
              {EXPLORE.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Info">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Info</p>
            <ul className="mt-3 space-y-2 text-sm">
              {INFO.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={`mailto:${contactEmail}`} className="text-muted-foreground hover:text-foreground">
                  {contactEmail}
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <p className="mt-16 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteTitle}. Alle rettigheder forbeholdes.
        </p>
      </div>
    </footer>
  )
}
