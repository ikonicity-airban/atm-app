import React from 'react';
import { cn } from '../../lib/utils.ts';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variantStyles = {
      primary:
        'bg-[#ca2484] text-white hover:bg-[#aa1769] focus:ring-[#ca2484] shadow-sm',
      secondary:
        'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 shadow-sm',
      outline:
        'border border-slate-300 text-slate-800 bg-white hover:bg-slate-50 focus:ring-slate-400',
      ghost:
        'text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300',
      destructive:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 shadow-sm',
      link:
        'text-[#ca2484] underline-offset-4 hover:underline focus:ring-[#ca2484] p-0 h-auto min-h-0',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs min-h-[36px]',
      md: 'px-4 py-2.5 text-sm min-h-[44px]', // 44px min touch target
      lg: 'px-6 py-3.5 text-base min-h-[48px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          variant !== 'link' && sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />
        ) : (
          leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="ml-2 inline-flex">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
