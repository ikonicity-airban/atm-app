import test from 'node:test';
import assert from 'node:assert/strict';
import {
  StaticTripRepository,
} from '../../../apps/web/src/server/repositories/trips.ts';
import {
  StaticSettingsRepository,
} from '../../../apps/web/src/server/repositories/settings.ts';
import { getLagosDate } from '../src/utils/search.ts';

test('StaticTripRepository contract: searchTrips for served and unserved corridors', async () => {
  const repo = new StaticTripRepository();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);
  const dateStr = getLagosDate(futureDate);

  // 1. Served Corridor: Enugu -> Abuja
  const trips = await repo.searchTrips({
    originCity: 'Enugu',
    destinationCity: 'Abuja',
    date: dateStr,
    passengers: 2,
  });

  assert.ok(trips.length > 0, 'Should return scheduled departures for Enugu -> Abuja');
  const trip = trips[0]!;

  assert.equal(trip.originTerminal.city, 'Enugu');
  assert.equal(trip.destinationTerminal.city, 'Abuja');
  assert.ok(trip.fareKobo > 0, 'Fare must be greater than 0 kobo');
  assert.equal(trip.isPlaceholder, true, 'Seed fare must be flagged as placeholder');
  assert.equal(trip.vehicle.passengerCapacity, 5, 'Toyota Sienna has 5 passenger seats');
  assert.ok(trip.seatsLeft >= 0 && trip.seatsLeft <= 5, 'Seats left must be between 0 and 5');
  assert.equal(trip.bookable, true, 'Future trip should be bookable');

  // 2. Unserved Corridor: Abuja -> Lagos
  const unservedTrips = await repo.searchTrips({
    originCity: 'Abuja',
    destinationCity: 'Lagos',
    date: dateStr,
    passengers: 1,
  });
  assert.equal(unservedTrips.length, 0, 'Unserved corridor must return zero results');
});

test('StaticTripRepository contract: cutoff and past date handling', async () => {
  const repo = new StaticTripRepository();

  // Past date search
  const pastTrips = await repo.searchTrips({
    originCity: 'Enugu',
    destinationCity: 'Abuja',
    date: '2020-01-01',
    passengers: 1,
  });

  // All trips in past date should have bookable === false
  for (const t of pastTrips) {
    assert.equal(t.bookable, false);
    assert.equal(t.unavailableReason, 'Departed');
  }
});

test('SettingsRepository contract: default booking settings', async () => {
  const repo = new StaticSettingsRepository();
  const settings = await repo.getBookingSettings();

  assert.equal(settings.maxAdvanceDays, 30);
  assert.equal(settings.cutoffMinutes, 60);

  const fallbackVal = await repo.getSetting('non_existent_key', 'fallback_value');
  assert.equal(fallbackVal, 'fallback_value');
});
