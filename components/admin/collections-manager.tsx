'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Star, Trash2, Check } from 'lucide-react'
import type { Collection } from '@/types'
import { cn } from '@/lib/utils'

export function CollectionsManager({ collections }: { collections: Collection[] }) {
  const router = useRouter()
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [rows, setRows] = useState(collections)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    await fetch('/api/admin/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() }),
    })
    setNewTitle('')
    setCreating(false)
    router.refresh()
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/admin/collections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    router.refresh()
  }

  async function saveTitleAndDescription(c: Collection) {
    setSavingId(c.id)
    await patch(c.id, { title: c.title, description: c.description })
    setSavingId(null)
  }

  function update(id: string, patchLocal: Partial<Collection>) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patchLocal } : row)))
  }

  async function remove(id: string) {
    if (!confirm('Slet collection? Billeder i den slettes IKKE, men mister deres collection.')) return
    await fetch(`/api/admin/collections/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div>
      <form onSubmit={create} className="mb-6 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Ny collection-titel"
          className="flex-1 border border-input bg-transparent px-3 py-2 text-sm"
        />
        <button disabled={creating} className="border border-foreground px-4 py-2 text-xs uppercase tracking-wider hover:bg-foreground hover:text-background disabled:opacity-50">
          Opret
        </button>
      </form>

      <ul className="divide-y divide-border border-y border-border">
        {rows.map((c) => (
          <li key={c.id} className="flex flex-col gap-2 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={c.title}
                onChange={(e) => update(c.id, { title: e.target.value })}
                className="min-w-40 flex-1 border-b border-transparent bg-transparent font-medium hover:border-input focus:border-foreground focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">{c.imageCount} billeder</span>
              <button
                onClick={() => patch(c.id, { featured: !c.featured })}
                aria-label="Featured"
                className={cn('rounded p-1.5 hover:bg-accent', c.featured && 'text-foreground')}
              >
                <Star className={cn('size-4', c.featured && 'fill-current')} />
              </button>
              <select
                defaultValue={c.visibility}
                onChange={(e) => patch(c.id, { visibility: e.target.value })}
                className="border border-input bg-transparent px-2 py-1 text-xs"
              >
                <option value="public">Offentlig</option>
                <option value="unlisted">Ulistet</option>
                <option value="private">Privat</option>
              </select>
              <button
                onClick={() => {
                  const pw = prompt(c.passwordProtected ? 'Ny adgangskode (tomt = fjern beskyttelse):' : 'Sæt adgangskode for denne collection:')
                  if (pw === null) return
                  patch(c.id, { password: pw || null })
                }}
                aria-label="Adgangskode"
                className={cn('rounded p-1.5 hover:bg-accent', c.passwordProtected && 'text-foreground')}
              >
                <Lock className="size-4" />
              </button>
              <button onClick={() => remove(c.id)} aria-label="Slet" className="rounded p-1.5 text-destructive hover:bg-destructive/10">
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 pl-0.5">
              <input
                value={c.description ?? ''}
                onChange={(e) => update(c.id, { description: e.target.value })}
                placeholder="Beskrivelse (valgfri)…"
                className="flex-1 border-b border-transparent bg-transparent text-sm text-muted-foreground hover:border-input focus:border-foreground focus:outline-none"
              />
              <button
                onClick={() => saveTitleAndDescription(c)}
                disabled={savingId === c.id}
                aria-label="Gem titel og beskrivelse"
                className="inline-flex items-center gap-1 border border-foreground px-2 py-1 text-xs uppercase tracking-wider hover:bg-foreground hover:text-background disabled:opacity-50"
              >
                <Check className="size-3" />
                {savingId === c.id ? '…' : 'Gem'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
