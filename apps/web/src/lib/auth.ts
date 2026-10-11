/**
 * Better Auth Configuration & Access Control
 * 
 * Rules:
 * - One `user` table with `role` ("customer" | "staff")
 * - Staff are created by admin only, never self-register
 * - /admin/* requires role === 'staff'
 * - /account requires role === 'customer' or authenticated user
 */

import type { UserRole } from '@atm/shared';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    image?: string | null;
  };
  session: {
    id: string;
    expiresAt: string;
  };
}

export interface BetterAuthConfig {
  secret: string;
  baseURL: string;
}

// In-memory / session stub for Phase 0 scaffold
let currentSession: AuthSession | null = null;

export const auth = {
  async getSession(): Promise<AuthSession | null> {
    return currentSession;
  },

  async setDevStaffSession() {
    currentSession = {
      user: {
        id: 'user-staff-dev-01',
        email: 'admin@atmnigeria.com',
        name: 'Ascent Operations Lead',
        role: 'staff',
      },
      session: {
        id: 'sess-dev-01',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
    };
    return currentSession;
  },

  async setDevCustomerSession() {
    currentSession = {
      user: {
        id: 'user-cust-dev-01',
        email: 'customer@example.com',
        name: 'Chioma Okeke',
        role: 'customer',
      },
      session: {
        id: 'sess-dev-02',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
    };
    return currentSession;
  },

  async signOut() {
    currentSession = null;
  },
};

export function checkRouteAccess(pathname: string, session: AuthSession | null): {
  authorized: boolean;
  redirectUrl?: string;
} {
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!session || session.user.role !== 'staff') {
      return { authorized: false, redirectUrl: '/admin/login' };
    }
  }

  if (pathname.startsWith('/account')) {
    if (!session) {
      return { authorized: false, redirectUrl: '/login' };
    }
  }

  return { authorized: true };
}
