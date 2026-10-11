import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBookingTotal,
  getSelectableSeats,
  validateSeatSelection,
  holdSecondsRemaining,
  generateHoldToken,
  hashHoldToken,
  verifyHoldToken,
  SIENNA_5_SEAT_LAYOUT,
  bookingHoldInputSchema,
} from '../src/index.ts';

test('calculateBookingTotal computes correct kobo values', () => {
  assert.equal(calculateBookingTotal(3500000, 1), 3500000);
  assert.equal(calculateBookingTotal(3500000, 3), 10500000);
  assert.equal(calculateBookingTotal(2800000, 5), 14000000);
  assert.equal(calculateBookingTotal(0, 2), 0);
  assert.throws(() => calculateBookingTotal(-100, 2), /non-negative/);
});

test('getSelectableSeats returns correct 5 seats for Toyota Sienna layout', () => {
  const seats = getSelectableSeats(SIENNA_5_SEAT_LAYOUT);
  assert.deepEqual(seats, [1, 2, 3, 4, 5]);
});

test('validateSeatSelection enforces capacity and bounds', () => {
  // 1. Valid selection
  const validRes = validateSeatSelection(SIENNA_5_SEAT_LAYOUT, [1, 2], 2);
  assert.equal(validRes.valid, true);

  // 2. Count mismatch (selected 3 for 2 passengers)
  const mismatchRes = validateSeatSelection(SIENNA_5_SEAT_LAYOUT, [1, 2, 3], 2);
  assert.equal(mismatchRes.valid, false);
  assert.match(mismatchRes.error || '', /exactly 2 seats/);

  // 3. Duplicate seats
  const dupRes = validateSeatSelection(SIENNA_5_SEAT_LAYOUT, [2, 2], 2);
  assert.equal(dupRes.valid, false);
  assert.match(dupRes.error || '', /Duplicate seats/);

  // 4. Out of range / driver seat (seat 6 or 0)
  const outOfRange = validateSeatSelection(SIENNA_5_SEAT_LAYOUT, [6], 1);
  assert.equal(outOfRange.valid, false);
  assert.match(outOfRange.error || '', /not a valid passenger seat/);
});

test('holdSecondsRemaining correctly calculates countdown and clamps to zero', () => {
  const now = new Date('2026-10-08T12:00:00Z');
  const future = new Date('2026-10-08T12:10:00Z'); // +10 minutes = 600s
  const past = new Date('2026-10-08T11:59:00Z');   // -1 minute

  assert.equal(holdSecondsRemaining(future, now), 600);
  assert.equal(holdSecondsRemaining(past, now), 0);
  assert.equal(holdSecondsRemaining(now, now), 0);
});

test('Hold token generation and SHA-256 verification', () => {
  const token = generateHoldToken();
  assert.equal(typeof token, 'string');
  assert.equal(token.length, 64, '32-byte hex string must have length 64');

  const hash = hashHoldToken(token);
  assert.equal(typeof hash, 'string');
  assert.equal(hash.length, 64, 'SHA-256 hex must have length 64');

  // Verify constant-time compare
  assert.equal(verifyHoldToken(token, hash), true);
  assert.equal(verifyHoldToken('invalid_token', hash), false);
  assert.equal(verifyHoldToken(token, '0'.repeat(64)), false);
});

test('bookingHoldInputSchema validates correct booking payloads', () => {
  const validPayload = {
    tripId: 'trip-enugu-abuja-01',
    seats: [1, 2],
    passengers: [
      { seatNo: 1, fullName: 'Chinedu Okafor' },
      { seatNo: 2, fullName: 'Amaka Okafor' },
    ],
    contact: {
      fullName: 'Chinedu Okafor',
      phone: '09070000625',
      email: 'chinedu@example.com',
      nextOfKinPhone: '08023456789',
    },
    consent: true,
    idempotencyKey: 'idem-12345678-abcd',
  };

  const parsed = bookingHoldInputSchema.safeParse(validPayload);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.contact.phone, '+2349070000625');
    assert.equal(parsed.data.contact.nextOfKinPhone, '+2348023456789');
  }

  // Reject without consent
  const noConsent = bookingHoldInputSchema.safeParse({
    ...validPayload,
    consent: false,
  });
  assert.equal(noConsent.success, false);

  // Reject seat / passenger count mismatch
  const mismatch = bookingHoldInputSchema.safeParse({
    ...validPayload,
    passengers: [{ seatNo: 1, fullName: 'Chinedu Okafor' }],
  });
  assert.equal(mismatch.success, false);
});
