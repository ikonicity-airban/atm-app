import type { CancellationPolicy } from '../types/index.ts';
import { formatNaira } from './money.ts';

export interface CancellationCalculationResult {
  hoursBeforeDeparture: number;
  eligibleForRefund: boolean;
  cancellationFeeKobo: number;
  refundAmountKobo: number;
  feePercentageApplied: number;
  reason: string;
}

/**
 * Calculates cancellation fee and refund in integer kobo based on policy rules.
 */
export function calculateCancellationFee(
  policy: CancellationPolicy,
  tripDeparture: Date,
  now: Date,
  fareKobo: number
): CancellationCalculationResult {
  if (fareKobo <= 0) {
    return {
      hoursBeforeDeparture: 0,
      eligibleForRefund: false,
      cancellationFeeKobo: 0,
      refundAmountKobo: 0,
      feePercentageApplied: 0,
      reason: 'Zero fare booking',
    };
  }

  const diffMs = tripDeparture.getTime() - now.getTime();
  const hoursBefore = diffMs / (1000 * 60 * 60);

  // If trip already departed or within the no-refund cutoff window
  if (hoursBefore < policy.noRefundHoursBefore) {
    return {
      hoursBeforeDeparture: Math.max(0, hoursBefore),
      eligibleForRefund: false,
      cancellationFeeKobo: fareKobo,
      refundAmountKobo: 0,
      feePercentageApplied: 100,
      reason: `Cancellations within ${policy.noRefundHoursBefore} hours of departure are non refundable.`,
    };
  }

  // Find the matching policy rule (rules sorted descending by hours)
  const sortedRules = [...policy.rules].sort(
    (a, b) => b.hoursBeforeDeparture - a.hoursBeforeDeparture
  );

  let selectedFeePct = 100;
  for (const rule of sortedRules) {
    if (hoursBefore >= rule.hoursBeforeDeparture) {
      selectedFeePct = rule.feePercentage;
      break;
    }
  }

  const feeKobo = Math.round((fareKobo * selectedFeePct) / 100);
  const refundKobo = Math.max(0, fareKobo - feeKobo);

  return {
    hoursBeforeDeparture: hoursBefore,
    eligibleForRefund: refundKobo > 0,
    cancellationFeeKobo: feeKobo,
    refundAmountKobo: refundKobo,
    feePercentageApplied: selectedFeePct,
    reason: `Cancellation ${Math.round(hoursBefore)} hours before departure (${selectedFeePct}% fee applied).`,
  };
}

/**
 * Constructs SMS notification text for processed ticket cancellation
 */
export function formatCancellationConfirmationSms(params: {
  bookingRef: string;
  cancelledSeats: number[];
  feeKobo: number;
  refundKobo: number;
  disbursementMethod: 'atm_credit' | 'paystack_reversal';
}): string {
  const methodLabel = params.disbursementMethod === 'atm_credit' ? 'ATM wallet credit' : 'card refund';
  const seatsList = params.cancelledSeats.sort((a, b) => a - b).join(', ');
  return `Ascent Transport: Cancellation confirmed for Ref ${params.bookingRef}. Seat(s) ${seatsList}. Refund of ${formatNaira(params.refundKobo)} processed via ${methodLabel}. Fee deducted: ${formatNaira(params.feeKobo)}. Support: 09070000625.`;
}

