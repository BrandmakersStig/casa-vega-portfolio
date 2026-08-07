import { Aperture, Calendar, Camera, MapPin, Timer } from 'lucide-react'
import type { PortfolioImage } from '@/types'
import { formatDate } from '@/lib/utils/format'

export function ExifList({ image }: { image: PortfolioImage }) {
  const { exif } = image
  const rows: { icon: typeof Camera; label: string; value: string | null | undefined }[] = [
    { icon: Camera, label: 'Kamera', value: exif.camera },
    { icon: Aperture, label: 'Objektiv', value: exif.lens },
    {
      icon: Timer,
      label: 'Eksponering',
      value: [
        exif.focalLength ? `${Math.round(exif.focalLength)}mm` : null,
        exif.aperture ? `f/${exif.aperture}` : null,
        exif.shutterSpeed,
        exif.iso ? `ISO ${exif.iso}` : null,
      ]
        .filter(Boolean)
        .join(' · ') || null,
    },
    { icon: Calendar, label: 'Dato', value: formatDate(exif.takenAt ?? image.createdAt) },
    { icon: MapPin, label: 'Lokation', value: image.location },
  ]

  const visible = rows.filter((r) => r.value)
  if (visible.length === 0) return null

  return (
    <dl className="space-y-2.5 text-sm">
      {visible.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-start gap-3 text-white/70">
          <Icon className="mt-0.5 size-3.5 shrink-0" />
          <div>
            <dt className="sr-only">{label}</dt>
            <dd>{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}
