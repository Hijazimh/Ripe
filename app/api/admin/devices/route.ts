import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { getAllDevices } from '@/lib/db'

export async function GET(_request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const devices = await getAllDevices()
  return NextResponse.json({ devices })
}
