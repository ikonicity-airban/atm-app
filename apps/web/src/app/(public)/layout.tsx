'use client';

import React from 'react';
import { PublicHeader } from '../../components/layout/PublicHeader.tsx';
import { PublicFooter } from '../../components/layout/PublicFooter.tsx';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader
        currentPath="/"
        onNavigate={(path) => {
          if (typeof window !== 'undefined') window.location.href = path;
        }}
      />
      <main className="flex-1">{children}</main>
      <PublicFooter
        onNavigate={(path) => {
          if (typeof window !== 'undefined') window.location.href = path;
        }}
      />
    </div>
  );
}
