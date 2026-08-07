'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Login mislykkedes')
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <h1 className="font-display text-2xl">Admin login</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Log ind med din Supabase-konto.' : 'Dev-fallback login — sæt ADMIN_FALLBACK_PASSWORD i .env.local.'}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full border border-input bg-transparent px-3 py-2 text-sm focus:outline-none"
          />
        )}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Adgangskode"
          required
          className="w-full border border-input bg-transparent px-3 py-2 text-sm focus:outline-none"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full border border-foreground py-2 text-sm uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
        >
          {loading ? 'Logger ind…' : 'Log ind'}
        </button>
      </form>
    </div>
  )
}
