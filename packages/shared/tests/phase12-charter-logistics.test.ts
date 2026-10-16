import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCharterQuote,
  generateCharterReference,
  charterQuoteInputSchema,
  createCharterRequestSchema,
  updateCharterRequestSchema,
  formatNaira,
  assertIntegerKobo,
} from '../src/index.ts';

describe('Phase 12: Charter & Corporate Logistics (Spec 0019)', () => {
  describe('AC-1: Transparent Instant Fare Estimation Engine', () => {
    it('calculates standard one-way charter fare in integer kobo', () => {
      const quote = calculateCharterQuote({
        serviceType: 'private_charter',
        tripType: 'one_way',
        originCity: 'Enugu',
        destinationCity: 'Abuja',
        durationDays: 1,
        passengerCount: 4,
        isDoorToDoor: true,
        hasArmedEscort: false,
      });

      // Base: ₦180,000 (18,000,000 kobo) + Door-to-door: ₦15,000 (1,500,000 kobo) = 19,500,000 kobo (₦195,000)
      assert.equal(quote.breakdown.baseCorridorKobo, 18000000);
      assert.equal(quote.breakdown.dailyVehicleAllocationKobo, 0);
      assert.equal(quote.breakdown.doorToDoorKobo, 1500000);
      assert.equal(quote.breakdown.armedEscortKobo, 0);
      assert.equal(quote.breakdown.totalEstimatedKobo, 19500000);
      assertIntegerKobo(quote.breakdown.totalEstimatedKobo);
    });

    it('calculates round-trip journey with 15% return leg discount', () => {
      const quote = calculateCharterQuote({
        serviceType: 'private_charter',
        tripType: 'round_trip',
        originCity: 'Enugu',
        destinationCity: 'Abuja',
        durationDays: 2,
        passengerCount: 5,
        isDoorToDoor: false,
        hasArmedEscort: false,
      });

      // Base: 18,000,000 * 2 = 36,000,000 kobo
      // Extra day (day 2): 1 * 12,000,000 = 12,000,000 kobo
      // Return discount: 15% of 18,000,000 = 2,700,000 kobo
      // Total: (36m + 12m) - 2.7m = 45,300,000 kobo (₦453,000)
      assert.equal(quote.breakdown.baseCorridorKobo, 36000000);
      assert.equal(quote.breakdown.dailyVehicleAllocationKobo, 12000000);
      assert.equal(quote.breakdown.discountKobo, 2700000);
      assert.equal(quote.breakdown.totalEstimatedKobo, 45300000);
      assertIntegerKobo(quote.breakdown.totalEstimatedKobo);
    });

    it('calculates multi-day executive charter with armed security escort', () => {
      const quote = calculateCharterQuote({
        serviceType: 'corporate_transit',
        tripType: 'multi_day',
        originCity: 'Enugu',
        destinationCity: 'Lagos',
        durationDays: 3,
        passengerCount: 3,
        isDoorToDoor: true,
        hasArmedEscort: true,
      });

      // Base corridor (Enugu-Lagos): 22,000,000 kobo
      // Extra 2 days: 2 * 12,000,000 = 24,000,000 kobo
      // Door-to-door: 1,500,000 kobo
      // Armed escort (3 days * 65m): 195,000,000 kobo
      // Total: 22m + 24m + 1.5m + 195m = 242,500,000 kobo (₦2,425,000)
      assert.equal(quote.breakdown.baseCorridorKobo, 22000000);
      assert.equal(quote.breakdown.dailyVehicleAllocationKobo, 24000000);
      assert.equal(quote.breakdown.doorToDoorKobo, 1500000);
      assert.equal(quote.breakdown.armedEscortKobo, 195000000);
      assert.equal(quote.breakdown.totalEstimatedKobo, 242500000);
      assert.equal(formatNaira(quote.breakdown.totalEstimatedKobo), '₦2,425,000');
    });
  });

  describe('AC-2 & AC-3: Request Submission Zod Schema Validation', () => {
    it('validates charter quote inputs with defaults', () => {
      const parsed = charterQuoteInputSchema.safeParse({
        originCity: 'Enugu',
        destinationCity: 'Abuja',
      });

      assert.equal(parsed.success, true);
      if (parsed.success) {
        assert.equal(parsed.data.serviceType, 'private_charter');
        assert.equal(parsed.data.tripType, 'one_way');
        assert.equal(parsed.data.durationDays, 1);
        assert.equal(parsed.data.isDoorToDoor, true);
      }
    });

    it('rejects passenger count exceeding 5 for Toyota Sienna layout', () => {
      const parsed = charterQuoteInputSchema.safeParse({
        originCity: 'Enugu',
        destinationCity: 'Abuja',
        passengerCount: 7, // Sienna max capacity is 5
      });

      assert.equal(parsed.success, false);
      if (!parsed.success) {
        assert.match(parsed.error.issues[0].message, /Maximum 5 passengers/i);
      }
    });

    it('validates full charter request and normalizes phone to E.164', () => {
      const rawPayload = {
        serviceType: 'private_charter',
        tripType: 'round_trip',
        originCity: 'Enugu',
        originAddress: '14 Independence Layout',
        destinationCity: 'Abuja',
        destinationAddress: 'Maitama District',
        departureDate: '2026-10-25T06:00:00.000Z',
        returnDate: '2026-10-27T18:00:00.000Z',
        durationDays: 3,
        passengerCount: 4,
        contactName: 'Chief Emeka Okafor',
        contactPhone: '08031234567', // Nigerian local
        contactEmail: 'emeka@primeholdings.ng',
        billingMethod: 'paystack_gateway',
        estimatedFareKobo: 57300000,
      };

      const parsed = createCharterRequestSchema.safeParse(rawPayload);
      assert.equal(parsed.success, true);
      if (parsed.success) {
        assert.equal(parsed.data.contactPhone, '+2348031234567');
        assert.equal(parsed.data.durationDays, 3);
        assert.equal(parsed.data.estimatedFareKobo, 57300000);
      }
    });

    it('rejects invalid email or missing pickup address', () => {
      const invalidPayload = {
        serviceType: 'private_charter',
        tripType: 'one_way',
        originCity: 'Enugu',
        originAddress: '', // missing
        destinationCity: 'Abuja',
        destinationAddress: 'Maitama District',
        departureDate: '2026-10-25T06:00:00.000Z',
        durationDays: 1,
        contactName: 'Emeka',
        contactPhone: '08031234567',
        contactEmail: 'invalid-email',
        estimatedFareKobo: 19500000,
      };

      const parsed = createCharterRequestSchema.safeParse(invalidPayload);
      assert.equal(parsed.success, false);
    });
  });

  describe('AC-3 & AC-4: Unambiguous Reference & Corporate Invoicing', () => {
    it('generates unambiguous ATM-CRT- reference codes', () => {
      const ref = generateCharterReference();
      assert.match(ref, /^ATM-CRT-[2-9A-HJ-NP-Z]{6}$/);
      // Ensure no confusing 0, 1, I, O
      assert.equal(ref.includes('0'), false);
      assert.equal(ref.includes('1'), false);
      assert.equal(ref.includes('I'), false);
      assert.equal(ref.includes('O'), false);
    });

    it('validates corporate B2B request with organization tax ID and PO reference', () => {
      const corpPayload = {
        serviceType: 'corporate_transit',
        tripType: 'one_way',
        originCity: 'Enugu',
        originAddress: 'Emene Industrial Depot',
        destinationCity: 'Lagos',
        destinationAddress: 'Dangote Towers, Ikoyi',
        departureDate: '2026-10-28T07:00:00.000Z',
        durationDays: 1,
        passengerCount: 3,
        contactName: 'Engr. Folake Adeleke',
        contactPhone: '+2348029876543',
        contactEmail: 'folake@dangote.com',
        organizationName: 'Dangote Cement PLC',
        organizationTaxId: 'RC-1129481',
        billingMethod: 'corporate_invoice',
        invoiceReference: 'PO-DANG-2026-089',
        estimatedFareKobo: 23500000,
      };

      const parsed = createCharterRequestSchema.safeParse(corpPayload);
      assert.equal(parsed.success, true);
      if (parsed.success) {
        assert.equal(parsed.data.organizationName, 'Dangote Cement PLC');
        assert.equal(parsed.data.organizationTaxId, 'RC-1129481');
        assert.equal(parsed.data.billingMethod, 'corporate_invoice');
      }
    });
  });

  describe('AC-5, AC-6 & AC-7: Administrative Updates & State Transitions', () => {
    it('validates staff quote override and fleet vehicle/driver assignment', () => {
      const updatePayload = {
        status: 'assigned',
        finalFareKobo: 65000000, // ₦650,000 adjusted fare
        assignedVehicleId: 'veh-sienna-01',
        assignedDriverId: 'drv-chukwuma-01',
        dispatchNotes: 'Executive highway protocol briefed.',
        staffId: 'staff-ops-01',
      };

      const parsed = updateCharterRequestSchema.safeParse(updatePayload);
      assert.equal(parsed.success, true);
      if (parsed.success) {
        assert.equal(parsed.data.status, 'assigned');
        assert.equal(parsed.data.finalFareKobo, 65000000);
        assert.equal(parsed.data.assignedVehicleId, 'veh-sienna-01');
      }
    });

    it('rejects negative or non-integer kobo fare override', () => {
      const invalidFarePayload = {
        finalFareKobo: -5000,
      };

      const parsed = updateCharterRequestSchema.safeParse(invalidFarePayload);
      assert.equal(parsed.success, false);
    });
  });
});
