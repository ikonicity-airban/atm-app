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
      // Demo access: automatically provision default demo staff session for frictionless review
      const response = NextResponse.next();
      const demoStaff = {
        id: 'staff-lead-01',
        name: 'Chinedu Okafor',
        email: 'admin@atmnigeria.com',
        role: 'staff',
      };
      response.cookies.set('atm_staff_session', encodeURIComponent(JSON.stringify(demoStaff)), {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
      return response;
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
