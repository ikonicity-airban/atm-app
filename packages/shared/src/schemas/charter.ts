import { z } from 'zod';
import { normalisePhone } from '../utils/phone.ts';

export const serviceTypeEnum = z.enum(['private_charter', 'corporate_transit', 'custom_cargo']);
export type ServiceType = z.infer<typeof serviceTypeEnum>;

export const tripTypeEnum = z.enum(['one_way', 'round_trip', 'multi_day']);
export type TripType = z.infer<typeof tripTypeEnum>;

export const billingMethodEnum = z.enum(['paystack_gateway', 'corporate_invoice']);
export type BillingMethod = z.infer<typeof billingMethodEnum>;

export const charterStatusEnum = z.enum([
  'submitted',
  'quoted',
  'approved',
  'assigned',
  'completed',
  'declined',
]);
export type CharterStatus = z.infer<typeof charterStatusEnum>;

export const charterQuoteInputSchema = z.object({
  serviceType: serviceTypeEnum.default('private_charter'),
  tripType: tripTypeEnum.default('one_way'),
  originCity: z.string().min(2, 'Origin city is required'),
  destinationCity: z.string().min(2, 'Destination city is required'),
  durationDays: z.number().int().min(1, 'Minimum duration is 1 day').default(1),
  passengerCount: z.number().int().min(1).max(5, 'Maximum 5 passengers per Toyota Sienna').default(1),
  isDoorToDoor: z.boolean().default(true),
  hasArmedEscort: z.boolean().default(false),
});
export type CharterQuoteInput = z.infer<typeof charterQuoteInputSchema>;

export const createCharterRequestSchema = z.object({
  serviceType: serviceTypeEnum,
  tripType: tripTypeEnum,
  originCity: z.string().min(2, 'Origin city is required'),
  originAddress: z.string().min(5, 'Specific pickup address is required'),
  destinationCity: z.string().min(2, 'Destination city is required'),
  destinationAddress: z.string().min(5, 'Specific destination address is required'),
  departureDate: z.string().min(10, 'Valid departure date is required'),
  returnDate: z.string().optional().nullable(),
  durationDays: z.number().int().min(1).default(1),
  passengerCount: z.number().int().min(1).max(5).default(1),
  contactName: z.string().min(2, 'Contact name is required'),
  contactPhone: z
    .string()
    .min(10, 'Valid phone number is required')
    .transform((val) => normalisePhone(val)),
  contactEmail: z.string().email('Valid email address is required'),
  organizationName: z.string().optional().nullable(),
  organizationTaxId: z.string().optional().nullable(),
  specialRequirements: z.string().optional().nullable(),
  billingMethod: billingMethodEnum.default('paystack_gateway'),
  invoiceReference: z.string().optional().nullable(),
  estimatedFareKobo: z.number().int().positive('Estimated fare must be a positive integer kobo'),
});
export type CreateCharterRequestInput = z.infer<typeof createCharterRequestSchema>;

export const updateCharterRequestSchema = z.object({
  status: charterStatusEnum.optional(),
  finalFareKobo: z.number().int().positive().optional(),
  assignedVehicleId: z.string().optional().nullable(),
  assignedDriverId: z.string().optional().nullable(),
  dispatchNotes: z.string().optional().nullable(),
  staffId: z.string().default('staff-ops-default'),
});
export type UpdateCharterRequestInput = z.infer<typeof updateCharterRequestSchema>;
