// Edge-runtime-safe auth — uses Web Crypto API only (no Node.js modules).
// Imported exclusively by middleware.ts.

import { NextRequest } from 'next/server'

export const SESSION_COOKIE = 'bbl_admin_session'

async function computeHmacHex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function isAuthenticatedRequest(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false

  const secret = process.env.SESSION_SECRET ?? 'fallback-dev-secret'
  const password = process.env.ADMIN_PASSWORD ?? ''

  try {
    const expected = await computeHmacHex(secret, password)
    if (token.length !== expected.length) return false
    let diff = 0
    for (let i = 0; i < token.length; i++) {
      diff |= token.charCodeAt(i) ^ expected.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}
