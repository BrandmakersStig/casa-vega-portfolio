'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SiteSettings } from '@/types'

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter()
  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-5">
      <div>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">Sidetitel</label>
        <input value={form.siteTitle} onChange={(e) => setForm({ ...form, siteTitle: e.target.value })} className="mt-1 w-full border border-input bg-transparent px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">Tagline</label>
        <input value={form.siteTagline} onChange={(e) => setForm({ ...form, siteTagline: e.target.value })} className="mt-1 w-full border border-input bg-transparent px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">Hero-visning</label>
        <select value={form.heroMode} onChange={(e) => setForm({ ...form, heroMode: e.target.value as SiteSettings['heroMode'] })} className="mt-1 border border-input bg-transparent px-3 py-2 text-sm">
          <option value="image">Enkelt billede</option>
          <option value="slideshow">Slideshow</option>
          <option value="video">Video</option>
        </select>
      </div>
      {form.heroMode === 'video' && (
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground">Video-URL</label>
          <input
            value={form.heroVideoUrl ?? ''}
            onChange={(e) => setForm({ ...form, heroVideoUrl: e.target.value })}
            className="mt-1 w-full border border-input bg-transparent px-3 py-2 text-sm"
          />
        </div>
      )}
      <div>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">Kontakt-email</label>
        <input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="mt-1 w-full border border-input bg-transparent px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">Vandmærke-tekst (valgfri)</label>
        <input
          value={form.watermarkText ?? ''}
          onChange={(e) => setForm({ ...form, watermarkText: e.target.value || null })}
          className="mt-1 w-full border border-input bg-transparent px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">Om-side (Markdown)</label>
        <textarea
          value={form.aboutMarkdown}
          onChange={(e) => setForm({ ...form, aboutMarkdown: e.target.value })}
          rows={6}
          className="mt-1 w-full border border-input bg-transparent px-3 py-2 text-sm"
        />
      </div>
      <button disabled={saving} className="border border-foreground px-4 py-2 text-xs uppercase tracking-wider hover:bg-foreground hover:text-background disabled:opacity-50">
        {saving ? 'Gemmer…' : saved ? 'Gemt ✓' : 'Gem indstillinger'}
      </button>
    </form>
  )
}
