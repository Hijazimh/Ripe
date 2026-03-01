import { NextRequest, NextResponse } from 'next/server'
import { registerDevice, getDeviceByDeviceId } from '@/lib/db'

export async function POST(request: NextRequest) {
  let body: { deviceId?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'INVALID_BODY' }, { status: 400 })
  }

  const { deviceId } = body

  if (!deviceId || typeof deviceId !== 'string' || deviceId.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'MISSING_DEVICE_ID' }, { status: 400 })
  }

  const cleanDeviceId = deviceId.trim().toLowerCase()

  // If device already registered, just update last_seen (idempotent)
  const existing = await getDeviceByDeviceId(cleanDeviceId)
  if (existing) {
    return NextResponse.json({ success: true, alreadyRegistered: true, isPro: existing.is_pro })
  }

  // Auto-register the device — no invite code required
  const device = await registerDevice(cleanDeviceId)

  return NextResponse.json({ success: true, isPro: device.is_pro })
}
