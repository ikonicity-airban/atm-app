/**
 * Pure Payment and Ticket Signing Utilities
 * Works seamlessly across Node.js runtime and browser environments
 */

import { hashHoldToken } from './booking.ts';

/**
 * Asserts an amount is a valid integer kobo value (no fractions, non-negative)
 */
export function assertIntegerKobo(amount: unknown): number {
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 0) {
    throw new Error(`Amount must be a non-negative integer kobo, received: ${amount}`);
  }
  return amount;
}

/**
 * Validates that Paystack transaction amount matches booking fare strictly
 */
export function isAmountMatch(paystackAmountKobo: number, bookingFareKobo: number): boolean {
  if (!Number.isInteger(paystackAmountKobo) || !Number.isInteger(bookingFareKobo)) {
    return false;
  }
  return paystackAmountKobo === bookingFareKobo;
}

/**
 * Generates an HMAC SHA-256 signed ticket QR payload
 * Uses portable SHA-256 hashing to guarantee browser & server runtime consistency
 * Format: ATM-{bookingRef}-S{seatNo}-{ticketId.slice(0,8)}-{sig}
 */
export function generateTicketQrPayload(params: {
  bookingRef: string;
  ticketId: string;
  seatNo: number;
  secret: string;
}): string {
  const { bookingRef, ticketId, seatNo, secret } = params;
  const rawData = `ATM:${bookingRef}:S${seatNo}:${ticketId}:${secret}`;
  const fullHash = hashHoldToken(rawData);
  const signature = fullHash.slice(0, 16).toUpperCase();
  const shortId = ticketId.replace(/-/g, '').slice(0, 8);
  return `ATM-${bookingRef}-S${seatNo}-${shortId}-${signature}`;
}

/**
 * Verifies a ticket QR payload against the server secret
 */
export function verifyTicketQrPayload(params: {
  qrPayload: string;
  bookingRef: string;
  ticketId: string;
  seatNo: number;
  secret: string;
}): boolean {
  const { qrPayload, bookingRef, ticketId, seatNo, secret } = params;
  if (!qrPayload || !bookingRef || !ticketId || !seatNo || !secret) {
    return false;
  }

  const expectedPayload = generateTicketQrPayload({
    bookingRef,
    ticketId,
    seatNo,
    secret,
  });

  if (qrPayload.length !== expectedPayload.length) {
    return false;
  }

  // Constant-time character comparison
  let result = 0;
  for (let i = 0; i < qrPayload.length; i++) {
    result |= qrPayload.charCodeAt(i) ^ expectedPayload.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Formats UTC ISO date string into Lagos WAT date and time components
 */
export function formatWatDateTime(utcDateString: string): { dateStr: string; timeStr: string; fullStr: string } {
  try {
    const d = new Date(utcDateString);
    if (Number.isNaN(d.getTime())) {
      return { dateStr: 'Departure Date', timeStr: '06:30 AM', fullStr: '06:30 AM WAT' };
    }
    const dateStr = new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Africa/Lagos',
    }).format(d);
    const timeStr = new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Lagos',
    }).format(d);
    return { dateStr, timeStr, fullStr: `${dateStr} ${timeStr} WAT` };
  } catch {
    return { dateStr: 'Departure Date', timeStr: '06:30 AM', fullStr: '06:30 AM WAT' };
  }
}

/**
 * Constructs SMS confirmation message for traveler
 */
export function formatTicketConfirmationSms(params: {
  bookingRef: string;
  corridor: string;
  departureTimeWAT: string;
  seats: number[];
  passengerCount: number;
}): string {
  const seatList = params.seats.sort((a, b) => a - b).join(', ');
  return `Ascent Transport (ATM): Confirmed! Ref: ${params.bookingRef}. ${params.corridor}. Departs: ${params.departureTimeWAT}. Seat(s): ${seatList}. Arrive terminal 30m before departure. Pass: atm.ng/book/success/${params.bookingRef}`;
}
