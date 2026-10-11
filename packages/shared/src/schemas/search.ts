import { z } from 'zod';
import {
  SERVED_CITIES,
  DEFAULT_BOOKING_SETTINGS,
} from '../constants/index.ts';
import { isServedPair, getLagosDate } from '../utils/search.ts';

/**
 * Validates search query parameters for trip discovery.
 */
export const searchParamsSchema = z
  .object({
    from: z.enum(SERVED_CITIES, {
      message: 'Please select a valid origin city (Enugu, Abuja, Lagos, or Owerri)',
    }),
    to: z.enum(SERVED_CITIES, {
      message: 'Please select a valid destination city (Enugu, Abuja, Lagos, or Owerri)',
    }),
    date: z
      .string({
        message: 'Travel date is required',
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
      .refine(
        (dateStr) => {
          const todayLagos = getLagosDate();
          return dateStr >= todayLagos;
        },
        {
          message: 'Departure date cannot be in the past',
        }
      )
      .refine(
        (dateStr) => {
          const today = new Date();
          const maxAdvanceMs =
            DEFAULT_BOOKING_SETTINGS.maxAdvanceDays * 24 * 60 * 60 * 1000;
          const maxDate = new Date(today.getTime() + maxAdvanceMs);
          const maxDateLagos = getLagosDate(maxDate);
          return dateStr <= maxDateLagos;
        },
        {
          message: `Bookings can only be made up to ${DEFAULT_BOOKING_SETTINGS.maxAdvanceDays} days in advance`,
        }
      ),
    passengers: z.coerce
      .number()
      .int('Passengers must be a whole number')
      .min(1, 'At least 1 passenger is required')
      .max(5, 'Maximum 5 passengers per Toyota Sienna. For larger groups, please request a corporate group booking at /corporate.'),
  })
  .superRefine((data, ctx) => {
    if (!isServedPair(data.from, data.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${data.from} to ${data.to} is not an active transport corridor. We operate Enugu ↔ Abuja, Enugu ↔ Lagos, and Lagos ↔ Owerri.`,
        path: ['to'],
      });
    }
  });

export type SearchParamsInput = z.infer<typeof searchParamsSchema>;
