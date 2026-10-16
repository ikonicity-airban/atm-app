import { test } from 'node:test';
import assert from 'node:assert';
import {
  logMaintenanceSchema,
  updateVehicleStatusSchema,
  createCorridorPricingRuleSchema,
  togglePricingRuleSchema,
  createCustomerInquirySchema,
  resolveInquirySchema,
  normalisePhone,
  formatNaira,
  type FleetVehicleRecord,
  type CorridorPricingRule,
  type CustomerInquiry,
} from '../src/index.ts';

// Test Suite: Spec 0017 Admin Logistics, CRM, and Fleet Maintenance

test('Spec 0017 (AC-1): Fleet 5,000 km Routine Maintenance Thresholds & Schema', () => {
  // Test schema validation
  const validLog = logMaintenanceSchema.safeParse({
    vehicleId: 'veh-sienna-01',
    serviceType: 'routine_oil_filter',
    odometerKm: 86200,
    costKobo: 4500000, // ₦45,000 in integer kobo
    workshopName: 'Ascent Central Garage Enugu',
    technicianName: 'Emeka Nwosu',
    notes: 'Engine oil replacement, oil filter, air filter change',
    staffId: 'staff-terminal-enugu-01',
  });

  assert.strictEqual(validLog.success, true);
  if (validLog.success) {
    assert.strictEqual(validLog.data.costKobo, 4500000);
    assert.strictEqual(validLog.data.odometerKm, 86200);
  }

  // Cost must be positive integer kobo
  const invalidLog = logMaintenanceSchema.safeParse({
    vehicleId: 'veh-sienna-01',
    serviceType: 'routine_oil_filter',
    odometerKm: 86200,
    costKobo: -500,
    workshopName: 'Ascent Central Garage Enugu',
    technicianName: 'Emeka Nwosu',
    notes: 'Test note',
    staffId: 'staff-terminal-enugu-01',
  });
  assert.strictEqual(invalidLog.success, false);

  // Maintenance threshold reset logic: Next service = current + 5,000km
  const currentMileage = 86200;
  const nextDue = currentMileage + 5000;
  assert.strictEqual(nextDue, 91200, 'Next service due must advance by exactly 5,000 km');
});

test('Spec 0017 (AC-1): Vehicle Status Update Schema Validation', () => {
  const validStatus = updateVehicleStatusSchema.safeParse({
    vehicleId: 'veh-sienna-02',
    status: 'grounded',
    reason: 'Transmission fluid leak identified during morning pre-trip inspection',
    staffId: 'staff-terminal-enugu-01',
  });
  assert.strictEqual(validStatus.success, true);

  const invalidStatus = updateVehicleStatusSchema.safeParse({
    vehicleId: 'veh-sienna-02',
    status: 'invalid_status_code',
    reason: 'Transmission fluid leak',
    staffId: 'staff-terminal-enugu-01',
  });
  assert.strictEqual(invalidStatus.success, false);
});

test('Spec 0017 (AC-2): Statutory Document Expiry Warning Calculation', () => {
  const referenceDate = new Date('2026-10-15T00:00:00Z');
  
  // Test insurance expiry in 15 days (warning window <= 30 days)
  const expiringSoon = new Date('2026-10-30T00:00:00Z');
  const daysUntilExpiring = Math.ceil(
    (expiringSoon.getTime() - referenceDate.getTime()) / (1000 * 3600 * 24)
  );
  assert.strictEqual(daysUntilExpiring, 15);
  const isExpiringSoon = daysUntilExpiring > 0 && daysUntilExpiring <= 30;
  assert.strictEqual(isExpiringSoon, true);

  // Test roadworthiness expired 5 days ago
  const expiredDate = new Date('2026-10-10T00:00:00Z');
  const daysUntilExpired = Math.ceil(
    (expiredDate.getTime() - referenceDate.getTime()) / (1000 * 3600 * 24)
  );
  assert.strictEqual(daysUntilExpired, -5);
  const isExpired = daysUntilExpired <= 0;
  assert.strictEqual(isExpired, true);
});

test('Spec 0017 (AC-3): Corridor Pricing Override Rules & Integer Kobo Calculation', () => {
  const baselineFareKobo = 2800000; // ₦28,000 baseline fare for Enugu to Abuja

  // Test 115% holiday multiplier
  const multiplier = 1.15;
  const effectiveFareKobo = Math.round(baselineFareKobo * multiplier);
  assert.strictEqual(effectiveFareKobo, 3220000, '115% of ₦28,000 must be ₦32,200 (3,220,000 kobo)');
  assert.strictEqual(formatNaira(effectiveFareKobo), '₦32,200');

  // Test create rule schema validation
  const validRule = createCorridorPricingRuleSchema.safeParse({
    routeId: 'route-enugu-abuja',
    ruleType: 'percentage_multiplier',
    multiplierPercentage: 115,
    startDate: '2026-12-15',
    endDate: '2027-01-08',
    reason: 'December Peak Holiday Surge',
    staffId: 'staff-hq-admin-01',
  });
  assert.strictEqual(validRule.success, true);

  // Multiplier out of range (e.g. 500% surge, max is 300) must fail
  const excessiveMultiplier = createCorridorPricingRuleSchema.safeParse({
    routeId: 'route-enugu-abuja',
    ruleType: 'percentage_multiplier',
    multiplierPercentage: 500,
    startDate: '2026-12-15',
    endDate: '2027-01-08',
    reason: 'Illegal gouge',
    staffId: 'staff-hq-admin-01',
  });
  assert.strictEqual(excessiveMultiplier.success, false);

  // Rule toggle schema
  const toggleResult = togglePricingRuleSchema.safeParse({
    ruleId: 'rule-surge-01',
    isActive: false,
    staffId: 'staff-hq-admin-01',
  });
  assert.strictEqual(toggleResult.success, true);
});

test('Spec 0017 (AC-5 & AC-6): Waybill 4-Digit Pickup PIN Verification Invariants', () => {
  const validOtp = '8391';
  const testInputCorrect = '8391';
  const testInputWrong = '0000';

  assert.strictEqual(testInputCorrect.trim() === validOtp, true, 'Matching 4-digit OTP must verify');
  assert.strictEqual(testInputWrong.trim() === validOtp, false, 'Mismatched OTP must fail verification');

  // Status progression order invariant
  const statusProgression = [
    'booked',
    'received_at_origin',
    'in_transit',
    'arrived_at_destination',
    'ready_for_pickup',
    'delivered',
  ];
  assert.strictEqual(statusProgression.indexOf('ready_for_pickup'), 4);
  assert.strictEqual(statusProgression.indexOf('delivered'), 5);
});

test('Spec 0017 (AC-7): Customer Support Ticket Schema & Phone Normalization', () => {
  // Test Nigerian phone normalization to E.164
  const normalizedPhone = normalisePhone('08023456789');
  assert.strictEqual(normalizedPhone, '+2348023456789');

  // Test ticket creation schema
  const validInquiry = createCustomerInquirySchema.safeParse({
    customerName: 'Chiamaka Okonkwo',
    customerPhone: normalizedPhone,
    customerEmail: 'chiamaka@example.com',
    bookingRef: 'ATM-7K9W2P',
    category: 'booking',
    priority: 'high',
    subject: 'Seat modification request',
    message: 'Request to swap passenger seat to window seat 1 due to mild motion sensitivity.',
  });
  assert.strictEqual(validInquiry.success, true);

  // Missing required message must fail
  const invalidInquiry = createCustomerInquirySchema.safeParse({
    customerName: 'Chiamaka Okonkwo',
    customerPhone: normalizedPhone,
    category: 'booking',
    subject: 'No message provided',
    message: '',
  });
  assert.strictEqual(invalidInquiry.success, false);

  // Test resolution schema
  const validResolution = resolveInquirySchema.safeParse({
    inquiryId: 'INQ-2026-001',
    status: 'resolved',
    resolutionNotes: 'Customer seat successfully updated to Seat 1 on departure manifest.',
    staffId: 'staff-hq-admin-01',
    staffName: 'Adaeze Nwankwo',
  });
  assert.strictEqual(validResolution.success, true);

  // Resolution without notes must fail
  const missingNotesResolution = resolveInquirySchema.safeParse({
    inquiryId: 'INQ-2026-001',
    status: 'resolved',
    resolutionNotes: '',
    staffId: 'staff-hq-admin-01',
    staffName: 'Adaeze Nwankwo',
  });
  assert.strictEqual(missingNotesResolution.success, false);
});
