import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { getAllInviteCodes, createInviteCode } from '@/lib/db'
import { generateCode } from '@/lib/codes'

export async function GET(_request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const codes = await getAllInviteCodes()
  return NextResponse.json({ codes })
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let customCode: string | undefined
  try {
    const body = await request.json()
    customCode = body?.code?.trim().toUpperCase() || undefined
  } catch {
    // no body — auto-generate
  }

  const code = customCode ?? generateCode()
  const created = await createInviteCode(code)
  return NextResponse.json({ code: created }, { status: 201 })
}
