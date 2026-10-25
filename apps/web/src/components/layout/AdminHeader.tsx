import React from 'react';
import { User, LogOut, ShieldAlert, ArrowRightLeft } from 'lucide-react';
import type { AuthSession } from '../../lib/auth.ts';
import { ThemeToggle } from '../theme/ThemeToggle.tsx';
import { SoundToggle } from '../theme/SoundToggle.tsx';

interface AdminHeaderProps {
  session: AuthSession | null;
  onSignOut: () => void;
  onNavigate: (path: string) => void;
}

export function AdminHeader({ session, onSignOut, onNavigate }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border text-card-foreground px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:inline">
          Terminal Console:
        </span>
        <span className="text-xs font-medium bg-muted text-foreground px-2 py-0.5 rounded border border-border">
          Enugu Central Terminal (Active)
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
          Demo Staff Access
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <SoundToggle />

        {session ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/admin/login')}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-md border border-border transition-colors cursor-pointer"
              title="Switch demo staff account"
            >
              <ArrowRightLeft className="w-3 h-3 text-primary" />
              <span>Switch Demo Account</span>
            </button>

            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-foreground block leading-tight">
                {session.user.name}
              </span>
              <span className="text-[10px] text-primary font-medium">
                {session.user.email}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <User className="w-4 h-4" />
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="p-2 text-muted-foreground hover:text-foreground rounded focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
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
