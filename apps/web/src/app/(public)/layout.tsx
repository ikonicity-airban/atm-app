'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PublicHeader } from '../../components/layout/PublicHeader.tsx';
import { PublicFooter } from '../../components/layout/PublicFooter.tsx';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <PublicHeader
        currentPath={pathname || '/'}
        onNavigate={(path) => {
          router.push(path);
        }}
      />
      <main className="flex-1">{children}</main>
      <PublicFooter
        onNavigate={(path) => {
          router.push(path);
        }}
      />
    </div>
  );
}
