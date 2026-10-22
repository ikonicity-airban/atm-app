'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { PublicHeader } from '../components/layout/PublicHeader.tsx';
import { PublicFooter } from '../components/layout/PublicFooter.tsx';
import { NotFoundView } from '../components/error/NotFoundView.tsx';

export default function RootNotFound() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <PublicHeader
        currentPath={pathname || '/'}
        onNavigate={(path) => router.push(path)}
      />
      <main className="flex-1 flex items-center justify-center">
        <NotFoundView />
      </main>
      <PublicFooter
        onNavigate={(path) => router.push(path)}
      />
    </div>
  );
}
