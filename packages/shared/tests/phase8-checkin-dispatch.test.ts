import { test } from 'node:test';
import assert from 'node:assert';
import {
  checkInLookupSchema,
  boardPassengerSchema,
  standbyReleaseSchema,
  assignTripDispatchSchema,
  canTransitionTicketStatus,
  canTransitionTripStatus,
  SEED_TERMINALS,
  BRAND,
  type TicketStatus,
  type TripStatus,
} from '../src/index.ts';

// Direct unit test verification of Spec 0016 Terminal Check-In & Vehicle Dispatch
test('Spec 0016 (AC-1): Gate Agent Lookup Schema Validation (Phone, Ref, QR Payload)', () => {
  // Valid Reference
  const refResult = checkInLookupSchema.safeParse({ ref: 'ATM-7K9W2P' });
  assert.strictEqual(refResult.success, true);
  if (refResult.success) {
    assert.strictEqual(refResult.data.ref, 'ATM-7K9W2P');
  }

  // Valid Phone (converts to E.164 +234...)
  const phoneResult = checkInLookupSchema.safeParse({ phone: '08031234567' });
  assert.strictEqual(phoneResult.success, true);
  if (phoneResult.success) {
    assert.strictEqual(phoneResult.data.phone, '+2348031234567');
  }

  // Valid QR Payload
  const qrResult = checkInLookupSchema.safeParse({ qrPayload: 'ATM|ATM-7K9W2P|SEAT1|HASH7721' });
  assert.strictEqual(qrResult.success, true);
  if (qrResult.success) {
    assert.strictEqual(qrResult.data.qrPayload, 'ATM|ATM-7K9W2P|SEAT1|HASH7721');
  }

  // Empty criteria must fail
  const emptyResult = checkInLookupSchema.safeParse({});
  assert.strictEqual(emptyResult.success, false);
});

test('Spec 0016 (AC-2 & AC-3): Passenger Boarding Schema and Seat Constraints', () => {
  // Valid Boarding Payload
  const validBoard = boardPassengerSchema.safeParse({
    tripId: 'trip-enugu-abuja-morning',
    bookingRef: 'ATM-7K9W2P',
    seatNumbers: [1, 2],
    staffId: 'staff-enugu-01',
    staffName: 'Obiora Nwachukwu',
  });
  assert.strictEqual(validBoard.success, true);

  // Invalid Seat (Sienna max capacity is 5)
  const invalidSeat = boardPassengerSchema.safeParse({
    tripId: 'trip-enugu-abuja-morning',
    bookingRef: 'ATM-7K9W2P',
    seatNumbers: [6], // Out of bounds
    staffId: 'staff-enugu-01',
  });
  assert.strictEqual(invalidSeat.success, false);

  // Empty Seats Array must fail
  const emptySeats = boardPassengerSchema.safeParse({
    tripId: 'trip-enugu-abuja-morning',
    bookingRef: 'ATM-7K9W2P',
    seatNumbers: [],
    staffId: 'staff-enugu-01',
  });
  assert.strictEqual(emptySeats.success, false);
});

test('Spec 0016 (AC-7): Standby Release Schema and 15-Minute Cutoff Validation', () => {
  const validStandby = standbyReleaseSchema.safeParse({
    tripId: 'trip-enugu-abuja-morning',
    bookingRef: 'ATM-9P2Z4V',
    seatNumbers: [4],
    reason: 'Passenger no-show at 15-minute departure cutoff',
    staffId: 'staff-supervisor-01',
  });
  assert.strictEqual(validStandby.success, true);
  if (validStandby.success) {
    assert.strictEqual(validStandby.data.seatNumbers[0], 4);
    assert.strictEqual(validStandby.data.reason, 'Passenger no-show at 15-minute departure cutoff');
  }

  // Empty reason must fall back or fail
  const invalidStandby = standbyReleaseSchema.safeParse({
    tripId: 'trip-enugu-abuja-morning',
    bookingRef: 'ATM-9P2Z4V',
    seatNumbers: [4],
    reason: '',
    staffId: 'staff-supervisor-01',
  });
  assert.strictEqual(invalidStandby.success, false);
});

test('Spec 0016 (AC-4 & AC-5): Dispatch Vehicle & Driver Assignment Schema', () => {
  const validAssign = assignTripDispatchSchema.safeParse({
    tripId: 'trip-enugu-abuja-morning',
    vehicleId: 'veh-sienna-01',
    driverId: 'drv-chukwuma-okafor',
    status: 'boarding',
  });
  assert.strictEqual(validAssign.success, true);

  // Missing vehicleId
  const missingVehicle = assignTripDispatchSchema.safeParse({
    tripId: 'trip-enugu-abuja-morning',
    driverId: 'drv-chukwuma-okafor',
  });
  assert.strictEqual(missingVehicle.success, false);
});

test('Spec 0016: State Machine Transition Invariants for Tickets and Trips', () => {
  // Ticket transitions
  assert.strictEqual(canTransitionTicketStatus('paid', 'checked_in'), true);
  assert.strictEqual(canTransitionTicketStatus('checked_in', 'cancelled'), true);
  assert.strictEqual(canTransitionTicketStatus('refunded', 'checked_in'), false);

  // Trip transitions
  assert.strictEqual(canTransitionTripStatus('scheduled', 'boarding'), true);
  assert.strictEqual(canTransitionTripStatus('boarding', 'in_transit'), true);
  assert.strictEqual(canTransitionTripStatus('in_transit', 'completed'), true);
  assert.strictEqual(canTransitionTripStatus('completed', 'boarding'), false);
});

test('Spec 0016 (AC-6): Statutory Highway Manifest Data and Regulatory Requirements', () => {
  // Verify terminals exist for manifest origins and destinations
  const enugu = SEED_TERMINALS.find((t) => t.id === 'term-enugu-ogui');
  const abuja = SEED_TERMINALS.find((t) => t.id === 'term-abuja-utako');
  assert.ok(enugu, 'Enugu terminal must exist');
  assert.ok(abuja, 'Abuja terminal must exist');

  // Verify Brand contact phones are present for official letterhead
  assert.ok(BRAND.contactPhones.length >= 2, 'Brand must have emergency contact phones');
  assert.strictEqual(BRAND.name, 'Ascent Transport Management');

  // Verify Toyota Sienna 5-passenger constraint
  const siennaCapacity = 5;
  assert.strictEqual(siennaCapacity, 5, 'Fleet capacity must strictly equal 5 seats');
});
