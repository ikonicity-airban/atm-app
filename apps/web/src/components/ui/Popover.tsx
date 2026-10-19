'use client';

import * as React from 'react';
import { Popover as PopoverPrimitive } from '@base-ui/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const popoverPopupVariants = cva(
  'z-50 min-w-[8rem] rounded-xl border p-4 shadow-lg outline-none transition-all duration-150 data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground border-border shadow-md',
        glass: 'glass-surface text-card-foreground shadow-xl',
        spatial: 'glass-card-spatial text-card-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface PopoverProps extends React.ComponentProps<typeof PopoverPrimitive.Root> {
  trigger?: React.ReactNode;
  content?: React.ReactNode;
  title?: string;
  className?: string;
}

export function Popover({
  trigger,
  content,
  title,
  children,
  className,
  ...props
}: PopoverProps) {
  if (trigger !== undefined) {
    return (
      <PopoverPrimitive.Root {...props}>
        <PopoverPrimitive.Trigger render={React.isValidElement(trigger) ? trigger : <button type="button">{trigger}</button>} />
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Positioner sideOffset={8}>
            <PopoverPrimitive.Popup className={cn(popoverPopupVariants({ variant: 'default' }), className)}>
              {title && (
                <PopoverPrimitive.Title className="text-xs font-semibold text-foreground mb-1">
                  {title}
                </PopoverPrimitive.Title>
              )}
              {content || (typeof children === 'function' ? null : (children as React.ReactNode))}
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }

  return <PopoverPrimitive.Root {...props}>{children}</PopoverPrimitive.Root>;
}

export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverPortal = PopoverPrimitive.Portal;
export const PopoverPositioner = PopoverPrimitive.Positioner;
export const PopoverArrow = PopoverPrimitive.Arrow;

export interface PopoverPopupProps
  extends React.ComponentProps<typeof PopoverPrimitive.Popup>,
    VariantProps<typeof popoverPopupVariants> {
  sideOffset?: number;
}

export function PopoverPopup({
  className,
  variant,
  sideOffset = 8,
  children,
  ...props
}: PopoverPopupProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner sideOffset={sideOffset}>
        <PopoverPrimitive.Popup
          className={cn(popoverPopupVariants({ variant }), className)}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export function PopoverTitle({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Title>) {
  return (
    <PopoverPrimitive.Title
      className={cn('text-xs font-semibold text-foreground tracking-tight', className)}
      {...props}
    />
  );
}

export function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Description>) {
  return (
    <PopoverPrimitive.Description
      className={cn('text-xs text-muted-foreground mt-1', className)}
      {...props}
    />
  );
}

export function PopoverClose({
  className,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Close>) {
  return (
    <PopoverPrimitive.Close
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted min-h-[44px] min-w-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      {...props}
    >
      {children || <X className="w-4 h-4" />}
    </PopoverPrimitive.Close>
  );
}
