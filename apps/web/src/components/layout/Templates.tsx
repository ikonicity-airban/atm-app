import React from 'react';
import { cn } from '@/lib/utils';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Separator';
import { SEOHead } from '@/components/seo/SEOHead';
import { BRAND } from '@atm/shared';

/**
 * 1. PageShell: Standard container for public and content pages
 */
export type PageShellWidth = 'prose' | 'compact' | 'standard';
export type PageShellDensity = 'compact' | 'comfortable' | 'spacious';

export interface PageShellProps {
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  width?: PageShellWidth;
  density?: PageShellDensity;
}

const WIDTH_CLASSES: Record<PageShellWidth, string> = {
  prose: 'max-w-3xl',
  compact: 'max-w-5xl',
  standard: 'max-w-7xl',
};

const DENSITY_CLASSES: Record<PageShellDensity, string> = {
  compact: 'pt-20 sm:pt-24 pb-8 sm:pb-12',
  comfortable: 'pt-24 sm:pt-28 pb-12 sm:pb-16',
  spacious: 'pt-28 sm:pt-32 pb-16 sm:pb-24',
};

export function PageShell({
  breadcrumbs,
  title,
  description,
  actions,
  children,
  className,
  width = 'standard',
  density = 'comfortable',
}: PageShellProps) {
  const widthClass = WIDTH_CLASSES[width] || WIDTH_CLASSES.standard;
  const densityClass = DENSITY_CLASSES[density] || DENSITY_CLASSES.comfortable;

  return (
    <div className={cn(widthClass, 'mx-auto px-4 sm:px-6 lg:px-8', densityClass, className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-6">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}

      {title && (
        <>
          <SEOHead
            title={`${title} | ${BRAND.name}`}
            description={description}
          />
          <div className="mb-8 pb-6 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="min-w-0">
                {/* Hard ban: Heading is plain typography on background (no pills or cards) */}
                <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight text-balance">
                  {title}
                </h1>
                {description && (
                  <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed text-pretty">
                    {description}
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
            </div>
          </div>
        </>
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
    <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 sm:pb-16">
      <SEOHead
        title={`${title} | ${BRAND.name}`}
        description={subtitle}
      />
      {breadcrumbs && (
        <div className="mb-6">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}

      <header className="mb-10 pb-6 border-b border-border">
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-base text-muted-foreground leading-relaxed text-pretty">
            {subtitle}
          </p>
        )}
        {lastUpdated && (
          <p className="mt-3 text-xs font-mono text-muted-foreground/75">
            Last Updated: {lastUpdated}
          </p>
        )}
      </header>

      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-foreground space-y-6">
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
