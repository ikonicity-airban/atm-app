import { z } from 'zod';
import { normalisePhone } from '../utils/phone.ts';

export const companionPassengerSchema = z.object({
  fullName: z.string().trim().min(2, 'Companion full name must be at least 2 characters'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Please select gender: male, female, or other' }),
  }),
  phone: z
    .string()
    .trim()
    .min(10, 'Valid Nigerian phone number required')
    .transform((val) => normalisePhone(val)),
  isDefaultNextOfKin: z.boolean().optional().default(false),
});

export type CompanionPassengerInput = z.infer<typeof companionPassengerSchema>;

export const updateCustomerProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').optional(),
  email: z.string().trim().email('Invalid email address').toLowerCase().optional(),
  nextOfKinName: z.string().trim().min(2, 'Next of kin name must be at least 2 characters').optional(),
  nextOfKinPhone: z
    .string()
    .trim()
    .min(10, 'Valid next of kin phone number required')
    .transform((val) => normalisePhone(val))
    .optional(),
});

export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileSchema>;

export const applyCheckoutCreditSchema = z.object({
  bookingRef: z.string().trim().min(1, 'Booking reference is required'),
  holdToken: z.string().trim().min(1, 'Hold security token is required'),
  applyCreditKobo: z.number().int().nonnegative('Applied credit must be a non-negative integer kobo'),
});

export type ApplyCheckoutCreditInput = z.infer<typeof applyCheckoutCreditSchema>;

export const customerPreferencesSchema = z.object({
  smsAlerts: z.boolean().default(true),
  whatsappAlerts: z.boolean().default(true),
  emailReceipts: z.boolean().default(true),
  preferredSeatPosition: z.enum(['front_window', 'middle_row', 'rear_row', 'any']).default('any'),
  autoFillEmergencyContact: z.boolean().default(true),
  localDataConsent: z.boolean().default(true),
});

export type CustomerPreferencesInput = z.infer<typeof customerPreferencesSchema>;
