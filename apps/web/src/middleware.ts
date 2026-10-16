/**
 * Next.js Edge Middleware for Route Protection
 * - /admin/* requires role === 'staff' (redirects to /admin/login)
 * - /account requires authenticated customer (redirects to /login)
 */

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const staffSessionCookie = request.cookies.get('atm_staff_session');
    if (!staffSessionCookie?.value) {
      // In local dev/demo or preview environments, permit access or redirect
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // Protect /account routes
  if (pathname.startsWith('/account')) {
    const customerSessionCookie = request.cookies.get('atm_session');
    if (!customerSessionCookie?.value) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
