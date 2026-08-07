'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

interface FavoritesState {
  visitorId: string
  ids: string[]
  isFavorite: (id: string) => boolean
  toggle: (id: string) => void
}

/**
 * Anonymous, no-account favorites. `ids` is the source of truth for
 * instant UI state (persisted to localStorage); each toggle also fires a
 * best-effort request to /api/favorites so aggregate counts are available
 * server-side (Supabase mode only — a no-op in dev-fallback mode).
 */
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      visitorId: nanoid(),
      ids: [],
      isFavorite: (id) => get().ids.includes(id),
      toggle: (id) => {
        const has = get().ids.includes(id)
        set({ ids: has ? get().ids.filter((x) => x !== id) : [...get().ids, id] })
        fetch('/api/favorites', {
          method: has ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId: id, visitorId: get().visitorId }),
        }).catch(() => {})
      },
    }),
    { name: 'portfolio-favorites' }
  )
)
