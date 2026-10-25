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

export interface DemoStaffAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  terminal: string;
  description: string;
}

export const DEMO_STAFF_ACCOUNTS: DemoStaffAccount[] = [
  {
    id: 'staff-lead-01',
    name: 'Chinedu Okafor',
    email: 'admin@atmnigeria.com',
    role: 'staff',
    title: 'Operations & Dispatch Lead',
    terminal: 'Ascent Central HQ (Enugu)',
    description: 'Full supervisory authority across all corridors, live telematics, pricing overrides, and revenue auditing.',
  },
  {
    id: 'staff-terminal-enugu',
    name: 'Amaka Eze',
    email: 'enugu.terminal@atmnigeria.com',
    role: 'staff',
    title: 'Terminal Ticketing Officer',
    terminal: 'Enugu Ogui Road Terminal',
    description: 'Passenger check-in verification, standby passenger assignment, and physical highway manifest printing.',
  },
  {
    id: 'staff-terminal-abuja',
    name: 'Ibrahim Musa',
    email: 'abuja.terminal@atmnigeria.com',
    role: 'staff',
    title: 'Terminal Operations Desk',
    terminal: 'Abuja Utako Terminal',
    description: 'Northern corridor boarding operations, luggage and waybill parcel intake, and departure dispatch.',
  },
  {
    id: 'staff-fleet-01',
    name: 'Babajide Adeleke',
    email: 'fleet.ops@atmnigeria.com',
    role: 'staff',
    title: 'Fleet & Safety Supervisor',
    terminal: 'Central Fleet Depot',
    description: 'Toyota Sienna vehicle telematics, maintenance cycle tracking, driver licensing, and speed limiter monitoring.',
  },
];

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
    if (typeof document !== 'undefined') {
      try {
        const encoded = encodeURIComponent(JSON.stringify(user));
        if (user.role === 'staff') {
          document.cookie = `atm_staff_session=${encoded}; path=/; max-age=604800; SameSite=Lax`;
        }
        document.cookie = `atm_session=${encoded}; path=/; max-age=604800; SameSite=Lax`;
      } catch {
        // Ignore cookie write errors
      }
    }
    return session;
  },

  async setDemoStaffSession(accountId?: string) {
    const account = (accountId ? DEMO_STAFF_ACCOUNTS.find((a) => a.id === accountId) : null) ?? DEMO_STAFF_ACCOUNTS[0];
    if (!account) {
      return this.setSession({
        id: 'staff-lead-01',
        email: 'admin@atmnigeria.com',
        name: 'Chinedu Okafor',
        role: 'staff',
      });
    }
    return this.setSession({
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
    });
  },

  async setDevStaffSession() {
    return this.setDemoStaffSession('staff-lead-01');
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
    if (typeof document !== 'undefined') {
      try {
        document.cookie = 'atm_staff_session=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'atm_session=; path=/; max-age=0; SameSite=Lax';
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
