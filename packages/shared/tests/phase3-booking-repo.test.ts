import test from 'node:test';
import assert from 'node:assert/strict';
import {
  StaticBookingRepository,
} from '../../../apps/web/src/server/repositories/bookings.ts';
import { AppError } from '../../../apps/web/src/lib/errors.ts';

test('BookingRepository contract: createHold, seat lock, idempotency, and release', async () => {
  const repo = new StaticBookingRepository();
  const tripId = 'trip-sch-ogui-utako-morning-2026-10-20';

  // 1. Initial seats are free
  const initialOccupied = await repo.getOccupiedSeats(tripId);
  assert.equal(initialOccupied.includes(2), false);

  // 2. Create hold for seat 2
  const hold1 = await repo.createHold({
    tripId,
    seats: [2],
    passengers: [{ seatNo: 2, fullName: 'Ngozi Eze' }],
    contact: {
      fullName: 'Ngozi Eze',
      phone: '09070000625',
      email: 'ngozi@example.com',
    },
    consent: true,
    idempotencyKey: 'idem-test-ngozi-01',
  });

  assert.ok(hold1.ref.startsWith('ATM-'));
  assert.equal(hold1.seats[0], 2);
  assert.equal(typeof hold1.holdToken, 'string');
  assert.ok(hold1.totalKobo > 0);

  // 3. Seat 2 is now occupied
  const occupiedAfter = await repo.getOccupiedSeats(tripId);
  assert.ok(occupiedAfter.includes(2), 'Seat 2 must be recorded as occupied');

  // 4. Duplicate hold attempt on seat 2 must fail with SEAT_UNAVAILABLE
  let errorCaught: AppError | null = null;
  try {
    await repo.createHold({
      tripId,
      seats: [2],
      passengers: [{ seatNo: 2, fullName: 'Second User' }],
      contact: {
        fullName: 'Second User',
        phone: '08023456789',
      },
      consent: true,
      idempotencyKey: 'idem-test-user2-unique',
    });
  } catch (err: any) {
    errorCaught = err;
  }

  assert.ok(errorCaught !== null, 'Should have thrown an error for taken seat');
  assert.equal(errorCaught?.code, 'SEAT_UNAVAILABLE');

  // 5. Idempotent retry with same idempotencyKey returns existing hold
  const idempotentResult = await repo.createHold({
    tripId,
    seats: [2],
    passengers: [{ seatNo: 2, fullName: 'Ngozi Eze' }],
    contact: {
      fullName: 'Ngozi Eze',
      phone: '09070000625',
    },
    consent: true,
    idempotencyKey: 'idem-test-ngozi-01',
  });
  assert.equal(idempotentResult.ref, hold1.ref);

  // 6. getHeldBooking succeeds with correct token
  const heldRecord = await repo.getHeldBooking(hold1.ref, hold1.holdToken);
  assert.equal(heldRecord.ref, hold1.ref);
  assert.equal(heldRecord.seats[0], 2);

  // 7. Replace seats: atomically move from seat 2 to seat 3
  const replaced = await repo.replaceHold(hold1.ref, hold1.holdToken, [3]);
  assert.equal(replaced.seats[0], 3);

  const occupiedReplaced = await repo.getOccupiedSeats(tripId);
  assert.equal(occupiedReplaced.includes(2), false, 'Seat 2 should be free after replace');
  assert.equal(occupiedReplaced.includes(3), true, 'Seat 3 should be occupied');

  // 8. Release hold frees seat 3
  const released = await repo.releaseHold(hold1.ref, hold1.holdToken);
  assert.equal(released, true);

  const occupiedFinal = await repo.getOccupiedSeats(tripId);
  assert.equal(occupiedFinal.includes(3), false, 'Seat 3 should be freed after release');
});
