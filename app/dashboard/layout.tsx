'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/login', { method: 'DELETE' })
    router.push('/login')
  }

  const navLinks = [
    { href: '/dashboard', label: 'Devices' },
    { href: '/dashboard/codes', label: 'Pro Keys' },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800/60 bg-gray-950/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
          {/* Logo */}
          <img src="/ripe-logo.svg" alt="Ripe" className="h-[22px] w-auto opacity-90 mr-2" />

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="ml-auto text-sm text-gray-600 hover:text-gray-300 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
