'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Trash2 } from 'lucide-react'
import type { ClientGallery, Collection } from '@/types'

export function ClientGalleriesManager({ galleries, collections }: { galleries: ClientGallery[]; collections: Collection[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [password, setPassword] = useState('')
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set())
  const [allowFavorites, setAllowFavorites] = useState(true)
  const [allowDownload, setAllowDownload] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function toggleCollection(id: string) {
    setSelectedCollections((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !password.trim() || selectedCollections.size === 0) return
    setCreating(true)
    await fetch('/api/admin/client-galleries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        clientName: clientName.trim(),
        password,
        collectionIds: [...selectedCollections],
        allowFavorites,
        allowDownload,
      }),
    })
    setTitle('')
    setClientName('')
    setPassword('')
    setSelectedCollections(new Set())
    setCreating(false)
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Slet klientgalleri? Selve billederne/collections berøres ikke.')) return
    await fetch(`/api/admin/client-galleries/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  function copyLink(slug: string, id: string) {
    const url = `${window.location.origin}/gallery/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div>
      <form onSubmit={create} className="mb-8 space-y-3 border border-border p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Galleri-titel"
            className="border border-input bg-transparent px-3 py-2 text-sm"
          />
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Kundenavn (valgfri)"
            className="border border-input bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Adgangskode"
          className="w-full border border-input bg-transparent px-3 py-2 text-sm"
        />
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Collections i galleriet</p>
          <div className="flex flex-wrap gap-3">
            {collections.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={selectedCollections.has(c.id)} onChange={() => toggleCollection(c.id)} />
                {c.title}
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={allowFavorites} onChange={(e) => setAllowFavorites(e.target.checked)} />
            Tillad favoritter
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={allowDownload} onChange={(e) => setAllowDownload(e.target.checked)} />
            Tillad download
          </label>
        </div>
        <button disabled={creating} className="border border-foreground px-4 py-2 text-xs uppercase tracking-wider hover:bg-foreground hover:text-background disabled:opacity-50">
          Opret galleri
        </button>
      </form>

      <ul className="divide-y divide-border border-y border-border">
        {galleries.map((g) => (
          <li key={g.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-40 flex-1">
              <p className="font-medium">{g.title}</p>
              {g.clientName && <p className="text-xs text-muted-foreground">{g.clientName}</p>}
            </div>
            <span className="text-xs text-muted-foreground">{g.collectionIds.length} collections</span>
            <button onClick={() => copyLink(g.slug, g.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              {copiedId === g.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copiedId === g.id ? 'Kopieret' : 'Kopiér link'}
            </button>
            <button onClick={() => remove(g.id)} aria-label="Slet" className="rounded p-1.5 text-destructive hover:bg-destructive/10">
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
        {galleries.length === 0 && <li className="py-6 text-sm text-muted-foreground">Ingen klientgallerier endnu.</li>}
      </ul>
    </div>
  )
}
