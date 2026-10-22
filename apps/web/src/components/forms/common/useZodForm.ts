'use client';

import { useForm, type UseFormProps, type UseFormReturn, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType, ZodTypeDef } from 'zod';

export function useZodForm<
  TValues extends FieldValues = FieldValues,
  TContext = any,
>(
  schema: ZodType<any, ZodTypeDef, any>,
  options?: Omit<UseFormProps<TValues, TContext>, 'resolver'>
): UseFormReturn<TValues, TContext> {
  return useForm<TValues, TContext>({
    ...options,
    resolver: zodResolver(schema),
  });
}
