'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, Check, X, Trash2 } from 'lucide-react'
import type { Comment } from '@/types'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

export function CommentsModeration({ comments }: { comments: Comment[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(comments)

  async function patch(id: string, body: Record<string, unknown>) {
    setRows((r) => r.map((c) => (c.id === id ? { ...c, ...body } : c)))
    await fetch(`/api/admin/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    router.refresh()
  }

  async function remove(id: string) {
    setRows((r) => r.filter((c) => c.id !== id))
    await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (rows.length === 0) return <p className="text-muted-foreground">Ingen kommentarer.</p>

  return (
    <ul className="divide-y divide-border border-y border-border">
      {rows.map((c) => (
        <li key={c.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{c.authorName}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  c.status === 'approved' && 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
                  c.status === 'pending' && 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
                  c.status === 'rejected' && 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                )}
              >
                {c.status}
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm">{c.body}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {c.status !== 'approved' && (
              <button onClick={() => patch(c.id, { status: 'approved' })} aria-label="Godkend" className="rounded p-1.5 hover:bg-accent">
                <Check className="size-4" />
              </button>
            )}
            {c.status !== 'rejected' && (
              <button onClick={() => patch(c.id, { status: 'rejected' })} aria-label="Afvis" className="rounded p-1.5 hover:bg-accent">
                <X className="size-4" />
              </button>
            )}
            <button onClick={() => patch(c.id, { pinned: !c.pinned })} aria-label="Fastgør" className={cn('rounded p-1.5 hover:bg-accent', c.pinned && 'text-foreground')}>
              <Pin className="size-4" />
            </button>
            <button onClick={() => remove(c.id)} aria-label="Slet" className="rounded p-1.5 text-destructive hover:bg-destructive/10">
              <Trash2 className="size-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
