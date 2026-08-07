import Link from 'next/link'
import { Lock } from 'lucide-react'
import type { Collection } from '@/types'
import { PhotoThumb } from '@/components/shared/photo-thumb'

export function CollectionCard({ collection, priority = false }: { collection: Collection; priority?: boolean }) {
  return (
    <Link href={`/collections/${collection.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-muted">
      {collection.coverImageUrl && (
        <PhotoThumb
          image={{
            title: collection.title,
            blurhash: null,
            urls: {
              thumb: collection.coverImageUrl,
              medium: collection.coverImageUrl,
              large: collection.coverImageUrl,
              original: collection.coverImageUrl,
            },
            dimensions: { width: 1200, height: 1500 },
          }}
          variant="medium"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className="transition-transform duration-700 ease-out group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-95" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <p className="flex items-center gap-2 font-display text-xl">
          {collection.passwordProtected && <Lock className="size-4" />}
          {collection.title}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wider text-white/70">{collection.imageCount} billeder</p>
      </div>
    </Link>
  )
}
