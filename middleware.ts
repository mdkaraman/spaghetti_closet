import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const protectedPaths = ['/jont', '/user', '/pay']

function isProtected(pathname: string) {
  return protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  if (!isProtected(pathname)) {
    return response
  }

  if (!user) {
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
