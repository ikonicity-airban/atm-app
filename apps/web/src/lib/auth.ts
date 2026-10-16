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

// In-memory / session store
let currentSession: AuthSession | null = null;

// Initialize from localStorage if running in browser
if (typeof window !== 'undefined') {
  try {
    const stored = window.localStorage.getItem('atm_auth_session');
    if (stored) {
      currentSession = JSON.parse(stored);
    }
  } catch {
    // Ignore storage parse issues
  }
}

export const auth = {
  async getSession(): Promise<AuthSession | null> {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('atm_auth_session');
        if (stored) {
          currentSession = JSON.parse(stored);
        }
      } catch {
        // Ignore
      }
    }
    return currentSession;
  },

  async setSession(user: { id: string; email: string; name: string; role: UserRole; image?: string | null }): Promise<AuthSession> {
    const session: AuthSession = {
      user,
      session: {
        id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
    };
    currentSession = session;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('atm_auth_session', JSON.stringify(session));
      } catch {
        // Ignore
      }
    }
    return session;
  },

  async setDevStaffSession() {
    return this.setSession({
      id: 'user-staff-dev-01',
      email: 'admin@atmnigeria.com',
      name: 'Ascent Operations Lead',
      role: 'staff',
    });
  },

  async setDevCustomerSession() {
    return this.setSession({
      id: 'user-cust-dev-01',
      email: 'customer@example.com',
      name: 'Chioma Okeke',
      role: 'customer',
    });
  },

  async signOut() {
    currentSession = null;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('atm_auth_session');
      } catch {
        // Ignore
      }
    }
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
