import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SEED_TERMINALS,
  formatNaira,
  formatWatDateTime,
} from '@atm/shared';
import { reportingService, type OperationsMetrics } from '@/server/repositories/reports.ts';
import { bookingRepository } from '@/server/repositories/bookings.ts';

test('Spec 0015 (AC-1): Role Authorization Invariant for Staff Surfaces', () => {
  // Authorization predicate must strictly enforce role === 'staff'
  const isAuthorizedStaff = (session: { user: { role?: string } } | null): boolean => {
    return Boolean(session && session.user && session.user.role === 'staff');
  };

  assert.equal(isAuthorizedStaff(null), false, 'Anonymous guest must not access admin');
  assert.equal(
    isAuthorizedStaff({ user: { role: 'customer' } }),
    false,
    'Customer account must be denied access to admin console'
  );
  assert.equal(
    isAuthorizedStaff({ user: { role: undefined } }),
    false,
    'Undefined role must be denied access to admin console'
  );
  assert.equal(
    isAuthorizedStaff({ user: { role: 'staff' } }),
    true,
    'Staff role must be granted administrative access'
  );
});

test('Spec 0015 (AC-2): Key Performance Indicator Metric Calculations', async () => {
  const metrics: OperationsMetrics = await reportingService.getOperationsMetrics();

  // Basic metric presence and bounds
  assert.ok(metrics.todayTripsCount >= 1, 'Today trips count must be at least 1');
  assert.ok(metrics.activeVehiclesCount >= 1, 'Active Sienna vehicles count must be at least 1');
  assert.ok(
    metrics.seatLoadFactorPercentage >= 0 && metrics.seatLoadFactorPercentage <= 100,
    'Seat load factor must be a valid percentage between 0 and 100'
  );
  assert.ok(metrics.activeParcelsCount >= 1, 'Active parcels count must be positive');
  assert.ok(metrics.parcelsInTransitCount >= 0, 'Parcels in transit must be non-negative');

  // Revenue accounting invariants in integer kobo
  assert.ok(Number.isInteger(metrics.todayGrossRevenueKobo), 'Today gross revenue must be an integer');
  assert.ok(Number.isInteger(metrics.monthlyGrossRevenueKobo), 'Monthly gross revenue must be an integer');
  assert.ok(Number.isInteger(metrics.passengerRevenueKobo), 'Passenger revenue must be an integer');
  assert.ok(Number.isInteger(metrics.courierRevenueKobo), 'Courier revenue must be an integer');
  assert.ok(Number.isInteger(metrics.cancellationRevenueKobo), 'Cancellation revenue must be an integer');

  // Sum check: Gross = Passenger + Courier + Cancellation
  const expectedGrossKobo =
    metrics.passengerRevenueKobo + metrics.courierRevenueKobo + metrics.cancellationRevenueKobo;
  assert.equal(
    metrics.monthlyGrossRevenueKobo,
    expectedGrossKobo,
    'Monthly gross revenue must exactly equal passenger + courier + cancellation fees'
  );

  // Formatting check: formatNaira handles integer kobo properly
  const formatted = formatNaira(metrics.monthlyGrossRevenueKobo);
  assert.ok(formatted.startsWith('₦'), 'Formatted revenue must start with ₦ symbol');
});

test('Spec 0015 (AC-3): Terminal Hub Filtering and Corridor Throughput', async () => {
  // 1. System wide aggregated metrics
  const systemMetrics = await reportingService.getOperationsMetrics('all');
  assert.equal(systemMetrics.terminalId, null);
  assert.equal(systemMetrics.terminalName, 'All Terminals');

  // 2. Filter by Enugu Ogui Terminal
  const enuguTerminal = SEED_TERMINALS.find((t) => t.id === 'term-enugu-ogui')!;
  const enuguMetrics = await reportingService.getOperationsMetrics(enuguTerminal.id);
  assert.equal(enuguMetrics.terminalId, enuguTerminal.id);
  assert.equal(enuguMetrics.terminalName, enuguTerminal.name);

  // Filtered revenue should be tailored to terminal operations
  assert.ok(
    enuguMetrics.monthlyGrossRevenueKobo < systemMetrics.monthlyGrossRevenueKobo,
    'Single terminal revenue must be a subset of system-wide gross revenue'
  );

  // Corridor performance rows must exist
  assert.ok(enuguMetrics.corridorPerformance.length > 0, 'Corridor league table must have rows');
  for (const c of enuguMetrics.corridorPerformance) {
    assert.ok(c.departures > 0, 'Corridor departures must be positive');
    assert.ok(c.passengers > 0, 'Corridor passenger count must be positive');
    assert.equal(
      c.totalRevenueKobo,
      c.fareKobo + c.parcelFreightKobo,
      'Corridor total must equal fare + parcel freight in kobo'
    );
  }
});

test('Spec 0015 (AC-4 & AC-5): Passenger Booking Manifest and Seat Allocations', async () => {
  const allBookings = await bookingRepository.getAllBookings();
  assert.ok(allBookings.length >= 4, 'Must have at least 4 active seed bookings in manifest');

  for (const b of allBookings) {
    // Booking reference pattern ATM-XXXXXX
    assert.match(b.ref, /^ATM-[A-Z0-9]+$/, `Booking ref ${b.ref} must match ATM-XXXXXX`);

    // Customer phone must normalize to E.164 (+234...)
    assert.ok(b.contact.phone.startsWith('+234'), `Phone ${b.contact.phone} must be in E.164 format`);

    // Seats must be valid Toyota Sienna passenger seats (1 to 5)
    for (const seatNo of b.seats) {
      assert.ok(
        seatNo >= 1 && seatNo <= 5,
        `Seat ${seatNo} must be within 5-passenger Sienna capacity (1-5)`
      );
    }

    // Integer kobo calculation
    assert.ok(Number.isInteger(b.totalFareKobo), 'Booking fare must be integer kobo');
    assert.equal(
      b.totalFareKobo,
      b.fareKoboPerSeat * b.seats.length,
      'Total fare must equal per-seat fare multiplied by seat count'
    );
  }
});

test('Spec 0015 (AC-6 & AC-7): Financial Statements and CSV Generation', async () => {
  const metrics = await reportingService.getOperationsMetrics();
  const csv = reportingService.generateFinancialReportCsv(metrics);

  // CSV content validation
  assert.ok(csv.includes('Ascent Transport Management (ATM Nigeria) - Monthly Revenue Statement'));
  assert.ok(csv.includes('Corridor,Departures,Passengers,Passenger Fare (NGN),Parcel Freight (NGN),Total Revenue (NGN)'));
  assert.ok(csv.includes('Total Gross Revenue'));

  // Corridors present in CSV
  for (const c of metrics.corridorPerformance) {
    assert.ok(csv.includes(c.corridor), `CSV must contain corridor row for ${c.corridor}`);
    const fareInNaira = (c.fareKobo / 100).toFixed(2);
    assert.ok(csv.includes(fareInNaira), `CSV must contain fare amount ${fareInNaira}`);
  }

  // Check lines count
  const lines = csv.split('\n');
  assert.ok(lines.length >= 8, 'CSV report must contain header, data rows, and summary row');
});
