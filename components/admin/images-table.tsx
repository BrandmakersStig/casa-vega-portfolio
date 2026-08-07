'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import type { Collection, PortfolioImage } from '@/types'

type Row = PortfolioImage

export function ImagesTable({ images, collections }: { images: Row[]; collections: Collection[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [rows, setRows] = useState(images)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null)

  async function generateAi(row: Row) {
    setAiLoadingId(row.id)
    const res = await fetch(`/api/admin/images/${row.id}/ai-generate`, { method: 'POST' })
    const data = await res.json()
    setAiLoadingId(null)
    if (!res.ok) {
      toast.error(data.error ?? 'AI-generering fejlede')
      return
    }
    const mergedKeywords = [...new Set([...row.keywords, ...(data.aiKeywords ?? [])])]
    update(row.id, { keywords: mergedKeywords, description: row.description ?? data.aiDescription })
    toast.success('AI-forslag tilføjet — husk at trykke Gem', { description: data.aiDescription })
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((s) => (s.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))))
  }

  async function saveRow(row: Row) {
    setSavingId(row.id)
    await fetch(`/api/admin/images/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: row.title,
        description: row.description,
        rating: row.rating,
        keywords: row.keywords,
        collectionId: row.collectionId,
        visibility: row.visibility,
        featured: row.featured,
        downloadPolicy: row.downloadPolicy,
      }),
    })
    setSavingId(null)
    router.refresh()
  }

  async function batch(patch: Record<string, unknown>) {
    if (selected.size === 0) return
    await fetch('/api/admin/images/batch', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selected], patch }),
    })
    router.refresh()
  }

  async function batchDelete() {
    if (selected.size === 0) return
    if (!confirm(`Slet ${selected.size} billeder? Dette kan ikke fortrydes.`)) return
    await fetch('/api/admin/images/batch', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selected] }),
    })
    setRows((r) => r.filter((row) => !selected.has(row.id)))
    setSelected(new Set())
    router.refresh()
  }

  function update(id: string, patch: Partial<Row>) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 border border-border bg-accent/50 p-3 text-sm">
          <span>{selected.size} valgt</span>
          <select onChange={(e) => e.target.value && batch({ collectionId: e.target.value })} className="border border-input bg-transparent px-2 py-1">
            <option value="">Flyt til collection…</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <select onChange={(e) => e.target.value && batch({ rating: Number(e.target.value) })} className="border border-input bg-transparent px-2 py-1">
            <option value="">Sæt rating…</option>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} stjerner</option>
            ))}
          </select>
          <select onChange={(e) => e.target.value && batch({ visibility: e.target.value })} className="border border-input bg-transparent px-2 py-1">
            <option value="">Sæt synlighed…</option>
            <option value="public">Offentlig</option>
            <option value="unlisted">Ulistet</option>
            <option value="private">Privat</option>
          </select>
          <select onChange={(e) => e.target.value && batch({ downloadPolicy: e.target.value })} className="border border-input bg-transparent px-2 py-1">
            <option value="">Download…</option>
            <option value="none">Ingen</option>
            <option value="low">Lav opløsning</option>
            <option value="original">Original</option>
            <option value="watermark">Vandmærke</option>
          </select>
          <button onClick={batchDelete} className="ml-auto border border-destructive px-3 py-1 text-destructive hover:bg-destructive hover:text-white">
            Slet valgte
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="w-8 py-2"><input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleAll} /></th>
              <th className="w-14 py-2"></th>
              <th className="py-2">Titel</th>
              <th className="py-2">Collection</th>
              <th className="py-2">Rating</th>
              <th className="py-2">Keywords</th>
              <th className="py-2">Synlighed</th>
              <th className="py-2">Featured</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/50">
                <td className="py-2"><input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} /></td>
                <td className="py-2">
                  <div className="relative size-10 overflow-hidden bg-muted">
                    <Image src={row.urls.thumb} alt={row.title} fill sizes="40px" className="object-cover" />
                  </div>
                </td>
                <td className="py-2 pr-2">
                  <input
                    value={row.title}
                    onChange={(e) => update(row.id, { title: e.target.value })}
                    className="w-full border-b border-transparent bg-transparent hover:border-input focus:border-foreground focus:outline-none"
                  />
                </td>
                <td className="py-2 pr-2">
                  <select value={row.collectionId} onChange={(e) => update(row.id, { collectionId: e.target.value })} className="bg-transparent">
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-2">
                  <select value={row.rating} onChange={(e) => update(row.id, { rating: Number(e.target.value) })} className="bg-transparent">
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-2">
                  <input
                    value={row.keywords.join(', ')}
                    onChange={(e) => update(row.id, { keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })}
                    className="w-full border-b border-transparent bg-transparent hover:border-input focus:border-foreground focus:outline-none"
                  />
                </td>
                <td className="py-2 pr-2">
                  <select value={row.visibility} onChange={(e) => update(row.id, { visibility: e.target.value as Row['visibility'] })} className="bg-transparent">
                    <option value="public">Offentlig</option>
                    <option value="unlisted">Ulistet</option>
                    <option value="private">Privat</option>
                  </select>
                </td>
                <td className="py-2 pr-2 text-center">
                  <input type="checkbox" checked={row.featured} onChange={(e) => update(row.id, { featured: e.target.checked })} />
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => generateAi(row)}
                      disabled={aiLoadingId === row.id}
                      aria-label="Generér keywords og beskrivelse med AI"
                      title="Generér keywords og beskrivelse med AI"
                      className="border border-input px-2 py-1 text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-50"
                    >
                      <Sparkles className={aiLoadingId === row.id ? 'size-3.5 animate-pulse' : 'size-3.5'} />
                    </button>
                    <button
                      onClick={() => saveRow(row)}
                      disabled={savingId === row.id}
                      className="border border-foreground px-2 py-1 text-xs uppercase tracking-wider hover:bg-foreground hover:text-background disabled:opacity-50"
                    >
                      {savingId === row.id ? '…' : 'Gem'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
