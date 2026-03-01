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

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/devices')
    const data = await res.json()
    setDevices(data.devices ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleAccess(device: Device) {
    setActionId(device.id)
    await fetch(`/api/admin/devices/${device.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_allowed: !device.is_allowed }),
    })
    await load()
    setActionId(null)
  }

  async function deleteDevice(id: string) {
    if (!confirm('Delete this device? They will need to re-register with an invite code.')) return
    setActionId(id)
    await fetch(`/api/admin/devices/${id}`, { method: 'DELETE' })
    await load()
    setActionId(null)
  }

  function startEdit(device: Device) {
    setEditId(device.id)
    setEditName(device.display_name ?? '')
    setEditNotes(device.notes ?? '')
  }

  async function saveEdit(id: string) {
    setActionId(id)
    await fetch(`/api/admin/devices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: editName || null, notes: editNotes || null }),
    })
    setEditId(null)
    await load()
    setActionId(null)
  }

  if (loading) {
    return <p className="text-gray-500">Loading devices...</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Devices</h1>
        <span className="text-gray-500 text-sm">{devices.length} registered</span>
      </div>

      {devices.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          No devices registered yet. Share an invite code to get started.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Tester</th>
                <th className="px-4 py-3 text-left">Device ID</th>
                <th className="px-4 py-3 text-left">Code Used</th>
                <th className="px-4 py-3 text-left">Last Seen</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {devices.map(device => (
                <tr key={device.id} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                  <td className="px-4 py-3">
                    {editId === device.id ? (
                      <div className="space-y-1">
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          placeholder="Name"
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                        />
                        <input
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          placeholder="Notes"
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(device.id)}
                            disabled={actionId === device.id}
                            className="text-blue-400 hover:text-blue-300 text-xs"
                          >
                            Save
                          </button>
                          <button onClick={() => setEditId(null)} className="text-gray-500 hover:text-gray-300 text-xs">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-white font-medium">
                          {device.display_name ?? <span className="text-gray-500 italic">Unnamed</span>}
                        </div>
                        {device.notes && <div className="text-gray-500 text-xs mt-0.5">{device.notes}</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-400 text-xs">
                    {device.device_id.substring(0, 12)}…
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-400">
                    {device.invite_code}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{timeAgo(device.last_seen_at)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        device.is_allowed
                          ? 'bg-green-900 text-green-300'
                          : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {device.is_allowed ? 'Allowed' : 'Revoked'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 items-center">
                      <button
                        onClick={() => toggleAccess(device)}
                        disabled={actionId === device.id}
                        className={`text-xs font-medium transition-colors disabled:opacity-50 ${
                          device.is_allowed
                            ? 'text-red-400 hover:text-red-300'
                            : 'text-green-400 hover:text-green-300'
                        }`}
                      >
                        {device.is_allowed ? 'Revoke' : 'Restore'}
                      </button>
                      <button
                        onClick={() => startEdit(device)}
                        className="text-gray-500 hover:text-gray-300 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteDevice(device.id)}
                        disabled={actionId === device.id}
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
