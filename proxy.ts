import { NextRequest, NextResponse } from 'next/server';

// Cookie name — keep in sync with lib/auth.ts
const COOKIE_NAME = 'dchem_session';

// Paths that don't require auth
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/',
  // Bot polling routes — must remain open (bot doesn't send cookies)
  '/api/config',
  '/api/triggers',
  '/api/logs',
  '/favicon.ico',
  '/_next/',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'],
};
