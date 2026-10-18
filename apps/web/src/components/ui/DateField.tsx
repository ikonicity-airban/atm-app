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
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            {label}
          </label>
        )}
        <input
          type="date"
          ref={ref}
          min={effectiveMin}
          max={effectiveMax}
          className={cn(
            'w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border transition-all min-h-[46px]',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            hasError
              ? 'border-red-500 focus:ring-red-500/20'
              : 'border-slate-200/90 focus:border-brand-500 focus:ring-brand-500/20',
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
