import React from 'react';
import { cn } from '../../lib/utils.ts';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  isRequired?: boolean;
}

export function Label({ className, isRequired, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5', className)}
      {...props}
    >
      {children}
      {isRequired && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
    </label>
  );
}

export interface FormFieldProps {
  label?: string;
  isRequired?: boolean;
  helpText?: string;
  errorMessage?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  isRequired,
  helpText,
  errorMessage,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {label && <Label isRequired={isRequired}>{label}</Label>}
      {children}
      {errorMessage ? (
        <p className="text-xs text-red-600 font-medium mt-1">{errorMessage}</p>
      ) : helpText ? (
        <p className="text-xs text-slate-500 mt-1">{helpText}</p>
      ) : null}
    </div>
  );
}
