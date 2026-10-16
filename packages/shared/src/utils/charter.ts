import { assertIntegerKobo } from './payment.ts';
import type { CharterQuoteInput } from '../schemas/charter.ts';
import type { CharterQuoteResult, CharterQuoteBreakdown } from '../types/charter.ts';

// Standard corridor baseline private hire fare (integer kobo)
const CORRIDOR_BASE_RATES: Record<string, number> = {
  'enugu-abuja': 18000000, // ₦180,000
  'abuja-enugu': 18000000,
  'enugu-lagos': 22000000, // ₦220,000
  'lagos-enugu': 22000000,
  'enugu-owerri': 8500000, // ₦85,000
  'owerri-enugu': 8500000,
  'enugu-ph': 11000000, // ₦110,000
  'ph-enugu': 11000000,
  'abuja-lagos': 25000000, // ₦250,000
  'lagos-abuja': 25000000,
};

const DEFAULT_BASE_RATE_KOBO = 18000000; // ₦180,000 baseline
const DAILY_VEHICLE_RATE_KOBO = 12000000; // ₦120,000 / day
const DOOR_TO_DOOR_SURCHARGE_KOBO = 1500000; // ₦15,000
const ARMED_ESCORT_DAILY_KOBO = 65000000; // ₦650,000 / day

/**
 * Computes an instant transparent charter fare estimate in integer kobo
 */
export function calculateCharterQuote(input: CharterQuoteInput): CharterQuoteResult {
  const originNorm = input.originCity.trim().toLowerCase();
  const destNorm = input.destinationCity.trim().toLowerCase();
  const corridorKey = `${originNorm}-${destNorm}`;

  const baseCorridorKobo = CORRIDOR_BASE_RATES[corridorKey] || DEFAULT_BASE_RATE_KOBO;
  assertIntegerKobo(baseCorridorKobo);

  const days = Math.max(1, input.durationDays || 1);
  // Days beyond the first day incur daily vehicle allocation fee
  const dailyVehicleAllocationKobo = days > 1 ? (days - 1) * DAILY_VEHICLE_RATE_KOBO : 0;
  assertIntegerKobo(dailyVehicleAllocationKobo);

  const doorToDoorKobo = input.isDoorToDoor ? DOOR_TO_DOOR_SURCHARGE_KOBO : 0;
  assertIntegerKobo(doorToDoorKobo);

  const armedEscortKobo = input.hasArmedEscort ? days * ARMED_ESCORT_DAILY_KOBO : 0;
  assertIntegerKobo(armedEscortKobo);

  // Return trip discount on base corridor
  let discountKobo = 0;
  let multiplier = 1;

  if (input.tripType === 'round_trip') {
    multiplier = 2;
    // 15% discount on the return base leg
    discountKobo = Math.round(baseCorridorKobo * 0.15);
  } else if (input.tripType === 'multi_day') {
    multiplier = 1; // multi-day rate covered by dailyVehicleAllocationKobo
  }

  const subtotal = baseCorridorKobo * multiplier + dailyVehicleAllocationKobo + doorToDoorKobo + armedEscortKobo;
  const totalEstimatedKobo = Math.max(0, subtotal - discountKobo);
  assertIntegerKobo(totalEstimatedKobo);

  const breakdown: CharterQuoteBreakdown = {
    baseCorridorKobo: baseCorridorKobo * multiplier,
    dailyVehicleAllocationKobo,
    doorToDoorKobo,
    armedEscortKobo,
    discountKobo,
    totalEstimatedKobo,
  };

  return {
    params: input,
    breakdown,
    currency: 'NGN',
  };
}

/**
 * Generates an unambiguous charter booking reference (e.g. ATM-CRT-7K9W2P)
 */
export function generateCharterReference(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ATM-CRT-${code}`;
}
