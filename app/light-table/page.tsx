import type { Metadata } from 'next'
import { LightTableView } from '@/components/light-table/light-table-view'

export const metadata: Metadata = { title: 'Light Table' }

export default function LightTablePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-light">Light Table</h1>
        <p className="mt-2 text-muted-foreground">Sammenlign flere billeder side om side.</p>
      </header>
      <LightTableView />
    </div>
  )
}
