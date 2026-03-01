'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Device } from '@/lib/db'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
      <div className={`text-2xl font-bold tabular-nums ${accent ?? 'text-white'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wide">{label}</div>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  color = 'emerald',
}: {
  checked: boolean
  onChange: () => void
  color?: 'emerald' | 'violet'
}) {
  const trackOn = color === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? trackOn : 'bg-gray-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
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

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/devices')
    const data = await res.json()
    setDevices(data.devices ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleAccess(device: Device) {
    const next = !device.is_allowed
    setDevices(prev => prev.map(d => d.id === device.id ? { ...d, is_allowed: next } : d))
    const res = await fetch(`/api/admin/devices/${device.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_allowed: next }),
    })
    if (!res.ok) {
      setDevices(prev => prev.map(d => d.id === device.id ? { ...d, is_allowed: device.is_allowed } : d))
      showToast('Failed to update access', 'error')
    }
  }

  async function togglePro(device: Device) {
    const next = !device.is_pro
    setDevices(prev => prev.map(d => d.id === device.id ? { ...d, is_pro: next } : d))
    const res = await fetch(`/api/admin/devices/${device.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pro: next }),
    })
    if (!res.ok) {
      setDevices(prev => prev.map(d => d.id === device.id ? { ...d, is_pro: device.is_pro } : d))
      showToast('Failed to update pro status', 'error')
    }
  }

  async function deleteDevice(id: string) {
    if (!confirm('Delete this device? They will re-register on next launch.')) return
    setDeletingId(id)
    await fetch(`/api/admin/devices/${id}`, { method: 'DELETE' })
    setDevices(prev => prev.filter(d => d.id !== id))
    setDeletingId(null)
  }

  function startEdit(device: Device) {
    setEditId(device.id)
    setEditName(device.display_name ?? '')
    setEditNotes(device.notes ?? '')
  }

  async function saveEdit(id: string) {
    setSavingId(id)
    await fetch(`/api/admin/devices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: editName || null, notes: editNotes || null }),
    })
    setDevices(prev =>
      prev.map(d => d.id === id ? { ...d, display_name: editName || null, notes: editNotes || null } : d)
    )
    setEditId(null)
    setSavingId(null)
  }

  const allowed = devices.filter(d => d.is_allowed).length
  const pro = devices.filter(d => d.is_pro).length
  const revoked = devices.length - allowed

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-7 w-28 bg-gray-800 rounded-lg" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-900 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-900 rounded-xl" />
      </div>
    )
  }

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">Devices</h1>
        <button
          onClick={load}
          className="text-xs text-gray-600 hover:text-gray-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={devices.length} />
        <StatCard label="Allowed" value={allowed} accent="text-emerald-400" />
        <StatCard label="Pro" value={pro} accent="text-violet-400" />
        <StatCard label="Revoked" value={revoked} accent={revoked > 0 ? 'text-red-400' : 'text-gray-600'} />
      </div>

      {devices.length === 0 ? (
        <div className="text-center py-24 text-gray-600 bg-gray-900/50 rounded-xl border border-gray-800">
          No devices registered yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tester</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pro Key</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Access</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pro</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {devices.map(device => (
                <tr key={device.id} className="bg-gray-950 hover:bg-gray-900/40 transition-colors">
                  {/* Name / Edit */}
                  <td className="px-4 py-3.5 min-w-[160px]">
                    {editId === device.id ? (
                      <div className="space-y-1.5">
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          placeholder="Display name"
                          onKeyDown={e => e.key === 'Enter' && saveEdit(device.id)}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          placeholder="Notes (optional)"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="flex gap-3 pt-0.5">
                          <button
                            onClick={() => saveEdit(device.id)}
                            disabled={savingId === device.id}
                            className="text-xs font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50"
                          >
                            {savingId === device.id ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="text-xs text-gray-600 hover:text-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-white font-medium">
                          {device.display_name ?? (
                            <span className="text-gray-600 italic font-normal">Unnamed</span>
                          )}
                        </div>
                        {device.notes && (
                          <div className="text-gray-500 text-xs mt-0.5">{device.notes}</div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Device ID */}
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs text-gray-600">
                      {device.device_id.substring(0, 13)}…
                    </span>
                  </td>

                  {/* Pro Key */}
                  <td className="px-4 py-3.5">
                    {device.invite_code ? (
                      <span className="font-mono text-xs text-violet-400">{device.invite_code}</span>
                    ) : (
                      <span className="text-gray-700 text-xs">—</span>
                    )}
                  </td>

                  {/* Last Seen */}
                  <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                    {timeAgo(device.last_seen_at)}
                  </td>

                  {/* Access toggle */}
                  <td className="px-4 py-3.5">
                    <div className="flex justify-center">
                      <Toggle
                        checked={device.is_allowed}
                        onChange={() => toggleAccess(device)}
                        color="emerald"
                      />
                    </div>
                  </td>

                  {/* Pro toggle */}
                  <td className="px-4 py-3.5">
                    <div className="flex justify-center">
                      <Toggle
                        checked={device.is_pro}
                        onChange={() => togglePro(device)}
                        color="violet"
                      />
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => startEdit(device)}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteDevice(device.id)}
                        disabled={deletingId === device.id}
                        className="text-xs text-gray-700 hover:text-red-400 transition-colors disabled:opacity-40"
                      >
                        {deletingId === device.id ? '…' : 'Delete'}
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
