import { getCollections } from '@/lib/data/collections'
import { UploadDropzone } from '@/components/admin/upload-dropzone'

export default async function AdminUploadPage() {
  const collections = await getCollections({ includeAll: true })
  return (
    <div>
      <h1 className="font-display text-3xl font-light">Upload</h1>
      <p className="mt-2 text-muted-foreground">
        EXIF, thumbnails og WebP-konvertering sker automatisk ved upload.
      </p>
      <div className="mt-8">
        <UploadDropzone collections={collections} />
      </div>
    </div>
  )
}
