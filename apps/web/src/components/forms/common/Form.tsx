'use client';

import * as React from 'react';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
} from 'react-hook-form';
import { cn } from '@/lib/utils';

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn('space-y-1.5', className)} {...props} />
    </FormItemContext.Provider>
  );
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

function FormLabel({
  className,
  children,
  isRequired,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { isRequired?: boolean }) {
  const { error, formItemId } = useFormField();

  return (
    <label
      htmlFor={formItemId}
      className={cn(
        'text-xs font-bold uppercase tracking-wider block text-foreground transition-colors',
        error && 'text-destructive',
        className
      )}
      {...props}
    >
      {children}
      {isRequired && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
    </label>
  );
}

function FormControl({ children, ...props }: { children: React.ReactElement<any> } & React.HTMLAttributes<HTMLElement>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return React.cloneElement(children, {
    id: formItemId,
    'aria-describedby': error
      ? `${formDescriptionId} ${formMessageId}`
      : formDescriptionId,
    'aria-invalid': !!error,
    hasError: !!error,
    ...props,
  });
}

function FormDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      id={formDescriptionId}
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

function FormMessage({
  className,
  children,
  error: errorProp,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { error?: string }) {
  const { error, formMessageId } = useFormField();
  const body = errorProp || (error ? String(error?.message) : children);

  if (!body) {
    return null;
  }

  return (
    <p
      id={formMessageId}
      role="alert"
      className={cn('text-xs font-semibold text-destructive mt-1', className)}
      {...props}
    >
      {body}
    </p>
  );
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
