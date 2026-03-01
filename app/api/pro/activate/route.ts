import { NextRequest, NextResponse } from 'next/server'
import { getDeviceByDeviceId, getInviteCode, activateProLicense } from '@/lib/db'

export async function POST(request: NextRequest) {
  let body: { deviceId?: string; proKey?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'INVALID_BODY' }, { status: 400 })
  }

  const { deviceId, proKey } = body

  if (!deviceId || typeof deviceId !== 'string' || deviceId.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'MISSING_DEVICE_ID' }, { status: 400 })
  }
  if (!proKey || typeof proKey !== 'string' || proKey.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'MISSING_PRO_KEY' }, { status: 400 })
  }

  const cleanDeviceId = deviceId.trim().toLowerCase()
  const cleanKey = proKey.trim().toUpperCase()

  // Device must already be registered
  const device = await getDeviceByDeviceId(cleanDeviceId)
  if (!device) {
    return NextResponse.json({ success: false, error: 'NOT_REGISTERED' }, { status: 403 })
  }

  // Validate the pro key against invite_codes table
  const code = await getInviteCode(cleanKey)
  if (!code) {
    return NextResponse.json({ success: false, error: 'INVALID_KEY' }, { status: 403 })
  }
  if (!code.is_active) {
    return NextResponse.json({ success: false, error: 'KEY_INACTIVE' }, { status: 403 })
  }

  // Activate pro access
  await activateProLicense(cleanDeviceId, cleanKey)

  return NextResponse.json({ success: true })
}
