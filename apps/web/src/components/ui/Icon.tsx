'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.ts';

export const iconVariants = cva(
  'inline-flex items-center justify-center shrink-0 transition-colors',
  {
    variants: {
      variant: {
        default: 'text-muted-foreground',
        muted: 'text-muted-foreground',
        primary: 'text-primary',
        secondary: 'text-secondary-foreground',
        foreground: 'text-foreground',
        success: 'text-emerald-600 dark:text-emerald-400',
        warning: 'text-amber-600 dark:text-amber-400',
        destructive: 'text-rose-600 dark:text-rose-400',
      },
      size: {
        xs: 'w-3 h-3',
        sm: 'w-3.5 h-3.5',
        default: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface IconProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof iconVariants> {
  icon?: React.ComponentType<{ className?: string }>;
}

export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  ({ icon: Component, variant, size, className, children, ...props }, ref) => {
    const resolvedClasses = cn(iconVariants({ variant, size }), className);

    if (Component) {
      return (
        <Component
          className={resolvedClasses}
          aria-hidden="true"
          {...(props as Record<string, unknown>)}
        />
      );
    }

    return (
      <span ref={ref} className={resolvedClasses} aria-hidden="true" {...props}>
        {children}
      </span>
    );
  }
);

Icon.displayName = 'Icon';
