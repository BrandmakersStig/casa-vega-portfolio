'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

export function CollectionGate({ collectionId, title }: { collectionId: string; title: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/collections/${collectionId}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) router.refresh()
    else setError('Forkert adgangskode')
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center px-4 text-center">
      <Lock className="size-6 text-muted-foreground" />
      <h1 className="mt-4 font-display text-2xl">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Denne collection er adgangskode-beskyttet.</p>
      <form onSubmit={submit} className="mt-6 w-full space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Adgangskode"
          required
          autoFocus
          className="w-full border border-input bg-transparent px-3 py-2 text-center text-sm focus:outline-none"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full border border-foreground py-2 text-sm uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
        >
          {loading ? 'Tjekker…' : 'Lås op'}
        </button>
      </form>
    </div>
  )
}
