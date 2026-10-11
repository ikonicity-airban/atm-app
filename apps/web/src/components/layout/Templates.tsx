import React from 'react';
import { cn } from '../../lib/utils.ts';
import { Breadcrumb, type BreadcrumbItem } from '../ui/Separator.tsx';

/**
 * 1. PageShell: Standard container for public and content pages
 */
export interface PageShellProps {
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageShell({
  breadcrumbs,
  title,
  description,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-6">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}

      {title && (
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              {/* Hard ban: Heading is plain typography on background (no pills or cards) */}
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {title}
              </h1>
              {description && (
                <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
        </div>
      )}

      <div>{children}</div>
    </div>
  );
}

/**
 * 2. ContentPage: Readable prose-width layout for legal, terms, privacy, and text guidelines
 */
export interface ContentPageProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export function ContentPage({
  title,
  subtitle,
  lastUpdated,
  children,
  breadcrumbs,
}: ContentPageProps) {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
      {breadcrumbs && (
        <div className="mb-6">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}

      <header className="mb-10 pb-6 border-b border-slate-200">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-base text-slate-600 leading-relaxed">
            {subtitle}
          </p>
        )}
        {lastUpdated && (
          <p className="mt-3 text-xs font-mono text-slate-400">
            Last Updated: {lastUpdated}
          </p>
        )}
      </header>

      <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 space-y-6">
        {children}
      </div>
    </article>
  );
}

/**
 * 3. SplitSection: 2-column layout (content + aside card/action)
 */
export interface SplitSectionProps {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
}

export function SplitSection({ left, right, className }: SplitSectionProps) {
  return (
    <section className={cn('grid grid-cols-1 lg:grid-cols-12 gap-8 items-start', className)}>
      <div className="lg:col-span-7 xl:col-span-8 space-y-6">{left}</div>
      <div className="lg:col-span-5 xl:col-span-4 space-y-6">{right}</div>
    </section>
  );
}
