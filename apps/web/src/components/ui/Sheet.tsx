'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  side?: 'left' | 'right' | 'bottom';
  children: React.ReactNode;
  className?: string;
}

export function Sheet({
  isOpen,
  onClose,
  title,
  side = 'right',
  children,
  className,
}: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const dragControls = useDragControls();

  const isBottom = side === 'bottom';

  // Lock document body scroll when open and restore when closed
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable && focusable.length > 0) {
          focusable[0]?.focus();
        } else {
          sheetRef.current?.focus();
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow || '';
        if (previouslyFocusedRef.current) {
          previouslyFocusedRef.current.focus();
        }
      };
    }
  }, [isOpen]);

  // Trap Tab key inside slide over sheet and close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && sheetRef.current) {
        const focusables = sheetRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Motion variants with subtle spring and natural deceleration
  const variants = {
    initial: isBottom
      ? { y: '100%', opacity: 0.96 }
      : side === 'right'
      ? { x: '100%', opacity: 0.96 }
      : { x: '-100%', opacity: 0.96 },
    animate: isBottom
      ? { y: 0, opacity: 1 }
      : { x: 0, opacity: 1 },
    exit: isBottom
      ? { y: '100%', opacity: 0.96 }
      : side === 'right'
      ? { x: '100%', opacity: 0.96 }
      : { x: '-100%', opacity: 0.96 },
  };

  const springTransition = isBottom
    ? {
        type: 'spring' as const,
        damping: 30,
        stiffness: 300,
        mass: 0.82,
      }
    : {
        type: 'spring' as const,
        damping: 32,
        stiffness: 320,
        mass: 0.85,
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop with smooth fade transition and blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer / Bottom Sheet Container */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={springTransition}
            drag={isBottom ? 'y' : undefined}
            dragListener={false}
            dragControls={isBottom ? dragControls : undefined}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 90 || info.velocity.y > 350) {
                onClose();
              }
            }}
            className={cn(
              'fixed z-50 bg-card text-card-foreground shadow-2xl flex flex-col focus:outline-none',
              isBottom
                ? 'inset-x-0 bottom-0 max-h-[90vh] rounded-t-3xl border-t border-border'
                : side === 'right'
                ? 'inset-y-0 right-0 w-full max-w-md border-l border-border'
                : 'inset-y-0 left-0 w-full max-w-md border-r border-border',
              className
            )}
          >
            {isBottom && (
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="w-full flex items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
                aria-label="Drag bar to dismiss"
              >
                <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full hover:bg-muted-foreground/50 transition-colors" />
              </div>
            )}

            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-foreground tracking-tight">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center focus:ring-2 focus:ring-primary cursor-pointer active:scale-95 transition-all"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 scroll-smooth touch-pan-y">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
