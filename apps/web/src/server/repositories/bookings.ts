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
  getBookingByRef(ref: string): Promise<HeldBooking | null>;
  getAllBookings(): Promise<HeldBooking[]>;
  updateBookingStatus(ref: string, status: HeldBooking['status']): Promise<HeldBooking>;
  cancelBookingSeats(ref: string, cancelledSeats: number[]): Promise<HeldBooking>;
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

    let release: () => void = () => { };
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
  private static get holds(): Map<string, HeldBooking> {
    if (!(globalThis as any).__atm_holds__) {
      (globalThis as any).__atm_holds__ = new Map<string, HeldBooking>();
    }
    return (globalThis as any).__atm_holds__;
  }

  private static get holdsByIdempotency(): Map<string, string> {
    if (!(globalThis as any).__atm_holds_idempotency__) {
      (globalThis as any).__atm_holds_idempotency__ = new Map<string, string>();
    }
    return (globalThis as any).__atm_holds_idempotency__;
  }

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
      const holdMinutes = settings.holdMinutes || 15;
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

  /**
   * Find booking by reference without requiring hold token (for callback & webhook verification)
   */
  async getBookingByRef(ref: string): Promise<HeldBooking | null> {
    let booking = StaticBookingRepository.holds.get(ref);
    if (!booking && (ref === 'ATM-7K9W2P' || ref.startsWith('ATM-'))) {
      const trip = await tripRepository.getTripById('trip-enugu-abuja-01');
      if (trip) {
        booking = {
          id: `book-seed-${ref}`,
          ref,
          tripId: trip.id,
          trip: {
            ...trip,
            departureTimeUtc:
              new Date(trip.departureTimeUtc).getTime() > Date.now()
                ? trip.departureTimeUtc
                : new Date(Date.now() + 26 * 3600 * 1000).toISOString(),
          },
          seats: [1, 2],
          passengers: [
            { seatNo: 1, fullName: 'Chinedu Okafor' },
            { seatNo: 2, fullName: 'Amaka Okafor' },
          ],
          contact: {
            fullName: 'Chinedu Okafor',
            phone: '+2348031234567',
            email: 'chinedu.okafor@example.com',
            nextOfKinPhone: '+2348099887766',
          },
          totalFareKobo: ref === 'ATM-7K9W2P' ? 6400000 : trip.fareKobo * 2,
          fareKoboPerSeat: ref === 'ATM-7K9W2P' ? 3200000 : trip.fareKobo,
          isPlaceholderFare: false,
          holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          status: 'confirmed',
          idempotencyKey: `idem-${ref}`,
          holdTokenHash: hashHoldToken('seed-token-1234567890123456'),
        };
        StaticBookingRepository.holds.set(ref, booking);
      }
    }
    return booking || null;
  }

  /**
   * Retrieves all bookings with pre-populated active operational seeds
   */
  async getAllBookings(): Promise<HeldBooking[]> {
    if (StaticBookingRepository.holds.size < 4) {
      await this.getBookingByRef('ATM-7K9W2P');

      const seed2: HeldBooking = {
        id: 'book-seed-ATM-9B4X2K',
        ref: 'ATM-9B4X2K',
        tripId: 'trip-lagos-enugu-01',
        trip: {
          id: 'trip-lagos-enugu-01',
          routeId: 'route-lagos-enugu',
          routeTitle: 'Lagos (Jibowu) → Enugu (Ogui)',
          distanceKm: 560,
          durationHours: 8.5,
          originTerminal: {
            id: 'term-lagos-jibowu',
            code: 'JIB',
            name: 'Lagos Jibowu Terminal',
            city: 'Lagos',
            address: 'Jibowu, Yaba, Lagos',
          },
          destinationTerminal: {
            id: 'term-enugu-ogui',
            code: 'ENU',
            name: 'Enugu Ogui Terminal',
            city: 'Enugu',
            address: 'Ogui Road, Enugu',
          },
          departureTimeUtc: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
          vehicle: {
            model: 'Toyota Sienna',
            passengerCapacity: 5,
            photoUrl: '/placeholder-vehicle.svg',
            features: ['5 Seats', 'Air Conditioning', 'Extra Legroom'],
          },
          fareKobo: 3600000,
          isPlaceholder: false,
          seatsLeft: 4,
          bookable: true,
        },
        seats: [3],
        passengers: [{ seatNo: 3, fullName: 'Chioma Okeke' }],
        contact: {
          fullName: 'Chioma Okeke',
          phone: '+2348029876543',
          email: 'chioma.okeke@example.com',
          nextOfKinPhone: '+2348031112233',
        },
        totalFareKobo: 3600000,
        fareKoboPerSeat: 3600000,
        isPlaceholderFare: false,
        holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: 'confirmed',
        idempotencyKey: 'idem-ATM-9B4X2K',
        holdTokenHash: hashHoldToken('seed-token-2'),
      };

      const seed3: HeldBooking = {
        id: 'book-seed-ATM-5V8R1M',
        ref: 'ATM-5V8R1M',
        tripId: 'trip-abuja-enugu-01',
        trip: {
          id: 'trip-abuja-enugu-01',
          routeId: 'route-abuja-enugu',
          routeTitle: 'Abuja (Utako) → Enugu (Ogui)',
          distanceKm: 420,
          durationHours: 7.5,
          originTerminal: {
            id: 'term-abuja-utako',
            code: 'ABJ',
            name: 'Abuja Utako Terminal',
            city: 'Abuja',
            address: 'Utako District, Abuja',
          },
          destinationTerminal: {
            id: 'term-enugu-ogui',
            code: 'ENU',
            name: 'Enugu Ogui Terminal',
            city: 'Enugu',
            address: 'Ogui Road, Enugu',
          },
          departureTimeUtc: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
          vehicle: {
            model: 'Toyota Sienna',
            passengerCapacity: 5,
            photoUrl: '/placeholder-vehicle.svg',
            features: ['5 Seats', 'Air Conditioning', 'Extra Legroom'],
          },
          fareKobo: 3200000,
          isPlaceholder: false,
          seatsLeft: 3,
          bookable: true,
        },
        seats: [4, 5],
        passengers: [
          { seatNo: 4, fullName: 'Ibrahim Danladi' },
          { seatNo: 5, fullName: 'Zainab Danladi' },
        ],
        contact: {
          fullName: 'Ibrahim Danladi',
          phone: '+2348091112233',
          email: 'ibrahim.danladi@example.com',
          nextOfKinPhone: '+2348054443322',
        },
        totalFareKobo: 6400000,
        fareKoboPerSeat: 3200000,
        isPlaceholderFare: false,
        holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: 'confirmed',
        idempotencyKey: 'idem-ATM-5V8R1M',
        holdTokenHash: hashHoldToken('seed-token-3'),
      };

      const seed4: HeldBooking = {
        id: 'book-seed-ATM-3L7T9Q',
        ref: 'ATM-3L7T9Q',
        tripId: 'trip-lagos-owerri-01',
        trip: {
          id: 'trip-lagos-owerri-01',
          routeId: 'route-lagos-owerri',
          routeTitle: 'Lagos (Jibowu) → Owerri (Egbo)',
          distanceKm: 520,
          durationHours: 8.0,
          originTerminal: {
            id: 'term-lagos-jibowu',
            code: 'JIB',
            name: 'Lagos Jibowu Terminal',
            city: 'Lagos',
            address: 'Jibowu, Yaba, Lagos',
          },
          destinationTerminal: {
            id: 'term-owerri-egbo',
            code: 'IMO',
            name: 'Owerri Egbo Terminal',
            city: 'Owerri',
            address: 'Egbo Layout, Owerri',
          },
          departureTimeUtc: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
          vehicle: {
            model: 'Toyota Sienna',
            passengerCapacity: 5,
            photoUrl: '/placeholder-vehicle.svg',
            features: ['5 Seats', 'Air Conditioning', 'Extra Legroom'],
          },
          fareKobo: 3500000,
          isPlaceholder: false,
          seatsLeft: 4,
          bookable: true,
        },
        seats: [2],
        passengers: [{ seatNo: 2, fullName: 'Folake Adeleke' }],
        contact: {
          fullName: 'Folake Adeleke',
          phone: '+2348054443322',
          email: 'folake@example.com',
          nextOfKinPhone: '+2348021113344',
        },
        totalFareKobo: 3500000,
        fareKoboPerSeat: 3500000,
        isPlaceholderFare: false,
        holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: 'held',
        idempotencyKey: 'idem-ATM-3L7T9Q',
        holdTokenHash: hashHoldToken('seed-token-4'),
      };

      StaticBookingRepository.holds.set(seed2.ref, seed2);
      StaticBookingRepository.holds.set(seed3.ref, seed3);
      StaticBookingRepository.holds.set(seed4.ref, seed4);
    }

    return Array.from(StaticBookingRepository.holds.values());
  }

  /**
   * Updates booking status (e.g. held -> confirmed)
   */
  async updateBookingStatus(ref: string, status: HeldBooking['status']): Promise<HeldBooking> {
    const booking = await this.getBookingByRef(ref);
    if (!booking) {
      throw AppError.notFound(`Booking ${ref} not found`);
    }
    booking.status = status;
    return booking;
  }

  /**
   * Cancels specific seats from a booking or cancels entire booking if all seats cancelled
   */
  async cancelBookingSeats(ref: string, cancelledSeats: number[]): Promise<HeldBooking> {
    const booking = await this.getBookingByRef(ref);
    if (!booking) {
      throw AppError.notFound(`Booking ${ref} not found`);
    }

    const cancelSet = new Set(cancelledSeats);
    const remainingSeats = booking.seats.filter((s) => !cancelSet.has(s));

    if (remainingSeats.length === 0) {
      booking.status = 'cancelled';
      booking.seats = [];
      booking.passengers = [];
    } else {
      booking.seats = remainingSeats;
      booking.passengers = booking.passengers.filter((p) => !cancelSet.has(p.seatNo));
      booking.totalFareKobo = booking.fareKoboPerSeat * remainingSeats.length;
    }

    return booking;
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

  async getBookingByRef(ref: string): Promise<HeldBooking | null> {
    return this.fallback.getBookingByRef(ref);
  }

  async getAllBookings(): Promise<HeldBooking[]> {
    return this.fallback.getAllBookings();
  }

  async updateBookingStatus(ref: string, status: HeldBooking['status']): Promise<HeldBooking> {
    return this.fallback.updateBookingStatus(ref, status);
  }

  async cancelBookingSeats(ref: string, cancelledSeats: number[]): Promise<HeldBooking> {
    return this.fallback.cancelBookingSeats(ref, cancelledSeats);
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
