'use client'

import { useRouter } from 'next/navigation'

export function AdminLogoutButton() {
  const router = useRouter()
  return (
    <button
      onClick={async () => {
        await fetch('/api/admin/logout', { method: 'POST' })
        router.push('/admin/login')
        router.refresh()
      }}
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      Log ud
    </button>
  )
}
