'use client';

import * as React from 'react';
import { Menu as MenuPrimitive } from '@base-ui/react';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from '../../lib/utils.ts';
import { Icon } from './Icon.tsx';

export const DropdownMenu = MenuPrimitive.Root;

export const DropdownMenuTrigger = MenuPrimitive.Trigger;

export const DropdownMenuGroup = MenuPrimitive.Group;

export const DropdownMenuPortal = MenuPrimitive.Portal;

export const DropdownMenuSub = MenuPrimitive.SubmenuRoot;

export const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup;

export interface DropdownMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof MenuPrimitive.Popup> {
  portalProps?: React.ComponentPropsWithoutRef<typeof MenuPrimitive.Portal>;
  sideOffset?: number;
}

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className, children, sideOffset = 6, portalProps, ...props }, ref) => {
  return (
    <MenuPrimitive.Portal {...portalProps}>
      <MenuPrimitive.Positioner sideOffset={sideOffset} className="z-50 outline-none">
        <MenuPrimitive.Popup
          ref={ref}
          className={cn(
            'relative min-w-32 overflow-hidden rounded-2xl border border-border bg-popover/95 p-1 text-popover-foreground shadow-xl backdrop-blur-xl animate-fluid-fade data-[state=closed]:opacity-0',
            className
          )}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

export interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof MenuPrimitive.Item> {
  inset?: boolean;
  startIcon?: React.ReactNode | React.ComponentType<{ className?: string }>;
}

export const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(({ className, inset, startIcon, children, ...props }, ref) => {
  const renderStartIcon = () => {
    if (!startIcon) return null;
    if (React.isValidElement(startIcon)) {
      return <Icon className="mr-2">{startIcon}</Icon>;
    }
    const IconComponent = startIcon as React.ComponentType<{ className?: string }>;
    return <Icon icon={IconComponent} className="mr-2" />;
  };

  return (
    <MenuPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-xs sm:text-sm outline-none transition-colors hover:bg-primary/80 focus:bg-primary/80 hover:text-primary text-foreground data-disabled:pointer-events-noneadata-disabled:opacity-50adata-highlighted:bg-muted',
        inset && 'pl-8',
        className
      )}
      {...props}
    >
      {renderStartIcon()}
      {children}
    </MenuPrimitive.Item>
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

export interface DropdownMenuCheckboxItemProps
  extends React.ComponentPropsWithoutRef<typeof MenuPrimitive.CheckboxItem> { }

export const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuCheckboxItemProps
>(({ className, children, checked, ...props }, ref) => {
  return (
    <MenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-xl py-2 pl-8 pr-3 text-xs sm:text-sm outline-none transition-colors hover:bg-muted focus:bg-muted text-foreground data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-muted',
        className
      )}
      checked={checked}
      {...props}
    >
      <MenuPrimitive.CheckboxItemIndicator className="absolute left-2.5 flex items-center justify-center">
        <Icon icon={Check} className="text-primary w-3.5 h-3.5" />
      </MenuPrimitive.CheckboxItemIndicator>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
});
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

export interface DropdownMenuRadioItemProps
  extends React.ComponentPropsWithoutRef<typeof MenuPrimitive.RadioItem> { }

export const DropdownMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuRadioItemProps
>(({ className, children, ...props }, ref) => {
  return (
    <MenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-xl py-2 pl-8 pr-3 text-xs sm:text-sm outline-none transition-colors hover:bg-muted focus:bg-muted text-foreground data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-muted',
        className
      )}
      {...props}
    >
      <MenuPrimitive.RadioItemIndicator className="absolute left-2.5 flex items-center justify-center">
        <Icon icon={Circle} className="w-2 h-2 fill-primary text-primary" />
      </MenuPrimitive.RadioItemIndicator>
      {children}
    </MenuPrimitive.RadioItem>
  );
});
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

export interface DropdownMenuLabelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

export const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  DropdownMenuLabelProps
>(({ className, inset, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="presentation"
      className={cn(
        'px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  );
});
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Separator>
>(({ className, ...props }, ref) => {
  return (
    <MenuPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
});
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export interface DropdownMenuSubTriggerProps
  extends React.ComponentPropsWithoutRef<typeof MenuPrimitive.SubmenuTrigger> {
  inset?: boolean;
}

export const DropdownMenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSubTriggerProps
>(({ className, inset, children, ...props }, ref) => {
  return (
    <MenuPrimitive.SubmenuTrigger
      ref={ref}
      className={cn(
        'flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-xs sm:text-sm outline-none transition-colors hover:bg-muted focus:bg-muted text-foreground data-[state=open]:bg-muted',
        inset && 'pl-8',
        className
      )}
      {...props}
    >
      {children}
      <Icon icon={ChevronRight} className="ml-auto w-3.5 h-3.5" />
    </MenuPrimitive.SubmenuTrigger>
  );
});
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';
