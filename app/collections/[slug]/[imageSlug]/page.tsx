import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCollectionBySlug } from '@/lib/data/collections'
import { getImages, getImageBySlug } from '@/lib/data/images'
import { CollectionDetail } from '@/components/collections/collection-detail'
import { CollectionGate } from '@/components/collections/collection-gate'
import { ImageJsonLd } from '@/components/shared/image-json-ld'
import { hasCollectionAccess } from '@/lib/auth/collection-access'
import type { SortOption } from '@/types'

interface Props {
  params: Promise<{ slug: string; imageSlug: string }>
  searchParams: Promise<{ sort?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, imageSlug } = await params
  const collection = await getCollectionBySlug(slug, { includeProtected: true })
  if (!collection || collection.passwordProtected) return {}
  const image = await getImageBySlug(slug, imageSlug)
  if (!image) return {}
  return {
    title: image.title,
    description: image.description ?? image.location ?? undefined,
    openGraph: { images: [image.urls.large], type: 'article' },
    twitter: { card: 'summary_large_image', images: [image.urls.large] },
  }
}

export default async function CollectionImagePage({ params, searchParams }: Props) {
  const { slug, imageSlug } = await params
  const { sort } = await searchParams
  const collection = await getCollectionBySlug(slug, { includeProtected: true })
  if (!collection) notFound()

  if (collection.passwordProtected && !(await hasCollectionAccess(collection.id))) {
    return <CollectionGate collectionId={collection.id} title={collection.title} />
  }

  const images = await getImages({
    collectionId: collection.id,
    sort: (sort as SortOption) ?? 'newest',
    includeAll: collection.passwordProtected,
  })
  const image = images.find((i) => i.slug === imageSlug)
  if (!image) notFound()

  return (
    <>
      <ImageJsonLd image={image} />
      <CollectionDetail collection={collection} images={images} sort={(sort as SortOption) ?? 'newest'} initialImageId={image.id} />
    </>
  )
}
