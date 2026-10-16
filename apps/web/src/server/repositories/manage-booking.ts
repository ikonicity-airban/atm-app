/**
 * Manage Booking & Cancellation Repository
 * Secure booking retrieval, sliding-window rate limiting,
 * tiered cancellation quote computation, and atomic seat inventory release.
 */

import crypto from 'crypto';
import type { DbTicket, DbPayment, DbCancellation } from '@atm/db';
import {
  normalisePhone,
  calculateCancellationFee,
  DEFAULT_CANCELLATION_POLICY,
  formatWatDateTime,
  type ManageBookingLookupInput,
  type CancellationQuoteInput,
  type CancellationExecutionInput,
  type CancellationQuoteResult,
  type CancellationExecutionResult,
} from '@atm/shared';
import { AppError } from '@/lib/errors.ts';
import { bookingRepository, type HeldBooking } from '@/server/repositories/bookings.ts';
import { paymentRepository } from '@/server/repositories/payments.ts';
import { getPaymentProvider } from '@/server/payments/index.ts';
import { getNotificationService } from '@/server/notifications/index.ts';

export interface ManageBookingDetails {
  booking: HeldBooking;
  tickets: DbTicket[];
  payment: DbPayment | null;
  cancellationEligibility: CancellationQuoteResult | null;
  walletBalanceKobo: number;
}

export interface RateLimitEntry {
  key: string;
  attemptCount: number;
  lockedUntil: number | null; // Unix ms
  lastAttemptAt: number; // Unix ms
}

export interface IManageBookingRepository {
  lookupBooking(input: ManageBookingLookupInput, clientIp?: string): Promise<ManageBookingDetails>;
  getRateLimitStatus(clientIp: string, phone: string): { locked: boolean; remainingMinutes: number; attempts: number };
  resetRateLimit(clientIp: string, phone: string): void;
  quoteCancellation(input: CancellationQuoteInput): Promise<CancellationQuoteResult>;
  executeCancellation(input: CancellationExecutionInput, clientIp?: string): Promise<CancellationExecutionResult>;
}

export class ManageBookingRepository implements IManageBookingRepository {
  private static rateLimits = new Map<string, RateLimitEntry>();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_WINDOW_MS = 60 * 60 * 1000; // 60 minutes
  private static readonly ATTEMPT_EXPIRY_MS = 60 * 60 * 1000; // 60 minutes

  private getRateLimitKey(clientIp: string = '127.0.0.1', phone: string): string {
    const normalised = normalisePhone(phone);
    const hash = crypto.createHash('sha256').update(`${normalised}:atm-salt`).digest('hex').slice(0, 16);
    return `lookup:${clientIp}:${hash}`;
  }

  getRateLimitStatus(clientIp: string = '127.0.0.1', phone: string): {
    locked: boolean;
    remainingMinutes: number;
    attempts: number;
  } {
    const key = this.getRateLimitKey(clientIp, phone);
    const entry = ManageBookingRepository.rateLimits.get(key);
    const now = Date.now();

    if (!entry) {
      return { locked: false, remainingMinutes: 0, attempts: 0 };
    }

    // Check if lockout has expired
    if (entry.lockedUntil && entry.lockedUntil > now) {
      const remainingMinutes = Math.ceil((entry.lockedUntil - now) / 60000);
      return { locked: true, remainingMinutes, attempts: entry.attemptCount };
    }

    // Check if attempts have expired without a lock
    if (now - entry.lastAttemptAt > ManageBookingRepository.ATTEMPT_EXPIRY_MS) {
      ManageBookingRepository.rateLimits.delete(key);
      return { locked: false, remainingMinutes: 0, attempts: 0 };
    }

    return { locked: false, remainingMinutes: 0, attempts: entry.attemptCount };
  }

  private recordFailedAttempt(clientIp: string = '127.0.0.1', phone: string): void {
    const key = this.getRateLimitKey(clientIp, phone);
    const now = Date.now();
    let entry = ManageBookingRepository.rateLimits.get(key);

    if (!entry || now - entry.lastAttemptAt > ManageBookingRepository.ATTEMPT_EXPIRY_MS) {
      entry = {
        key,
        attemptCount: 1,
        lockedUntil: null,
        lastAttemptAt: now,
      };
    } else {
      entry.attemptCount += 1;
      entry.lastAttemptAt = now;
      if (entry.attemptCount >= ManageBookingRepository.MAX_ATTEMPTS) {
        entry.lockedUntil = now + ManageBookingRepository.LOCKOUT_WINDOW_MS;
      }
    }

    ManageBookingRepository.rateLimits.set(key, entry);
  }

  resetRateLimit(clientIp: string = '127.0.0.1', phone: string): void {
    const key = this.getRateLimitKey(clientIp, phone);
    ManageBookingRepository.rateLimits.delete(key);
  }

  /**
   * Secure booking lookup with sliding window rate limiting
   */
  async lookupBooking(input: ManageBookingLookupInput, clientIp: string = '127.0.0.1'): Promise<ManageBookingDetails> {
    const rateStatus = this.getRateLimitStatus(clientIp, input.phone);
    if (rateStatus.locked) {
      throw AppError.rateLimited(
        `Too many failed lookup attempts. Please try again after ${rateStatus.remainingMinutes} minutes.`
      );
    }

    const booking = await bookingRepository.getBookingByRef(input.ref);
    if (!booking) {
      this.recordFailedAttempt(clientIp, input.phone);
      throw AppError.notFound('Booking reference not found or phone number does not match.');
    }

    const inputPhoneNorm = normalisePhone(input.phone);
    const bookingPhoneNorm = normalisePhone(booking.contact.phone);

    if (inputPhoneNorm !== bookingPhoneNorm) {
      this.recordFailedAttempt(clientIp, input.phone);
      throw AppError.notFound('Booking reference not found or phone number does not match.');
    }

    // Successful lookup clears rate limit counter
    this.resetRateLimit(clientIp, input.phone);

    // Fetch tickets and payment
    const tickets = await paymentRepository.getTicketsByBookingRef(booking.ref);
    const payment = await paymentRepository.getPaymentByBookingRef(booking.ref);
    const walletBalanceKobo = await paymentRepository.getWalletBalance(bookingPhoneNorm);

    // Calculate cancellation eligibility for active tickets
    let cancellationEligibility: CancellationQuoteResult | null = null;
    const activeTickets = tickets.filter((t) => t.status !== 'cancelled');
    if (activeTickets.length > 0) {
      try {
        cancellationEligibility = await this.quoteCancellation({
          ref: booking.ref,
          phone: input.phone,
          ticketIds: activeTickets.map((t) => t.id),
        });
      } catch {
        cancellationEligibility = null;
      }
    }

    return {
      booking,
      tickets,
      payment,
      cancellationEligibility,
      walletBalanceKobo,
    };
  }

  /**
   * Quotes cancellation fees and net refund in integer kobo
   */
  async quoteCancellation(input: CancellationQuoteInput): Promise<CancellationQuoteResult> {
    const booking = await bookingRepository.getBookingByRef(input.ref);
    if (!booking) {
      throw AppError.notFound(`Booking reference ${input.ref} not found.`);
    }

    const inputPhoneNorm = normalisePhone(input.phone);
    const bookingPhoneNorm = normalisePhone(booking.contact.phone);
    if (inputPhoneNorm !== bookingPhoneNorm) {
      throw AppError.unauthorized('Phone number does not match this booking record.');
    }

    const tickets = await paymentRepository.getTicketsByBookingRef(booking.ref);
    const activeTickets = tickets.filter((t) => t.status !== 'cancelled');

    let ticketsToCancel = activeTickets;
    if (input.ticketIds && input.ticketIds.length > 0) {
      const idSet = new Set(input.ticketIds);
      ticketsToCancel = activeTickets.filter((t) => idSet.has(t.id));
    }

    if (ticketsToCancel.length === 0) {
      throw AppError.badRequest('No active tickets found for cancellation.');
    }

    const totalFareCancelledKobo = ticketsToCancel.reduce((sum, t) => sum + t.fareKobo, 0);
    const departureDate = new Date(booking.trip.departureTimeUtc);
    const now = new Date();

    const quote = calculateCancellationFee(
      DEFAULT_CANCELLATION_POLICY,
      departureDate,
      now,
      totalFareCancelledKobo
    );

    return {
      bookingRef: booking.ref,
      tripDepartureTimeUtc: booking.trip.departureTimeUtc,
      hoursRemaining: Math.max(0, quote.hoursBeforeDeparture),
      eligibleForRefund: quote.eligibleForRefund,
      totalFareCancelledKobo,
      cancellationFeeKobo: quote.cancellationFeeKobo,
      refundAmountKobo: quote.refundAmountKobo,
      feePercentageApplied: quote.feePercentageApplied,
      reason: quote.reason,
      seatsToCancel: ticketsToCancel.map((t) => t.seatNo),
      ticketIdsToCancel: ticketsToCancel.map((t) => t.id),
      quoteExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Executes ticket cancellation atomically, restores seat inventory, and initiates refund
   */
  async executeCancellation(
    input: CancellationExecutionInput,
    clientIp: string = '127.0.0.1'
  ): Promise<CancellationExecutionResult> {
    const quote = await this.quoteCancellation({
      ref: input.ref,
      phone: input.phone,
      ticketIds: input.ticketIds,
    });

    const booking = await bookingRepository.getBookingByRef(input.ref);
    if (!booking) {
      throw AppError.notFound(`Booking reference ${input.ref} not found.`);
    }

    // Departure time cutoff check
    const departureDate = new Date(booking.trip.departureTimeUtc);
    if (departureDate.getTime() <= Date.now()) {
      throw AppError.badRequest('Departure time has already passed. Cancellations cannot be processed.');
    }

    // 1. Mark tickets as cancelled
    for (const ticketId of quote.ticketIdsToCancel) {
      await paymentRepository.updateTicketStatus(ticketId, 'cancelled');
    }

    // 2. Release seat inventory back to /trips atomically
    await bookingRepository.cancelBookingSeats(booking.ref, quote.seatsToCancel);

    // 3. Process refund disbursement
    let paystackRefundId: string | null = null;
    let walletBalanceAfterKobo: number | null = null;
    const normalisedPhone = normalisePhone(booking.contact.phone);

    if (input.disbursementMethod === 'atm_credit') {
      if (quote.refundAmountKobo > 0) {
        const creditEntry = await paymentRepository.creditCustomer(
          normalisedPhone,
          quote.refundAmountKobo,
          `Cancellation refund for ${booking.ref} (${quote.seatsToCancel.length} seat(s))`,
          booking.id
        );
        walletBalanceAfterKobo = creditEntry.balanceAfterKobo;
      } else {
        walletBalanceAfterKobo = await paymentRepository.getWalletBalance(normalisedPhone);
      }
    } else if (input.disbursementMethod === 'paystack_reversal') {
      if (quote.refundAmountKobo > 0) {
        const payment = await paymentRepository.getPaymentByBookingRef(booking.ref);
        const provider = getPaymentProvider();
        const refundResult = await provider.refundTransaction({
          transactionReference: payment?.providerRef || booking.ref,
          amountKobo: quote.refundAmountKobo,
          merchantNote: `Passenger cancellation ${booking.ref} (${quote.seatsToCancel.length} seat(s))`,
        });
        paystackRefundId = refundResult.refundId;
      }
    }

    // 4. Record cancellation audit record
    const cancellationId = crypto.randomUUID ? crypto.randomUUID() : `cancel-${Date.now()}`;
    const cancellationRecord: DbCancellation = {
      id: cancellationId,
      bookingId: booking.id,
      ticketId: quote.ticketIdsToCancel.length === 1 ? quote.ticketIdsToCancel[0]! : null,
      customerId: normalisedPhone,
      reason: input.reason,
      cancelledSeatsCount: quote.seatsToCancel.length,
      totalFareCancelledKobo: quote.totalFareCancelledKobo,
      cancellationFeeKobo: quote.cancellationFeeKobo,
      refundKobo: quote.refundAmountKobo,
      disbursementMethod: input.disbursementMethod,
      paystackRefundId,
      processedByStaffId: null,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await paymentRepository.recordCancellation(cancellationRecord);

    // 5. Automated SMS Confirmation Dispatch (AC-8)
    try {
      const notificationService = getNotificationService();
      await notificationService.sendCancellationConfirmation({
        recipientPhone: booking.contact.phone,
        bookingRef: booking.ref,
        cancelledSeats: quote.seatsToCancel,
        feeKobo: quote.cancellationFeeKobo,
        refundKobo: quote.refundAmountKobo,
        disbursementMethod: input.disbursementMethod,
      });
    } catch (smsErr) {
      console.warn('[ManageBookingRepository] SMS dispatch failed gracefully:', smsErr);
    }

    return {
      cancellationId,
      bookingRef: booking.ref,
      cancelledSeatsCount: quote.seatsToCancel.length,
      totalFareCancelledKobo: quote.totalFareCancelledKobo,
      cancellationFeeKobo: quote.cancellationFeeKobo,
      refundAmountKobo: quote.refundAmountKobo,
      disbursementMethod: input.disbursementMethod,
      paystackRefundId,
      walletBalanceAfterKobo,
      status: 'completed',
      cancelledAt: cancellationRecord.createdAt,
    };
  }
}

export const manageBookingRepository: IManageBookingRepository = new ManageBookingRepository();
