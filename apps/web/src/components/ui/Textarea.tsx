import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full px-3.5 py-2.5 text-xs rounded-xl bg-card text-foreground border transition-colors min-h-[96px]',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
          hasError
            ? 'border-destructive focus-visible:ring-destructive'
            : 'border-border focus-visible:border-primary',
          'disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
