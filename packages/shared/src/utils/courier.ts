import { generateTrackingCode } from './code.ts';
import type { ParcelStatus } from '../types/index.ts';

export type ParcelCategory =
  | 'documents'
  | 'electronics'
  | 'clothing'
  | 'perishables'
  | 'fragile'
  | 'general';

export type { ParcelStatus };

export interface ParcelDeliveryFeeInput {
  category: ParcelCategory;
  weightKg: number;
  fragile?: boolean;
  declaredValueKobo?: number | null;
}

export interface ParcelDeliveryFeeBreakdown {
  baseFeeKobo: number;
  weightSurchargeKobo: number;
  fragileSurchargeKobo: number;
  insuranceFeeKobo: number;
  totalFeeKobo: number;
}

/**
 * Category base freight fees in integer kobo
 */
export const PARCEL_CATEGORY_BASE_FEES_KOBO: Record<ParcelCategory, number> = {
  documents: 350000,    // ₦3,500
  clothing: 450000,     // ₦4,500
  general: 500000,      // ₦5,000
  perishables: 550000,  // ₦5,500
  electronics: 600000,  // ₦6,000
  fragile: 650000,      // ₦6,500
};

export const WEIGHT_INCLUDED_KG = 5;
export const ADDITIONAL_WEIGHT_RATE_PER_KG_KOBO = 50000; // ₦500 per additional kg
export const FRAGILE_HANDLING_SURCHARGE_KOBO = 150000;  // ₦1,500
export const INSURANCE_THRESHOLD_KOBO = 5000000;        // ₦50,000
export const INSURANCE_RATE_PERCENTAGE = 0.015;         // 1.5%

/**
 * Computes parcel freight delivery fee strictly in integer kobo.
 */
export function calculateParcelDeliveryFee(input: ParcelDeliveryFeeInput): ParcelDeliveryFeeBreakdown {
  const baseFeeKobo = PARCEL_CATEGORY_BASE_FEES_KOBO[input.category] ?? 500000;

  // Additional weight surcharge for weight above included allowance
  const billableAdditionalWeight = Math.max(0, Math.ceil(input.weightKg - WEIGHT_INCLUDED_KG));
  const weightSurchargeKobo = billableAdditionalWeight * ADDITIONAL_WEIGHT_RATE_PER_KG_KOBO;

  // Fragile handling fee
  const isFragileCategory = input.category === 'fragile';
  const fragileSurchargeKobo = (input.fragile || isFragileCategory) ? FRAGILE_HANDLING_SURCHARGE_KOBO : 0;

  // Transit insurance fee: 1.5% of declared value if declared value exceeds ₦50,000
  let insuranceFeeKobo = 0;
  if (input.declaredValueKobo && input.declaredValueKobo > INSURANCE_THRESHOLD_KOBO) {
    insuranceFeeKobo = Math.round(input.declaredValueKobo * INSURANCE_RATE_PERCENTAGE);
  }

  const totalFeeKobo = baseFeeKobo + weightSurchargeKobo + fragileSurchargeKobo + insuranceFeeKobo;

  return {
    baseFeeKobo,
    weightSurchargeKobo,
    fragileSurchargeKobo,
    insuranceFeeKobo,
    totalFeeKobo,
  };
}

/**
 * Generates a 4-digit numeric pickup verification code.
 * Given to recipient via SMS for terminal collection verification.
 */
export function generatePickupOtp(): string {
  const code = Math.floor(1000 + Math.random() * 9000);
  return String(code);
}

/**
 * Human-readable parcel status information with visual stage order.
 */
export interface ParcelStatusInfo {
  label: string;
  description: string;
  stageIndex: number; // 0 to 4
  badgeClass: string;
}

export const PARCEL_STATUS_MAP: Record<ParcelStatus, ParcelStatusInfo> = {
  booked: {
    label: 'Booked (Awaiting Drop-off)',
    description: 'Waybill created online. Awaiting package intake at origin terminal counter.',
    stageIndex: 0,
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  received_at_origin: {
    label: 'Received at Terminal',
    description: 'Package inspected, weighed, and stored in terminal parcel room ready for dispatch.',
    stageIndex: 1,
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  in_transit: {
    label: 'In Transit',
    description: 'Dispatched on scheduled Toyota Sienna transit vehicle along corridor.',
    stageIndex: 2,
    badgeClass: 'bg-brand-50 text-brand-800 border-brand-200',
  },
  arrived_at_destination: {
    label: 'Arrived at Destination',
    description: 'Offloaded and verified at destination terminal. Undergoing intake processing.',
    stageIndex: 3,
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  ready_for_pickup: {
    label: 'Ready for Collection',
    description: 'Package ready at destination terminal parcel room. Recipient alerted with pickup code.',
    stageIndex: 3,
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
  },
  out_for_delivery: {
    label: 'Out for Pickup',
    description: 'Package arriving at destination terminal parcel room for release.',
    stageIndex: 3,
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
  },
  delivered: {
    label: 'Delivered / Collected',
    description: 'Package verified with pickup OTP and released to recipient.',
    stageIndex: 4,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Waybill reservation cancelled before parcel drop-off.',
    stageIndex: -1,
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  returned: {
    label: 'Returned to Sender',
    description: 'Package could not be collected and has been returned to origin terminal.',
    stageIndex: -1,
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
  },
};
