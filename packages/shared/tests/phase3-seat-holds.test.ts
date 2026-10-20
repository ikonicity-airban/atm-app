import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBookingTotal,
  holdSecondsRemaining,
  generateHoldToken,
  hashHoldToken,
  verifyHoldToken,
  SEAT_HOLD_DURATION_MINUTES,
  DEFAULT_BOOKING_SETTINGS,
  bookingHoldInputSchema,
  SIENNA_5_SEAT_LAYOUT,
  getSelectableSeats,
  validateSeatSelection,
} from '../src/index.ts';
import { StaticBookingRepository } from '../../../apps/web/src/server/repositories/bookings.ts';

// ---------------------------------------------------------------------------
// SPEC 0009: BOOKING FLOW & SEAT HOLD LOCKS CONTRACT TESTS
// ---------------------------------------------------------------------------

test('Spec 0009 (AC-4): 15-minute hold duration constant configuration', () => {
  assert.equal(SEAT_HOLD_DURATION_MINUTES, 15, 'Seat hold duration must be 15 minutes');
  assert.equal(DEFAULT_BOOKING_SETTINGS.holdMinutes, 15, 'Default booking settings holdMinutes must be 15');

  // 15 minutes = 900 seconds
  const now = new Date('2026-10-15T12:00:00Z');
  const future15 = new Date('2026-10-15T12:15:00Z');
  assert.equal(holdSecondsRemaining(future15, now), 900, '15-minute countdown must equal 900 seconds');
});

test('Spec 0009 (AC-1 & AC-2): Sienna 5-seat passenger layout bounds and validation', () => {
  const selectable = getSelectableSeats(SIENNA_5_SEAT_LAYOUT);
  assert.deepEqual(selectable, [1, 2, 3, 4, 5], 'Sienna cabin has seats 1 through 5');

  // Valid 2-seat selection
  const valid = validateSeatSelection(SIENNA_5_SEAT_LAYOUT, [1, 5], 2);
  assert.equal(valid.valid, true);

  // Mismatch: 3 seats for 1 passenger
  const mismatch = validateSeatSelection(SIENNA_5_SEAT_LAYOUT, [1, 2, 3], 1);
  assert.equal(mismatch.valid, false);
  assert.match(mismatch.error || '', /exactly 1 seat/);

  // Out of range seat 6
  const invalidSeat = validateSeatSelection(SIENNA_5_SEAT_LAYOUT, [6], 1);
  assert.equal(invalidSeat.valid, false);
});

test('Spec 0009 (AC-3 & AC-10): Passenger manifest validation with emergency next of kin and integer kobo pricing', () => {
  const payload = {
    tripId: 'trip-ogui-utako-01',
    seats: [1, 2],
    passengers: [
      { seatNo: 1, fullName: 'Obinna Okeke' },
      { seatNo: 2, fullName: 'Adaobi Okeke' },
    ],
    contact: {
      fullName: 'Obinna Okeke',
      phone: '08031234567',
      email: 'obinna@example.com',
      nextOfKinPhone: '08099887766',
    },
    consent: true,
    idempotencyKey: 'idem-obinna-uuid-001',
  };

  const validated = bookingHoldInputSchema.parse(payload);
  assert.equal(validated.contact.phone, '+2348031234567', 'Phone must normalize to E.164');
  assert.equal(validated.contact.nextOfKinPhone, '+2348099887766', 'Next of kin phone must normalize to E.164');

  // Uniform pricing calculation: 35,000 NGN per seat = 3,500,000 kobo
  const fareKobo = 3500000;
  const totalKobo = calculateBookingTotal(fareKobo, validated.seats.length);
  assert.equal(totalKobo, 7000000, 'Total kobo must strictly equal baseFareKobo * passengerCount');
});

test('Spec 0009 (AC-5 & AC-6): Hold token cryptography and atomic collision rejection', async () => {
  const repo = new StaticBookingRepository();
  const futureDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];
  const tripId = `trip-sch-enugu-abuja-morning-${futureDate}`;

  // User A holds Seat 1
  const holdA = await repo.createHold({
    tripId,
    seats: [1],
    passengers: [{ seatNo: 1, fullName: 'Traveler A' }],
    contact: {
      fullName: 'Traveler A',
      phone: '09070000625',
    },
    consent: true,
    idempotencyKey: 'idem-traveler-a',
  });

  assert.ok(holdA.ref.startsWith('ATM-'));
  assert.equal(typeof holdA.holdToken, 'string');
  assert.equal(holdA.holdToken.length, 64);

  // Expiration must be approximately 15 minutes (900 seconds) in the future
  const remainingSeconds = holdSecondsRemaining(holdA.expiresAt);
  assert.ok(remainingSeconds >= 895 && remainingSeconds <= 900, 'ExpiresAt must be 15 minutes in future');

  // User B attempts to reserve Seat 1 -> must fail with SEAT_UNAVAILABLE
  await assert.rejects(
    async () => {
      await repo.createHold({
        tripId,
        seats: [1],
        passengers: [{ seatNo: 1, fullName: 'Traveler B' }],
        contact: {
          fullName: 'Traveler B',
          phone: '09070000210',
        },
        consent: true,
        idempotencyKey: 'idem-traveler-b',
      });
    },
    (err: any) => {
      assert.equal(err.code, 'SEAT_UNAVAILABLE');
      return true;
    }
  );

  // User B can reserve Seat 4 without collision
  const holdB = await repo.createHold({
    tripId,
    seats: [4],
    passengers: [{ seatNo: 4, fullName: 'Traveler B' }],
    contact: {
      fullName: 'Traveler B',
      phone: '09070000210',
    },
    consent: true,
    idempotencyKey: 'idem-traveler-b-seat4',
  });
  assert.equal(holdB.seats[0], 4);
});

test('Spec 0009 (AC-8): Manual hold release returns seats to inventory immediately', async () => {
  const repo = new StaticBookingRepository();
  const futureDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];
  const tripId = `trip-sch-abuja-enugu-morning-${futureDate}`;

  const hold = await repo.createHold({
    tripId,
    seats: [5],
    passengers: [{ seatNo: 5, fullName: 'Traveler Release' }],
    contact: {
      fullName: 'Traveler Release',
      phone: '09070000625',
    },
    consent: true,
    idempotencyKey: 'idem-traveler-release',
  });

  const occupiedBefore = await repo.getOccupiedSeats(tripId);
  assert.ok(occupiedBefore.includes(5), 'Seat 5 must be occupied while held');

  // Release with valid token
  const released = await repo.releaseHold(hold.ref, hold.holdToken);
  assert.equal(released, true);

  const occupiedAfter = await repo.getOccupiedSeats(tripId);
  assert.equal(occupiedAfter.includes(5), false, 'Seat 5 must be available immediately after release');

  // Attempting release with invalid token must fail
  await assert.rejects(
    async () => {
      await repo.releaseHold(hold.ref, 'bad_token_hash_0000');
    },
    (err: any) => {
      assert.equal(err.code, 'UNAUTHORIZED');
      return true;
    }
  );
});
