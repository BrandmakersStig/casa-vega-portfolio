import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getClientGalleryBySlug, getClientGalleryImages } from '@/lib/data/client-galleries'
import { hasGalleryAccess } from '@/lib/auth/client-gallery-access'
import { GalleryGate } from '@/components/gallery/gallery-gate'
import { PhotoGrid } from '@/components/collections/photo-grid'

export const metadata: Metadata = { title: 'Klientgalleri', robots: { index: false, follow: false } }

export default async function ClientGalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const gallery = await getClientGalleryBySlug(slug)
  if (!gallery) notFound()

  if (!(await hasGalleryAccess(gallery.id))) {
    return <GalleryGate slug={slug} title={gallery.title} />
  }

  const images = await getClientGalleryImages(gallery)

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="font-display text-4xl font-light">{gallery.title}</h1>
        {gallery.clientName && <p className="mt-2 text-muted-foreground">Til {gallery.clientName}</p>}
        <p className="mt-1 text-sm text-muted-foreground">{images.length} billeder — privat, ikke indekseret</p>
      </header>
      <PhotoGrid images={images} backHref={`/gallery/${slug}`} />
    </div>
  )
}
