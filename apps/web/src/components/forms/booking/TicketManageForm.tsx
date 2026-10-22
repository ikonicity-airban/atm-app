'use client';

import * as React from 'react';
import { z } from 'zod';
import { isValidNigerianPhone, normalisePhone } from '@atm/shared';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../common/Form';
import { useZodForm } from '../common/useZodForm';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/atm/AtmBlocks';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ticketLookupSchema = z.object({
  bookingRef: z
    .string()
    .trim()
    .min(6, 'Please enter a valid 6-character booking reference code (e.g. ATM-7K9W2P)')
    .toUpperCase(),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .refine(isValidNigerianPhone, {
      message: 'Must be a valid Nigerian phone number used during reservation',
    })
    .transform((val) => normalisePhone(val)),
});

export type TicketLookupValues = z.infer<typeof ticketLookupSchema>;

export interface TicketManageFormProps {
  initialRef?: string;
  initialPhone?: string;
  isLoading?: boolean;
  onSubmit: (values: TicketLookupValues) => Promise<void> | void;
  className?: string;
}

export function TicketManageForm({
  initialRef = '',
  initialPhone = '',
  isLoading = false,
  onSubmit,
  className,
}: TicketManageFormProps) {
  const form = useZodForm(ticketLookupSchema, {
    defaultValues: {
      bookingRef: initialRef.toUpperCase(),
      phone: initialPhone,
    },
  });

  React.useEffect(() => {
    if (initialRef) form.setValue('bookingRef', initialRef.toUpperCase());
    if (initialPhone) form.setValue('phone', initialPhone);
  }, [initialRef, initialPhone, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4 sm:space-y-5', className)}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="bookingRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired>Booking Reference Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. ATM-7K9W2P"
                    className="font-mono uppercase font-bold tracking-wider"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    label="Lead Passenger Phone Number"
                    placeholder="08031234567"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full min-h-[46px] text-xs font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <span>Locating Reservation...</span>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Retrieve Digital Boarding Pass</span>
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
