import React from 'react';
import { cn } from '../../lib/utils.ts';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  isRequired?: boolean;
}

export function Label({ className, isRequired, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('block text-xs font-medium uppercase tracking-wider text-foreground mb-1.5', className)}
      {...props}
    >
      {children}
      {isRequired && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
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
        <p className="text-xs text-destructive font-medium mt-1">{errorMessage}</p>
      ) : helpText ? (
        <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
      ) : null}
    </div>
  );
}
