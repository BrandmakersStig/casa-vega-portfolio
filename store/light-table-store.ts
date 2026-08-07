'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LightTableState {
  ids: string[]
  isOn: (id: string) => boolean
  toggle: (id: string) => void
  remove: (id: string) => void
  clear: () => void
}

const MAX_ITEMS = 8

/** Images the visitor has pinned side by side for comparison — persisted, no account needed. */
export const useLightTableStore = create<LightTableState>()(
  persist(
    (set, get) => ({
      ids: [],
      isOn: (id) => get().ids.includes(id),
      toggle: (id) => {
        const has = get().ids.includes(id)
        if (has) {
          set({ ids: get().ids.filter((x) => x !== id) })
        } else if (get().ids.length < MAX_ITEMS) {
          set({ ids: [...get().ids, id] })
        }
      },
      remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
      clear: () => set({ ids: [] }),
    }),
    { name: 'portfolio-light-table' }
  )
)
