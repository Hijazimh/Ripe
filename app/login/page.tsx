'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/dashboard'

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    setLoading(false)

    if (res.ok) {
      router.push(from)
    } else {
      setError('Incorrect password.')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm px-4">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img src="/ripe-logo.svg" alt="Ripe" className="h-8 w-auto" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-lg font-semibold text-white mb-1">Admin Login</h1>
          <p className="text-gray-500 text-sm mb-7">Enter your password to access the dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoFocus
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors text-sm"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Verifying…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
