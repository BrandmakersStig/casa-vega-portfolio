'use client'

import { useState } from 'react'
import { Printer } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import type { PortfolioImage } from '@/types'

const SIZES = ['20×30 cm', '30×40 cm', '50×70 cm', '70×100 cm']
const MATERIALS = ['Fine art papir', 'Akrylglas', 'Aluminium (dibond)', 'Lærred']

export function PrintOrderDialog({ image, className }: { image: PortfolioImage; className?: string }) {
  const [open, setOpen] = useState(false)
  const [size, setSize] = useState(SIZES[1])
  const [material, setMaterial] = useState(MATERIALS[0])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const res = await fetch('/api/print-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId: image.id, customerName: name, customerEmail: email, size, material, notes }),
    })
    setStatus(res.ok ? 'sent' : 'error')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setStatus('idle')
      }}
    >
      <DialogTrigger
        render={<button type="button" className={`inline-flex size-9 items-center justify-center hover:opacity-70 ${className ?? ''}`} />}
        aria-label="Bestil print"
      >
        <Printer className="size-4" />
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Bestil print</DialogTitle>
          <DialogDescription>{image.title} — vi vender tilbage med pris og leveringstid.</DialogDescription>
        </DialogHeader>
        {status === 'sent' ? (
          <p className="text-sm text-muted-foreground">Tak! Din forespørgsel er sendt — vi kontakter dig på {email}.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select value={size} onChange={(e) => setSize(e.target.value)} className="border border-input bg-transparent px-2 py-2 text-sm">
                {SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={material} onChange={(e) => setMaterial(e.target.value)} className="border border-input bg-transparent px-2 py-2 text-sm">
                {MATERIALS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Navn"
              required
              className="w-full border border-input bg-transparent px-3 py-2 text-sm focus:outline-none"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full border border-input bg-transparent px-3 py-2 text-sm focus:outline-none"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bemærkninger (valgfri)"
              rows={2}
              className="w-full resize-none border border-input bg-transparent px-3 py-2 text-sm focus:outline-none"
            />
            {status === 'error' && <p className="text-sm text-destructive">Noget gik galt — prøv igen.</p>}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full border border-foreground py-2 text-sm uppercase tracking-wider hover:bg-foreground hover:text-background disabled:opacity-50"
            >
              {status === 'sending' ? 'Sender…' : 'Send forespørgsel'}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
