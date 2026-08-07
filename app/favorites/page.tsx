import type { Metadata } from 'next'
import { FavoritesClient } from '@/components/favorites/favorites-client'

export const metadata: Metadata = { title: 'Favoritter' }

export default function FavoritesPage() {
  return <FavoritesClient />
}
