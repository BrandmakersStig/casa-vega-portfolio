'use client'

import { Columns3 } from 'lucide-react'
import { useLightTableStore } from '@/store/light-table-store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function LightTableButton({ imageId, className }: { imageId: string; className?: string }) {
  const isOn = useLightTableStore((s) => s.isOn(imageId))
  const toggle = useLightTableStore((s) => s.toggle)

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isOn ? 'Fjern fra light table' : 'Tilføj til light table'}
      aria-pressed={isOn}
      onClick={() => toggle(imageId)}
      className={cn(className)}
    >
      <Columns3 className={cn('size-4', isOn && 'fill-current')} />
    </Button>
  )
}
