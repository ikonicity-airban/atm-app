import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalisePhone,
  isValidNigerianPhone,
} from '../src/utils/phone.ts';
import {
  formatNaira,
  nairaToKobo,
  koboToNaira,
} from '../src/utils/money.ts';
import {
  generateBookingRef,
  generateTrackingCode,
} from '../src/utils/code.ts';
import {
  calculateCancellationFee,
} from '../src/utils/cancellation.ts';
import {
  DEFAULT_CANCELLATION_POLICY,
} from '../src/constants/index.ts';
import {
  canTransitionParcelStatus,
  canTransitionBookingStatus,
} from '../src/utils/transitions.ts';
import {
  searchTripsSchema,
  createBookingSchema,
  cancellationRequestSchema,
  searchParamsSchema,
} from '../src/schemas/index.ts';
import {
  getServedDestinations,
  isServedPair,
  getLagosDate,
  lagosTimeToUtc,
  isBookable,
  seatsLeft,
  sortTrips,
} from '../src/utils/search.ts';

test('normalisePhone handles various valid Nigerian formats to E.164', () => {
  assert.equal(normalisePhone('09070000625'), '+2349070000625');
  assert.equal(normalisePhone('+234 907 000 0625'), '+2349070000625');
  assert.equal(normalisePhone('2349070000625'), '+2349070000625');
  assert.equal(normalisePhone('9070000625'), '+2349070000625');
  assert.equal(normalisePhone('08031234567'), '+2348031234567');
  assert.equal(normalisePhone('07060001122'), '+2347060001122');
  assert.equal(isValidNigerianPhone('09070000625'), true);
});

test('normalisePhone rejects invalid numbers', () => {
  assert.throws(() => normalisePhone('12345'));
  assert.throws(() => normalisePhone('06070000625')); // Invalid prefix 060
  assert.equal(isValidNigerianPhone('abcd'), false);
});

test('formatNaira correctly formats integer kobo to en-NG currency string', () => {
  // ₦32,000 for 3,200,000 kobo
  const formatted = formatNaira(3200000);
  assert.ok(formatted.includes('32,000') || formatted.includes('32000'));
  assert.equal(nairaToKobo(35000), 3500000);
  assert.equal(koboToNaira(3500000), 35000);
});

test('generateBookingRef generates valid ATM-XXXXXX pattern', () => {
  const ref1 = generateBookingRef();
  const ref2 = generateBookingRef();
  assert.match(ref1, /^ATM-[2-9A-HJ-NP-Z]{6}$/);
  assert.match(ref2, /^ATM-[2-9A-HJ-NP-Z]{6}$/);
  assert.notEqual(ref1, ref2);
});

test('generateTrackingCode generates valid ATM-EXP-XXXXXX pattern', () => {
  const code = generateTrackingCode();
  assert.match(code, /^ATM-EXP-[2-9A-HJ-NP-Z]{6}$/);
});

test('calculateCancellationFee computes correct tiered percentages', () => {
  const baseFareKobo = 3000000; // ₦30,000
  const now = new Date('2026-10-10T10:00:00Z');

  // Case 1: 48 hours before (> 24h => 10% fee)
  const departure48h = new Date('2026-10-12T10:00:00Z');
  const res48h = calculateCancellationFee(DEFAULT_CANCELLATION_POLICY, departure48h, now, baseFareKobo);
  assert.equal(res48h.feePercentageApplied, 10);
  assert.equal(res48h.cancellationFeeKobo, 300000); // ₦3,000
  assert.equal(res48h.refundAmountKobo, 2700000);   // ₦27,000
  assert.equal(res48h.eligibleForRefund, true);

  // Case 2: 12 hours before (between 6h and 24h => 25% fee)
  const departure12h = new Date('2026-10-10T22:00:00Z');
  const res12h = calculateCancellationFee(DEFAULT_CANCELLATION_POLICY, departure12h, now, baseFareKobo);
  assert.equal(res12h.feePercentageApplied, 25);
  assert.equal(res12h.cancellationFeeKobo, 750000); // ₦7,500
  assert.equal(res12h.refundAmountKobo, 2250000);   // ₦22,500

  // Case 3: 4 hours before (between 2h and 6h => 50% fee)
  const departure4h = new Date('2026-10-10T14:00:00Z');
  const res4h = calculateCancellationFee(DEFAULT_CANCELLATION_POLICY, departure4h, now, baseFareKobo);
  assert.equal(res4h.feePercentageApplied, 50);
  assert.equal(res4h.cancellationFeeKobo, 1500000);

  // Case 4: 1 hour before (< 2h => non-refundable)
  const departure1h = new Date('2026-10-10T11:00:00Z');
  const res1h = calculateCancellationFee(DEFAULT_CANCELLATION_POLICY, departure1h, now, baseFareKobo);
  assert.equal(res1h.eligibleForRefund, false);
  assert.equal(res1h.refundAmountKobo, 0);
});

test('status transition map checks work accurately', () => {
  assert.equal(canTransitionParcelStatus('booked', 'received_at_origin'), true);
  assert.equal(canTransitionParcelStatus('received_at_origin', 'in_transit'), true);
  assert.equal(canTransitionParcelStatus('delivered', 'in_transit'), false);
  assert.equal(canTransitionBookingStatus('pending', 'confirmed'), true);
  assert.equal(canTransitionBookingStatus('completed', 'cancelled'), false);
});

test('zod schemas validate properly', () => {
  const validSearch = searchTripsSchema.safeParse({
    originTerminalId: 'term-enugu-ogui',
    destinationTerminalId: 'term-abuja-utako',
    travelDate: '2026-10-15',
    passengers: 2,
  });
  assert.equal(validSearch.success, true);

  const invalidSameTerminal = searchTripsSchema.safeParse({
    originTerminalId: 'term-enugu-ogui',
    destinationTerminalId: 'term-enugu-ogui',
    travelDate: '2026-10-15',
  });
  assert.equal(invalidSameTerminal.success, false);
});

test('served destination filtering and validation', () => {
  assert.deepEqual(getServedDestinations('Enugu'), ['Abuja', 'Lagos']);
  assert.deepEqual(getServedDestinations('Abuja'), ['Enugu']);
  assert.deepEqual(getServedDestinations('Lagos'), ['Enugu', 'Owerri']);
  assert.deepEqual(getServedDestinations('Owerri'), ['Lagos']);

  assert.equal(isServedPair('Enugu', 'Abuja'), true);
  assert.equal(isServedPair('Abuja', 'Enugu'), true);
  assert.equal(isServedPair('Enugu', 'Lagos'), true);
  assert.equal(isServedPair('Lagos', 'Owerri'), true);

  // Unserved pairs
  assert.equal(isServedPair('Abuja', 'Lagos'), false);
  assert.equal(isServedPair('Abuja', 'Owerri'), false);
  assert.equal(isServedPair('Enugu', 'Owerri'), false);

  // Defensive handling against undefined / null / malformed inputs
  assert.equal(isServedPair(undefined as any, undefined as any), false);
  assert.equal(isServedPair('Enugu', undefined as any), false);
  assert.equal(isServedPair(null as any, 'Abuja'), false);
  assert.deepEqual(getServedDestinations(undefined as any), []);
  assert.deepEqual(getServedDestinations(null as any), []);
});

test('searchParamsSchema enforces business rules', () => {
  const todayLagos = getLagosDate();

  // Valid search
  const valid = searchParamsSchema.safeParse({
    from: 'Enugu',
    to: 'Abuja',
    date: todayLagos,
    passengers: '2',
  });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.passengers, 2);
  }

  // Reject unserved corridor (Abuja -> Lagos)
  const unserved = searchParamsSchema.safeParse({
    from: 'Abuja',
    to: 'Lagos',
    date: todayLagos,
    passengers: 1,
  });
  assert.equal(unserved.success, false);

  // Reject passenger count > 5 (5-seat Sienna capacity)
  const tooMany = searchParamsSchema.safeParse({
    from: 'Enugu',
    to: 'Abuja',
    date: todayLagos,
    passengers: 6,
  });
  assert.equal(tooMany.success, false);

  // Reject past date
  const pastDate = searchParamsSchema.safeParse({
    from: 'Enugu',
    to: 'Abuja',
    date: '2020-01-01',
    passengers: 1,
  });
  assert.equal(pastDate.success, false);
});

test('timezone edges: Africa/Lagos WAT (UTC+1) date calculations', () => {
  // Late-night UTC: 2026-10-14 23:30:00 UTC is 2026-10-15 00:30:00 in Africa/Lagos
  const lateNightUtc = new Date('2026-10-14T23:30:00Z');
  assert.equal(getLagosDate(lateNightUtc), '2026-10-15');

  // Morning departure: 06:30 WAT converts to 05:30 UTC
  const depUtc = lagosTimeToUtc('2026-10-15', '06:30');
  assert.equal(depUtc.toISOString(), '2026-10-15T05:30:00.000Z');
});

test('isBookable correctly enforces same-day cutoff minutes', () => {
  const departure = new Date('2026-10-15T08:00:00Z'); // 08:00 UTC

  // 120 minutes prior -> Bookable
  const twoHoursPrior = new Date('2026-10-15T06:00:00Z');
  const res1 = isBookable(departure, twoHoursPrior, 60);
  assert.equal(res1.bookable, true);

  // 59 minutes prior -> Cutoff reached (cutoff is 60 min)
  const fiftyNineMinPrior = new Date('2026-10-15T07:01:00Z');
  const res2 = isBookable(departure, fiftyNineMinPrior, 60);
  assert.equal(res2.bookable, false);
  assert.equal(res2.reason, 'Booking closed');

  // After departure -> Departed
  const afterDeparture = new Date('2026-10-15T08:05:00Z');
  const res3 = isBookable(departure, afterDeparture, 60);
  assert.equal(res3.bookable, false);
  assert.equal(res3.reason, 'Departed');
});

test('seatsLeft calculation respects 5-seat capacity and ignores expired holds', () => {
  const now = new Date('2026-10-15T10:00:00Z');
  const activeHoldExpires = new Date('2026-10-15T10:10:00Z'); // 10 min in future
  const expiredHoldExpires = new Date('2026-10-15T09:50:00Z'); // 10 min in past

  // 0 tickets -> 5 seats
  assert.equal(seatsLeft(5, [], now), 5);

  // 2 paid tickets -> 3 seats
  const tickets1 = [
    { status: 'paid' },
    { status: 'checked_in' },
  ];
  assert.equal(seatsLeft(5, tickets1, now), 3);

  // 1 paid + 1 active hold + 1 expired hold -> 3 seats left (expired hold ignored!)
  const tickets2 = [
    { status: 'paid' },
    { status: 'held', holdExpiresAt: activeHoldExpires },
    { status: 'held', holdExpiresAt: expiredHoldExpires },
  ];
  assert.equal(seatsLeft(5, tickets2, now), 3);

  // 5 confirmed tickets -> 0 seats
  const tickets3 = [
    { status: 'paid' },
    { status: 'paid' },
    { status: 'paid' },
    { status: 'paid' },
    { status: 'paid' },
  ];
  assert.equal(seatsLeft(5, tickets3, now), 0);
});

test('sortTrips sorts by earliest departure and cheapest fare', () => {
  const trips = [
    { departureTimeUtc: '2026-10-15T07:00:00Z', fareKobo: 3600000 },
    { departureTimeUtc: '2026-10-15T05:30:00Z', fareKobo: 3200000 },
    { departureTimeUtc: '2026-10-15T11:00:00Z', fareKobo: 3000000 },
  ];

  const earliest = sortTrips(trips, 'earliest');
  assert.equal(earliest[0]?.departureTimeUtc, '2026-10-15T05:30:00Z');
  assert.equal(earliest[2]?.departureTimeUtc, '2026-10-15T11:00:00Z');

  const cheapest = sortTrips(trips, 'cheapest');
  assert.equal(cheapest[0]?.fareKobo, 3000000);
  assert.equal(cheapest[2]?.fareKobo, 3600000);
});

test('SearchForm component swap and destination filter logic', () => {
  // 1. Initial selection: Enugu -> Abuja
  let from = 'Enugu';
  let to = 'Abuja';
  let validDests = getServedDestinations(from);
  assert.equal(validDests.includes(to as any), true);

  // 2. Change From to Abuja -> served destinations is only ['Enugu']
  from = 'Abuja';
  validDests = getServedDestinations(from);
  assert.deepEqual(validDests, ['Enugu']);
  if (!validDests.includes(to as any)) {
    to = validDests[0]!;
  }
  assert.equal(to, 'Enugu');

  // 3. Swap: Abuja -> Enugu reversed to Enugu -> Abuja
  const prevFrom = from;
  const prevTo = to;
  const reverseServed = getServedDestinations(prevTo);
  assert.equal(reverseServed.includes(prevFrom as any), true);
  from = prevTo;
  to = prevFrom;
  assert.equal(from, 'Enugu');
  assert.equal(to, 'Abuja');

  // 4. Passenger boundaries
  const clampPassenger = (val: number, delta: number) => Math.min(5, Math.max(1, val + delta));
  assert.equal(clampPassenger(1, -1), 1); // cannot go below 1
  assert.equal(clampPassenger(5, 1), 5);  // cannot go above 5
  assert.equal(clampPassenger(3, 1), 4);
});


