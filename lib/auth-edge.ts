// Edge-runtime-safe auth — no Node.js modules, no crypto.
// Compares cookie against pre-computed SESSION_TOKEN env var (set on Vercel).

import { NextRequest } from 'next/server'

export const SESSION_COOKIE = 'bbl_admin_session'

export function isAuthenticatedRequest(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false

  const expected = process.env.SESSION_TOKEN ?? ''
  if (!expected || token.length !== expected.length) return false

  // Constant-time comparison to prevent timing attacks
  let diff = 0
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}
