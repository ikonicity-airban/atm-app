'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getLagosDate, DEFAULT_BOOKING_SETTINGS } from '@atm/shared';

export interface DateFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  hasError?: boolean;
  errorMessage?: string;
  maxAdvanceDays?: number;
}

/**
 * Native DateField component
 * Native <input type="date"> provides the optimal mobile picker experience on iOS & Android.
 * Enforces Africa/Lagos WAT date bounds (today -> today + maxAdvanceDays) with Coss semantic tokens.
 */
export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  (
    {
      className,
      label,
      hasError = false,
      errorMessage,
      min,
      max,
      maxAdvanceDays = DEFAULT_BOOKING_SETTINGS.maxAdvanceDays,
      ...props
    },
    ref
  ) => {
    // Determine min date (today in Africa/Lagos)
    const todayLagos = getLagosDate();
    const effectiveMin = min ?? todayLagos;

    // Determine max date (today + maxAdvanceDays in Africa/Lagos)
    const effectiveMax =
      max ??
      (() => {
        const d = new Date();
        d.setDate(d.getDate() + maxAdvanceDays);
        return getLagosDate(d);
      })();

    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
            {label}
          </label>
        )}
        <input
          type="date"
          ref={ref}
          min={effectiveMin}
          max={effectiveMax}
          className={cn(
            'w-full px-3.5 py-2.5 text-xs font-normal rounded-xl bg-card text-foreground border transition-colors min-h-[44px]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
            hasError
              ? 'border-destructive focus-visible:ring-destructive'
              : 'border-border focus-visible:border-primary',
            'disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {errorMessage && (
          <p className="text-xs text-destructive font-medium mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }
);

DateField.displayName = 'DateField';
