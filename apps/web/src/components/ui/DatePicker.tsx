'use client';

import * as React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLagosDate, DEFAULT_BOOKING_SETTINGS } from '@atm/shared';
import { Calendar } from '@/components/ui/Calendar';
import {
  Popover,
  PopoverTrigger,
  PopoverPopup,
} from '@/components/ui/Popover';
import { Icon } from '@/components/ui/Icon';

export interface DatePickerChangeEvent {
  target: {
    value: string;
    name?: string;
  };
  currentTarget: {
    value: string;
    name?: string;
  };
}

export type DatePickerChangeHandler = (event: DatePickerChangeEvent) => void;

export interface DatePickerProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: DatePickerChangeHandler;
  label?: string;
  hasError?: boolean;
  errorMessage?: string;
  min?: string;
  max?: string;
  maxAdvanceDays?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  startIcon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  required?: boolean;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      id,
      name,
      value,
      defaultValue,
      onChange,
      label,
      hasError = false,
      errorMessage,
      min,
      max,
      maxAdvanceDays = DEFAULT_BOOKING_SETTINGS.maxAdvanceDays,
      placeholder = 'Select date',
      disabled = false,
      className,
      containerClassName,
      startIcon,
      required,
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState<string>(defaultValue || '');
    const [isOpen, setIsOpen] = React.useState(false);

    const selectedString = value !== undefined ? value : internalValue;

    const todayLagos = getLagosDate();
    const effectiveMinStr = min ?? todayLagos;
    const effectiveMaxStr =
      max ??
      (() => {
        const d = new Date();
        d.setDate(d.getDate() + maxAdvanceDays);
        return getLagosDate(d);
      })();

    const minDate = React.useMemo(() => parseISO(effectiveMinStr), [effectiveMinStr]);

    const selectedDate = React.useMemo(() => {
      if (!selectedString) return undefined;
      const parsed = parseISO(selectedString);
      return isValid(parsed) ? parsed : undefined;
    }, [selectedString]);

    const handleSelect = (date: Date | undefined) => {
      if (!date) return;
      const dateStr = format(date, 'yyyy-MM-dd');
      if (value === undefined) {
        setInternalValue(dateStr);
      }
      if (onChange) {
        const syntheticEvent: DatePickerChangeEvent = {
          target: { value: dateStr, name },
          currentTarget: { value: dateStr, name },
        };
        onChange(syntheticEvent);
      }
      setIsOpen(false);
    };

    const renderIcon = (iconContent: React.ReactNode | React.ComponentType<{ className?: string }>) => {
      if (!iconContent) return null;
      if (React.isValidElement(iconContent)) {
        return <Icon size="default">{iconContent}</Icon>;
      }
      const IconComponent = iconContent as React.ComponentType<{ className?: string }>;
      return <Icon icon={IconComponent} size="default" />;
    };

    const displayLabel = selectedDate ? format(selectedDate, 'PPP') : placeholder;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          type="hidden"
          id={id}
          name={name}
          value={selectedString}
          required={required}
        />

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger
            disabled={disabled}
            aria-label={label || 'Select date'}
            className={cn(
              'w-full flex items-center justify-between text-left rounded-xl border transition-colors cursor-pointer outline-none',
              'px-3.5 py-2.5 text-xs font-normal min-h-[44px]',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
              hasError
                ? 'border-destructive text-destructive'
                : 'border-border text-foreground hover:border-primary/40',
              disabled && 'bg-muted text-muted-foreground cursor-not-allowed opacity-50',
              className
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="shrink-0 text-muted-foreground">
                {startIcon ? renderIcon(startIcon) : <Icon icon={CalendarIcon} size="default" />}
              </span>
              <span
                className={cn(
                  'truncate font-normal',
                  !selectedDate && 'text-muted-foreground'
                )}
              >
                {displayLabel}
              </span>
            </div>
            <Icon icon={ChevronDown} size="sm" className="shrink-0 text-muted-foreground" />
          </PopoverTrigger>

          <PopoverPopup
            className="p-3 w-auto bg-popover/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl z-[100]"
            sideOffset={8}
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              defaultMonth={selectedDate || minDate}
              disabled={(date: Date) => {
                const dStr = format(date, 'yyyy-MM-dd');
                return dStr < effectiveMinStr || dStr > effectiveMaxStr;
              }}
            />
          </PopoverPopup>
        </Popover>

        {errorMessage && (
          <p className="text-xs text-destructive font-medium mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export const DateField = DatePicker;
