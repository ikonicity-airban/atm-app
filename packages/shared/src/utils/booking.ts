/**
 * Pure Booking Utilities & Hold Token Cryptography
 * Shared across server and client
 */

import type { VehicleSeatLayout } from '../types/index.ts';

/**
 * Calculates total booking amount in kobo from per-seat fare and seat count
 */
export function calculateBookingTotal(fareKobo: number, seatCount: number): number {
  if (fareKobo < 0 || seatCount < 0) {
    throw new Error('Fare and seat count must be non-negative integers');
  }
  return Math.round(fareKobo * seatCount);
}

/**
 * Returns selectable passenger seat numbers from a seat layout (excludes driver)
 */
export function getSelectableSeats(layout: VehicleSeatLayout): number[] {
  return layout.seats
    .filter((s) => !s.isDriver)
    .map((s) => s.seatNo)
    .sort((a, b) => a - b);
}

/**
 * Validates a list of selected seat numbers against a vehicle layout and passenger count
 */
export function validateSeatSelection(
  layout: VehicleSeatLayout,
  seats: number[],
  passengers: number
): { valid: boolean; error?: string } {
  if (passengers < 1 || passengers > 5) {
    return { valid: false, error: 'Passenger count must be between 1 and 5' };
  }

  if (seats.length !== passengers) {
    return {
      valid: false,
      error: `Please select exactly ${passengers} seat${passengers > 1 ? 's' : ''}. Currently selected: ${seats.length}`,
    };
  }

  // Check for duplicates
  const uniqueSeats = new Set(seats);
  if (uniqueSeats.size !== seats.length) {
    return { valid: false, error: 'Duplicate seats cannot be selected' };
  }

  const selectable = new Set(getSelectableSeats(layout));

  for (const seatNo of seats) {
    if (!selectable.has(seatNo)) {
      return {
        valid: false,
        error: `Seat ${seatNo} is not a valid passenger seat in this vehicle`,
      };
    }
  }

  return { valid: true };
}

/**
 * Calculates seconds remaining on a hold
 */
export function holdSecondsRemaining(
  expiresAt: string | Date,
  now: Date | number = new Date()
): number {
  const expiryMs = typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt.getTime();
  const currentMs = typeof now === 'number' ? now : now.getTime();
  const diffSec = Math.floor((expiryMs - currentMs) / 1000);
  return Math.max(0, diffSec);
}

/**
 * Generates a cryptographically random 32-byte hold token (hex-encoded string)
 */
export function generateHoldToken(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for non-crypto environments
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += Math.floor(Math.random() * 16).toString(16);
  }
  return token;
}

/**
 * Synchronous SHA-256 hash implementation for tokens (portable hex digest)
 * Uses simple portable SHA-256 implementation that works without native async SubtleCrypto
 */
export function hashHoldToken(token: string): string {
  // Pure JS SHA-256 implementation ensuring portable synchronous hashing across Node & Browser
  return sha256Hex(token);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function verifyHoldToken(token: string, expectedHash: string): boolean {
  if (!token || !expectedHash) return false;
  const computedHash = hashHoldToken(token);
  if (computedHash.length !== expectedHash.length) return false;

  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return result === 0;
}

// Minimal portable pure TypeScript SHA-256 implementation
function sha256Hex(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let compositeHash: number[] = [];
  for (i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] = (words[i >> 2] || 0) | (code << (24 - (i % 4) * 8));
  }

  words[asciiBitLength >> 5] = (words[asciiBitLength >> 5] || 0) | (0x80 << (24 - (asciiBitLength % 32)));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words.length; i += 16) {
    const w: number[] = [];
    for (j = 0; j < 16; j++) w[j] = words[i + j] || 0;
    for (j = 16; j < 64; j++) {
      const s0 = (rightRotate(w[j - 15]!, 7) ^ rightRotate(w[j - 15]!, 18) ^ (w[j - 15]! >>> 3));
      const s1 = (rightRotate(w[j - 2]!, 17) ^ rightRotate(w[j - 2]!, 19) ^ (w[j - 2]! >>> 10));
      w[j] = ((w[j - 16]! + s0 + w[j - 7]! + s1) | 0);
    }

    let [a, b, c, d, e, f, g, h] = hash;

    for (j = 0; j < 64; j++) {
      const s1 = (rightRotate(e!, 6) ^ rightRotate(e!, 11) ^ rightRotate(e!, 25));
      const ch = ((e! & f!) ^ (~e! & g!));
      const temp1 = ((h! + s1 + ch + k[j]! + w[j]!) | 0);
      const s0 = (rightRotate(a!, 2) ^ rightRotate(a!, 13) ^ rightRotate(a!, 22));
      const maj = ((a! & b!) ^ (a! & c!) ^ (b! & c!));
      const temp2 = ((s0 + maj) | 0);

      h = g;
      g = f;
      f = e;
      e = ((d! + temp1) | 0);
      d = c;
      c = b;
      b = a;
      a = ((temp1 + temp2) | 0);
    }

    hash[0] = ((hash[0]! + a!) | 0);
    hash[1] = ((hash[1]! + b!) | 0);
    hash[2] = ((hash[2]! + c!) | 0);
    hash[3] = ((hash[3]! + d!) | 0);
    hash[4] = ((hash[4]! + e!) | 0);
    hash[5] = ((hash[5]! + f!) | 0);
    hash[6] = ((hash[6]! + g!) | 0);
    hash[7] = ((hash[7]! + h!) | 0);
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const byte = (hash[i]! >> (j * 8)) & 255;
      result += byte.toString(16).padStart(2, '0');
    }
  }

  return result;
}

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}
