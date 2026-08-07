import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAdmin } from '@/lib/auth/require-admin'
import { AdminLogoutButton } from '@/components/admin/logout-button'

const NAV = [
  { href: '/admin', label: 'Oversigt' },
  { href: '/admin/upload', label: 'Upload' },
  { href: '/admin/images', label: 'Billeder' },
  { href: '/admin/collections', label: 'Collections' },
  { href: '/admin/client-galleries', label: 'Klientgallerier' },
  { href: '/admin/print-orders', label: 'Print-bestillinger' },
  { href: '/admin/comments', label: 'Kommentarer' },
  { href: '/admin/settings', label: 'Indstillinger' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth — proxy.ts already redirects unauthenticated requests
  // before this ever renders, but double-checking here avoids ever flashing
  // admin content if that guard is bypassed or misconfigured.
  if (!(await isAdmin())) redirect('/admin/login')

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <aside className="w-48 shrink-0">
        <p className="mb-4 font-display text-lg">Admin</p>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded px-2 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t pt-4">
          <AdminLogoutButton />
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
