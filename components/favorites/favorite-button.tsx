'use client'

import { Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFavoritesStore } from '@/store/favorites-store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function FavoriteButton({ imageId, className }: { imageId: string; className?: string }) {
  const isFavorite = useFavoritesStore((s) => s.isFavorite(imageId))
  const toggle = useFavoritesStore((s) => s.toggle)

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isFavorite ? 'Fjern fra favoritter' : 'Tilføj til favoritter'}
      aria-pressed={isFavorite}
      onClick={() => toggle(imageId)}
      className={cn(className)}
    >
      <motion.span initial={false} animate={{ scale: isFavorite ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.3 }}>
        <Heart className={cn('size-4', isFavorite && 'fill-current text-red-500')} />
      </motion.span>
    </Button>
  )
}
