'use client'

import { useCallback, useRef, useState } from 'react'
import { UploadCloud, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resizeImageForUpload } from '@/lib/utils/client-image-resize'
import type { Collection } from '@/types'

interface QueueItem {
  id: string
  file: File
  status: 'pending' | 'resizing' | 'uploading' | 'done' | 'error'
  error?: string
}

// Vercel's serverless functions cap the request body around 4.5MB — real
// camera photos routinely exceed that, so we resize client-side first
// (see lib/utils/client-image-resize.ts) whenever a file is anywhere near
// the limit.
const RESIZE_THRESHOLD_BYTES = 3.5 * 1024 * 1024

export function UploadDropzone({ collections }: { collections: Collection[] }) {
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? '')
  const [newCollectionTitle, setNewCollectionTitle] = useState('')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(files: FileList | null) {
    if (!files) return
    const items: QueueItem[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({ id: `${file.name}-${file.size}-${Math.random()}`, file, status: 'pending' }))
    setQueue((q) => [...q, ...items])
  }

  const upload = useCallback(async () => {
    for (const item of queue) {
      if (item.status !== 'pending') continue

      let fileToSend = item.file
      if (item.file.size > RESIZE_THRESHOLD_BYTES) {
        setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, status: 'resizing' } : i)))
        try {
          fileToSend = await resizeImageForUpload(item.file)
        } catch {
          // If client-side resizing fails for any reason, still try the original —
          // it'll just hit the size limit if it's genuinely too large, same as before.
        }
      }

      setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i)))
      const formData = new FormData()
      formData.append('file', fileToSend)
      formData.append('collectionId', collectionId || newCollectionTitle)
      if (newCollectionTitle) formData.append('newCollectionTitle', newCollectionTitle)

      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(body?.error ?? `Upload fejlede (${res.status})`)
        }
        setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, status: 'done' } : i)))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload fejlede'
        setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, status: 'error', error: message } : i)))
      }
    }
  }, [queue, collectionId, newCollectionTitle])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground">Collection</label>
          <select
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
            className="mt-1 border border-input bg-transparent px-3 py-2 text-sm"
          >
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground">…eller ny collection</label>
          <input
            value={newCollectionTitle}
            onChange={(e) => setNewCollectionTitle(e.target.value)}
            placeholder="Ny collection-titel"
            className="mt-1 border border-input bg-transparent px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          addFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-16 text-center transition-colors',
          dragOver ? 'border-foreground bg-accent' : 'border-border'
        )}
      >
        <UploadCloud className="size-8 text-muted-foreground" />
        <p className="text-sm">Træk billeder hertil, eller klik for at vælge</p>
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP — batch-upload understøttet</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {queue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{queue.length} filer i køen</p>
            <button
              onClick={upload}
              disabled={!collectionId && !newCollectionTitle}
              className="border border-foreground px-4 py-1.5 text-xs uppercase tracking-wider hover:bg-foreground hover:text-background disabled:opacity-50"
            >
              Upload alle
            </button>
          </div>
          <ul className="divide-y divide-border border-y border-border text-sm">
            {queue.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 py-2">
                <span className="truncate">
                  {item.file.name}
                  <span className="ml-2 text-xs text-muted-foreground">{(item.file.size / 1024 / 1024).toFixed(1)} MB</span>
                </span>
                {item.status === 'pending' && <span className="text-muted-foreground">Venter</span>}
                {item.status === 'resizing' && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Formindsker…
                  </span>
                )}
                {item.status === 'uploading' && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                {item.status === 'done' && <CheckCircle2 className="size-4 text-green-600" />}
                {item.status === 'error' && (
                  <span className="flex items-center gap-1.5 text-destructive" title={item.error}>
                    <XCircle className="size-4 shrink-0" />
                    <span className="max-w-48 truncate text-xs">{item.error}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
