import React from 'react';
import { cn } from '../../lib/utils.ts';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError = false, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 text-sm rounded bg-white text-slate-900 border appearance-none transition-colors min-h-[44px]',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            hasError
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-300 focus:border-[#ca2484] focus:ring-[#ca2484]',
            'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
