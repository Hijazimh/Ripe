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

export default function CodesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [customCode, setCustomCode] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

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
      setCustomCode('')
      await load()
    } else {
      const err = await res.json()
      alert(err?.error ?? 'Failed to create code')
    }
    setGenerating(false)
  }

  async function deactivateCode(id: string) {
    setActionId(id)
    await fetch(`/api/admin/invite-codes/${id}`, { method: 'PATCH' })
    await load()
    setActionId(null)
  }

  async function deleteCode(id: string) {
    if (!confirm('Delete this invite code?')) return
    setActionId(id)
    await fetch(`/api/admin/invite-codes/${id}`, { method: 'DELETE' })
    await load()
    setActionId(null)
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 1500)
  }

  if (loading) {
    return <p className="text-gray-500">Loading invite codes...</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Invite Codes</h1>
        <span className="text-gray-500 text-sm">{codes.filter(c => c.is_active).length} active</span>
      </div>

      {/* Generate */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">Custom code (optional)</label>
          <input
            value={customCode}
            onChange={e => setCustomCode(e.target.value)}
            placeholder="Leave blank for auto-generated (e.g. BBL-A3X9)"
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={generateCode}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
        >
          {generating ? 'Creating...' : 'Generate Code'}
        </button>
      </div>

      {codes.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No invite codes yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {codes.map(code => (
                <tr key={code.id} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{code.code}</span>
                      <button
                        onClick={() => copyCode(code.code)}
                        className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
                        title="Copy"
                      >
                        {copied === code.code ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(code.created_at)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        code.is_active
                          ? 'bg-green-900 text-green-300'
                          : 'bg-gray-800 text-gray-500'
                      }`}
                    >
                      {code.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      {code.is_active && (
                        <button
                          onClick={() => deactivateCode(code.id)}
                          disabled={actionId === code.id}
                          className="text-yellow-500 hover:text-yellow-400 text-xs transition-colors disabled:opacity-50"
                        >
                          Deactivate
                        </button>
                      )}
                      <button
                        onClick={() => deleteCode(code.id)}
                        disabled={actionId === code.id}
                        className="text-gray-600 hover:text-red-400 text-xs transition-colors disabled:opacity-50"
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
