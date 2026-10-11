/**
 * Idempotent seed script for Ascent Transport Management (ATM Nigeria)
 * Can be run repeatedly without duplicating records.
 */

import {
  SEED_TERMINALS,
  PLACEHOLDER_FARES_KOBO,
  SIENNA_5_SEAT_LAYOUT,
  DEFAULT_CANCELLATION_POLICY,
} from '@atm/shared';

export interface SeedReport {
  terminalsCount: number;
  routesCount: number;
  vehiclesCount: number;
  driversCount: number;
  schedulesCount: number;
  tripsCount: number;
  staffUsersCount: number;
  settingsCount: number;
}

export async function runSeed(): Promise<SeedReport> {
  console.log('--- Starting Ascent Transport Management Database Seed ---');

  // 1. Terminals: 6 real terminals from client brief
  const terminals = SEED_TERMINALS.map(t => ({
    id: t.id,
    code: t.code,
    name: t.name,
    city: t.city,
    state: t.state,
    address: t.address,
    phones: [...t.phones],
    latitude: t.latitude,
    longitude: t.longitude,
    isActive: true,
  }));
  console.log(`✓ Seeded ${terminals.length} terminals.`);

  // 2. Routes: Enugu ↔ Abuja, Enugu ↔ Lagos (3 terminals), Lagos (3 terminals) ↔ Owerri in BOTH directions
  // ASSUMPTION: Distances and durations estimated based on standard highway travel times
  // TODO: confirm with client
  const lagosTerminalIds = [
    'term-lagos-jibowu',
    'term-lagos-ajah',
    'term-lagos-festac',
  ];

  interface SeedRoute {
    id: string;
    originTerminalId: string;
    destinationTerminalId: string;
    distanceKm: number;
    estimatedDurationHours: number;
    baseFareKobo: number;
  }

  const routes: SeedRoute[] = [
    // Enugu <-> Abuja
    {
      id: 'route-enugu-abuja',
      originTerminalId: 'term-enugu-ogui',
      destinationTerminalId: 'term-abuja-utako',
      distanceKm: 420,
      estimatedDurationHours: 7.5,
      baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_ABUJA,
    },
    {
      id: 'route-abuja-enugu',
      originTerminalId: 'term-abuja-utako',
      destinationTerminalId: 'term-enugu-ogui',
      distanceKm: 420,
      estimatedDurationHours: 7.5,
      baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_ABUJA,
    },
  ];

  // Enugu <-> Lagos (all 3 terminals)
  for (const lagosId of lagosTerminalIds) {
    const lagosCode = lagosId.replace('term-lagos-', '');
    routes.push(
      {
        id: `route-enugu-lagos-${lagosCode}`,
        originTerminalId: 'term-enugu-ogui',
        destinationTerminalId: lagosId,
        distanceKm: 550,
        estimatedDurationHours: 9.0,
        baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_LAGOS,
      },
      {
        id: `route-lagos-${lagosCode}-enugu`,
        originTerminalId: lagosId,
        destinationTerminalId: 'term-enugu-ogui',
        distanceKm: 550,
        estimatedDurationHours: 9.0,
        baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_LAGOS,
      }
    );
  }

  // Lagos (all 3 terminals) <-> Owerri
  for (const lagosId of lagosTerminalIds) {
    const lagosCode = lagosId.replace('term-lagos-', '');
    routes.push(
      {
        id: `route-lagos-${lagosCode}-owerri`,
        originTerminalId: lagosId,
        destinationTerminalId: 'term-owerri-egbo',
        distanceKm: 510,
        estimatedDurationHours: 8.5,
        baseFareKobo: PLACEHOLDER_FARES_KOBO.LAGOS_OWERRI,
      },
      {
        id: `route-owerri-lagos-${lagosCode}`,
        originTerminalId: 'term-owerri-egbo',
        destinationTerminalId: lagosId,
        distanceKm: 510,
        estimatedDurationHours: 8.5,
        baseFareKobo: PLACEHOLDER_FARES_KOBO.LAGOS_OWERRI,
      }
    );
  }
  console.log(`✓ Seeded ${routes.length} bidirectional routes.`);

  // 3. Vehicles: 2 sample Toyota Siennas (5 passenger seats, luxury air conditioned)
  const vehicles = [
    {
      id: 'veh-sienna-01',
      registrationNumber: 'ENU-418-XY',
      make: 'Toyota',
      model: 'Sienna Limited',
      year: 2021,
      seatCapacity: 5,
      seatLayout: SIENNA_5_SEAT_LAYOUT,
      hasAirConditioning: true,
      status: 'active' as const,
      currentTerminalId: 'term-enugu-ogui',
    },
    {
      id: 'veh-sienna-02',
      registrationNumber: 'ABJ-892-KT',
      make: 'Toyota',
      model: 'Sienna XLE',
      year: 2022,
      seatCapacity: 5,
      seatLayout: SIENNA_5_SEAT_LAYOUT,
      hasAirConditioning: true,
      status: 'active' as const,
      currentTerminalId: 'term-abuja-utako',
    },
  ];
  console.log(`✓ Seeded ${vehicles.length} Toyota Sienna vehicles.`);

  // 4. Drivers: 2 sample vetted drivers
  const drivers = [
    {
      id: 'drv-chukwuma-okafor',
      fullName: 'Chukwuma Okafor',
      phone: '+2348039871122',
      licenseNumber: 'ENU982341AA',
      licenseExpiry: '2028-05-15',
      homeTerminalId: 'term-enugu-ogui',
      isActive: true,
    },
    {
      id: 'drv-emeka-nnamdi',
      fullName: 'Emeka Nnamdi',
      phone: '+2348056782233',
      licenseNumber: 'FCT120938BB',
      licenseExpiry: '2027-11-20',
      homeTerminalId: 'term-abuja-utako',
      isActive: true,
    },
  ];
  console.log(`✓ Seeded ${drivers.length} licensed drivers.`);

  // 5. Schedules: Daily fixed departures
  // ASSUMPTION: Morning departure 6:30 AM and midday departure 12:00 PM
  // TODO: confirm with client
  const schedules = [
    {
      id: 'sch-enugu-abuja-morning',
      routeId: 'route-enugu-abuja',
      departureTimeLocal: '06:30:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_ABUJA,
    },
    {
      id: 'sch-abuja-enugu-morning',
      routeId: 'route-abuja-enugu',
      departureTimeLocal: '06:30:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_ABUJA,
    },
    {
      id: 'sch-enugu-jibowu-morning',
      routeId: 'route-enugu-lagos-jibowu',
      departureTimeLocal: '07:00:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_LAGOS,
    },
    {
      id: 'sch-jibowu-owerri-morning',
      routeId: 'route-lagos-jibowu-owerri',
      departureTimeLocal: '06:45:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      baseFareKobo: PLACEHOLDER_FARES_KOBO.LAGOS_OWERRI,
    },
  ];
  console.log(`✓ Seeded ${schedules.length} recurring schedules.`);

  // 6. Generate 1 week of scheduled trips
  const generatedTrips = [];
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const tripDay = new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = tripDay.toISOString().split('T')[0];

    for (const sch of schedules) {
      // 06:30 WAT (UTC+1) is 05:30 UTC
      const [hourStr, minStr] = sch.departureTimeLocal.split(':');
      const watHour = parseInt(hourStr || '6', 10);
      const watMin = parseInt(minStr || '30', 10);
      const utcDate = new Date(Date.UTC(
        tripDay.getFullYear(),
        tripDay.getMonth(),
        tripDay.getDate(),
        watHour - 1, // WAT is UTC+1
        watMin,
        0
      ));

      generatedTrips.push({
        id: `trip-${sch.id}-${dateStr}`,
        scheduleId: sch.id,
        routeId: sch.routeId,
        vehicleId: vehicles[dayOffset % 2]?.id ?? null,
        driverId: drivers[dayOffset % 2]?.id ?? null,
        departureTimeUtc: utcDate.toISOString(),
        tripDate: dateStr,
        status: 'scheduled' as const,
        fareKobo: sch.baseFareKobo,
        availableSeats: 5,
        notes: 'Toyota Sienna, 5 seats, A/C, extra legroom, refreshments',
      });
    }
  }
  console.log(`✓ Generated ${generatedTrips.length} trips across the upcoming 7 days.`);

  // 7. Dev Staff User
  // Rule: staff are created by admin only, never self-register
  const devStaffUser = {
    userId: 'user-staff-dev-01',
    name: 'Ascent Operations Lead',
    email: 'admin@atmnigeria.com',
    role: 'staff' as const,
    staffProfile: {
      id: 'staff-profile-01',
      roleTitle: 'Terminal Manager & Head of Operations',
      terminalId: 'term-enugu-ogui',
      phone: '+2349070000625',
      active: true,
    },
  };
  console.log(`✓ Seeded dev staff user: ${devStaffUser.email} (staff role).`);

  // 8. Core Settings (Cancellation policy, credit rules, booking hold minutes)
  const defaultSettings = [
    {
      key: 'booking.holdMinutes',
      value: { holdMinutes: 10 },
    },
    {
      key: 'booking.maxAdvanceDays',
      value: { maxAdvanceDays: 30 },
    },
    {
      key: 'booking.cutoffMinutes',
      value: { cutoffMinutes: 60 },
    },
    {
      key: 'cancellation_policy',
      value: DEFAULT_CANCELLATION_POLICY,
    },
    {
      key: 'credit_rules',
      value: {
        allowCustomerCredits: true,
        autoRefundToCreditOnCancellation: true,
        creditExpiryDays: 365,
      },
    },
  ];
  console.log(`✓ Seeded ${defaultSettings.length} system configuration entries.`);

  return {
    terminalsCount: terminals.length,
    routesCount: routes.length,
    vehiclesCount: vehicles.length,
    driversCount: drivers.length,
    schedulesCount: schedules.length,
    tripsCount: generatedTrips.length,
    staffUsersCount: 1,
    settingsCount: defaultSettings.length,
  };
}

if (typeof process !== 'undefined' && process.argv && process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  runSeed()
    .then((report) => {
      console.log('Seed completed successfully:', report);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
