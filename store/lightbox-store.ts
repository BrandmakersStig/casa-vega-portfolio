'use client'

import { create } from 'zustand'

interface LightboxState {
  isOpen: boolean
  /** Ordered ids of the current "roll" — the set of images prev/next navigates within. */
  rollIds: string[]
  currentId: string | null
  open: (rollIds: string[], currentId: string) => void
  close: () => void
  setCurrent: (id: string) => void
  next: () => void
  prev: () => void
}

export const useLightboxStore = create<LightboxState>((set, get) => ({
  isOpen: false,
  rollIds: [],
  currentId: null,
  open: (rollIds, currentId) => set({ isOpen: true, rollIds, currentId }),
  close: () => set({ isOpen: false }),
  setCurrent: (id) => set({ currentId: id }),
  next: () => {
    const { rollIds, currentId } = get()
    const idx = rollIds.indexOf(currentId ?? '')
    if (idx === -1) return
    const nextIdx = (idx + 1) % rollIds.length
    set({ currentId: rollIds[nextIdx] })
  },
  prev: () => {
    const { rollIds, currentId } = get()
    const idx = rollIds.indexOf(currentId ?? '')
    if (idx === -1) return
    const prevIdx = (idx - 1 + rollIds.length) % rollIds.length
    set({ currentId: rollIds[prevIdx] })
  },
}))
