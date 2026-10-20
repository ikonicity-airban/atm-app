import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils.ts';
import { Icon } from './Icon.tsx';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: AlertProps) {
  const styles = {
    info: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  };

  const icons = {
    info: <Icon icon={Info} className="text-sky-600 dark:text-sky-400 shrink-0" />,
    success: <Icon icon={CheckCircle2} variant="success" className="shrink-0" />,
    warning: <Icon icon={AlertTriangle} variant="warning" className="shrink-0" />,
    danger: <Icon icon={AlertCircle} variant="destructive" className="shrink-0" />,
  };

  return (
    <div
      role="alert"
      className={cn('p-3.5 border rounded-xl flex items-start gap-3 text-xs leading-relaxed', styles[variant], className)}
    >
      <div className="mt-0.5">{icons[variant]}</div>
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        <div>{children}</div>
      </div>
    </div>
  );
}
