/**
 * Payment and Ticket Issuance Repository
 * Handles idempotent payment recording, booking confirmation, HMAC SHA-256 signed ticket issuance,
 * and overbooked late payment credit allocations.
 */

import crypto from 'crypto';
import type { DbPayment, DbTicket, DbCreditLedger, DbCancellation } from '@atm/db';
import {
  isAmountMatch,
  assertIntegerKobo,
  generateTicketQrPayload,
  formatWatDateTime,
} from '@atm/shared';
import { AppError } from '../../lib/errors.ts';
import { env } from '../../lib/env.ts';
import { bookingRepository, type HeldBooking } from './bookings.ts';
import { getNotificationService } from '../notifications/index.ts';

export interface ConfirmPaymentParams {
  bookingRef: string;
  providerRef: string;
  amountKobo: number;
  method: 'card' | 'bank_transfer' | 'ussd' | 'mobile_money' | 'pay_at_terminal';
  gatewayResponse?: string;
  metadataJson?: Record<string, unknown>;
}

export interface ConfirmPaymentResult {
  booking: HeldBooking;
  tickets: DbTicket[];
  payment: DbPayment;
  alreadyProcessed: boolean;
  overbookedException?: boolean;
  creditIssuedKobo?: number;
}

export interface IPaymentRepository {
  recordPayment(payment: DbPayment): Promise<DbPayment>;
  getPaymentByProviderRef(providerRef: string): Promise<DbPayment | null>;
  getPaymentByBookingRef(bookingRef: string): Promise<DbPayment | null>;
  getTicketsByBookingRef(bookingRef: string): Promise<DbTicket[]>;
  getCreditLedgerEntries(customerIdOrPhone: string): Promise<DbCreditLedger[]>;
  creditCustomer(
    customerIdOrPhone: string,
    deltaKobo: number,
    reason: string,
    referenceBookingId?: string
  ): Promise<DbCreditLedger>;
  getWalletBalance(customerIdOrPhone: string): Promise<number>;
  updateTicketStatus(ticketId: string, status: DbTicket['status']): Promise<DbTicket | null>;
  recordCancellation(cancellation: DbCancellation): Promise<DbCancellation>;
  getCancellationsByBookingId(bookingId: string): Promise<DbCancellation[]>;
  confirmBookingAndIssueTickets(params: ConfirmPaymentParams): Promise<ConfirmPaymentResult>;
}

export class StaticPaymentRepository implements IPaymentRepository {
  private static payments = new Map<string, DbPayment>(); // key: providerRef
  private static paymentsByBookingRef = new Map<string, string>(); // bookingRef -> providerRef
  private static tickets = new Map<string, DbTicket[]>(); // key: bookingRef
  private static creditLedgers: DbCreditLedger[] = [];
  private static cancellations: DbCancellation[] = [];

  async recordPayment(payment: DbPayment): Promise<DbPayment> {
    assertIntegerKobo(payment.amountKobo);
    StaticPaymentRepository.payments.set(payment.providerRef, payment);
    if (payment.bookingId) {
      StaticPaymentRepository.paymentsByBookingRef.set(payment.bookingId, payment.providerRef);
    }
    return payment;
  }

  async getPaymentByProviderRef(providerRef: string): Promise<DbPayment | null> {
    return StaticPaymentRepository.payments.get(providerRef) || null;
  }

  async getPaymentByBookingRef(bookingRef: string): Promise<DbPayment | null> {
    const providerRef = StaticPaymentRepository.paymentsByBookingRef.get(bookingRef);
    if (providerRef) {
      return StaticPaymentRepository.payments.get(providerRef) || null;
    }
    // Search by booking id or ref
    for (const p of StaticPaymentRepository.payments.values()) {
      if (p.bookingId === bookingRef || p.providerRef.includes(bookingRef)) {
        return p;
      }
    }
    return null;
  }

  async getTicketsByBookingRef(bookingRef: string): Promise<DbTicket[]> {
    let tickets = StaticPaymentRepository.tickets.get(bookingRef);
    if (!tickets || tickets.length === 0) {
      // Seed sample tickets for preview / demo references like ATM-7K9W2P
      const booking = await bookingRepository.getBookingByRef(bookingRef);
      if (booking) {
        const secret = env.TICKET_SIGNING_SECRET || 'atm-dev-ticket-secret-key-32b';
        tickets = booking.passengers.map((p, idx) => {
          const ticketId = `tkt-${bookingRef}-${idx + 1}`;
          return {
            id: ticketId,
            bookingId: booking.id,
            tripId: booking.tripId,
            seatNo: p.seatNo,
            passengerName: p.fullName,
            passengerGender: null,
            status: 'paid',
            fareKobo: Math.round(booking.totalFareKobo / booking.passengers.length),
            checkInAt: null,
            checkedInByStaffId: null,
            qrPayload: generateTicketQrPayload({
              bookingRef: booking.ref,
              ticketId,
              seatNo: p.seatNo,
              secret,
            }),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });
        StaticPaymentRepository.tickets.set(bookingRef, tickets);
      }
    }
    return tickets || [];
  }

  async getCreditLedgerEntries(customerIdOrPhone: string): Promise<DbCreditLedger[]> {
    return StaticPaymentRepository.creditLedgers.filter(
      (entry) => entry.customerId === customerIdOrPhone
    );
  }

  async creditCustomer(
    customerIdOrPhone: string,
    deltaKobo: number,
    reason: string,
    referenceBookingId?: string
  ): Promise<DbCreditLedger> {
    if (typeof deltaKobo !== 'number' || !Number.isInteger(deltaKobo)) {
      throw new Error(`Delta must be an integer kobo, received: ${deltaKobo}`);
    }
    const prevEntries = await this.getCreditLedgerEntries(customerIdOrPhone);
    const currentBalance = prevEntries.reduce((sum, e) => sum + e.deltaKobo, 0);
    const newBalance = currentBalance + deltaKobo;
    assertIntegerKobo(newBalance);

    const entry: DbCreditLedger = {
      id: crypto.randomUUID ? crypto.randomUUID() : `cred-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      customerId: customerIdOrPhone,
      deltaKobo,
      balanceAfterKobo: newBalance,
      reason,
      referenceBookingId: referenceBookingId || null,
      createdAt: new Date().toISOString(),
    };
    StaticPaymentRepository.creditLedgers.push(entry);
    return entry;
  }

  async getWalletBalance(customerIdOrPhone: string): Promise<number> {
    const entries = await this.getCreditLedgerEntries(customerIdOrPhone);
    return entries.reduce((sum, e) => sum + e.deltaKobo, 0);
  }

  async updateTicketStatus(ticketId: string, status: DbTicket['status']): Promise<DbTicket | null> {
    for (const tickets of StaticPaymentRepository.tickets.values()) {
      const found = tickets.find((t) => t.id === ticketId);
      if (found) {
        found.status = status;
        found.updatedAt = new Date().toISOString();
        return found;
      }
    }
    return null;
  }

  async recordCancellation(cancellation: DbCancellation): Promise<DbCancellation> {
    StaticPaymentRepository.cancellations.push(cancellation);
    return cancellation;
  }

  async getCancellationsByBookingId(bookingId: string): Promise<DbCancellation[]> {
    return StaticPaymentRepository.cancellations.filter((c) => c.bookingId === bookingId);
  }

  /**
   * Confirms a held booking idempotently, checks invariants, issues tickets or handles late overbooking
   */
  async confirmBookingAndIssueTickets(params: ConfirmPaymentParams): Promise<ConfirmPaymentResult> {
    assertIntegerKobo(params.amountKobo);

    // 1. Idempotency Check (AC-5)
    const existingPayment = await this.getPaymentByProviderRef(params.providerRef);
    if (existingPayment) {
      const existingBooking = await bookingRepository.getBookingByRef(params.bookingRef);
      const existingTickets = await this.getTicketsByBookingRef(params.bookingRef);
      if (existingBooking) {
        return {
          booking: existingBooking,
          tickets: existingTickets,
          payment: existingPayment,
          alreadyProcessed: true,
        };
      }
    }

    // 2. Booking lookup
    const booking = await bookingRepository.getBookingByRef(params.bookingRef);
    if (!booking) {
      throw AppError.notFound(`Booking reference ${params.bookingRef} not found`);
    }

    // 3. Amount Mismatch Tampering Invariant Check (AC-1, AC-10)
    if (!isAmountMatch(params.amountKobo, booking.totalFareKobo)) {
      const failedPayment: DbPayment = {
        id: crypto.randomUUID ? crypto.randomUUID() : `pay-fail-${Date.now()}`,
        bookingId: booking.id,
        parcelId: null,
        provider: 'paystack',
        providerRef: params.providerRef,
        amountKobo: params.amountKobo,
        currency: 'NGN',
        method: params.method,
        status: 'failed',
        metadataJson: {
          error: 'AMOUNT_MISMATCH',
          expectedKobo: booking.totalFareKobo,
          receivedKobo: params.amountKobo,
          ...params.metadataJson,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await this.recordPayment(failedPayment);

      throw AppError.badRequest(
        `Amount mismatch: Paystack charged ${params.amountKobo} kobo, but booking total is ${booking.totalFareKobo} kobo.`
      );
    }

    // 4. Check Late Payment after Hold Expired (AC-7)
    const now = new Date();
    const isExpired = new Date(booking.holdExpiresAt) < now;
    if (isExpired) {
      // Check if seats were claimed by another active confirmed booking
      const occupiedSeats = await bookingRepository.getOccupiedSeats(booking.tripId);
      const seatCollision = booking.seats.some((seat) => occupiedSeats.includes(seat));

      if (seatCollision) {
        // Handle Overbooked Late Payment: record payment, credit customer ledger, alert operations
        const paymentRecord: DbPayment = {
          id: crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`,
          bookingId: booking.id,
          parcelId: null,
          provider: 'paystack',
          providerRef: params.providerRef,
          amountKobo: params.amountKobo,
          currency: 'NGN',
          method: params.method,
          status: 'successful',
          metadataJson: {
            flag: 'OVERBOOKED_LATE_PAYMENT',
            gatewayResponse: params.gatewayResponse || 'Approved',
            ...params.metadataJson,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await this.recordPayment(paymentRecord);

        // Mark booking as expired exception
        await bookingRepository.updateBookingStatus(booking.ref, 'expired');

        // Issue Customer Credit Ledger Entry
        const customerId = booking.contact.phone;
        const creditEntry: DbCreditLedger = {
          id: crypto.randomUUID ? crypto.randomUUID() : `crd-${Date.now()}`,
          customerId,
          deltaKobo: params.amountKobo,
          balanceAfterKobo: params.amountKobo,
          reason: 'OVERBOOKED_LATE_PAYMENT',
          referenceBookingId: booking.id,
          createdAt: new Date().toISOString(),
        };
        StaticPaymentRepository.creditLedgers.push(creditEntry);

        console.warn(
          `[Late Payment Exception]: Booking ${booking.ref} paid after hold expiration. Credit of ${params.amountKobo} kobo issued to ${customerId}.`
        );

        return {
          booking,
          tickets: [],
          payment: paymentRecord,
          alreadyProcessed: false,
          overbookedException: true,
          creditIssuedKobo: params.amountKobo,
        };
      }
    }

    // 5. Happy Path: Confirm Booking & Issue Cryptographically Signed Tickets (AC-6)
    await bookingRepository.updateBookingStatus(booking.ref, 'confirmed');

    const paymentRecord: DbPayment = {
      id: crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`,
      bookingId: booking.id,
      parcelId: null,
      provider: 'paystack',
      providerRef: params.providerRef,
      amountKobo: params.amountKobo,
      currency: 'NGN',
      method: params.method,
      status: 'successful',
      metadataJson: {
        gatewayResponse: params.gatewayResponse || 'Approved',
        ...params.metadataJson,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.recordPayment(paymentRecord);

    const secret = env.TICKET_SIGNING_SECRET || 'atm-dev-ticket-secret-key-32b';
    const perSeatFare = Math.round(booking.totalFareKobo / booking.passengers.length);

    const issuedTickets: DbTicket[] = booking.passengers.map((passenger, idx) => {
      const ticketId = crypto.randomUUID
        ? crypto.randomUUID()
        : `tkt-${booking.ref}-${idx + 1}-${Date.now().toString(36)}`;

      const qrPayload = generateTicketQrPayload({
        bookingRef: booking.ref,
        ticketId,
        seatNo: passenger.seatNo,
        secret,
      });

      return {
        id: ticketId,
        bookingId: booking.id,
        tripId: booking.tripId,
        seatNo: passenger.seatNo,
        passengerName: passenger.fullName,
        passengerGender: null,
        status: 'paid',
        fareKobo: perSeatFare,
        checkInAt: null,
        checkedInByStaffId: null,
        qrPayload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    StaticPaymentRepository.tickets.set(booking.ref, issuedTickets);

    // 6. Automated SMS Dispatch (AC-8)
    try {
      const notificationService = getNotificationService();
      const corridor = `${booking.trip.originTerminal.city} (${booking.trip.originTerminal.code}) → ${booking.trip.destinationTerminal.city} (${booking.trip.destinationTerminal.code})`;
      await notificationService.sendBookingConfirmation({
        recipientPhone: booking.contact.phone,
        bookingRef: booking.ref,
        corridor,
        departureTimeWAT: formatWatDateTime(booking.trip.departureTimeUtc).fullStr,
        seats: booking.seats,
        passengerCount: booking.passengers.length,
      });
    } catch (smsErr) {
      console.warn('[PaymentRepository] SMS dispatch failed gracefully:', smsErr);
    }

    return {
      booking,
      tickets: issuedTickets,
      payment: paymentRecord,
      alreadyProcessed: false,
    };
  }
}

export const paymentRepository: IPaymentRepository = new StaticPaymentRepository();
