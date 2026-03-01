import { NextRequest, NextResponse } from 'next/server'
import { createTables } from '@/lib/db'

// One-time setup endpoint — creates the database tables.
// Protected by admin password to prevent unauthorized calls.
export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD
  const provided = request.headers.get('x-admin-key')

  if (!adminPassword || provided !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await createTables()
    return NextResponse.json({ success: true, message: 'Tables created (or already exist).' })
  } catch (err) {
    console.error('Setup error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
