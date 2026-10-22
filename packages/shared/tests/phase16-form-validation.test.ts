import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  SERVED_CITIES,
  isServedPair,
  getLagosDate,
  normalisePhone,
  isValidNigerianPhone,
  searchParamsSchema,
  bookingHoldInputSchema,
  bookParcelSchema,
  createCharterRequestSchema,
  complaintSchema,
  calculateParcelDeliveryFee,
  calculateCharterQuote,
  formatNaira,
} from '../src/index.ts';

describe('Phase 16 Form Validation & Zod Schema Architecture', () => {
  test('Trip search schema enforces valid served pairs and disallows unserved routes', () => {
    // Valid route
    const validSearch = searchParamsSchema.safeParse({
      from: 'Enugu',
      to: 'Abuja',
      date: getLagosDate(),
      passengers: 2,
    });
    assert.equal(validSearch.success, true, 'Enugu to Abuja must be a valid served corridor');

    // Unserved route (e.g. Owerri to Abuja)
    const invalidPair = searchParamsSchema.safeParse({
      from: 'Owerri',
      to: 'Abuja',
      date: getLagosDate(),
      passengers: 1,
    });
    assert.equal(invalidPair.success, false, 'Owerri to Abuja is not an active direct corridor');
  });

  test('Trip search schema restricts maximum passengers to 5 per executive Toyota Sienna', () => {
    const exceedsSeats = searchParamsSchema.safeParse({
      from: 'Enugu',
      to: 'Lagos',
      date: getLagosDate(),
      passengers: 6,
    });
    assert.equal(exceedsSeats.success, false, 'More than 5 seats must be rejected with advice to use /corporate');

    const exactSeats = searchParamsSchema.safeParse({
      from: 'Enugu',
      to: 'Lagos',
      date: getLagosDate(),
      passengers: 5,
    });
    assert.equal(exactSeats.success, true, '5 seats is the maximum permitted Sienna capacity');
  });

  test('Nigerian phone number validation and E.164 normalization', () => {
    assert.equal(isValidNigerianPhone('08012345678'), true);
    assert.equal(isValidNigerianPhone('+2348012345678'), true);
    assert.equal(isValidNigerianPhone('09070000625'), true);
    assert.equal(isValidNigerianPhone('12345'), false);

    assert.equal(normalisePhone('08012345678'), '+2348012345678');
    assert.equal(normalisePhone('+234 801 234 5678'), '+2348012345678');
  });

  test('Booking hold input schema enforces seat and passenger correspondence', () => {
    // Valid 2 seats with 2 passengers
    const validHold = bookingHoldInputSchema.safeParse({
      tripId: 'trip-enugu-abuja-01',
      seats: [1, 2],
      passengers: [
        { seatNo: 1, fullName: 'Chukwuemeka Obi' },
        { seatNo: 2, fullName: 'Amaka Obi' },
      ],
      contact: {
        fullName: 'Chukwuemeka Obi',
        phone: '08012345678',
      },
      consent: true,
      idempotencyKey: 'idem-test-123456',
    });
    assert.equal(validHold.success, true, 'Valid passenger checkout must pass validation');

    // Mismatched seats count
    const mismatchedHold = bookingHoldInputSchema.safeParse({
      tripId: 'trip-enugu-abuja-01',
      seats: [1, 2],
      passengers: [{ seatNo: 1, fullName: 'Chukwuemeka Obi' }],
      contact: {
        fullName: 'Chukwuemeka Obi',
        phone: '08012345678',
      },
      consent: true,
      idempotencyKey: 'idem-test-123456',
    });
    assert.equal(mismatchedHold.success, false, 'Selected seats count must match passenger entries');
  });

  test('Courier waybill schema requires different origin and destination and security consent', () => {
    const validParcel = bookParcelSchema.safeParse({
      originTerminalId: 'term-enugu-ogui',
      destinationTerminalId: 'term-abuja-utako',
      category: 'general',
      description: 'Auto spare parts in carton',
      weightKg: 4,
      fragile: false,
      declaredValueKobo: 2500000,
      senderName: 'Uche Nnamdi',
      senderPhone: '08031234567',
      receiverName: 'Garba Bello',
      receiverPhone: '08091234567',
      paymentMethod: 'online',
      securityDeclarationAccepted: true,
    });
    assert.equal(validParcel.success, true, 'Valid parcel booking must pass validation');

    // Same terminal error
    const sameTerminal = bookParcelSchema.safeParse({
      originTerminalId: 'term-enugu-ogui',
      destinationTerminalId: 'term-enugu-ogui',
      category: 'general',
      description: 'Auto spare parts in carton',
      weightKg: 4,
      fragile: false,
      senderName: 'Uche Nnamdi',
      senderPhone: '08031234567',
      receiverName: 'Garba Bello',
      receiverPhone: '08091234567',
      paymentMethod: 'online',
      securityDeclarationAccepted: true,
    });
    assert.equal(sameTerminal.success, false, 'Origin and destination cannot be identical');
  });

  test('Charter quote engine computes integer kobo pricing with return leg discount', () => {
    const oneWay = calculateCharterQuote({
      serviceType: 'private_charter',
      tripType: 'one_way',
      originCity: 'Enugu',
      destinationCity: 'Abuja',
      durationDays: 1,
      passengerCount: 4,
      isDoorToDoor: true,
      hasArmedEscort: false,
    });
    assert.equal(typeof oneWay.breakdown.totalEstimatedKobo, 'number');
    assert.ok(oneWay.breakdown.totalEstimatedKobo > 0);
    assert.equal(Number.isInteger(oneWay.breakdown.totalEstimatedKobo), true, 'Money must strictly be integer kobo');

    const roundTrip = calculateCharterQuote({
      serviceType: 'private_charter',
      tripType: 'round_trip',
      originCity: 'Enugu',
      destinationCity: 'Abuja',
      durationDays: 2,
      passengerCount: 4,
      isDoorToDoor: true,
      hasArmedEscort: false,
    });
    assert.ok(roundTrip.breakdown.discountKobo > 0, 'Round trip must apply return discount');
  });

  test('Customer complaint schema validates minimum character length and normalizes contact phone', () => {
    const validComplaint = complaintSchema.safeParse({
      fullName: 'Ibrahim Musa',
      phone: '08021234567',
      category: 'trip_delay',
      bookingRef: 'ATM-7K9W2P',
      message: 'My Sienna departure was delayed by 30 minutes at Utako terminal.',
    });
    assert.equal(validComplaint.success, true);
    if (validComplaint.success) {
      assert.equal(validComplaint.data.phone, '+2348021234567', 'Phone must normalize to E.164');
    }
  });
});
