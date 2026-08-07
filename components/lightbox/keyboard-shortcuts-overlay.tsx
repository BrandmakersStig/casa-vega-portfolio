'use client'

import { AnimatePresence, motion } from 'framer-motion'

const SHORTCUTS: [string, string][] = [
  ['← / →', 'Forrige / næste billede'],
  ['Esc', 'Luk'],
  ['I', 'Skift infopanel'],
  ['F', 'Favorit'],
  ['Scroll / +/-', 'Zoom'],
  ['Dobbeltklik', 'Zoom ind/ud'],
  ['?', 'Vis/skjul denne hjælp'],
]

export function KeyboardShortcutsOverlay({ open }: { open: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 p-6"
        >
          <div className="w-full max-w-sm border border-white/20 bg-black p-6 text-white">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-white/50">Tastaturgenveje</p>
            <dl className="space-y-2 text-sm">
              {SHORTCUTS.map(([key, desc]) => (
                <div key={key} className="flex justify-between gap-4">
                  <dt className="font-mono text-white/70">{key}</dt>
                  <dd className="text-right text-white/50">{desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
