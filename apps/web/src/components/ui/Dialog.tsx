'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dialogPopupVariants = cva(
  'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl border p-6 shadow-2xl outline-none max-h-[90vh] overflow-y-auto transition-all',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground border-border',
        glass: 'glass-card-spatial text-card-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const dialogFooterVariants = cva(
  'flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4',
  {
    variants: {
      variant: {
        default: 'border-t border-border mt-4',
        bare: 'mt-2',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface DialogProps extends React.ComponentProps<typeof DialogPrimitive.Root> {
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  className,
  children,
  open,
  onOpenChange,
  ...props
}: DialogProps) {
  // Legacy compatibility: <Dialog isOpen={isOpen} onClose={onClose} title={title}>
  if (isOpen !== undefined) {
    const handleOpenChange = (nextOpen: boolean, eventDetails: any) => {
      onOpenChange?.(nextOpen, eventDetails);
      if (!nextOpen && onClose) {
        onClose();
      }
    };

    return (
      <DialogPrimitive.Root
        open={isOpen}
        onOpenChange={handleOpenChange}
        {...props}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity" />
          <DialogPrimitive.Popup
            className={cn(dialogPopupVariants({ variant: 'default' }), className)}
          >
            {(title || onClose) && (
              <div className="flex items-start justify-between mb-4">
                <div>
                  {title && (
                    <DialogPrimitive.Title className="text-base font-bold text-foreground tracking-tight">
                      {title}
                    </DialogPrimitive.Title>
                  )}
                  {description && (
                    <DialogPrimitive.Description className="text-xs text-muted-foreground mt-1">
                      {description}
                    </DialogPrimitive.Description>
                  )}
                </div>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            {typeof children === 'function' ? null : (children as React.ReactNode)}
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      {...props}
    >
      {children}
    </DialogPrimitive.Root>
  );
}

export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogBackdrop = DialogPrimitive.Backdrop;

export interface DialogPopupProps
  extends React.ComponentProps<typeof DialogPrimitive.Popup>,
    VariantProps<typeof dialogPopupVariants> {
  showCloseButton?: boolean;
}

export function DialogPopup({
  className,
  variant,
  showCloseButton = true,
  children,
  ...props
}: DialogPopupProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity" />
      <DialogPrimitive.Popup
        className={cn(dialogPopupVariants({ variant }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-left mb-4', className)}
      {...props}
    />
  );
}

export function DialogPanel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-4 text-xs text-foreground', className)} {...props} />;
}

export interface DialogFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogFooterVariants> {}

export function DialogFooter({
  className,
  variant,
  ...props
}: DialogFooterProps) {
  return (
    <div
      className={cn(dialogFooterVariants({ variant }), className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-base font-bold text-foreground tracking-tight', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-xs text-muted-foreground mt-1', className)}
      {...props}
    />
  );
}

export const DialogClose = DialogPrimitive.Close;
