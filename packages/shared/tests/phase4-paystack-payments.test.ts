import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  assertIntegerKobo,
  isAmountMatch,
  generateTicketQrPayload,
  verifyTicketQrPayload,
  formatTicketConfirmationSms,
  initializePaymentSchema,
  paystackWebhookEventSchema,
  normalisePhone,
  formatNaira,
} from '../src/index.ts';
import { PaystackPaymentProvider } from '@/server/payments/index.ts';
import {
  StaticPaymentRepository,
  type IPaymentRepository,
} from '@/server/repositories/payments.ts';
import { StaticBookingRepository } from '@/server/repositories/bookings.ts';

test('Spec 0010 (AC-1 & AC-10): Integer Kobo Assertions and Amount Match Rules', () => {
  // Integer kobo assertions
  assert.equal(assertIntegerKobo(3200000), 3200000);
  assert.equal(assertIntegerKobo(0), 0);

  assert.throws(() => assertIntegerKobo(32000.5), /integer kobo/);
  assert.throws(() => assertIntegerKobo(-1000), /integer kobo/);
  assert.throws(() => assertIntegerKobo('3200000'), /integer kobo/);

  // Exact amount matching
  assert.equal(isAmountMatch(3200000, 3200000), true);
  assert.equal(isAmountMatch(3200000, 3200001), false);
  assert.equal(isAmountMatch(3200000, 1600000), false);

  // Format integer kobo at UI edge
  assert.equal(formatNaira(3200000), '₦32,000');
});

test('Spec 0010 (AC-1): Payment Initialization Zod Schema Validation', () => {
  const valid = initializePaymentSchema.safeParse({
    bookingRef: 'ATM-7K9W2P',
    holdToken: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    email: 'traveler@example.ng',
    callbackUrl: 'https://atm.ng/book/success/ATM-7K9W2P',
  });
  assert.equal(valid.success, true);

  // Invalid booking ref pattern
  const badRef = initializePaymentSchema.safeParse({
    bookingRef: 'invalid-ref-123',
    holdToken: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  });
  assert.equal(badRef.success, false);

  // Short hold token
  const shortToken = initializePaymentSchema.safeParse({
    bookingRef: 'ATM-7K9W2P',
    holdToken: 'too-short',
  });
  assert.equal(shortToken.success, false);
});

test('Spec 0010 (AC-4 & AC-10): HMAC SHA-512 Webhook Signature Verification', () => {
  const secretKey = 'sk_test_atm_paystack_secret_key_512';
  const provider = new PaystackPaymentProvider(secretKey);

  const rawBody = JSON.stringify({
    event: 'charge.success',
    data: {
      id: 9988221,
      reference: 'ATM-TEST-PAY-01',
      amount: 3200000,
      currency: 'NGN',
      status: 'success',
      channel: 'card',
      gateway_response: 'Approved',
      paid_at: '2026-10-15T08:00:00Z',
    },
  });

  // Generate authentic HMAC SHA-512 signature
  const validSignature = crypto
    .createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex');

  // Verify authentic signature
  assert.equal(provider.verifyWebhookSignature(validSignature, rawBody), true);

  // Reject tampered signature
  const forgedSignature = validSignature.slice(0, -4) + '0000';
  assert.equal(provider.verifyWebhookSignature(forgedSignature, rawBody), false);

  // Reject tampered body with original signature
  const tamperedBody = rawBody.replace('3200000', '1600000');
  assert.equal(provider.verifyWebhookSignature(validSignature, tamperedBody), false);

  // Reject empty / missing signature
  assert.equal(provider.verifyWebhookSignature('', rawBody), false);
});

test('Spec 0010 (AC-4): Paystack Webhook Event Zod Validation', () => {
  const payload = {
    event: 'charge.success',
    data: {
      id: 123456,
      domain: 'test',
      status: 'success',
      reference: 'ATM-7K9W2P',
      amount: 3200000,
      gateway_response: 'Approved',
      paid_at: '2026-10-15T08:30:00Z',
      channel: 'card',
      currency: 'NGN',
      metadata: { bookingRef: 'ATM-7K9W2P' },
      customer: { email: 'passenger@example.ng' },
    },
  };

  const parsed = paystackWebhookEventSchema.safeParse(payload);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.data.amount, 3200000);
    assert.equal(parsed.data.data.reference, 'ATM-7K9W2P');
  }
});

test('Spec 0010 (AC-6): HMAC SHA-256 Signed Ticket QR Code Payloads', () => {
  const secret = 'atm-test-ticket-signing-secret-32b';
  const bookingRef = 'ATM-7K9W2P';
  const ticketId = 'tkt-uuid-001';
  const seatNo = 1;

  const qrPayload = generateTicketQrPayload({
    bookingRef,
    ticketId,
    seatNo,
    secret,
  });

  assert.match(qrPayload, /^ATM-ATM-7K9W2P-S1-[A-Z0-9]+-[A-F0-9]{16}$/i);

  // Genuine verification passes
  const isValid = verifyTicketQrPayload({
    qrPayload,
    bookingRef,
    ticketId,
    seatNo,
    secret,
  });
  assert.equal(isValid, true);

  // Tampered seat number fails
  const tamperedSeat = verifyTicketQrPayload({
    qrPayload,
    bookingRef,
    ticketId,
    seatNo: 2, // altered seat
    secret,
  });
  assert.equal(tamperedSeat, false);

  // Tampered secret fails
  const wrongSecret = verifyTicketQrPayload({
    qrPayload,
    bookingRef,
    ticketId,
    seatNo,
    secret: 'wrong-secret-key',
  });
  assert.equal(wrongSecret, false);
});

test('Spec 0010 (AC-5 & AC-6): Webhook Idempotency and Ticket Issuance', async () => {
  const paymentRepo: IPaymentRepository = new StaticPaymentRepository();
  const bookingRef = 'ATM-7K9W2P';
  const providerRef = `paystack-tx-${Date.now()}`;
  const amountKobo = 6400000; // 2 seats * ₦32,000

  // 1. First delivery confirms booking and issues tickets
  const firstConfirmation = await paymentRepo.confirmBookingAndIssueTickets({
    bookingRef,
    providerRef,
    amountKobo,
    method: 'card',
    gatewayResponse: 'Approved',
  });

  assert.equal(firstConfirmation.alreadyProcessed, false);
  assert.equal(firstConfirmation.booking.status, 'confirmed');
  assert.equal(firstConfirmation.tickets.length, 2);
  assert.equal(firstConfirmation.payment.status, 'successful');
  assert.equal(firstConfirmation.payment.amountKobo, amountKobo);

  // 2. Duplicate webhook delivery returns existing confirmation idempotently
  const duplicateConfirmation = await paymentRepo.confirmBookingAndIssueTickets({
    bookingRef,
    providerRef,
    amountKobo,
    method: 'card',
    gatewayResponse: 'Approved',
  });

  assert.equal(duplicateConfirmation.alreadyProcessed, true);
  assert.equal(duplicateConfirmation.tickets.length, 2);
  assert.equal(duplicateConfirmation.payment.id, firstConfirmation.payment.id);
});

test('Spec 0010 (AC-7): Overbooked Late Payment Credit Ledger Handling', async () => {
  const paymentRepo = new StaticPaymentRepository();
  const bookingRepo = new StaticBookingRepository();

  const lateRef = 'ATM-LATE-01';
  // Seed a booking that expired
  const booking = await bookingRepo.getBookingByRef(lateRef);
  assert.ok(booking);
  booking.holdExpiresAt = new Date(Date.now() - 60000).toISOString(); // 1 minute in the past
  booking.status = 'expired';

  // Simulate seat 1 was taken by another traveler
  bookingRepo.getOccupiedSeats = async () => [1];

  const result = await paymentRepo.confirmBookingAndIssueTickets({
    bookingRef: lateRef,
    providerRef: `paystack-late-${Date.now()}`,
    amountKobo: booking.totalFareKobo,
    method: 'bank_transfer',
    gatewayResponse: 'Approved',
  });

  assert.equal(result.overbookedException, true);
  assert.equal(result.tickets.length, 0); // No tickets issued
  assert.equal(result.creditIssuedKobo, booking.totalFareKobo);
  assert.equal(result.payment.status, 'successful');

  // Verify credit ledger record was registered
  const ledgers = await paymentRepo.getCreditLedgerEntries(booking.contact.phone);
  assert.ok(ledgers.length >= 1);
  const lateEntry = ledgers.find((l) => l.reason === 'OVERBOOKED_LATE_PAYMENT');
  assert.ok(lateEntry);
  assert.equal(lateEntry.deltaKobo, booking.totalFareKobo);
});

test('Spec 0010 (AC-8): Automated SMS Format and E.164 Phone Normalization', () => {
  const formatted = formatTicketConfirmationSms({
    bookingRef: 'ATM-7K9W2P',
    corridor: 'Enugu (ENU) → Abuja (ABJ)',
    departureTimeWAT: '2026-10-16 06:30 WAT',
    seats: [1, 2],
    passengerCount: 2,
  });

  assert.match(formatted, /ATM-7K9W2P/);
  assert.match(formatted, /Enugu \(ENU\) → Abuja \(ABJ\)/);
  assert.match(formatted, /Seat\(s\): 1, 2/);
  assert.match(formatted, /atm\.ng\/book\/success\/ATM-7K9W2P/);

  // Phone normalization
  assert.equal(normalisePhone('08031234567'), '+2348031234567');
  assert.equal(normalisePhone('+234 803 123 4567'), '+2348031234567');
});
