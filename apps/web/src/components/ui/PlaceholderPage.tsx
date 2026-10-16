import React from 'react';

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
  routePath: string;
  category?: string;
  actionText?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

export function PlaceholderPage({
  title,
  subtitle = 'This view is scaffolded for Phase 0. Full domain logic will be integrated in subsequent phases.',
  routePath,
  category,
  actionText,
  onAction,
  children,
}: PlaceholderPageProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 sm:pb-16">
      {/* Title is plain typography on background (Hard ban: never wrap titles in a pill, badge, or card) */}
      <div className="mb-6">
        {category && (
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 block">
            {category}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
          {title}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed text-pretty">
          {subtitle}
        </p>
      </div>

      <div className="border border-slate-200 rounded-2xl p-6 sm:p-8 bg-slate-50/50 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-mono text-slate-500">Route:</span>
            <code className="ml-2 text-xs font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-800">
              {routePath}
            </code>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Phase 0 Scaffold: Empty State
          </span>
        </div>

        <div className="mt-6">
          {children || (
            <div className="text-center py-10">
              <p className="text-sm text-slate-500">
                No active data records currently rendered. Form controls and tables will be activated in Phase 1+.
              </p>
              {actionText && (
                <button
                  type="button"
                  onClick={onAction}
                  className="mt-4 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs min-h-[44px] inline-flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ca2484] focus-visible:ring-offset-2"
                >
                  {actionText}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
