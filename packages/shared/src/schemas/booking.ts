import { z } from 'zod';
import { isValidNigerianPhone, normalisePhone } from '../utils/phone.ts';

const phoneValidator = z
  .string()
  .min(10, 'Phone number must be at least 10 characters')
  .refine(isValidNigerianPhone, {
    message: 'Must be a valid Nigerian phone number (e.g. 09070000625 or +234...)',
  })
  .transform((val) => normalisePhone(val));

const optionalPhoneValidator = z
  .string()
  .refine((val) => !val || isValidNigerianPhone(val), {
    message: 'Must be a valid Nigerian phone number',
  })
  .transform((val) => (val ? normalisePhone(val) : undefined))
  .optional();

export const seatItemSchema = z.object({
  seatNo: z.number().int().min(1).max(5),
  label: z.string().min(1),
  row: z.number().int().min(1),
  column: z.number().int().min(1),
  isDriver: z.boolean().optional(),
});

export const seatLayoutSchema = z.object({
  totalSeats: z.number().int().min(1).max(5),
  driverSeat: z.string().min(1),
  seats: z.array(seatItemSchema),
});

export const passengerItemSchema = z.object({
  seatNo: z.number().int().min(1, 'Seat number must be between 1 and 5').max(5, 'Seat number must be between 1 and 5'),
  fullName: z
    .string()
    .trim()
    .min(2, 'Passenger name must be at least 2 characters')
    .max(100, 'Passenger name cannot exceed 100 characters'),
});

export const bookingContactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Lead contact name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  phone: phoneValidator,
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  // Optional next of kin phone for the manifest // TODO(client): confirm whether ATM requires this on all trips
  nextOfKinPhone: z
    .string()
    .optional()
    .transform((val) => (val && isValidNigerianPhone(val) ? normalisePhone(val) : val ? normalisePhone(val) : undefined)),
});

export const bookingHoldInputSchema = z
  .object({
    tripId: z.string().min(1, 'Trip ID is required'),
    seats: z
      .array(z.number().int().min(1).max(5))
      .min(1, 'At least 1 seat must be selected')
      .max(5, 'Maximum 5 seats per Toyota Sienna'),
    passengers: z
      .array(passengerItemSchema)
      .min(1, 'At least 1 passenger detail required')
      .max(5, 'Maximum 5 passengers allowed'),
    contact: bookingContactSchema,
    consent: z
      .boolean()
      .refine((val) => val === true, {
        message: 'You must agree to receive your ticket and boarding alerts via SMS or WhatsApp',
      }),
    idempotencyKey: z
      .string()
      .min(8, 'Idempotency key must be at least 8 characters')
      .max(128),
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

export const replaceHoldInputSchema = z.object({
  seats: z
    .array(z.number().int().min(1).max(5))
    .min(1, 'At least 1 seat must be selected')
    .max(5, 'Maximum 5 seats per Toyota Sienna')
    .refine((seats) => new Set(seats).size === seats.length, {
      message: 'Selected seats must be unique',
    }),
});

export interface BookingContactInput {
  fullName: string;
  phone: string;
  email?: string;
  nextOfKinPhone?: string;
}

export interface BookingHoldInput {
  tripId: string;
  seats: number[];
  passengers: Array<{ seatNo: number; fullName: string }>;
  contact: BookingContactInput;
  consent: boolean;
  idempotencyKey: string;
}

export type ReplaceHoldInput = z.infer<typeof replaceHoldInputSchema>;
export type PassengerItemInput = z.infer<typeof passengerItemSchema>;
