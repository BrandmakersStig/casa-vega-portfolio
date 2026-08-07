'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InfoPanelMode, LayoutMode } from '@/types'

interface ViewerPrefsState {
  infoPanelMode: InfoPanelMode
  setInfoPanelMode: (mode: InfoPanelMode) => void
  layoutMode: LayoutMode
  setLayoutMode: (mode: LayoutMode) => void
}

/** Remembers the visitor's lightbox info-panel density and preferred grid layout across sessions. */
export const useViewerPrefsStore = create<ViewerPrefsState>()(
  persist(
    (set) => ({
      infoPanelMode: 'title',
      setInfoPanelMode: (infoPanelMode) => set({ infoPanelMode }),
      layoutMode: 'justified',
      setLayoutMode: (layoutMode) => set({ layoutMode }),
    }),
    { name: 'portfolio-viewer-prefs' }
  )
)
