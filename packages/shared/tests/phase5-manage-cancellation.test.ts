import test from 'node:test';
import assert from 'node:assert/strict';
import {
  manageBookingLookupSchema,
  cancellationQuoteInputSchema,
  cancellationExecutionInputSchema,
  calculateCancellationFee,
  DEFAULT_CANCELLATION_POLICY,
  formatCancellationConfirmationSms,
  normalisePhone,
  formatNaira,
} from '../src/index.ts';
import { ManageBookingRepository } from '@/server/repositories/manage-booking.ts';
import { StaticBookingRepository } from '@/server/repositories/bookings.ts';
import { StaticPaymentRepository } from '@/server/repositories/payments.ts';

test('Spec 0013 (AC-1): Manage Booking Lookup Schema Validation and Phone Normalization', () => {
  // Valid lookup
  const valid = manageBookingLookupSchema.safeParse({
    ref: 'ATM-7K9W2P',
    phone: '08031234567',
  });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.ref, 'ATM-7K9W2P');
    assert.equal(valid.data.phone, '+2348031234567');
  }

  // Invalid ref format
  const badRef = manageBookingLookupSchema.safeParse({
    ref: 'INVALID-REF',
    phone: '08031234567',
  });
  assert.equal(badRef.success, false);

  // Invalid Nigerian phone
  const badPhone = manageBookingLookupSchema.safeParse({
    ref: 'ATM-7K9W2P',
    phone: '12345',
  });
  assert.equal(badPhone.success, false);
});

test('Spec 0013 (AC-4): Tiered Cancellation Fee Calculation Pure Function', () => {
  const baseFareKobo = 3200000; // ₦32,000 per seat
  const now = new Date('2026-10-15T12:00:00Z');

  // Case 1: Departure in 30 hours (> 24 hours -> 10% fee)
  const departure30h = new Date('2026-10-16T18:00:00Z');
  const quote30h = calculateCancellationFee(DEFAULT_CANCELLATION_POLICY, departure30h, now, baseFareKobo);
  assert.equal(quote30h.eligibleForRefund, true);
  assert.equal(quote30h.feePercentageApplied, 10);
  assert.equal(quote30h.cancellationFeeKobo, 320000); // ₦3,200
  assert.equal(quote30h.refundAmountKobo, 2880000); // ₦28,800
  assert.equal(quote30h.cancellationFeeKobo + quote30h.refundAmountKobo, baseFareKobo);

  // Case 2: Departure in 12 hours (6 to 24 hours -> 25% fee)
  const departure12h = new Date('2026-10-16T00:00:00Z');
  const quote12h = calculateCancellationFee(DEFAULT_CANCELLATION_POLICY, departure12h, now, baseFareKobo);
  assert.equal(quote12h.eligibleForRefund, true);
  assert.equal(quote12h.feePercentageApplied, 25);
  assert.equal(quote12h.cancellationFeeKobo, 800000); // ₦8,000
  assert.equal(quote12h.refundAmountKobo, 2400000); // ₦24,000
  assert.equal(quote12h.cancellationFeeKobo + quote12h.refundAmountKobo, baseFareKobo);

  // Case 3: Departure in 4 hours (2 to 6 hours -> 50% fee)
  const departure4h = new Date('2026-10-15T16:00:00Z');
  const quote4h = calculateCancellationFee(DEFAULT_CANCELLATION_POLICY, departure4h, now, baseFareKobo);
  assert.equal(quote4h.eligibleForRefund, true);
  assert.equal(quote4h.feePercentageApplied, 50);
  assert.equal(quote4h.cancellationFeeKobo, 1600000); // ₦16,000
  assert.equal(quote4h.refundAmountKobo, 1600000); // ₦16,000
  assert.equal(quote4h.cancellationFeeKobo + quote4h.refundAmountKobo, baseFareKobo);

  // Case 4: Departure in 1 hour (< 2 hours cutoff -> 100% non refundable)
  const departure1h = new Date('2026-10-15T13:00:00Z');
  const quote1h = calculateCancellationFee(DEFAULT_CANCELLATION_POLICY, departure1h, now, baseFareKobo);
  assert.equal(quote1h.eligibleForRefund, false);
  assert.equal(quote1h.feePercentageApplied, 100);
  assert.equal(quote1h.cancellationFeeKobo, baseFareKobo);
  assert.equal(quote1h.refundAmountKobo, 0);
});

test('Spec 0013 (AC-2): Sliding Window Rate Limiting Lockout', async () => {
  const repo = new ManageBookingRepository();
  const testIp = '192.168.1.100';
  const testPhone = '08039998877';

  // Initially not rate limited
  const initialStatus = repo.getRateLimitStatus(testIp, testPhone);
  assert.equal(initialStatus.locked, false);
  assert.equal(initialStatus.attempts, 0);

  // Perform 4 failed lookups
  for (let i = 0; i < 4; i++) {
    try {
      await repo.lookupBooking(
        { ref: 'ATM-999999', phone: normalisePhone(testPhone) },
        testIp
      );
    } catch {
      // expected not found
    }
  }

  const statusAfter4 = repo.getRateLimitStatus(testIp, testPhone);
  assert.equal(statusAfter4.locked, false);
  assert.equal(statusAfter4.attempts, 4);

  // 5th failed lookup triggers lockout
  try {
    await repo.lookupBooking(
      { ref: 'ATM-999999', phone: normalisePhone(testPhone) },
      testIp
    );
  } catch {
    // expected
  }

  const lockedStatus = repo.getRateLimitStatus(testIp, testPhone);
  assert.equal(lockedStatus.locked, true);
  assert.ok(lockedStatus.remainingMinutes > 50);

  // Subsequent lookup throws 429 rate limited
  await assert.rejects(
    async () => {
      await repo.lookupBooking(
        { ref: 'ATM-7K9W2P', phone: normalisePhone(testPhone) },
        testIp
      );
    },
    (err: any) => err.statusCode === 429
  );
});

test('Spec 0013 (AC-3, AC-5, AC-6, AC-7): Booking Retrieval, Seat Inventory Replenishment & Hybrid Refund', async () => {
  const repo = new ManageBookingRepository();
  const clientIp = '10.0.0.1';

  // Seed reference ATM-7K9W2P is available
  const details = await repo.lookupBooking(
    { ref: 'ATM-7K9W2P', phone: '+2348031234567' },
    clientIp
  );

  assert.equal(details.booking.ref, 'ATM-7K9W2P');
  assert.equal(details.tickets.length, 2);
  assert.deepEqual(details.booking.seats, [1, 2]);

  // Partial cancellation: cancel only ticket 1 (Seat 1)
  const ticketToCancel = details.tickets[0];
  assert.ok(ticketToCancel);

  const quote = await repo.quoteCancellation({
    ref: 'ATM-7K9W2P',
    phone: '+2348031234567',
    ticketIds: [ticketToCancel.id],
  });

  assert.equal(quote.seatsToCancel.length, 1);
  assert.equal(quote.seatsToCancel[0], 1);
  assert.equal(quote.totalFareCancelledKobo, ticketToCancel.fareKobo);

  // Execute cancellation with ATM store credit
  const execution = await repo.executeCancellation(
    {
      ref: 'ATM-7K9W2P',
      phone: '+2348031234567',
      ticketIds: [ticketToCancel.id],
      reason: 'Schedule adjustment',
      disbursementMethod: 'atm_credit',
    },
    clientIp
  );

  assert.equal(execution.status, 'completed');
  assert.equal(execution.cancelledSeatsCount, 1);
  assert.equal(execution.disbursementMethod, 'atm_credit');
  assert.ok(execution.walletBalanceAfterKobo !== null && execution.walletBalanceAfterKobo >= 0);

  // Verify seat 1 was freed and booking retains seat 2
  const updatedBooking = await new StaticBookingRepository().getBookingByRef('ATM-7K9W2P');
  assert.ok(updatedBooking);
  assert.deepEqual(updatedBooking.seats, [2]);
  assert.equal(updatedBooking.status, 'confirmed');

  // Verify ticket status updated
  const updatedTickets = await new StaticPaymentRepository().getTicketsByBookingRef('ATM-7K9W2P');
  const cancelledTicket = updatedTickets.find((t) => t.id === ticketToCancel.id);
  assert.equal(cancelledTicket?.status, 'cancelled');
});

test('Spec 0013 (AC-8): Automated SMS Dispatch Formatting', () => {
  const sms = formatCancellationConfirmationSms({
    bookingRef: 'ATM-7K9W2P',
    cancelledSeats: [1],
    feeKobo: 320000,
    refundKobo: 2880000,
    disbursementMethod: 'atm_credit',
  });

  assert.ok(sms.includes('Ref ATM-7K9W2P'));
  assert.ok(sms.includes('Seat(s) 1'));
  assert.ok(sms.includes('₦28,800'));
  assert.ok(sms.includes('ATM wallet credit'));
  assert.ok(sms.includes('₦3,200'));
  // Ensure no forbidden punctuation dashes
  assert.ok(!sms.includes('—'));
  assert.ok(!sms.includes('–'));
});
