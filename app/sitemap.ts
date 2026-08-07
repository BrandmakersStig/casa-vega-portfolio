import type { MetadataRoute } from 'next'
import { getCollections } from '@/lib/data/collections'
import { getImages } from '@/lib/data/images'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const [collections, images] = await Promise.all([getCollections(), getImages()])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/collections`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/search`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/map`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.3 },
  ]

  const collectionRoutes: MetadataRoute.Sitemap = collections
    .filter((c) => !c.passwordProtected)
    .map((c) => ({ url: `${base}/collections/${c.slug}`, changeFrequency: 'weekly', priority: 0.7 }))

  const imageRoutes: MetadataRoute.Sitemap = images.map((i) => ({
    url: `${base}/collections/${i.collectionSlug}/${i.slug}`,
    lastModified: i.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  return [...staticRoutes, ...collectionRoutes, ...imageRoutes]
}
