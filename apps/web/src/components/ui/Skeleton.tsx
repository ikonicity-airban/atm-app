import React from 'react';
import { cn } from '../../lib/utils.ts';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Static Skeleton loader
 * HARD BAN COMPLIANCE: Zero pulsing or animation anywhere.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('bg-slate-200 rounded', className)}
      {...props}
    />
  );
}
