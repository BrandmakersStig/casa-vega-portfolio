import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCollectionBySlug } from '@/lib/data/collections'
import { getCollectionImages } from '@/lib/data/images'
import { CollectionDetail } from '@/components/collections/collection-detail'
import { CollectionGate } from '@/components/collections/collection-gate'
import { hasCollectionAccess } from '@/lib/auth/collection-access'
import type { SortOption } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const collection = await getCollectionBySlug(slug, { includeProtected: true })
  if (!collection || collection.passwordProtected) return {}
  return {
    title: collection.title,
    description: collection.description ?? `${collection.imageCount} billeder`,
    openGraph: { images: collection.coverImageUrl ? [collection.coverImageUrl] : [] },
  }
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { sort } = await searchParams
  const collection = await getCollectionBySlug(slug, { includeProtected: true })
  if (!collection) notFound()

  if (collection.passwordProtected && !(await hasCollectionAccess(collection.id))) {
    return <CollectionGate collectionId={collection.id} title={collection.title} />
  }

  // Password-protected collections are excluded from the anon RLS policy
  // entirely (see supabase/migrations/0001_init.sql); once the cookie gate
  // above has verified access, fetch as includeAll to bypass it too.
  const images = await getCollectionImages(collection, {
    sort: (sort as SortOption) ?? 'newest',
    includeAll: collection.passwordProtected,
  })

  return <CollectionDetail collection={collection} images={images} sort={(sort as SortOption) ?? 'newest'} />
}
