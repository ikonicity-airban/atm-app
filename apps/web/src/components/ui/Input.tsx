'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.ts';
import { Icon } from './Icon.tsx';

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
  startIcon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  endIcon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      type = 'text',
      size,
      hasError,
      startIcon,
      endIcon,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref
  ) => {
    const isInvalid = ariaInvalid === true || ariaInvalid === 'true' || hasError === true;

    const renderIcon = (iconContent: React.ReactNode | React.ComponentType<{ className?: string }>) => {
      if (!iconContent) return null;
      if (typeof iconContent === 'function') {
        const IconComponent = iconContent as React.ComponentType<{ className?: string }>;
        return <Icon icon={IconComponent} size={size === 'lg' ? 'md' : 'default'} />;
      }
      return <Icon size={size === 'lg' ? 'md' : 'default'}>{iconContent}</Icon>;
    };

    if (startIcon || endIcon) {
      return (
        <div className={cn('relative flex items-center w-full', containerClassName)}>
          {startIcon && (
            <div className="pointer-events-none absolute left-3.5 flex items-center justify-center">
              {renderIcon(startIcon)}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            aria-invalid={isInvalid ? true : undefined}
            className={cn(
              inputVariants({ size, hasError: isInvalid }),
              startIcon && 'pl-10',
              endIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {endIcon && (
            <div className="pointer-events-none absolute right-3.5 flex items-center justify-center">
              {renderIcon(endIcon)}
            </div>
          )}
        </div>
      );
    }

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

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  hasError?: boolean;
}

export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, hasError, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center w-full rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-colors min-h-[44px]',
          hasError && 'border-destructive focus-within:ring-destructive',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InputGroup.displayName = 'InputGroup';

export interface InputAddonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const InputAddon = React.forwardRef<HTMLDivElement, InputAddonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center px-3.5 text-muted-foreground select-none shrink-0', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InputAddon.displayName = 'InputAddon';
