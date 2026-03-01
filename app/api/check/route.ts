import { NextRequest, NextResponse } from 'next/server'
import { getDeviceByDeviceId, updateDeviceLastSeen } from '@/lib/db'

export async function GET(request: NextRequest) {
  const deviceId = request.nextUrl.searchParams.get('deviceId')

  if (!deviceId || deviceId.trim().length === 0) {
    return NextResponse.json({ allowed: false, error: 'MISSING_DEVICE_ID' }, { status: 400 })
  }

  const cleanDeviceId = deviceId.trim().toLowerCase()
  const device = await getDeviceByDeviceId(cleanDeviceId)

  if (!device) {
    return NextResponse.json({ allowed: false, isPro: false, error: 'NOT_REGISTERED' }, { status: 403 })
  }

  // Update last seen timestamp in the background (don't await)
  updateDeviceLastSeen(cleanDeviceId).catch(() => {})

  return NextResponse.json({ allowed: device.is_allowed, isPro: device.is_pro })
}
