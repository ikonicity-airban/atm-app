'use client';

import * as React from 'react';
import { Select as SelectPrimitive } from '@base-ui/react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils.ts';
import { Icon } from './Icon.tsx';

// Backward-compatible native select component
export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  startIcon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  containerClassName?: string;
}

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, containerClassName, hasError = false, startIcon, children, ...props }, ref) => {
    const renderStartIcon = () => {
      if (!startIcon) return null;
      if (React.isValidElement(startIcon)) {
        return <Icon>{startIcon}</Icon>;
      }
      const IconComponent = startIcon as React.ComponentType<{ className?: string }>;
      return <Icon icon={IconComponent} />;
    };

    return (
      <div className={cn('relative w-full', containerClassName)}>
        {startIcon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
            {renderStartIcon()}
          </div>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background text-foreground border appearance-none transition-colors min-h-[44px] cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
            hasError
              ? 'border-destructive focus:ring-destructive'
              : 'border-input hover:border-border',
            'disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed',
            startIcon && 'pl-10',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
          <Icon icon={ChevronDown} />
        </div>
      </div>
    );
  }
);
NativeSelect.displayName = 'NativeSelect';

export type SelectProps =
  | (React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> & { onChange?: never })
  | NativeSelectProps;

export function Select(props: SelectProps) {
  if ('onChange' in props && props.onChange) {
    return <NativeSelect {...(props as NativeSelectProps)} />;
  }
  return <SelectPrimitive.Root {...(props as React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>)} />;
}

export interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  size?: 'sm' | 'default' | 'lg';
  hasError?: boolean;
  startIcon?: React.ReactNode | React.ComponentType<{ className?: string }>;
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>(({ className, children, size = 'default', hasError, startIcon, ...props }, ref) => {
  const renderStartIcon = () => {
    if (!startIcon) return null;
    if (React.isValidElement(startIcon)) {
      return <Icon size={size === 'lg' ? 'md' : 'default'}>{startIcon}</Icon>;
    }
    const IconComponent = startIcon as React.ComponentType<{ className?: string }>;
    return <Icon icon={IconComponent} size={size === 'lg' ? 'md' : 'default'} />;
  };

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex w-full items-center justify-between rounded-xl border border-input bg-background px-3.5 py-2 text-xs sm:text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] cursor-pointer',
        size === 'sm' && 'h-9 text-xs min-h-[36px] relative after:absolute after:-inset-1 after:min-h-[44px]',
        size === 'lg' && 'h-12 text-base min-h-[48px]',
        hasError && 'border-destructive focus-visible:ring-destructive',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 truncate">
        {startIcon && renderStartIcon()}
        {children}
      </div>
      <SelectPrimitive.Icon>
        <Icon icon={ChevronDown} className="transition-transform duration-200" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>(({ className, ...props }, ref) => {
  return (
    <SelectPrimitive.Value
      ref={ref}
      className={cn('block truncate text-left', className)}
      {...props}
    />
  );
});
SelectValue.displayName = 'SelectValue';

export const SelectPopup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Popup> & {
    portalProps?: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Portal>;
  }
>(({ className, children, portalProps, ...props }, ref) => {
  return (
    <SelectPrimitive.Portal {...portalProps}>
      <SelectPrimitive.Positioner sideOffset={6} className="z-50">
        <SelectPrimitive.Popup
          ref={ref}
          className={cn(
            'relative max-h-80 min-w-[8rem] overflow-hidden rounded-2xl border border-border bg-popover/95 p-1 text-popover-foreground shadow-xl backdrop-blur-xl animate-fluid-fade data-[state=closed]:opacity-0',
            className
          )}
          {...props}
        >
          <SelectPrimitive.List className="overflow-y-auto p-1 space-y-0.5">
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
});
SelectPopup.displayName = 'SelectPopup';

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl py-2 px-3 text-xs sm:text-sm outline-none transition-colors hover:bg-muted focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted',
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="ml-2 inline-flex">
        <Check className="w-3.5 h-3.5 text-primary" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = 'SelectItem';

export const SelectGroup = SelectPrimitive.Group;

export const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.GroupLabel>
>(({ className, ...props }, ref) => {
  return (
    <SelectPrimitive.GroupLabel
      ref={ref}
      className={cn('px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground', className)}
      {...props}
    />
  );
});
SelectLabel.displayName = 'SelectLabel';

export const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
});
SelectSeparator.displayName = 'SelectSeparator';
