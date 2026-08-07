'use client'

import { useEffect } from 'react'

/**
 * Registers public/sw.js — offline cache of recently viewed images.
 * Production only: intentionally skipped in dev so Turbopack HMR never
 * has to fight a service worker's fetch interception.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline cache is a nice-to-have — a failed registration (e.g. an
      // unsupported browser) should never affect the rest of the site.
    })
  }, [])

  return null
}
