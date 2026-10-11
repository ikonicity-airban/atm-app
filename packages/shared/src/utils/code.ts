const UNAMBIGUOUS_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRandomSegment(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * UNAMBIGUOUS_CHARS.length);
    result += UNAMBIGUOUS_CHARS[randomIndex];
  }
  return result;
}

/**
 * Generates customer booking reference code.
 * Format: ATM-XXXXXX (e.g. ATM-9B4X2K)
 */
export function generateBookingRef(): string {
  return `ATM-${generateRandomSegment(6)}`;
}

/**
 * Generates courier parcel tracking code.
 * Format: ATM-EXP-XXXXXX (e.g. ATM-EXP-7K3N9R)
 */
export function generateTrackingCode(): string {
  return `ATM-EXP-${generateRandomSegment(6)}`;
}
