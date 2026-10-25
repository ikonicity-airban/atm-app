'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PublicHeader } from '../../components/layout/PublicHeader.tsx';
import { PublicFooter } from '../../components/layout/PublicFooter.tsx';
import { FloatingActionDock } from '../../components/layout/FloatingActionDock.tsx';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    document.body.classList.remove('mobile-drawer-open');
    document.body.style.overflow = '';
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <PublicHeader
        currentPath={pathname || '/'}
        onNavigate={(path) => {
          router.push(path);
        }}
      />
      <div id="app-page-container" className="flex-1 flex flex-col origin-right transition-all duration-300 ease-out">
        <main className="flex-1">{children}</main>
        <PublicFooter
          onNavigate={(path) => {
            router.push(path);
          }}
        />
        <FloatingActionDock />
      </div>
    </div>
  );
}
