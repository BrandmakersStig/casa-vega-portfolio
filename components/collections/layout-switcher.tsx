'use client'

import { LayoutGrid, Rows3, AlignJustify, Grid2x2 } from 'lucide-react'
import { useViewerPrefsStore } from '@/store/viewer-prefs-store'
import { cn } from '@/lib/utils'
import type { LayoutMode } from '@/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const OPTIONS: { mode: LayoutMode; label: string; icon: typeof LayoutGrid }[] = [
  { mode: 'justified', label: 'Justified', icon: AlignJustify },
  { mode: 'grid', label: 'Klassisk grid', icon: Grid2x2 },
  { mode: 'masonry', label: 'Masonry', icon: Rows3 },
  { mode: 'pinterest', label: 'Pinterest', icon: LayoutGrid },
]

export function LayoutSwitcher() {
  const layoutMode = useViewerPrefsStore((s) => s.layoutMode)
  const setLayoutMode = useViewerPrefsStore((s) => s.setLayoutMode)

  return (
    <div className="flex items-center gap-0.5 border border-border p-0.5">
      {OPTIONS.map(({ mode, label, icon: Icon }) => (
        <Tooltip key={mode}>
          <TooltipTrigger
            aria-label={label}
            aria-pressed={layoutMode === mode}
            onClick={() => setLayoutMode(mode)}
            className={cn(
              'inline-flex size-8 items-center justify-center transition-colors',
              layoutMode === mode ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-4" />
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
