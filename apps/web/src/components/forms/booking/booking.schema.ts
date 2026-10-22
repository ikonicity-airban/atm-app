import { z } from 'zod';
import {
  SERVED_CITIES,
  isServedPair,
  getLagosDate,
  DEFAULT_BOOKING_SETTINGS,
  isValidNigerianPhone,
  normalisePhone,
  type ServedCity,
} from '@atm/shared';

export const tripSearchFormSchema = z
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
      .max(5, 'Maximum 5 passengers per Toyota Sienna.'),
    timeWindow: z.enum(['all', 'morning', 'afternoon']).default('all'),
    sortBy: z.enum(['earliest', 'cheapest']).default('earliest'),
    terminal: z.string().default('all'),
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

export type TripSearchFormValues = z.infer<typeof tripSearchFormSchema>;

export const passengerItemFormSchema = z.object({
  seatNo: z
    .number()
    .int()
    .min(1, 'Seat number must be between 1 and 5')
    .max(5, 'Seat number must be between 1 and 5'),
  fullName: z
    .string()
    .trim()
    .min(2, 'Passenger name must be at least 2 characters')
    .max(100, 'Passenger name cannot exceed 100 characters'),
});

export const contactDetailsFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Lead contact name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .refine(isValidNigerianPhone, {
      message: 'Must be a valid Nigerian phone number (e.g. 08012345678 or +234...)',
    })
    .transform((val) => normalisePhone(val)),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  nextOfKinPhone: z
    .string()
    .optional()
    .refine((val) => !val || isValidNigerianPhone(val), {
      message: 'Must be a valid Nigerian phone number',
    })
    .transform((val) => (val && isValidNigerianPhone(val) ? normalisePhone(val) : undefined)),
});

export const passengerCheckoutFormSchema = z
  .object({
    tripId: z.string().min(1, 'Trip ID is required'),
    seats: z
      .array(z.number().int().min(1).max(5))
      .min(1, 'At least 1 seat must be selected')
      .max(5, 'Maximum 5 seats per Toyota Sienna'),
    passengers: z
      .array(passengerItemFormSchema)
      .min(1, 'At least 1 passenger detail is required')
      .max(5, 'Maximum 5 passengers allowed'),
    contact: contactDetailsFormSchema,
    smsConsent: z.boolean().refine((val) => val === true, {
      message: 'You must agree to receive your ticket and boarding alerts via SMS or WhatsApp',
    }),
    applyStoreCredit: z.boolean().default(false),
  })
  .refine((data) => data.seats.length === data.passengers.length, {
    message: 'The number of selected seats must equal the number of passenger names provided',
    path: ['passengers'],
  })
  .refine(
    (data) => {
      const selectedSeats = new Set(data.seats);
      return data.passengers.every((p) => selectedSeats.has(p.seatNo));
    },
    {
      message: 'Each passenger must be assigned to one of your selected seats',
      path: ['passengers'],
    }
  );

export type PassengerCheckoutFormValues = z.infer<typeof passengerCheckoutFormSchema>;
