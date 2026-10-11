import React from 'react';
import { User, LogOut, ShieldAlert } from 'lucide-react';
import type { AuthSession } from '../../lib/auth.ts';

interface AdminHeaderProps {
  session: AuthSession | null;
  onSignOut: () => void;
  onNavigate: (path: string) => void;
}

export function AdminHeader({ session, onSignOut }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Terminal Console:
        </span>
        <span className="text-xs font-medium bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
          Enugu Central Terminal (Active)
        </span>
      </div>

      <div className="flex items-center gap-3">
        {session ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {session.user.name}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">
                Staff (Operations)
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">
              <User className="w-4 h-4" />
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="p-2 text-slate-500 hover:text-slate-900 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600 text-xs">
            <ShieldAlert className="w-4 h-4" />
            <span>Unauthenticated session</span>
          </div>
        )}
      </div>
    </header>
  );
}
