'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-xs font-medium transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 min-h-[44px]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:opacity-95 shadow-xs',
        primary: 'bg-primary text-primary-foreground hover:opacity-95 shadow-xs',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-border bg-background hover:bg-muted text-foreground',
        ghost: 'text-foreground hover:bg-muted',
        glass: 'glass-surface text-foreground shadow-sm hover:opacity-95',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto min-h-0',
      },
      size: {
        default: 'h-11 px-4 py-2 min-h-[44px]',
        md: 'h-11 px-4 py-2 min-h-[44px]',
        sm: 'h-9 px-3 text-xs min-h-[36px] relative after:absolute after:-inset-1 after:min-h-[44px]',
        lg: 'h-12 px-6 text-sm min-h-[48px]',
        icon: 'w-11 h-11 min-w-[44px] min-h-[44px] p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
