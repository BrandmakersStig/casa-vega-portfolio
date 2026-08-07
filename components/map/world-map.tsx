'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { PortfolioImage } from '@/types'

// Leaflet's default marker images resolve to broken paths under most
// bundlers (Turbopack included) — a small styled div-icon avoids that
// entirely and matches the site's minimal aesthetic better than pins.
function dotIcon() {
  return L.divIcon({
    className: '',
    html: '<span style="display:block;width:12px;height:12px;border-radius:9999px;background:#fff;border:2px solid #000;box-shadow:0 0 0 2px rgba(255,255,255,0.6)"></span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

export function WorldMap({ images }: { images: PortfolioImage[] }) {
  const withGps = useMemo(() => images.filter((i) => i.gps), [images])
  const icon = useMemo(() => dotIcon(), [])

  return (
    <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom className="h-[75vh] w-full" worldCopyJump>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {withGps.map((img) => (
        <Marker key={img.id} position={[img.gps!.lat, img.gps!.lng]} icon={icon}>
          <Popup>
            <Link href={`/collections/${img.collectionSlug}/${img.slug}`} className="block w-32">
              <div className="relative aspect-square w-full overflow-hidden">
                <Image src={img.urls.thumb} alt={img.title} fill sizes="128px" className="object-cover" />
              </div>
              <p className="mt-1 text-xs">{img.title}</p>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
