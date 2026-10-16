/**
 * Dev-Preview Only Harness
 * Used only in AI Studio iframe preview environment to navigate between routes.
 * Imports authoritative page components and layouts from apps/web.
 */

import React, { useState, useEffect } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader.tsx';
import { PublicFooter } from '@/components/layout/PublicFooter.tsx';
import { AdminSidebar } from '@/components/layout/AdminSidebar.tsx';
import { AdminHeader } from '@/components/layout/AdminHeader.tsx';
import { AdminMobileNav } from '@/components/layout/AdminMobileNav.tsx';
import { auth, checkRouteAccess, type AuthSession } from '@/lib/auth.ts';
import { SEOHead } from '@/components/seo/SEOHead.tsx';
import { renderRouteComponent } from './route-map.tsx';

function getInitialPath(): string {
  if (typeof window !== 'undefined') {
    const full = window.location.pathname + window.location.search;
    return full || '/';
  }
  return '/';
}

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    auth.getSession().then(setSession);
  }, []);

  // Listen to browser Back and Forward navigation buttons
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const full = window.location.pathname + window.location.search || '/';
        setCurrentPath(full);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = async (targetPath: string, replace = false) => {
    const [pathname = '/'] = targetPath.split('?');
    const access = checkRouteAccess(pathname, session);
    const finalPath = !access.authorized && access.redirectUrl ? access.redirectUrl : targetPath;

    if (typeof window !== 'undefined') {
      const currentUrl = window.location.pathname + window.location.search;
      if (currentUrl !== finalPath) {
        if (replace) {
          window.history.replaceState({ path: finalPath }, '', finalPath);
        } else {
          window.history.pushState({ path: finalPath }, '', finalPath);
        }
      }
    }

    setCurrentPath(finalPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global anchor tag click interception for client-side single page transitions
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Only intercept standard left click without modifier keys
      if (
        e.button !== 0 ||
        e.metaKey ||
        e.altKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.defaultPrevented
      ) {
        return;
      }

      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      if (
        target.hasAttribute('download') ||
        target.target === '_blank' ||
        target.getAttribute('rel')?.includes('external')
      ) {
        return;
      }

      const href = target.getAttribute('href');
      if (!href) return;

      // Only intercept internal application routes
      if (href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault();
        navigate(href);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [session]);

  const handleStaffLogin = async () => {
    const s = await auth.setDevStaffSession();
    setSession(s);
    navigate('/admin');
  };

  const handleCustomerLogin = async () => {
    const s = await auth.setDevCustomerSession();
    setSession(s);
    navigate('/account');
  };

  const handleSignOut = async () => {
    await auth.signOut();
    setSession(null);
    if (currentPath.startsWith('/admin')) {
      navigate('/admin/login');
    } else if (currentPath.startsWith('/account')) {
      navigate('/login');
    }
  };

  const cleanPathname = currentPath.split('?')[0] || '/';
  const isAdminRoute = cleanPathname.startsWith('/admin') && cleanPathname !== '/admin/login';

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans">
      {/* Route-aware Dynamic SEO Head Manager */}
      <SEOHead currentPath={cleanPathname} />

      {/* Main View inside respective layout shell */}
      {isAdminRoute ? (
        <div className="min-h-screen flex bg-slate-50">
          <div className="hidden md:block">
            <AdminSidebar currentPath={currentPath} onNavigate={navigate} />
          </div>
          <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
            <AdminHeader session={session} onSignOut={handleSignOut} onNavigate={navigate} />
            <main className="flex-1 overflow-y-auto">
              {renderRouteComponent({
                currentPath,
                onNavigate: navigate,
                onStaffLogin: handleStaffLogin,
                onCustomerLogin: handleCustomerLogin,
              })}
            </main>
            <AdminMobileNav currentPath={currentPath} onNavigate={navigate} />
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col">
          <PublicHeader
            currentPath={currentPath}
            onNavigate={navigate}
            userRole={session?.user.role}
          />
          <main className="flex-1">
            {renderRouteComponent({
              currentPath,
              onNavigate: navigate,
              onStaffLogin: handleStaffLogin,
              onCustomerLogin: handleCustomerLogin,
            })}
          </main>
          <PublicFooter onNavigate={navigate} />
        </div>
      )}
    </div>
  );
}
