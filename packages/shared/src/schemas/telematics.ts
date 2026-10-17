import { z } from 'zod';
import { normalisePhone, isValidNigerianPhone } from '../utils/phone.ts';

export const bookingReferenceRegex = /^ATM-[A-Z0-9]{6,10}$/i;

export const telematicsLookupSchema = z.object({
  bookingReference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(bookingReferenceRegex, 'Please enter a valid ATM booking reference (e.g. ATM-ENAB01)'),
  passengerPhone: z
    .string()
    .trim()
    .refine((val) => {
      try {
        const normalized = normalisePhone(val);
        return normalized.startsWith('+234') && normalized.length === 14;
      } catch {
        return false;
      }
    }, 'Please enter a valid Nigerian phone number (e.g. 09070000625 or +2349070000625)'),
});


export type TelematicsLookupInput = z.infer<typeof telematicsLookupSchema>;

export const tripTelematicsParamsSchema = z.object({
  tripId: z.string().trim().min(3, 'Trip ID is required'),
});

export type TripTelematicsParamsInput = z.infer<typeof tripTelematicsParamsSchema>;
