import React from 'react';
import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  className,
}: RadioGroupProps) {
  return (
    <div className={cn('space-y-2', className)} role="radiogroup">
      {options.map((opt) => {
        const isChecked = opt.value === value;
        return (
          <label
            key={opt.value}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer min-h-[44px]',
              isChecked
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-card hover:bg-muted text-muted-foreground',
              opt.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isChecked}
              disabled={opt.disabled}
              onChange={() => onChange(opt.value)}
              className="w-4 h-4 mt-0.5 text-primary accent-primary border-border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex-1 text-xs">
              <span className="font-medium block text-foreground">{opt.label}</span>
              {opt.description && (
                <span className="text-muted-foreground block mt-0.5">{opt.description}</span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: SwitchProps) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer min-h-[44px]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'w-11 h-6 rounded-full transition-colors relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          checked ? 'bg-primary' : 'bg-muted'
        )}
      >
        <span
          className={cn(
            'inline-block w-4 h-4 rounded-full bg-card transition-transform transform shadow-sm',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
      {label && <span className="text-xs text-foreground font-medium select-none">{label}</span>}
    </label>
  );
}
