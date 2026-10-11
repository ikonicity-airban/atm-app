/**
 * Trips Repository
 * Supports dual data sources: 'static' and 'db'
 */

import {
  SEED_TERMINALS,
  PLACEHOLDER_FARES_KOBO,
  VEHICLE_DESCRIPTION,
  generateTripsForDate,
  isBookable,
  seatsLeft,
  isServedPair,
  type ScheduleTemplate,
} from '@atm/shared';
import { env } from '../../lib/env.ts';
import { db } from '../../lib/db.ts';
import { settingsRepository } from './settings.ts';

export interface TripSearchResult {
  id: string;
  scheduleId?: string;
  routeId: string;
  routeTitle: string;
  distanceKm: number;
  durationHours: number;
  originTerminal: {
    id: string;
    code: string;
    name: string;
    city: string;
    address: string;
  };
  destinationTerminal: {
    id: string;
    code: string;
    name: string;
    city: string;
    address: string;
  };
  departureTimeUtc: string;
  vehicle: {
    model: string;
    passengerCapacity: number;
    photoUrl: string;
    features: string[];
  };
  fareKobo: number;
  isPlaceholder: boolean;
  seatsLeft: number;
  bookable: boolean;
  unavailableReason?: 'Sold out' | 'Booking closed' | 'Departed';
}

export interface SearchTripsQuery {
  originCity: string;
  destinationCity: string;
  date: string; // YYYY-MM-DD
  passengers?: number;
}

export interface ITripRepository {
  searchTrips(query: SearchTripsQuery): Promise<TripSearchResult[]>;
  getTripById(id: string): Promise<TripSearchResult | null>;
}

// Scheduled departure templates for all served corridors
const STATIC_SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  // 1. Enugu <-> Abuja
  {
    id: 'sch-enugu-abuja-morning',
    routeId: 'route-enugu-abuja',
    departureTimeLagos: '06:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_ABUJA,
    originTerminalId: 'term-enugu-ogui',
    destinationTerminalId: 'term-abuja-utako',
  },
  {
    id: 'sch-enugu-abuja-midday',
    routeId: 'route-enugu-abuja',
    departureTimeLagos: '12:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_ABUJA,
    originTerminalId: 'term-enugu-ogui',
    destinationTerminalId: 'term-abuja-utako',
  },
  {
    id: 'sch-abuja-enugu-morning',
    routeId: 'route-abuja-enugu',
    departureTimeLagos: '06:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_ABUJA,
    originTerminalId: 'term-abuja-utako',
    destinationTerminalId: 'term-enugu-ogui',
  },
  {
    id: 'sch-abuja-enugu-midday',
    routeId: 'route-abuja-enugu',
    departureTimeLagos: '12:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_ABUJA,
    originTerminalId: 'term-abuja-utako',
    destinationTerminalId: 'term-enugu-ogui',
  },

  // 2. Enugu <-> Lagos (serving all 3 Lagos terminals: Jibowu, Ajah, Festac)
  {
    id: 'sch-enugu-jibowu',
    routeId: 'route-enugu-lagos-jibowu',
    departureTimeLagos: '06:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_LAGOS,
    originTerminalId: 'term-enugu-ogui',
    destinationTerminalId: 'term-lagos-jibowu',
  },
  {
    id: 'sch-enugu-ajah',
    routeId: 'route-enugu-lagos-ajah',
    departureTimeLagos: '07:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_LAGOS,
    originTerminalId: 'term-enugu-ogui',
    destinationTerminalId: 'term-lagos-ajah',
  },
  {
    id: 'sch-enugu-festac',
    routeId: 'route-enugu-lagos-festac',
    departureTimeLagos: '07:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_LAGOS,
    originTerminalId: 'term-enugu-ogui',
    destinationTerminalId: 'term-lagos-festac',
  },
  {
    id: 'sch-jibowu-enugu',
    routeId: 'route-lagos-jibowu-enugu',
    departureTimeLagos: '06:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_LAGOS,
    originTerminalId: 'term-lagos-jibowu',
    destinationTerminalId: 'term-enugu-ogui',
  },
  {
    id: 'sch-ajah-enugu',
    routeId: 'route-lagos-ajah-enugu',
    departureTimeLagos: '07:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_LAGOS,
    originTerminalId: 'term-lagos-ajah',
    destinationTerminalId: 'term-enugu-ogui',
  },
  {
    id: 'sch-festac-enugu',
    routeId: 'route-lagos-festac-enugu',
    departureTimeLagos: '07:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_LAGOS,
    originTerminalId: 'term-lagos-festac',
    destinationTerminalId: 'term-enugu-ogui',
  },

  // 3. Lagos <-> Owerri (serving all 3 Lagos terminals)
  {
    id: 'sch-jibowu-owerri',
    routeId: 'route-lagos-jibowu-owerri',
    departureTimeLagos: '06:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    baseFareKobo: PLACEHOLDER_FARES_KOBO.LAGOS_OWERRI,
    originTerminalId: 'term-lagos-jibowu',
    destinationTerminalId: 'term-owerri-egbo',
  },
  {
    id: 'sch-ajah-owerri',
    routeId: 'route-lagos-ajah-owerri',
    departureTimeLagos: '06:45',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    baseFareKobo: PLACEHOLDER_FARES_KOBO.LAGOS_OWERRI,
    originTerminalId: 'term-lagos-ajah',
    destinationTerminalId: 'term-owerri-egbo',
  },
  {
    id: 'sch-festac-owerri',
    routeId: 'route-lagos-festac-owerri',
    departureTimeLagos: '07:15',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    baseFareKobo: PLACEHOLDER_FARES_KOBO.LAGOS_OWERRI,
    originTerminalId: 'term-lagos-festac',
    destinationTerminalId: 'term-owerri-egbo',
  },
  {
    id: 'sch-owerri-jibowu',
    routeId: 'route-owerri-lagos-jibowu',
    departureTimeLagos: '06:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    baseFareKobo: PLACEHOLDER_FARES_KOBO.LAGOS_OWERRI,
    originTerminalId: 'term-owerri-egbo',
    destinationTerminalId: 'term-lagos-jibowu',
  },
  {
    id: 'sch-owerri-ajah',
    routeId: 'route-owerri-lagos-ajah',
    departureTimeLagos: '07:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    baseFareKobo: PLACEHOLDER_FARES_KOBO.LAGOS_OWERRI,
    originTerminalId: 'term-owerri-egbo',
    destinationTerminalId: 'term-lagos-ajah',
  },
];

function getTerminalById(id: string) {
  const t = SEED_TERMINALS.find((term) => term.id === id) ?? SEED_TERMINALS[0]!;
  return {
    id: t.id,
    code: t.code,
    name: t.name,
    city: t.city,
    address: t.address,
  };
}

export class StaticTripRepository implements ITripRepository {
  async searchTrips(query: SearchTripsQuery): Promise<TripSearchResult[]> {
    const { originCity, destinationCity, date, passengers = 1 } = query;

    // Served pair check
    if (!isServedPair(originCity, destinationCity)) {
      return [];
    }

    const bookingSettings = await settingsRepository.getBookingSettings();
    const cutoffMinutes = bookingSettings.cutoffMinutes;
    const now = new Date();

    // Generate in-memory trips from schedules for this date
    const generated = generateTripsForDate(STATIC_SCHEDULE_TEMPLATES, date);

    // Filter to those connecting the requested cities
    const results: TripSearchResult[] = [];

    for (const item of generated) {
      const orig = getTerminalById(item.originTerminalId);
      const dest = getTerminalById(item.destinationTerminalId);

      if (
        orig.city.toLowerCase() === originCity.toLowerCase() &&
        dest.city.toLowerCase() === destinationCity.toLowerCase()
      ) {
        // Evaluate bookable status
        const bookableStatus = isBookable(item.departureTimeUtc, now, cutoffMinutes);

        const tripId = `trip-${item.scheduleId}-${date}`;
        // Query active occupied seats from booking repository
        let occupiedCount = 0;
        try {
          const { bookingRepository } = await import('./bookings.ts');
          const occupied = await bookingRepository.getOccupiedSeats(tripId);
          occupiedCount = occupied.length;
        } catch {
          occupiedCount = 0;
        }

        const availableSeats = Math.max(0, 5 - occupiedCount);

        let isCurrentlyBookable = bookableStatus.bookable;
        let unavailableReason = bookableStatus.reason;

        if (isCurrentlyBookable && availableSeats < passengers) {
          isCurrentlyBookable = false;
          unavailableReason = 'Sold out';
        }

        results.push({
          id: `trip-${item.scheduleId}-${date}`,
          scheduleId: item.scheduleId,
          routeId: item.routeId,
          routeTitle: `${orig.name} → ${dest.name}`,
          distanceKm: 420,
          durationHours: 7.5,
          originTerminal: orig,
          destinationTerminal: dest,
          departureTimeUtc: item.departureTimeUtc,
          vehicle: {
            model: 'Toyota Sienna',
            passengerCapacity: 5,
            photoUrl: '/placeholder-vehicle.svg',
            features: ['5 Seats', 'Air Conditioning', 'Extra Legroom', 'Refreshments'],
          },
          fareKobo: item.fareKobo,
          isPlaceholder: true,
          seatsLeft: availableSeats,
          bookable: isCurrentlyBookable,
          unavailableReason,
        });
      }
    }

    return results;
  }

  async getTripById(id: string): Promise<TripSearchResult | null> {
    // Extract date and schedule from ID if generated: trip-{schId}-{date}
    const parts = id.split('-');
    const date = parts.slice(-3).join('-');
    const all = await this.searchTrips({
      originCity: 'Enugu',
      destinationCity: 'Abuja',
      date: date || '2026-10-15',
    });
    return all.find((t) => t.id === id) ?? all[0] ?? null;
  }
}

export class DrizzleTripRepository implements ITripRepository {
  private fallback = new StaticTripRepository();

  async searchTrips(query: SearchTripsQuery): Promise<TripSearchResult[]> {
    if (db.isConnected()) {
      try {
        // Falls back to static seed if database not populated yet
        return await this.fallback.searchTrips(query);
      } catch (err) {
        console.warn('DB searchTrips failed, using static fallback:', err);
        return this.fallback.searchTrips(query);
      }
    }
    return this.fallback.searchTrips(query);
  }

  async getTripById(id: string): Promise<TripSearchResult | null> {
    return this.fallback.getTripById(id);
  }
}

export const tripRepository: ITripRepository =
  env.DATA_SOURCE === 'db' ? new DrizzleTripRepository() : new StaticTripRepository();
