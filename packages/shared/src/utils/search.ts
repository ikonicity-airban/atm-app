import {
  SERVED_CITIES,
  SERVED_CORRIDORS,
  type ServedCity,
  DEFAULT_BOOKING_SETTINGS,
} from '../constants/index.ts';

/**
 * Returns the list of served destination cities for a given origin city.
 */
export function getServedDestinations(originCity: string): ServedCity[] {
  const norm = originCity.trim().toLowerCase();
  const matched = SERVED_CORRIDORS.filter(
    (c) => c.from.toLowerCase() === norm
  ).map((c) => c.to);
  return matched;
}

/**
 * Checks whether an origin and destination city form a served transport corridor.
 */
export function isServedPair(originCity: string, destinationCity: string): boolean {
  const fromNorm = originCity.trim().toLowerCase();
  const toNorm = destinationCity.trim().toLowerCase();
  return SERVED_CORRIDORS.some(
    (c) => c.from.toLowerCase() === fromNorm && c.to.toLowerCase() === toNorm
  );
}

/**
 * Formats a Date into YYYY-MM-DD string in Africa/Lagos (WAT, UTC+1) timezone.
 */
export function getLagosDate(date: Date = new Date()): string {
  // Use Intl to extract the local date components in Africa/Lagos timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // outputs YYYY-MM-DD
}

/**
 * Parses a YYYY-MM-DD date and time string in Lagos timezone into an ISO UTC Date.
 * e.g. "2026-10-15", "06:30" WAT -> "2026-10-15T05:30:00.000Z" (UTC is 1 hour behind WAT)
 */
export function lagosTimeToUtc(dateStr: string, timeStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const [hourStr, minStr] = timeStr.split(':');
  const year = parseInt(yearStr ?? '2026', 10);
  const month = parseInt(monthStr ?? '1', 10) - 1;
  const day = parseInt(dayStr ?? '1', 10);
  const hour = parseInt(hourStr ?? '0', 10);
  const min = parseInt(minStr ?? '0', 10);

  // Africa/Lagos is strictly UTC+1 (WAT) year-round with no DST
  // So UTC milliseconds = Date.UTC(year, month, day, hour - 1, min, 0)
  const utcMs = Date.UTC(year, month, day, hour - 1, min, 0);
  return new Date(utcMs);
}

export interface BookableCheckResult {
  bookable: boolean;
  reason?: 'Departed' | 'Booking closed' | 'Sold out';
}

/**
 * Evaluates whether a trip is currently bookable based on departure time and cut-off window.
 * Same-day cut-off: a trip stops being bookable `cutoffMinutes` before departure.
 */
export function isBookable(
  departureTimeUtc: string | Date,
  now: Date = new Date(),
  cutoffMinutes: number = DEFAULT_BOOKING_SETTINGS.cutoffMinutes
): BookableCheckResult {
  const departureDate =
    typeof departureTimeUtc === 'string' ? new Date(departureTimeUtc) : departureTimeUtc;
  const depTime = departureDate.getTime();
  const nowTime = now.getTime();

  if (nowTime >= depTime) {
    return { bookable: false, reason: 'Departed' };
  }

  const cutoffMs = cutoffMinutes * 60 * 1000;
  if (depTime - nowTime < cutoffMs) {
    return { bookable: false, reason: 'Booking closed' };
  }

  return { bookable: true };
}

export interface TicketSeatStatus {
  status: 'held' | 'paid' | 'checked_in' | 'cancelled' | 'refunded' | string;
  holdExpiresAt?: string | Date | null;
}

/**
 * Computes available seats left for a vehicle:
 * Seats left = totalSeats (5) minus count of tickets that are:
 * - 'paid' or 'checked_in'
 * - 'held' where holdExpiresAt > now (ignores expired holds)
 */
export function seatsLeft(
  totalSeats: number = 5,
  tickets: TicketSeatStatus[] = [],
  now: Date = new Date()
): number {
  const nowTime = now.getTime();

  const occupiedTickets = tickets.filter((t) => {
    if (t.status === 'paid' || t.status === 'checked_in') {
      return true;
    }
    if (t.status === 'held') {
      if (!t.holdExpiresAt) return true;
      const expiresTime =
        typeof t.holdExpiresAt === 'string'
          ? new Date(t.holdExpiresAt).getTime()
          : t.holdExpiresAt.getTime();
      return expiresTime > nowTime;
    }
    return false;
  });

  return Math.max(0, totalSeats - occupiedTickets.length);
}

/**
 * Sorts trips by departure time ("earliest") or fare ("cheapest").
 */
export function sortTrips<
  T extends { departureTimeUtc: string; fareKobo: number }
>(trips: T[], sortBy: 'earliest' | 'cheapest' = 'earliest'): T[] {
  return [...trips].sort((a, b) => {
    if (sortBy === 'cheapest') {
      if (a.fareKobo !== b.fareKobo) {
        return a.fareKobo - b.fareKobo;
      }
    }
    return (
      new Date(a.departureTimeUtc).getTime() -
      new Date(b.departureTimeUtc).getTime()
    );
  });
}

export interface ScheduleTemplate {
  id: string;
  routeId: string;
  departureTimeLagos: string; // "HH:MM" e.g. "06:30"
  daysOfWeek: number[]; // 0=Sunday, 1=Monday ... 6=Saturday
  baseFareKobo: number;
  originTerminalId: string;
  destinationTerminalId: string;
}

/**
 * Generates trip objects for a given Lagos-timezone date from fixed schedule templates.
 */
export function generateTripsForDate(
  schedules: ScheduleTemplate[],
  dateStr: string // "YYYY-MM-DD"
): Array<{
  scheduleId: string;
  routeId: string;
  departureTimeUtc: string;
  fareKobo: number;
  originTerminalId: string;
  destinationTerminalId: string;
}> {
  // Determine the day of week for this date in Lagos
  // Create an arbitrary midday timestamp for that date in Lagos to get day of week
  const dateMiddayUtc = lagosTimeToUtc(dateStr, '12:00');
  const dayOfWeek = dateMiddayUtc.getUTCDay();

  const matchingSchedules = schedules.filter((s) =>
    s.daysOfWeek.includes(dayOfWeek)
  );

  return matchingSchedules.map((sch) => {
    const depUtc = lagosTimeToUtc(dateStr, sch.departureTimeLagos);
    return {
      scheduleId: sch.id,
      routeId: sch.routeId,
      departureTimeUtc: depUtc.toISOString(),
      fareKobo: sch.baseFareKobo,
      originTerminalId: sch.originTerminalId,
      destinationTerminalId: sch.destinationTerminalId,
    };
  });
}
