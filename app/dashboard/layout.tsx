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

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-white text-lg mr-4">BBLauncher Admin</span>
        <Link
          href="/dashboard"
          className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
            pathname === '/dashboard'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Devices
        </Link>
        <Link
          href="/dashboard/codes"
          className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
            pathname === '/dashboard/codes'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Invite Codes
        </Link>
        <button
          onClick={handleLogout}
          className="ml-auto text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Logout
        </button>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
