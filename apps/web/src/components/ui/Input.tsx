import React from 'react';
import { cn } from '../../lib/utils.ts';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', hasError = false, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full px-3.5 py-2.5 text-sm rounded bg-white text-slate-900 border transition-colors min-h-[44px]',
          'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
          hasError
            ? 'border-red-500 focus:ring-red-500'
            : 'border-slate-300 focus:border-[#ca2484] focus:ring-[#ca2484]',
          'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
