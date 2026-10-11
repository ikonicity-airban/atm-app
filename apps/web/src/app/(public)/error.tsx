'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="w-12 h-12 rounded bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-600">
        {error.message || 'We encountered an error loading this transport page. Please try again.'}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded min-h-[44px]"
        >
          Try Again
        </button>
        <a
          href="/"
          className="px-4 py-2.5 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded min-h-[44px] flex items-center"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
