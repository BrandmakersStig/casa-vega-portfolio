'use client'

import { useEffect, useState } from 'react'
import { Heart, Pin } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import type { Comment } from '@/types'

export function CommentSection({ imageId }: { imageId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [likedIds, setLikedIds] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/comments/list?imageId=${imageId}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setComments(d.comments ?? []))
    return () => {
      cancelled = true
    }
  }, [imageId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !text.trim()) return
    setStatus('sending')
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId, authorName: name, text, website }),
    })
    if (res.ok) {
      setStatus('sent')
      setText('')
    } else {
      setStatus('error')
    }
  }

  async function like(id: string) {
    if (likedIds.includes(id)) return
    setLikedIds((ids) => [...ids, id])
    setComments((cs) => cs.map((c) => (c.id === id ? { ...c, likeCount: c.likeCount + 1 } : c)))
    fetch(`/api/comments/${id}/like`, { method: 'POST' }).catch(() => {})
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium uppercase tracking-wider text-white/50">Kommentarer ({comments.length})</h3>

      <ul className="space-y-4">
        {comments.map((c) => (
          <li key={c.id} className="space-y-1 border-b border-white/10 pb-4 last:border-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-white">{c.authorName}</span>
              {c.pinned && <Pin className="size-3 text-white/40" />}
              <span className="text-xs text-white/40">{formatDate(c.createdAt)}</span>
            </div>
            <p className="text-sm text-white/80">{c.body}</p>
            <button
              onClick={() => like(c.id)}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70"
              aria-label="Synes godt om kommentar"
            >
              <Heart className={c.likeCount > 0 && likedIds.includes(c.id) ? 'size-3 fill-current' : 'size-3'} />
              {c.likeCount > 0 && c.likeCount}
            </button>
          </li>
        ))}
        {comments.length === 0 && <p className="text-sm text-white/40">Vær den første til at kommentere.</p>}
      </ul>

      {status === 'sent' ? (
        <p className="text-sm text-white/60">Tak! Din kommentar afventer godkendelse.</p>
      ) : (
        <form onSubmit={submit} className="space-y-2">
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Navn"
            required
            maxLength={80}
            className="w-full border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Skriv en kommentar…"
            required
            maxLength={4000}
            rows={3}
            className="w-full resize-none border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="border border-white/40 px-4 py-2 text-xs uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50"
          >
            {status === 'sending' ? 'Sender…' : 'Send kommentar'}
          </button>
          {status === 'error' && <p className="text-xs text-red-400">Noget gik galt — prøv igen.</p>}
        </form>
      )}
    </div>
  )
}
