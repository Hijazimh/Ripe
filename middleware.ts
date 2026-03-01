import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAuthenticatedRequest } from '@/lib/auth-edge'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!(await isAuthenticatedRequest(request))) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
