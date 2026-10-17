import { z } from 'zod';
import { normalisePhone, isValidNigerianPhone } from '../utils/phone.ts';

const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 characters')
  .refine(isValidNigerianPhone, {
    message: 'Must be a valid Nigerian phone number (e.g. 09070000210 or +234...)',
  })
  .transform((val) => normalisePhone(val));

export const driverLoginSchema = z.object({
  identifier: z.string().min(3, 'Phone, badge ID or email is required').max(100),
  credential: z.string().min(4, 'PIN or password must be at least 4 characters').max(100),
  authMethod: z.enum(['phone_pin', 'badge_pin', 'email_password']).default('badge_pin'),
});

export const driverOtpSendSchema = z.object({
  phone: phoneSchema,
});

export const driverOtpVerifySchema = z.object({
  phone: phoneSchema,
  otp: z.string().regex(/^\d{6}$/, 'OTP must be an exact 6-digit numeric code'),
});

export const driverBoardPassengerSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  seatNo: z.number().int().min(1).max(5, 'Toyota Sienna seats are numbered 1 to 5'),
  isBoarded: z.boolean(),
});

export const updateTripStatusSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  status: z.enum(['in_transit', 'completed']),
  note: z.string().max(500).optional(),
});

export const reportIncidentSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  category: z.enum([
    'mechanical_breakdown',
    'checkpoint_delay',
    'traffic_gridlock',
    'weather_hazard',
    'medical_emergency',
    'other',
  ]),
  description: z.string().min(5, 'Incident description required (min 5 characters)').max(1000),
  locationNote: z.string().max(255).optional(),
});

export type DriverLoginInput = z.infer<typeof driverLoginSchema>;
export type DriverOtpSendInput = z.infer<typeof driverOtpSendSchema>;
export type DriverOtpVerifyInput = z.infer<typeof driverOtpVerifySchema>;
export type DriverBoardPassengerInput = z.infer<typeof driverBoardPassengerSchema>;
export type UpdateTripStatusInput = z.infer<typeof updateTripStatusSchema>;
export type ReportIncidentInput = z.infer<typeof reportIncidentSchema>;
