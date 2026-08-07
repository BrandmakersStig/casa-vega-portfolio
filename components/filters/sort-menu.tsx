'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SortOption } from '@/types'

const LABELS: Record<SortOption, string> = {
  newest: 'Nyeste',
  oldest: 'Ældste',
  'top-rated': 'Bedst ratede',
  'most-viewed': 'Mest viste',
  'most-commented': 'Mest kommenterede',
  random: 'Tilfældig',
}

export function SortMenu({ value }: { value: SortOption }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setSort(sort: SortOption) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sort)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowUpDown className="size-3.5" />
        {LABELS[value]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(LABELS) as SortOption[]).map((opt) => (
          <DropdownMenuItem key={opt} onClick={() => setSort(opt)}>
            {LABELS[opt]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
