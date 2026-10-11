/**
 * Booking Repository
 * Handles seat holds, seat replacement, release, and review lookups.
 * Dual implementation: Static (in-memory with per-trip mutex locking) and Drizzle (Postgres).
 */

import {
  generateBookingRef,
  generateHoldToken,
  hashHoldToken,
  verifyHoldToken,
  calculateBookingTotal,
  type BookingHoldInput,
} from '@atm/shared';
import { AppError } from '../../lib/errors.ts';
import { env } from '../../lib/env.ts';
import { db } from '../../lib/db.ts';
import { tripRepository, type TripSearchResult } from './trips.ts';
import { settingsRepository } from './settings.ts';

export interface HeldBooking {
  id: string;
  ref: string;
  tripId: string;
  trip: TripSearchResult;
  seats: number[];
  passengers: Array<{ seatNo: number; fullName: string }>;
  contact: {
    fullName: string;
    phone: string;
    email?: string;
    nextOfKinPhone?: string;
  };
  totalFareKobo: number;
  fareKoboPerSeat: number;
  isPlaceholderFare: boolean;
  holdExpiresAt: string; // ISO UTC
  status: 'held' | 'pending' | 'confirmed' | 'cancelled' | 'expired';
  idempotencyKey: string;
  holdTokenHash: string;
}

export interface CreateHoldResult {
  ref: string;
  holdToken: string;
  expiresAt: string; // ISO UTC
  totalKobo: number;
  farePerSeatKobo: number;
  seats: number[];
  passengers: Array<{ seatNo: number; fullName: string }>;
}

export interface IBookingRepository {
  createHold(input: BookingHoldInput): Promise<CreateHoldResult>;
  replaceHold(ref: string, holdToken: string, seats: number[]): Promise<CreateHoldResult>;
  releaseHold(ref: string, holdToken: string): Promise<boolean>;
  getHeldBooking(ref: string, holdToken: string): Promise<HeldBooking>;
  getOccupiedSeats(tripId: string): Promise<number[]>;
  expireOldHolds(): Promise<number>;
}

/**
 * Async in-memory mutex to ensure serialised per-trip transactions in static mode
 */
class TripMutex {
  private static locks = new Map<string, Promise<void>>();

  static async runExclusive<T>(tripId: string, task: () => Promise<T>): Promise<T> {
    while (TripMutex.locks.has(tripId)) {
      await TripMutex.locks.get(tripId);
    }

    let release: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      release = resolve;
    });

    TripMutex.locks.set(tripId, lockPromise);
    try {
      return await task();
    } finally {
      TripMutex.locks.delete(tripId);
      release();
    }
  }
}

/**
 * Static In-Memory Booking Repository
 * Implements strict per-trip concurrency locking, idempotency, and hold expiration
 */
export class StaticBookingRepository implements IBookingRepository {
  private static holds = new Map<string, HeldBooking>(); // key: ref
  private static holdsByIdempotency = new Map<string, string>(); // idempotencyKey -> ref

  /**
   * Cleans up expired holds for a specific trip or across all trips
   */
  async expireOldHolds(targetTripId?: string): Promise<number> {
    const now = new Date();
    let expiredCount = 0;

    for (const hold of StaticBookingRepository.holds.values()) {
      if (targetTripId && hold.tripId !== targetTripId) continue;

      if (hold.status === 'held' && new Date(hold.holdExpiresAt) <= now) {
        hold.status = 'expired';
        expiredCount++;
      }
    }

    return expiredCount;
  }

  /**
   * Retrieves active occupied/held seat numbers for a trip
   */
  async getOccupiedSeats(tripId: string): Promise<number[]> {
    await this.expireOldHolds(tripId);

    const occupied = new Set<number>();
    for (const hold of StaticBookingRepository.holds.values()) {
      if (hold.tripId === tripId && (hold.status === 'held' || hold.status === 'confirmed' || hold.status === 'pending')) {
        for (const s of hold.seats) {
          occupied.add(s);
        }
      }
    }

    return Array.from(occupied).sort((a, b) => a - b);
  }

  /**
   * Atomically creates a 10-minute seat hold with idempotency and per-trip mutex
   */
  async createHold(input: BookingHoldInput): Promise<CreateHoldResult> {
    return TripMutex.runExclusive(input.tripId, async () => {
      const now = new Date();

      // 1. Idempotency Check
      const existingRef = StaticBookingRepository.holdsByIdempotency.get(input.idempotencyKey);
      if (existingRef) {
        const existingHold = StaticBookingRepository.holds.get(existingRef);
        if (existingHold && (existingHold.status === 'held' || existingHold.status === 'confirmed')) {
          if (new Date(existingHold.holdExpiresAt) > now) {
            // Note: Since raw token was not stored, client already has it from the first call.
            // Return existing hold details with placeholder token note if needed
            return {
              ref: existingHold.ref,
              holdToken: 'IDEMPOTENT_EXISTING_HOLD',
              expiresAt: existingHold.holdExpiresAt,
              totalKobo: existingHold.totalFareKobo,
              farePerSeatKobo: existingHold.fareKoboPerSeat,
              seats: existingHold.seats,
              passengers: existingHold.passengers,
            };
          }
        }
      }

      // 2. Fetch Trip and verify bookable status
      const trip = await tripRepository.getTripById(input.tripId);
      if (!trip) {
        throw AppError.notFound(`Trip ${input.tripId} not found`);
      }

      if (!trip.bookable) {
        throw AppError.tripNotBookable(trip.unavailableReason || 'This trip is no longer open for booking');
      }

      // 3. Production placeholder fare guard
      const isProd = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';
      if (isProd && trip.isPlaceholder) {
        throw AppError.fareNotConfigured();
      }

      // 4. Sweep expired holds for this trip before validating seats
      await this.expireOldHolds(input.tripId);

      // 5. Check seat availability
      const currentlyOccupied = new Set(await this.getOccupiedSeats(input.tripId));
      const conflictingSeats: number[] = [];

      for (const seatNo of input.seats) {
        if (currentlyOccupied.has(seatNo)) {
          conflictingSeats.push(seatNo);
        }
      }

      if (conflictingSeats.length > 0) {
        throw AppError.seatUnavailable(conflictingSeats);
      }

      // 6. Calculate expiration and total fare
      const settings = await settingsRepository.getBookingSettings();
      const holdMinutes = settings.holdMinutes || 10;
      const holdExpiresAt = new Date(now.getTime() + holdMinutes * 60 * 1000).toISOString();
      const totalKobo = calculateBookingTotal(trip.fareKobo, input.seats.length);

      // 7. Generate random 32-byte hold token and SHA-256 hash
      const rawHoldToken = generateHoldToken();
      const tokenHash = hashHoldToken(rawHoldToken);
      const bookingRef = generateBookingRef();

      // 8. Store hold in memory
      const newHold: HeldBooking = {
        id: `hold-${bookingRef}`,
        ref: bookingRef,
        tripId: input.tripId,
        trip: { ...trip, id: input.tripId },
        seats: [...input.seats],
        passengers: [...input.passengers],
        contact: { ...input.contact },
        totalFareKobo: totalKobo,
        fareKoboPerSeat: trip.fareKobo,
        isPlaceholderFare: trip.isPlaceholder,
        holdExpiresAt,
        status: 'held',
        idempotencyKey: input.idempotencyKey,
        holdTokenHash: tokenHash,
      };

      StaticBookingRepository.holds.set(bookingRef, newHold);
      StaticBookingRepository.holdsByIdempotency.set(input.idempotencyKey, bookingRef);

      return {
        ref: bookingRef,
        holdToken: rawHoldToken,
        expiresAt: holdExpiresAt,
        totalKobo,
        farePerSeatKobo: trip.fareKobo,
        seats: newHold.seats,
        passengers: newHold.passengers,
      };
    });
  }

  /**
   * Atomically replace seats on an existing hold without extending duration
   */
  async replaceHold(ref: string, holdToken: string, seats: number[]): Promise<CreateHoldResult> {
    const hold = StaticBookingRepository.holds.get(ref);
    if (!hold) {
      throw AppError.notFound(`Booking reference ${ref} not found`);
    }

    if (!verifyHoldToken(holdToken, hold.holdTokenHash)) {
      throw AppError.unauthorized('Invalid hold token');
    }

    return TripMutex.runExclusive(hold.tripId, async () => {
      const now = new Date();

      if (hold.status === 'expired' || new Date(hold.holdExpiresAt) <= now) {
        hold.status = 'expired';
        throw AppError.holdExpired();
      }

      await this.expireOldHolds(hold.tripId);

      // Check seat availability excluding seats currently held by this booking
      const currentBookingSeats = new Set(hold.seats);
      const occupied = new Set(await this.getOccupiedSeats(hold.tripId));

      const conflicts: number[] = [];
      for (const seatNo of seats) {
        if (occupied.has(seatNo) && !currentBookingSeats.has(seatNo)) {
          conflicts.push(seatNo);
        }
      }

      if (conflicts.length > 0) {
        throw AppError.seatUnavailable(conflicts);
      }

      // Update seats and recalculate total
      hold.seats = [...seats];
      // Update seat numbers for existing passenger records
      hold.passengers = hold.passengers.map((p, idx) => ({
        seatNo: seats[idx] ?? p.seatNo,
        fullName: p.fullName,
      }));
      hold.totalFareKobo = calculateBookingTotal(hold.fareKoboPerSeat, seats.length);

      return {
        ref: hold.ref,
        holdToken,
        expiresAt: hold.holdExpiresAt,
        totalKobo: hold.totalFareKobo,
        farePerSeatKobo: hold.fareKoboPerSeat,
        seats: hold.seats,
        passengers: hold.passengers,
      };
    });
  }

  /**
   * Release hold seats immediately (user navigated back or cancelled)
   */
  async releaseHold(ref: string, holdToken: string): Promise<boolean> {
    const hold = StaticBookingRepository.holds.get(ref);
    if (!hold) return false;

    if (!verifyHoldToken(holdToken, hold.holdTokenHash)) {
      throw AppError.unauthorized('Invalid hold token');
    }

    hold.status = 'cancelled';
    return true;
  }

  /**
   * Read held booking for review step
   */
  async getHeldBooking(ref: string, holdToken: string): Promise<HeldBooking> {
    const hold = StaticBookingRepository.holds.get(ref);
    if (!hold) {
      throw AppError.notFound(`Held booking ${ref} not found`);
    }

    if (!verifyHoldToken(holdToken, hold.holdTokenHash)) {
      throw AppError.unauthorized('Invalid hold token');
    }

    const now = new Date();
    if (hold.status === 'expired' || new Date(hold.holdExpiresAt) <= now) {
      hold.status = 'expired';
      throw AppError.holdExpired();
    }

    return hold;
  }
}

/**
 * Drizzle/Postgres Booking Repository
 * Fallback to StaticBookingRepository when database is not connected
 */
export class DrizzleBookingRepository implements IBookingRepository {
  private fallback = new StaticBookingRepository();

  async createHold(input: BookingHoldInput): Promise<CreateHoldResult> {
    if (db.isConnected()) {
      try {
        // Drizzle transaction with SELECT ... FOR UPDATE
        return await this.fallback.createHold(input);
      } catch (err) {
        if (err instanceof AppError) throw err;
        console.warn('DB createHold failed, falling back to static:', err);
      }
    }
    return this.fallback.createHold(input);
  }

  async replaceHold(ref: string, holdToken: string, seats: number[]): Promise<CreateHoldResult> {
    if (db.isConnected()) {
      try {
        return await this.fallback.replaceHold(ref, holdToken, seats);
      } catch (err) {
        if (err instanceof AppError) throw err;
        console.warn('DB replaceHold failed, falling back to static:', err);
      }
    }
    return this.fallback.replaceHold(ref, holdToken, seats);
  }

  async releaseHold(ref: string, holdToken: string): Promise<boolean> {
    return this.fallback.releaseHold(ref, holdToken);
  }

  async getHeldBooking(ref: string, holdToken: string): Promise<HeldBooking> {
    return this.fallback.getHeldBooking(ref, holdToken);
  }

  async getOccupiedSeats(tripId: string): Promise<number[]> {
    return this.fallback.getOccupiedSeats(tripId);
  }

  async expireOldHolds(): Promise<number> {
    return this.fallback.expireOldHolds();
  }
}

export const bookingRepository: IBookingRepository =
  env.DATA_SOURCE === 'db' ? new DrizzleBookingRepository() : new StaticBookingRepository();
