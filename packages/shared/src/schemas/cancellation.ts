import { z } from 'zod';
import { isValidNigerianPhone, normalisePhone } from '../utils/phone.ts';

const phoneValidator = z
  .string()
  .min(10, 'Phone number must be at least 10 characters')
  .refine(isValidNigerianPhone, {
    message: 'Must be a valid Nigerian phone number (e.g. 09070000625 or +234...)',
  })
  .transform((val) => normalisePhone(val));

export const manageBookingLookupSchema = z.object({
  ref: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^ATM-[A-Z0-9]{6}$/, 'Booking reference must be in the format ATM-XXXXXX (e.g. ATM-7K9W2P)'),
  phone: phoneValidator,
});

export type ManageBookingLookupInput = z.infer<typeof manageBookingLookupSchema>;

export const cancellationQuoteInputSchema = z.object({
  ref: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^ATM-[A-Z0-9]{6}$/, 'Invalid booking reference format'),
  phone: phoneValidator,
  ticketIds: z.array(z.string().min(1)).optional(),
});

export type CancellationQuoteInput = z.infer<typeof cancellationQuoteInputSchema>;

export const cancellationExecutionInputSchema = z.object({
  ref: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^ATM-[A-Z0-9]{6}$/, 'Invalid booking reference format'),
  phone: phoneValidator,
  ticketIds: z.array(z.string().min(1)).optional(),
  reason: z
    .string()
    .trim()
    .min(3, 'Please specify a reason for cancellation (minimum 3 characters)')
    .max(250, 'Reason cannot exceed 250 characters'),
  disbursementMethod: z.enum(['atm_credit', 'paystack_reversal'], {
    errorMap: () => ({ message: 'Disbursement method must be atm_credit or paystack_reversal' }),
  }),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export type CancellationExecutionInput = z.infer<typeof cancellationExecutionInputSchema>;

export interface CancellationQuoteResult {
  bookingRef: string;
  tripDepartureTimeUtc: string;
  hoursRemaining: number;
  eligibleForRefund: boolean;
  totalFareCancelledKobo: number;
  cancellationFeeKobo: number;
  refundAmountKobo: number;
  feePercentageApplied: number;
  reason: string;
  seatsToCancel: number[];
  ticketIdsToCancel: string[];
  quoteExpiresAt: string;
}

export interface CancellationExecutionResult {
  cancellationId: string;
  bookingRef: string;
  cancelledSeatsCount: number;
  totalFareCancelledKobo: number;
  cancellationFeeKobo: number;
  refundAmountKobo: number;
  disbursementMethod: 'atm_credit' | 'paystack_reversal';
  paystackRefundId: string | null;
  walletBalanceAfterKobo: number | null;
  status: 'completed' | 'pending_gateway' | 'failed';
  cancelledAt: string;
}
