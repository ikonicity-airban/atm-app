'use client';

import React from 'react';
import './globals.css';
import { ErrorView } from '../components/error/ErrorView.tsx';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('atm_theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground font-sans flex items-center justify-center p-4">
        <ErrorView
          error={error}
          reset={reset}
          portalTitle="Application System Disruption"
        />
      </body>
    </html>
  );
}
