import { getImages } from '@/lib/data/images'
import { getCollections } from '@/lib/data/collections'
import { ImagesTable } from '@/components/admin/images-table'

export default async function AdminImagesPage() {
  const [images, collections] = await Promise.all([
    getImages({ includeAll: true, sort: 'newest' }),
    getCollections({ includeAll: true }),
  ])

  return (
    <div>
      <h1 className="font-display text-3xl font-light">Billeder</h1>
      <p className="mt-2 text-muted-foreground">{images.length} billeder i alt</p>
      <div className="mt-6">
        <ImagesTable images={images} collections={collections} />
      </div>
    </div>
  )
}
