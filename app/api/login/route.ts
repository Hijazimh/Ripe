import { NextRequest, NextResponse } from 'next/server'
import { makeSessionToken, SESSION_COOKIE } from '@/lib/auth'

export async function POST(request: NextRequest) {
  let body: { password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const { password } = body
  const adminPassword = process.env.ADMIN_PASSWORD ?? ''

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: 'WRONG_PASSWORD' }, { status: 401 })
  }

  const token = makeSessionToken(adminPassword)
  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete(SESSION_COOKIE)
  return response
}
