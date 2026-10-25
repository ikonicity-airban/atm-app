'use client';

import React, { useEffect, useState } from 'react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar.tsx';
import { AdminHeader } from '../../../components/layout/AdminHeader.tsx';
import { AdminMobileNav } from '../../../components/layout/AdminMobileNav.tsx';
import { auth, type AuthSession } from '../../../lib/auth.ts';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getSession().then((s) => {
      if (!s || s.user.role !== 'staff') {
        // Auto initialize demo staff session so admin portal is directly accessible
        auth.setDemoStaffSession().then((demoSession) => {
          setSession(demoSession);
          setLoading(false);
        });
        return;
      }
      setSession(s);
      setLoading(false);
    });
  }, []);

  const handleNavigate = (path: string) => {
    if (typeof window !== 'undefined') window.location.href = path;
  };

  const handleSignOut = async () => {
    await auth.signOut();
    handleNavigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400 text-xs">
        Verifying staff credentials...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <div className="hidden md:block">
        <AdminSidebar currentPath="/admin" onNavigate={handleNavigate} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <AdminHeader session={session} onSignOut={handleSignOut} onNavigate={handleNavigate} />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
        <AdminMobileNav currentPath="/admin" onNavigate={handleNavigate} />
      </div>
    </div>
  );
}
