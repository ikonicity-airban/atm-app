'use client';

import React, { useState, useId } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib/utils.ts';

export interface CardHoverGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  layoutId?: string;
  hoverClassName?: string;
}

export function CardHoverGroup({
  children,
  className,
  layoutId,
  hoverClassName,
  ...props
}: CardHoverGroupProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const reactId = useId();
  const effectiveLayoutId = layoutId || `cardHoverGroup-${reactId}`;

  return (
    <div
      className={cn('relative isolate', className)}
      onMouseLeave={() => setHoveredIndex(null)}
      {...props}
    >
      {React.Children.map(children, (child, idx) => {
        if (!React.isValidElement(child)) return child;

        return (
          <div
            key={child.key ?? idx}
            className="relative group block p-2 h-full w-full"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.span
                  className={cn(
                    'absolute inset-0 h-full w-full bg-neutral-200 dark:bg-slate-800/[0.8] block rounded-3xl pointer-events-none',
                    hoverClassName
                  )}
                  style={{ zIndex: 0, pointerEvents: 'none' }}
                  layoutId={effectiveLayoutId}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.15 },
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.15, delay: 0.2 },
                  }}
                />
              )}
            </AnimatePresence>
            <div
              className="relative z-10 h-full w-full transform-none"
              style={{ zIndex: 10, position: 'relative', transform: 'none' }}
            >
              {child}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface HoverEffectItem {
  title: string;
  description: string;
  link?: string;
  icon?: React.ReactNode;
}

export const HoverEffect = ({
  items,
  className,
}: {
  items: HoverEffectItem[];
  className?: string;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 py-10 relative isolate',
        className
      )}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {items.map((item, idx) => {
        const itemKey = item?.link || item?.title || String(idx);
        return (
          <a
            href={item?.link || '#'}
            key={itemKey}
            className="relative group block p-2 h-full w-full"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.span
                  className="absolute inset-0 h-full w-full bg-neutral-200 dark:bg-slate-800/[0.8] block rounded-3xl pointer-events-none"
                  style={{ zIndex: 0, pointerEvents: 'none' }}
                  layoutId="hoverBackground"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.15 },
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.15, delay: 0.2 },
                  }}
                />
              )}
            </AnimatePresence>
            <div
              className="relative z-10 h-full w-full transform-none"
              style={{ zIndex: 10, position: 'relative', transform: 'none' }}
            >
              <Card>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </Card>
            </div>
          </a>
        );
      })}
    </div>
  );
};

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl h-full w-full p-4 overflow-hidden bg-black border border-transparent dark:border-white/[0.2] group-hover:border-slate-700 relative z-20',
        className
      )}
      style={{ zIndex: 20, position: 'relative' }}
    >
      <div className="relative z-50">
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export const CardTitle = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <h4 className={cn('text-zinc-100 font-bold tracking-wide mt-4', className)}>
      {children}
    </h4>
  );
};

export const CardDescription = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <p
      className={cn(
        'mt-8 text-zinc-400 tracking-wide leading-relaxed text-sm',
        className
      )}
    >
      {children}
    </p>
  );
};
