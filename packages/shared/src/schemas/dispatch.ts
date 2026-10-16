import { z } from 'zod';
import { normalisePhone, isValidNigerianPhone } from '../utils/phone.ts';

const phoneInputSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 characters')
  .refine(isValidNigerianPhone, {
    message: 'Must be a valid Nigerian phone number (e.g. 080... or +234...)',
  })
  .transform((val) => normalisePhone(val));

/**
 * Gate Check-In Search / Lookup Schema
 * Supports searching by booking reference (ATM-XXXXXX), passenger phone, or scanned QR payload
 */
export const checkInLookupSchema = z
  .object({
    ref: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^ATM-[A-Z0-9]{6}$/, 'Booking reference format must be ATM-XXXXXX')
      .optional()
      .or(z.literal('')),
    phone: phoneInputSchema.optional().or(z.literal('')),
    qrPayload: z.string().trim().optional().or(z.literal('')),
  })
  .refine(
    (data) => Boolean(data.ref || data.phone || data.qrPayload),
    {
      message: 'Please provide a booking reference, passenger phone number, or QR code scan.',
      path: ['ref'],
    }
  );

export type CheckInLookupInput = z.infer<typeof checkInLookupSchema>;

/**
 * Passenger Boarding Check-In Schema
 * Records the verified seat numbers, verifying staff member ID, and optional staff name
 */
export const boardPassengerSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  bookingRef: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^ATM-[A-Z0-9]{6}$/, 'Booking reference format must be ATM-XXXXXX'),
  seatNumbers: z
    .array(z.number().int().min(1).max(5, 'Sienna seats are numbered 1 to 5'))
    .min(1, 'Select at least one seat to board'),
  staffId: z.string().min(1, 'Staff member ID is required').default('staff-gate-01'),
  staffName: z.string().optional(),
});

export type BoardPassengerInput = z.infer<typeof boardPassengerSchema>;

/**
 * Standby Release Schema
 * Releases unboarded seats back to terminal walk-in inventory 15 minutes before departure
 */
export const standbyReleaseSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  bookingRef: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^ATM-[A-Z0-9]{6}$/, 'Booking reference format must be ATM-XXXXXX'),
  seatNumbers: z
    .array(z.number().int().min(1).max(5, 'Sienna seats are numbered 1 to 5'))
    .min(1, 'Select at least one seat to release for standby'),
  reason: z
    .string()
    .min(3, 'Reason must be at least 3 characters')
    .default('Passenger no-show at 15-minute departure cutoff'),
  staffId: z.string().min(1, 'Staff member ID is required').default('staff-supervisor-01'),
});

export type StandbyReleaseInput = z.infer<typeof standbyReleaseSchema>;

/**
 * Assign Vehicle and Driver to Trip Dispatch Console Schema
 */
export const assignTripDispatchSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  driverId: z.string().min(1, 'Driver ID is required'),
  status: z
    .enum(['scheduled', 'boarding', 'in_transit', 'completed', 'cancelled', 'delayed'])
    .optional(),
});

export type AssignTripDispatchInput = z.infer<typeof assignTripDispatchSchema>;
