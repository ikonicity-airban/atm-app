import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

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
    info: 'bg-sky-50 text-sky-900 border-sky-200',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    danger: 'bg-red-50 text-red-900 border-red-200',
  };

  const icons = {
    info: <Info className="w-4 h-4 text-sky-600 flex-shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />,
    danger: <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />,
  };

  return (
    <div
      role="alert"
      className={cn('p-3.5 border rounded-lg flex items-start gap-3 text-xs leading-relaxed', styles[variant], className)}
    >
      <div className="mt-0.5">{icons[variant]}</div>
      <div className="flex-1">
        {title && <h5 className="font-bold mb-0.5">{title}</h5>}
        <div>{children}</div>
      </div>
    </div>
  );
}
