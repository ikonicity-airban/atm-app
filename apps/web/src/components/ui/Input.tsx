'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.ts';

export const inputVariants = cva(
  'w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs sm:text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-9 text-xs min-h-[36px] relative after:absolute after:-inset-1 after:min-h-[44px]',
        default: 'h-11 min-h-[44px]',
        lg: 'h-12 text-base min-h-[48px]',
      },
      hasError: {
        true: 'border-destructive focus-visible:ring-destructive',
        false: '',
      },
    },
    defaultVariants: {
      size: 'default',
      hasError: false,
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', size, hasError, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    const isInvalid = ariaInvalid === true || ariaInvalid === 'true' || hasError === true;

    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={isInvalid ? true : undefined}
        className={cn(inputVariants({ size, hasError: isInvalid, className }))}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
