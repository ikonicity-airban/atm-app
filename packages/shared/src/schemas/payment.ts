import { z } from 'zod';

export const paymentChannelSchema = z.enum([
  'card',
  'bank',
  'ussd',
  'mobile_money',
  'bank_transfer',
  'pay_at_terminal',
]);

export type PaymentChannel = z.infer<typeof paymentChannelSchema>;

export const initializePaymentSchema = z.object({
  bookingRef: z
    .string()
    .min(5, 'Booking reference is required')
    .max(32)
    .regex(/^ATM-[A-Z0-9]+$/, 'Invalid booking reference pattern'),
  holdToken: z.string().min(16, 'Hold token must be at least 16 characters'),
  email: z.string().email().optional(),
  callbackUrl: z.string().url().optional(),
});

export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>;

export const verifyPaymentQuerySchema = z.object({
  reference: z.string().min(5, 'Payment reference is required').max(128),
  bookingRef: z.string().optional(),
});

export type VerifyPaymentQuery = z.infer<typeof verifyPaymentQuerySchema>;

export const paystackWebhookDataSchema = z.object({
  id: z.number().optional(),
  domain: z.string().optional(),
  status: z.string(),
  reference: z.string(),
  amount: z.number().int().nonnegative('Amount must be non-negative integer kobo'),
  message: z.string().nullable().optional(),
  gateway_response: z.string().optional(),
  paid_at: z.string().optional(),
  created_at: z.string().optional(),
  channel: z.string().optional(),
  currency: z.string().default('NGN'),
  ip_address: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  customer: z
    .object({
      id: z.number().optional(),
      email: z.string().optional(),
      customer_code: z.string().optional(),
      phone: z.string().nullable().optional(),
    })
    .optional(),
});

export const paystackWebhookEventSchema = z.object({
  event: z.string(),
  data: paystackWebhookDataSchema,
});

export type PaystackWebhookEvent = z.infer<typeof paystackWebhookEventSchema>;
export type PaystackWebhookData = z.infer<typeof paystackWebhookDataSchema>;

export interface TicketQrData {
  bookingRef: string;
  ticketId: string;
  seatNo: number;
  passengerName: string;
  tripId: string;
  fareKobo: number;
  issuedAt: string;
}
