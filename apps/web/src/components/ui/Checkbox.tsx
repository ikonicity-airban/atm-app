import React from 'react';
import { cn } from '../../lib/utils.ts';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-2.5 cursor-pointer min-h-[44px]">
        <input
          type="checkbox"
          id={id}
          ref={ref}
          className={cn(
            'w-4 h-4 rounded text-[#ca2484] border-slate-300 focus:ring-[#ca2484] focus:ring-2 cursor-pointer',
            className
          )}
          {...props}
        />
        {label && <span className="text-sm text-slate-700 select-none">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
