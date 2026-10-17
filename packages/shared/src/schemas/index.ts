import { z } from 'zod';
import { normalisePhone, isValidNigerianPhone } from '../utils/phone.ts';
export * from './search.ts';
export * from './booking.ts';
export * from './payment.ts';
export * from './cancellation.ts';
export * from './courier.ts';
export * from './dispatch.ts';
export * from './fleet.ts';
export * from './pricing.ts';
export * from './inquiries.ts';
export * from './auth.ts';
export * from './customer.ts';
export * from './charter.ts';
export * from './seo.ts';
export * from './driver.ts';
export * from './telematics.ts';


const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 characters')
  .refine(isValidNigerianPhone, {
    message: 'Must be a valid Nigerian phone number (e.g. 09070000625 or +234...)',
  })
  .transform((val) => normalisePhone(val));

export const searchTripsSchema = z.object({
  originTerminalId: z.string().min(1, 'Origin terminal is required'),
  destinationTerminalId: z.string().min(1, 'Destination terminal is required'),
  travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Travel date must be YYYY-MM-DD'),
  passengers: z.coerce.number().int().min(1).max(5).default(1),
}).refine(data => data.originTerminalId !== data.destinationTerminalId, {
  message: 'Origin and destination cannot be the same terminal',
  path: ['destinationTerminalId'],
});

export const passengerSchema = z.object({
  seatNo: z.number().int().min(1).max(5, 'Sienna seats are numbered 1 to 5'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  gender: z.enum(['male', 'female', 'other']).optional(),
  isPrimaryBooker: z.boolean().default(false),
});

export const createBookingSchema = z.object({
  tripId: z.string().uuid('Invalid trip ID'),
  bookerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  bookerEmail: z.string().email('Valid email address required').optional().or(z.literal('')),
  bookerPhone: phoneSchema,
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().optional().refine(val => !val || isValidNigerianPhone(val), {
    message: 'Invalid emergency contact phone number',
  }),
  passengers: z.array(passengerSchema).min(1, 'At least one passenger must be selected').max(5),
  pickupTerminalId: z.string().min(1, 'Pickup terminal is required'),
  dropoffTerminalId: z.string().min(1, 'Dropoff terminal is required'),
});

export const createParcelSchema = z.object({
  senderName: z.string().min(2, 'Sender name required').max(100),
  senderPhone: phoneSchema,
  senderEmail: z.string().email().optional().or(z.literal('')),
  receiverName: z.string().min(2, 'Receiver name required').max(100),
  receiverPhone: phoneSchema,
  receiverAddress: z.string().max(255).optional(),
  originTerminalId: z.string().min(1, 'Origin terminal is required'),
  destinationTerminalId: z.string().min(1, 'Destination terminal is required'),
  category: z.enum(['documents', 'electronics', 'clothing', 'perishables', 'fragile', 'general']),
  description: z.string().min(3, 'Detailed description of items required').max(500),
  declaredValueKobo: z.number().int().nonnegative('Declared value cannot be negative').optional(),
  weightKg: z.number().positive('Weight must be positive').max(50, 'Max single parcel weight is 50kg').default(1),
  fragile: z.boolean().default(false),
});

export const charterRequestSchema = z.object({
  contactName: z.string().min(2, 'Contact name is required').max(100),
  contactPhone: phoneSchema,
  contactEmail: z.string().email('Valid email required'),
  originCity: z.string().min(2, 'Origin city is required').max(100),
  destinationCity: z.string().min(2, 'Destination city is required').max(100),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Departure date must be YYYY-MM-DD'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Return date must be YYYY-MM-DD').optional().or(z.literal('')),
  numberOfVehicles: z.coerce.number().int().min(1).max(10).default(1),
  isRoundTrip: z.boolean().default(false),
  specialRequests: z.string().max(1000).optional(),
});

export const corporateRequestSchema = z.object({
  companyName: z.string().min(2, 'Company name is required').max(150),
  contactPerson: z.string().min(2, 'Contact person is required').max(100),
  workEmail: z.string().email('Corporate email address required'),
  contactPhone: phoneSchema,
  serviceType: z.enum(['staff_commute', 'executive_charter', 'scheduled_courier', 'intercity_fleet_contract']),
  monthlyTripVolumeEstimate: z.coerce.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
});

export const cancellationRequestSchema = z.object({
  bookingRef: z.string().regex(/^ATM-[A-Z0-9]{6}$/, 'Booking reference format must be ATM-XXXXXX'),
  phone: phoneSchema,
  reason: z.string().min(5, 'Reason for cancellation required').max(500),
  accountNumberForRefund: z.string().length(10, 'Nigerian bank account must be 10 digits').optional(),
  bankCodeForRefund: z.string().min(3, 'Bank code required').optional(),
  accountNameForRefund: z.string().min(2, 'Account name required').optional(),
});

export const complaintSchema = z.object({
  fullName: z.string().min(2, 'Your name is required').max(100),
  phone: phoneSchema,
  email: z.string().email().optional().or(z.literal('')),
  category: z.enum(['trip_delay', 'driver_conduct', 'lost_parcel', 'vehicle_condition', 'refund_issue', 'other']),
  bookingRef: z.string().optional(),
  parcelTrackingCode: z.string().optional(),
  message: z.string().min(10, 'Please describe your complaint in detail (min 10 characters)').max(1500),
});

export type SearchTripsInput = z.infer<typeof searchTripsSchema>;
export type PassengerInput = z.infer<typeof passengerSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateParcelInput = z.infer<typeof createParcelSchema>;
export type CharterRequestInput = z.infer<typeof charterRequestSchema>;
export type CorporateRequestInput = z.infer<typeof corporateRequestSchema>;
export type CancellationRequestInput = z.infer<typeof cancellationRequestSchema>;
export type ComplaintInput = z.infer<typeof complaintSchema>;
