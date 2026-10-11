import React from 'react';
import { cn } from '../../lib/utils.ts';

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
              'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer min-h-[44px]',
              isChecked
                ? 'border-[#ca2484] bg-pink-50/40 text-slate-900'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
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
              className="w-4 h-4 mt-0.5 text-[#ca2484] border-slate-300 focus:ring-[#ca2484] cursor-pointer"
            />
            <div className="flex-1 text-xs">
              <span className="font-semibold block text-slate-900">{opt.label}</span>
              {opt.description && (
                <span className="text-slate-500 block mt-0.5">{opt.description}</span>
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
          'w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-[#ca2484] focus:ring-offset-2',
          checked ? 'bg-[#ca2484]' : 'bg-slate-300'
        )}
      >
        <span
          className={cn(
            'inline-block w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
      {label && <span className="text-xs font-semibold text-slate-700 select-none">{label}</span>}
    </label>
  );
}
