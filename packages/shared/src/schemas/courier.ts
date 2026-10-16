import { z } from 'zod';
import { normalisePhone, isValidNigerianPhone } from '../utils/phone.ts';

const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 characters')
  .refine(isValidNigerianPhone, {
    message: 'Must be a valid Nigerian phone number (e.g. 09070000625 or +234...)',
  })
  .transform((val) => normalisePhone(val));

export const courierCategoryEnum = z.enum([
  'documents',
  'electronics',
  'clothing',
  'perishables',
  'fragile',
  'general',
]);

export const parcelQuoteSchema = z.object({
  originTerminalId: z.string().min(1, 'Origin terminal is required'),
  destinationTerminalId: z.string().min(1, 'Destination terminal is required'),
  category: courierCategoryEnum,
  weightKg: z.coerce.number().positive('Weight must be positive').max(50, 'Maximum single parcel weight is 50kg'),
  fragile: z.boolean().default(false),
  declaredValueKobo: z.coerce.number().int().nonnegative().optional().default(0),
}).refine((data) => data.originTerminalId !== data.destinationTerminalId, {
  message: 'Origin and destination terminal cannot be identical',
  path: ['destinationTerminalId'],
});

export const bookParcelSchema = z.object({
  originTerminalId: z.string().min(1, 'Origin terminal is required'),
  destinationTerminalId: z.string().min(1, 'Destination terminal is required'),
  category: courierCategoryEnum,
  description: z.string().min(3, 'Package contents description required (min 3 characters)').max(300),
  weightKg: z.coerce.number().positive('Weight must be positive').max(50, 'Max single package weight is 50kg'),
  fragile: z.boolean().default(false),
  declaredValueKobo: z.coerce.number().int().nonnegative().optional().default(0),

  // Sender details
  senderName: z.string().min(2, 'Sender full name is required').max(100),
  senderPhone: phoneSchema,
  senderEmail: z.string().email('Valid email required').optional().or(z.literal('')),

  // Receiver details
  receiverName: z.string().min(2, 'Receiver full name is required').max(100),
  receiverPhone: phoneSchema,
  receiverAltPhone: z.string().optional().refine((val) => !val || isValidNigerianPhone(val), {
    message: 'Invalid alternative receiver phone number',
  }),
  receiverAddress: z.string().max(255).optional(),

  // Payment & Compliance
  paymentMethod: z.enum(['online', 'pay_on_dropoff']).default('online'),
  securityDeclarationAccepted: z.literal(true, {
    message: 'You must confirm that this parcel contains no hazardous or prohibited contraband',
  }),
}).refine((data) => data.originTerminalId !== data.destinationTerminalId, {
  message: 'Origin and destination terminal cannot be the same',
  path: ['destinationTerminalId'],
});

export const trackParcelSchema = z.object({
  query: z.string().min(6, 'Please enter a valid tracking code (ATM-EXP-XXXXXX) or phone number').trim(),
});

export type ParcelQuoteInput = z.infer<typeof parcelQuoteSchema>;
export type BookParcelInput = z.infer<typeof bookParcelSchema>;
export type TrackParcelInput = z.infer<typeof trackParcelSchema>;
