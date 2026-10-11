import React from 'react';

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">404 - Page Not Found</h1>
      <p className="mt-2 text-sm text-slate-600">
        The travel route, terminal, or page you requested could not be located.
      </p>
      <div className="mt-6">
        <a
          href="/"
          className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white bg-[#ca2484] hover:bg-[#aa1769] rounded min-h-[44px]"
        >
          Back to Ascent Transport Home
        </a>
      </div>
    </div>
  );
}
