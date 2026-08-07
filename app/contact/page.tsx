import type { Metadata } from 'next'
import { Mail } from 'lucide-react'
import { getSettings } from '@/lib/data/settings'

export const metadata: Metadata = { title: 'Contact' }

export default async function ContactPage() {
  const settings = await getSettings()
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-light">Kontakt</h1>
      <p className="mt-4 text-muted-foreground">Interesseret i et samarbejde, print eller en klientgalleri? Skriv endelig.</p>
      <a
        href={`mailto:${settings.contactEmail}`}
        className="mt-8 inline-flex items-center gap-2 border border-foreground px-6 py-3 text-sm uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background"
      >
        <Mail className="size-4" />
        {settings.contactEmail}
      </a>
    </div>
  )
}
