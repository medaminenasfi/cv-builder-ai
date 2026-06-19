import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/admin/login'];

const USER_COOKIE = 'cv_user_access_token';
const ADMIN_COOKIE = 'cv_admin_access_token';

function isUserAppRoute(path: string): boolean {
  return (
    path === '/dashboard' ||
    path.startsWith('/templates') ||
    path.startsWith('/job-match') ||
    path.startsWith('/settings') ||
    path.startsWith('/cv/')
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userToken = request.cookies.get(USER_COOKIE)?.value;
  const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/cv/share/');

  // Admin login — public
  if (pathname === '/admin/login') {
    if (adminToken) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // Admin panel — admin session only (independent from user session)
  if (pathname.startsWith('/admin')) {
    if (!adminToken) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isPublic) {
    if (userToken && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (userToken && pathname === '/register') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // User app — user session only
  if (isUserAppRoute(pathname) || !isPublic) {
    if (!userToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.png$|.*\\.jpg$).*)',
  ],
};
