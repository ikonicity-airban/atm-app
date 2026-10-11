/**
 * Next.js Edge Middleware for Route Protection
 * - /admin/* requires role === 'staff' (redirects to /admin/login)
 * - /account requires authenticated customer (redirects to /login)
 */

export interface NextRequestShim {
  nextUrl: {
    pathname: string;
  };
  cookies: {
    get: (name: string) => { value: string } | undefined;
  };
}

export function middleware(request: NextRequestShim) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const staffSessionCookie = request.cookies.get('atm_staff_session');
    if (!staffSessionCookie?.value) {
      // Redirect to staff login
      return {
        redirect: '/admin/login',
      };
    }
  }

  // Protect /account routes
  if (pathname.startsWith('/account')) {
    const customerSessionCookie = request.cookies.get('atm_session');
    if (!customerSessionCookie?.value) {
      return {
        redirect: '/login',
      };
    }
  }

  return null;
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
