import React from 'react';
import { cn } from '../../lib/utils.ts';
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
 * Enforces Africa/Lagos WAT date bounds (today -> today + maxAdvanceDays).
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
      <div className="space-y-1 w-full">
        {label && (
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {label}
          </label>
        )}
        <input
          type="date"
          ref={ref}
          min={effectiveMin}
          max={effectiveMax}
          className={cn(
            'w-full px-3.5 py-2.5 text-sm rounded bg-white text-slate-900 border transition-colors min-h-[44px]',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            hasError
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-300 focus:border-[#ca2484] focus:ring-[#ca2484]',
            'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {errorMessage && (
          <p className="text-xs text-red-600 font-medium mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }
);

DateField.displayName = 'DateField';
