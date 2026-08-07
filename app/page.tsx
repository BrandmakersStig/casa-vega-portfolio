import { getSettings } from '@/lib/data/settings'
import { getImages } from '@/lib/data/images'
import { getCollections } from '@/lib/data/collections'
import { Hero } from '@/components/home/hero'
import { FeaturedCollections } from '@/components/home/featured-collections'
import { LatestImages } from '@/components/home/latest-images'

export default async function HomePage() {
  const settings = await getSettings()
  const [heroImages, featuredCollections, latestImages] = await Promise.all([
    getImages({ ids: settings.heroImageIds }),
    getCollections({ featuredOnly: true }),
    getImages({ sort: 'newest', limit: 12 }),
  ])

  return (
    <>
      <Hero
        mode={settings.heroMode}
        images={heroImages}
        videoUrl={settings.heroVideoUrl}
        title={settings.siteTitle}
        tagline={settings.siteTagline}
      />
      <FeaturedCollections collections={featuredCollections} />
      <LatestImages images={latestImages} />
    </>
  )
}
