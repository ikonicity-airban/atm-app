/**
 * Dev-Preview Only Harness
 * Used only in AI Studio iframe preview environment to navigate between routes.
 * Imports authoritative page components and layouts from apps/web.
 */

import React, { useState, useEffect } from 'react';
import { PublicHeader } from '../apps/web/src/components/layout/PublicHeader.tsx';
import { PublicFooter } from '../apps/web/src/components/layout/PublicFooter.tsx';
import { AdminSidebar } from '../apps/web/src/components/layout/AdminSidebar.tsx';
import { AdminHeader } from '../apps/web/src/components/layout/AdminHeader.tsx';
import { AdminMobileNav } from '../apps/web/src/components/layout/AdminMobileNav.tsx';
import { auth, checkRouteAccess, type AuthSession } from '../apps/web/src/lib/auth.ts';
import { renderRouteComponent } from './route-map.tsx';
import { Compass, Wrench, Palette } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [showDevToolbar, setShowDevToolbar] = useState<boolean>(true);

  useEffect(() => {
    auth.getSession().then(setSession);
  }, []);

  const navigate = async (targetPath: string) => {
    const access = checkRouteAccess(targetPath, session);
    if (!access.authorized && access.redirectUrl) {
      setCurrentPath(access.redirectUrl);
      return;
    }
    setCurrentPath(targetPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStaffLogin = async () => {
    const s = await auth.setDevStaffSession();
    setSession(s);
    setCurrentPath('/admin');
  };

  const handleCustomerLogin = async () => {
    const s = await auth.setDevCustomerSession();
    setSession(s);
    setCurrentPath('/account');
  };

  const handleSignOut = async () => {
    await auth.signOut();
    setSession(null);
    if (currentPath.startsWith('/admin')) {
      setCurrentPath('/admin/login');
    } else if (currentPath.startsWith('/account')) {
      setCurrentPath('/login');
    }
  };

  const isAdminRoute = currentPath.startsWith('/admin') && currentPath !== '/admin/login';

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans">
      {/* Dev Scaffold Navigator Ribbon */}
      <aside
        aria-label="Dev Scaffold Inspector"
        className="bg-slate-950 text-slate-300 border-b border-slate-800 text-xs py-2 px-3 sm:px-6"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#ca2484]" />
              ATM Dev Preview:
            </span>
            <code className="text-[11px] font-mono bg-slate-900 text-pink-400 px-2 py-0.5 rounded border border-slate-800">
              {currentPath}
            </code>
            <button
              type="button"
              onClick={() => navigate('/design')}
              className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-pink-300 hover:text-white bg-pink-950/60 px-2 py-0.5 rounded border border-pink-800 cursor-pointer"
            >
              <Palette className="w-3 h-3" />
              <span>QA /design Page</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-400">Auth:</span>
              {session ? (
                <span className="text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                  {session.user.role.toUpperCase()}
                </span>
              ) : (
                <span className="text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">GUEST</span>
              )}
            </div>

            {session ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="text-[10px] text-slate-400 hover:text-white underline min-h-[32px] flex items-center cursor-pointer"
              >
                Sign Out
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCustomerLogin}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded min-h-[32px] flex items-center cursor-pointer"
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={handleStaffLogin}
                  className="text-[10px] bg-[#ca2484] hover:bg-[#aa1769] text-white px-2 py-1 rounded font-semibold min-h-[32px] flex items-center cursor-pointer"
                >
                  Staff
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowDevToolbar(!showDevToolbar)}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 min-h-[32px] cursor-pointer"
            >
              <Wrench className="w-3 h-3" />
              {showDevToolbar ? 'Hide Routes' : 'All Routes'}
            </button>
          </div>
        </div>

        {showDevToolbar && (
          <div className="mt-2 pt-2 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1 text-[11px]">
            <button type="button" onClick={() => navigate('/')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/' ? 'text-[#ca2484] font-bold' : ''}`}>/ (Home)</button>
            <button type="button" onClick={() => navigate('/terminals')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/terminals' ? 'text-[#ca2484] font-bold' : ''}`}>/terminals</button>
            <button type="button" onClick={() => navigate('/routes')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/routes' ? 'text-[#ca2484] font-bold' : ''}`}>/routes</button>
            <button type="button" onClick={() => navigate('/routes/enugu-abuja')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/routes/enugu-abuja' ? 'text-[#ca2484] font-bold' : ''}`}>/routes/enugu-abuja</button>
            <button type="button" onClick={() => navigate('/about')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/about' ? 'text-[#ca2484] font-bold' : ''}`}>/about</button>
            <button type="button" onClick={() => navigate('/contact')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/contact' ? 'text-[#ca2484] font-bold' : ''}`}>/contact</button>
            <button type="button" onClick={() => navigate('/faq')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/faq' ? 'text-[#ca2484] font-bold' : ''}`}>/faq</button>
            <button type="button" onClick={() => navigate('/terms')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/terms' ? 'text-[#ca2484] font-bold' : ''}`}>/terms</button>
            <button type="button" onClick={() => navigate('/privacy')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/privacy' ? 'text-[#ca2484] font-bold' : ''}`}>/privacy</button>
            <button type="button" onClick={() => navigate('/design')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/design' ? 'text-[#ca2484] font-bold' : ''}`}>/design (QA)</button>
            <button type="button" onClick={() => navigate('/trips')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/trips' ? 'text-[#ca2484] font-bold' : ''}`}>/trips</button>
            <button type="button" onClick={() => navigate('/courier')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/courier' ? 'text-[#ca2484] font-bold' : ''}`}>/courier</button>
            <button type="button" onClick={() => navigate('/track')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/track' ? 'text-[#ca2484] font-bold' : ''}`}>/track</button>
            <button type="button" onClick={() => navigate('/charter')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/charter' ? 'text-[#ca2484] font-bold' : ''}`}>/charter</button>
            <button type="button" onClick={() => navigate('/corporate')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/corporate' ? 'text-[#ca2484] font-bold' : ''}`}>/corporate</button>
            <button type="button" onClick={() => navigate('/account')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/account' ? 'text-[#ca2484] font-bold' : ''}`}>/account</button>
            <button type="button" onClick={() => navigate('/admin')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/admin' ? 'text-[#ca2484] font-bold' : ''}`}>/admin (Dash)</button>
            <button type="button" onClick={() => navigate('/admin/check-in')} className={`text-left px-1.5 py-0.5 rounded hover:bg-slate-800 truncate cursor-pointer ${currentPath === '/admin/check-in' ? 'text-[#ca2484] font-bold' : ''}`}>/admin/check-in</button>
          </div>
        )}
      </aside>

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
