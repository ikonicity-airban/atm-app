import React from 'react';
import { cn } from '../../lib/utils.ts';

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Separator({ orientation = 'horizontal', className }: SeparatorProps) {
  return (
    <div
      role="separator"
      className={cn(
        'bg-slate-200',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
    />
  );
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs text-slate-500', className)}>
      <ol className="flex items-center space-x-2">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={item.label} className="flex items-center">
              {idx > 0 && <span className="mx-2 text-slate-300">/</span>}
              {isLast || !item.href ? (
                <span className="font-semibold text-slate-900" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <a href={item.href} className="hover:text-slate-900 transition-colors">
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
