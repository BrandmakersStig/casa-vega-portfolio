'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Check, Download, Link2, Share2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import type { PortfolioImage } from '@/types'

function trackEvent(imageId: string, kind: 'view' | 'download' | 'share') {
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageId, kind }),
  }).catch(() => {})
}

export function ShareMenu({ image }: { image: PortfolioImage }) {
  const [open, setOpen] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined' ? `${window.location.origin}/collections/${image.collectionSlug}/${image.slug}` : ''

  useEffect(() => {
    if (!open || !url) return
    QRCode.toDataURL(url, { margin: 1, width: 200, color: { dark: '#000000', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(null))
  }, [open, url])

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    trackEvent(image.id, 'share')
    setTimeout(() => setCopied(false), 1500)
  }

  function download() {
    trackEvent(image.id, 'download')
    const link = document.createElement('a')
    link.href = image.downloadPolicy === 'original' || image.downloadPolicy === 'watermark' ? image.urls.original : image.urls.medium
    link.download = `${image.slug}.jpg`
    link.click()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" />}
        aria-label="Del billede"
      >
        <Share2 className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-3">
        <button
          onClick={copyLink}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
        >
          {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
          {copied ? 'Link kopieret' : 'Kopiér link'}
        </button>
        {image.downloadPolicy !== 'none' && (
          <button onClick={download} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
            <Download className="size-4" />
            Download {image.downloadPolicy === 'low' ? '(lav opløsning)' : image.downloadPolicy === 'original' ? '(original)' : '(vandmærket)'}
          </button>
        )}
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR-kode til dette billede" className="mx-auto size-32" />
        )}
      </PopoverContent>
    </Popover>
  )
}
