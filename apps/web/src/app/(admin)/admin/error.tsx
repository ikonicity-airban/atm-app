'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-2 text-red-600 mb-2">
        <AlertCircle className="w-5 h-5" />
        <h2 className="text-base font-bold text-slate-900">Admin Console Error</h2>
      </div>
      <p className="text-xs text-slate-600 mb-4">{error.message || 'Operation failed.'}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded min-h-[44px]"
      >
        Retry
      </button>
    </div>
  );
}
