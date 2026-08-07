import type { PortfolioImage } from '@/types'

export function ImageJsonLd({ image }: { image: PortfolioImage }) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: image.title,
    description: image.description ?? undefined,
    contentUrl: image.urls.large,
    thumbnailUrl: image.urls.thumb,
    datePublished: image.createdAt,
    keywords: image.keywords.join(', ') || undefined,
    contentLocation: image.location ?? undefined,
    width: image.dimensions.width,
    height: image.dimensions.height,
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
}
