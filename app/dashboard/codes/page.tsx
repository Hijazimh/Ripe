'use client'

import { useState, useEffect, useCallback } from 'react'
import type { InviteCode } from '@/lib/db'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border ${
        type === 'success'
          ? 'bg-gray-900 text-emerald-300 border-emerald-800'
          : 'bg-gray-900 text-red-300 border-red-800'
      }`}
    >
      {msg}
    </div>
  )
}

export default function CodesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [customCode, setCustomCode] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/invite-codes')
    const data = await res.json()
    setCodes(data.codes ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function generateCode() {
    setGenerating(true)
    const body = customCode.trim() ? { code: customCode.trim() } : {}
    const res = await fetch('/api/admin/invite-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json()
      setCustomCode('')
      setCodes(prev => [data.code, ...prev])
      showToast(`${data.code.code} created`)
    } else {
      const err = await res.json()
      showToast(err?.error ?? 'Failed to create code', 'error')
    }
    setGenerating(false)
  }

  async function deactivateCode(id: string) {
    setActionId(id)
    setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: false } : c))
    const res = await fetch(`/api/admin/invite-codes/${id}`, { method: 'PATCH' })
    if (!res.ok) {
      setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: true } : c))
      showToast('Failed to deactivate', 'error')
    }
    setActionId(null)
  }

  async function deleteCode(id: string) {
    if (!confirm('Delete this pro key?')) return
    setActionId(id)
    await fetch(`/api/admin/invite-codes/${id}`, { method: 'DELETE' })
    setCodes(prev => prev.filter(c => c.id !== id))
    setActionId(null)
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 1500)
  }

  const activeCount = codes.filter(c => c.is_active).length

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-7 w-28 bg-gray-800 rounded-lg" />
        <div className="h-20 bg-gray-900 rounded-xl" />
        <div className="h-64 bg-gray-900 rounded-xl" />
      </div>
    )
  }

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">Pro Keys</h1>
        <span className="text-xs text-gray-600 font-medium">
          {activeCount} active · {codes.length} total
        </span>
      </div>

      {/* Generate */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Generate Key</div>
        <div className="flex gap-3">
          <input
            value={customCode}
            onChange={e => setCustomCode(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') generateCode() }}
            placeholder="Custom code — or leave blank to auto-generate"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
          <button
            onClick={generateCode}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            {generating ? 'Creating…' : 'Generate'}
          </button>
        </div>
      </div>

      {codes.length === 0 ? (
        <div className="text-center py-24 text-gray-600 bg-gray-900/50 rounded-xl border border-gray-800">
          No pro keys yet. Generate one above.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {codes.map(code => (
                <tr key={code.id} className="bg-gray-950 hover:bg-gray-900/40 transition-colors">
                  {/* Code + copy */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-white tracking-wider">{code.code}</span>
                      <button
                        onClick={() => copyCode(code.code)}
                        className={`text-xs px-2 py-0.5 rounded-md border transition-colors ${
                          copied === code.code
                            ? 'bg-emerald-900/40 border-emerald-800 text-emerald-400'
                            : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        {copied === code.code ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{formatDate(code.created_at)}</td>

                  {/* Status dot */}
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      code.is_active ? 'text-emerald-400' : 'text-gray-600'
                    }`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                        code.is_active ? 'bg-emerald-400' : 'bg-gray-700'
                      }`} />
                      {code.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-3">
                      {code.is_active && (
                        <button
                          onClick={() => deactivateCode(code.id)}
                          disabled={actionId === code.id}
                          className="text-xs text-yellow-600 hover:text-yellow-400 transition-colors disabled:opacity-40"
                        >
                          Deactivate
                        </button>
                      )}
                      <button
                        onClick={() => deleteCode(code.id)}
                        disabled={actionId === code.id}
                        className="text-xs text-gray-700 hover:text-red-400 transition-colors disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
