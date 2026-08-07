import Link from 'next/link'

export function TagChips({ keywords }: { keywords: string[] }) {
  if (keywords.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {keywords.map((k) => (
        <Link
          key={k}
          href={`/search?keyword=${encodeURIComponent(k)}`}
          className="border border-white/20 px-2.5 py-1 text-xs text-white/80 transition-colors hover:border-white/50 hover:text-white"
        >
          {k}
        </Link>
      ))}
    </div>
  )
}
