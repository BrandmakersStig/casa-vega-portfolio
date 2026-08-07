'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  rating: number
  onChange?: (rating: number) => void
  size?: 'sm' | 'md'
}

/** Read-only for visitors; pass onChange (admin-only contexts) to make it editable. */
export function RatingStars({ rating, onChange, size = 'sm' }: RatingStarsProps) {
  const editable = Boolean(onChange)
  const starSize = size === 'sm' ? 'size-3.5' : 'size-5'

  return (
    <div className={cn('flex items-center gap-0.5', editable && 'cursor-pointer')} role={editable ? 'radiogroup' : undefined} aria-label="Bedømmelse">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!editable}
          onClick={() => onChange?.(n === rating ? 0 : n)}
          aria-label={`${n} stjerner`}
          className={cn(!editable && 'cursor-default')}
        >
          <Star className={cn(starSize, n <= rating ? 'fill-current text-current' : 'text-current/25')} />
        </button>
      ))}
    </div>
  )
}
