import { NextRequest, NextResponse } from 'next/server'
import { getInviteCode, registerDevice, getDeviceByDeviceId } from '@/lib/db'

export async function POST(request: NextRequest) {
  let body: { deviceId?: string; inviteCode?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'INVALID_BODY' }, { status: 400 })
  }

  const { deviceId, inviteCode } = body

  if (!deviceId || typeof deviceId !== 'string' || deviceId.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'MISSING_DEVICE_ID' }, { status: 400 })
  }
  if (!inviteCode || typeof inviteCode !== 'string' || inviteCode.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'MISSING_INVITE_CODE' }, { status: 400 })
  }

  const cleanDeviceId = deviceId.trim().toLowerCase()
  const cleanCode = inviteCode.trim().toUpperCase()

  // If device already registered, just return success (idempotent)
  const existing = await getDeviceByDeviceId(cleanDeviceId)
  if (existing) {
    return NextResponse.json({ success: true, alreadyRegistered: true })
  }

  // Validate invite code
  const code = await getInviteCode(cleanCode)
  if (!code) {
    return NextResponse.json({ success: false, error: 'INVALID_CODE' }, { status: 403 })
  }
  if (!code.is_active) {
    return NextResponse.json({ success: false, error: 'CODE_INACTIVE' }, { status: 403 })
  }

  // Register the device
  await registerDevice(cleanDeviceId, cleanCode)

  return NextResponse.json({ success: true })
}
