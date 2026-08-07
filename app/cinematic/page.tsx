import type { Metadata } from 'next'
import { getImages } from '@/lib/data/images'
import { KenBurnsSlideshow } from '@/components/slideshow/ken-burns-slideshow'

export const metadata: Metadata = { title: 'Cinematic View' }

export default async function CinematicPage() {
  const images = await getImages({ sort: 'top-rated', limit: 60 })
  return <KenBurnsSlideshow images={images} />
}
