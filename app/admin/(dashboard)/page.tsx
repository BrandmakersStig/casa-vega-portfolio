import Image from 'next/image'
import Link from 'next/link'
import { getSiteStats } from '@/lib/data/stats'

export default async function AdminDashboardPage() {
  const stats = await getSiteStats()

  const cards = [
    { label: 'Billeder', value: stats.totalImages },
    { label: 'Visninger', value: stats.totalViews },
    { label: 'Favoritter', value: stats.totalFavorites },
    { label: 'Downloads', value: stats.totalDownloads },
    { label: 'Delinger', value: stats.totalShares },
    { label: 'Ventende kommentarer', value: stats.pendingComments, href: '/admin/comments' },
  ]

  return (
    <div>
      <h1 className="font-display text-3xl font-light">Oversigt</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => {
          const content = (
            <div className="border border-border p-4">
              <p className="text-2xl font-medium">{c.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
            </div>
          )
          return c.href ? (
            <Link key={c.label} href={c.href}>
              {content}
            </Link>
          ) : (
            <div key={c.label}>{content}</div>
          )
        })}
      </div>

      <h2 className="mt-12 font-display text-xl">Mest populære billeder</h2>
      <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-8">
        {stats.topImages.map((img) => (
          <div key={img.id} className="space-y-1">
            <div className="relative aspect-square overflow-hidden bg-muted">
              <Image src={img.thumb} alt={img.title} fill sizes="150px" className="object-cover" />
            </div>
            <p className="truncate text-xs text-muted-foreground">{img.views} visninger</p>
          </div>
        ))}
      </div>
    </div>
  )
}
