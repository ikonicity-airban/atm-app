import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateParcelDeliveryFee,
  generateTrackingCode,
  generatePickupOtp,
  bookParcelSchema,
  parcelQuoteSchema,
  trackParcelSchema,
  type ParcelCategory,
} from '@atm/shared';
import { StaticParcelRepository } from '@/server/repositories/parcels.ts';

test('Spec 0014 (AC-2): Integer Kobo Parcel Delivery Fee Calculations', () => {
  // 1. Standard Document (0.5kg, no insurance, not fragile)
  const docFee = calculateParcelDeliveryFee({
    category: 'documents',
    weightKg: 0.5,
    fragile: false,
    declaredValueKobo: 0,
  });
  assert.equal(docFee.baseFeeKobo, 350000, 'Documents base fee is ₦3,500 (350,000 kobo)');
  assert.equal(docFee.weightSurchargeKobo, 0, 'No weight surcharge under 5kg');
  assert.equal(docFee.fragileSurchargeKobo, 0);
  assert.equal(docFee.insuranceFeeKobo, 0);
  assert.equal(docFee.totalFeeKobo, 350000);

  // 2. Heavy Box (8kg general cargo -> 3kg extra at 50,000 kobo/kg)
  const heavyFee = calculateParcelDeliveryFee({
    category: 'general',
    weightKg: 8,
    fragile: false,
    declaredValueKobo: 0,
  });
  assert.equal(heavyFee.baseFeeKobo, 500000, 'General base fee is ₦5,000');
  assert.equal(heavyFee.weightSurchargeKobo, 150000, '3kg extra @ ₦500/kg = ₦1,500 (150,000 kobo)');
  assert.equal(heavyFee.totalFeeKobo, 650000);

  // 3. Fragile Electronics with Declared Value Insurance
  // 4kg, ₦200,000 declared value (20,000,000 kobo) -> 1.5% of 20,000,000 = 300,000 kobo (₦3,000)
  const fragileElectronics = calculateParcelDeliveryFee({
    category: 'electronics',
    weightKg: 4,
    fragile: true,
    declaredValueKobo: 20000000,
  });
  assert.equal(fragileElectronics.baseFeeKobo, 600000, 'Electronics base fee is ₦6,000');
  assert.equal(fragileElectronics.fragileSurchargeKobo, 150000, 'Fragile handling fee is ₦1,500');
  assert.equal(fragileElectronics.insuranceFeeKobo, 300000, 'Insurance is 1.5% of ₦200,000 = ₦3,000 (300,000 kobo)');
  assert.equal(fragileElectronics.totalFeeKobo, 600000 + 150000 + 300000); // 1,050,000 kobo (₦10,500)
});

test('Spec 0014 (AC-3): Waybill Booking Input Validation and Phone Normalization', () => {
  // Reject identical terminals
  const invalidSameTerminal = bookParcelSchema.safeParse({
    originTerminalId: 'term-enugu-ogui',
    destinationTerminalId: 'term-enugu-ogui',
    category: 'general',
    description: 'Documents package',
    weightKg: 2,
    senderName: 'Chidi Okonkwo',
    senderPhone: '08031234567',
    receiverName: 'Amina Yusuf',
    receiverPhone: '08029876543',
    securityDeclarationAccepted: true,
  });
  assert.ok(!invalidSameTerminal.success, 'Identical origin and destination must fail');

  // Valid parcel booking with phone normalization
  const validBooking = bookParcelSchema.safeParse({
    originTerminalId: 'term-enugu-ogui',
    destinationTerminalId: 'term-abuja-utako',
    category: 'electronics',
    description: 'Laptop computer in padded case',
    weightKg: 3.5,
    fragile: true,
    declaredValueKobo: 15000000,
    senderName: 'Chidi Okonkwo',
    senderPhone: '08031234567',
    receiverName: 'Amina Yusuf',
    receiverPhone: '08029876543',
    paymentMethod: 'online',
    securityDeclarationAccepted: true,
  });

  assert.ok(validBooking.success, 'Valid parcel input must pass validation');
  if (validBooking.success) {
    assert.equal(validBooking.data.senderPhone, '+2348031234567', 'Sender phone normalized to E.164');
    assert.equal(validBooking.data.receiverPhone, '+2348029876543', 'Receiver phone normalized to E.164');
  }
});

test('Spec 0014 (AC-4): Unambiguous Tracking Code and 4-Digit Pickup OTP Generation', () => {
  const trackingCode = generateTrackingCode();
  assert.match(trackingCode, /^ATM-EXP-[2-9A-HJ-NP-Z]{6}$/, 'Tracking code matches ATM-EXP-XXXXXX format');

  const otp = generatePickupOtp();
  assert.match(otp, /^\d{4}$/, 'Pickup verification code is 4 numeric digits');
});

test('Spec 0014 (AC-7 & AC-8): StaticParcelRepository Seed Fixtures and Timeline Lookup', async () => {
  const repo = new StaticParcelRepository();

  // Test Seed Parcel 1: ATM-EXP-7K3N9R (In Transit)
  const result1 = await repo.getParcelByTrackingCode('ATM-EXP-7K3N9R');
  assert.ok(result1, 'Seed parcel 1 must exist');
  assert.equal(result1.parcel.status, 'in_transit');
  assert.equal(result1.parcel.category, 'electronics');
  assert.ok(result1.timeline.length >= 3, 'Must contain booked, received, and in_transit events');

  // Test Seed Parcel 2: ATM-EXP-2M8W4P (Ready for Pickup)
  const result2 = await repo.getParcelByTrackingCode('ATM-EXP-2M8W4P');
  assert.ok(result2, 'Seed parcel 2 must exist');
  assert.equal(result2.parcel.status, 'ready_for_pickup');
  assert.equal(result2.parcel.pickupOtp, '4829', 'Pickup OTP is present for destination pickup');

  // Query by phone number
  const parcelsByPhone = await repo.getParcelsByPhone('+2348031234567');
  assert.ok(parcelsByPhone.length >= 1, 'Should find parcels by sender phone');
  assert.equal(parcelsByPhone[0]?.trackingCode, 'ATM-EXP-7K3N9R');
});

test('Spec 0014 (AC-5 & AC-6): Parcel Creation, Event Logging and Status Transitions', async () => {
  const repo = new StaticParcelRepository();

  const { parcel, timeline } = await repo.createParcel({
    originTerminalId: 'term-enugu-ogui',
    destinationTerminalId: 'term-lagos-jibowu',
    category: 'clothing',
    description: 'Handmade traditional agbada fabrics',
    weightKg: 4.5,
    fragile: false,
    declaredValueKobo: 8000000,
    senderName: 'Ngozi Eze',
    senderPhone: '+2348039998877',
    receiverName: 'Kemi Adebayo',
    receiverPhone: '+2348021112233',
    paymentMethod: 'pay_on_dropoff',
    securityDeclarationAccepted: true,
  });

  assert.ok(parcel.trackingCode.startsWith('ATM-EXP-'));
  assert.equal(parcel.status, 'booked');
  assert.equal(parcel.paid, false, 'Pay on drop-off starts unpaid');
  assert.ok(parcel.pickupOtp && parcel.pickupOtp.length === 4);
  assert.equal(timeline.length, 1);
  assert.equal(timeline[0]?.status, 'booked');

  // Progress status to received_at_origin
  const updated1 = await repo.updateParcelStatus(
    parcel.trackingCode,
    'received_at_origin',
    parcel.originTerminalId,
    'Package weighed and placed in Enugu departure rack'
  );
  assert.ok(updated1);
  assert.equal(updated1.parcel.status, 'received_at_origin');
  assert.equal(updated1.timeline.length, 2);

  // Progress status to delivered
  const updated2 = await repo.updateParcelStatus(
    parcel.trackingCode,
    'delivered',
    parcel.destinationTerminalId,
    'Collected by recipient with OTP verification'
  );
  assert.ok(updated2);
  assert.equal(updated2.parcel.status, 'delivered');
  assert.equal(updated2.parcel.paid, true, 'Delivery marks paid');
  assert.equal(updated2.timeline.length, 3);
});
