/**
 * Concurrency Test for Seat Holds
 * Verifies that 20 parallel createHold calls for the same seat results in
 * EXACTLY 1 successful reservation and 19 SEAT_UNAVAILABLE rejections.
 * Also verifies that an expired hold immediately permits a new booking.
 */

import assert from 'node:assert/strict';
import { StaticBookingRepository } from '../apps/web/src/server/repositories/bookings.ts';
import { AppError } from '../apps/web/src/lib/errors.ts';

async function runConcurrencyTest() {
  console.log('--- Starting 20-Parallel-Request Concurrency Test ---');

  const repo = new StaticBookingRepository();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 10);
  const dateStr = futureDate.toISOString().split('T')[0];
  const tripId = `trip-sch-ogui-utako-morning-${dateStr}`;
  const targetSeat = 4;
  const numRequests = 20;

  console.log(`Firing ${numRequests} concurrent hold requests for seat ${targetSeat} on ${tripId}...`);

  const promises = Array.from({ length: numRequests }, (_, i) => {
    return repo.createHold({
      tripId,
      seats: [targetSeat],
      passengers: [{ seatNo: targetSeat, fullName: `Rival Booker ${i + 1}` }],
      contact: {
        fullName: `Rival Booker ${i + 1}`,
        phone: `0907000${(1000 + i).toString().slice(-4)}`,
      },
      consent: true,
      idempotencyKey: `idem-rival-${i + 1}-${Date.now()}`,
    });
  });

  const results = await Promise.allSettled(promises);

  const successes = results.filter((r) => r.status === 'fulfilled');
  const failures = results.filter((r) => r.status === 'rejected');

  console.log(`Results: ${successes.length} succeeded, ${failures.length} rejected.`);

  assert.equal(successes.length, 1, `Expected exactly 1 successful hold, but got ${successes.length}`);
  assert.equal(failures.length, numRequests - 1, `Expected ${numRequests - 1} failures, but got ${failures.length}`);

  // Verify all failures have error code SEAT_UNAVAILABLE
  for (const f of failures) {
    if (f.status === 'rejected') {
      const err = f.reason;
      assert.ok(err instanceof AppError, 'Failure should be an AppError instance');
      assert.equal(err.code, 'SEAT_UNAVAILABLE', `Expected SEAT_UNAVAILABLE but got ${err.code}`);
    }
  }
  console.log('✓ Concurrency isolation verified: Exactly 1 hold succeeded and 19 failed with SEAT_UNAVAILABLE.');

  // Test 2: Expired hold does not block new reservations
  console.log('\n--- Testing Expired Hold Release ---');
  const hold = await repo.createHold({
    tripId,
    seats: [1],
    passengers: [{ seatNo: 1, fullName: 'Original Booker' }],
    contact: { fullName: 'Original Booker', phone: '09070000625' },
    consent: true,
    idempotencyKey: `idem-expired-${Date.now()}`,
  });

  // Manually backdate hold expiration in memory
  const heldObj = await repo.getHeldBooking(hold.ref, hold.holdToken);
  heldObj.holdExpiresAt = new Date(Date.now() - 60000).toISOString();

  // Call expireOldHolds
  await repo.expireOldHolds(tripId);

  // A new user should now successfully claim seat 1
  const secondUserHold = await repo.createHold({
    tripId,
    seats: [1],
    passengers: [{ seatNo: 1, fullName: 'New Booker' }],
    contact: { fullName: 'New Booker', phone: '08023456789' },
    consent: true,
    idempotencyKey: `idem-new-${Date.now()}`,
  });

  assert.ok(secondUserHold.ref.startsWith('ATM-'));
  console.log('✓ Expired hold released: New user successfully acquired seat 1 without blocking.');

  console.log('\nAll concurrency and isolation tests passed successfully.');
}

runConcurrencyTest().catch((err) => {
  console.error('Concurrency test failed:', err);
  process.exit(1);
});
