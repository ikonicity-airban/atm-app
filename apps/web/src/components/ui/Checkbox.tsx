import React from 'react';
import { cn } from '@/lib/utils';

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
            'w-4 h-4 rounded border-border bg-card text-primary accent-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer',
            className
          )}
          {...props}
        />
        {label && <span className="text-xs font-normal text-foreground select-none">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
