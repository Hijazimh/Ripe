import { createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const SESSION_COOKIE = 'bbl_admin_session'

function sign(value: string): string {
  const secret = process.env.SESSION_SECRET ?? 'fallback-dev-secret'
  return createHmac('sha256', secret).update(value).digest('hex')
}

export function makeSessionToken(password: string): string {
  // Token = sign(password), so it's stateless but unforgeable
  return sign(password)
}

export function isValidSessionToken(token: string): boolean {
  const password = process.env.ADMIN_PASSWORD ?? ''
  const expected = makeSessionToken(password)
  // Constant-time comparison
  if (token.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

/** Check if the current request has a valid admin session (server component / route handler). */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return false
  return isValidSessionToken(token)
}

/** Check if a NextRequest has a valid admin session (middleware). */
export function isAuthenticatedRequest(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false
  return isValidSessionToken(token)
}

export { SESSION_COOKIE }
