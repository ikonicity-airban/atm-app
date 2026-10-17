import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CORRIDOR_WAYPOINTS_MAP,
  telematicsLookupSchema,
  interpolateCorridorProgress,
  calculateIncidentDelayMinutes,
  calculateCorridorBearing,
  formatTelematicsWat,
  normalisePhone,
  type RoadsideIncidentReport,
} from '@atm/shared';

test('Phase 15: Real-Time Fleet Telematics and Journey Tracking (Spec 0022)', async (t) => {
  await t.test('AC-2: Telematics Lookup Schema & Phone Normalization', async () => {
    // Valid lookups
    const validLookup = telematicsLookupSchema.safeParse({
      bookingReference: 'ATM-7K9W2P',
      passengerPhone: '08031234567',
    });
    assert.equal(validLookup.success, true);
    if (validLookup.success) {
      assert.equal(validLookup.data.bookingReference, 'ATM-7K9W2P');
    }

    // Normalizes with +234
    const intlPhoneLookup = telematicsLookupSchema.safeParse({
      bookingReference: 'ATM-8M3X1Q',
      passengerPhone: '+234 803 123 4567',
    });
    assert.equal(intlPhoneLookup.success, true);

    // Rejects invalid booking reference format
    const invalidRef = telematicsLookupSchema.safeParse({
      bookingReference: 'INVALID-REF',
      passengerPhone: '08031234567',
    });
    assert.equal(invalidRef.success, false);

    // Rejects malformed phone numbers
    const invalidPhone = telematicsLookupSchema.safeParse({
      bookingReference: 'ATM-7K9W2P',
      passengerPhone: '12345',
    });
    assert.equal(invalidPhone.success, false);
  });

  await t.test('AC-4 & AC-5: Nigerian Highway Corridor Waypoints Geometry', async () => {
    const enuguAbujaConfig = CORRIDOR_WAYPOINTS_MAP['enugu-abuja'];
    assert.ok(enuguAbujaConfig, 'Enugu to Abuja corridor config must exist');
    assert.equal(enuguAbujaConfig.totalDistanceKm, 420);
    assert.ok(enuguAbujaConfig.waypoints.length >= 6);

    // First waypoint is terminal at 0 km
    const firstWp = enuguAbujaConfig.waypoints[0];
    assert.ok(firstWp);
    assert.equal(firstWp.distanceFromOriginKm, 0);
    assert.equal(firstWp.name, 'Ogui Road Terminal');

    // Last waypoint is terminal at 420 km
    const lastWp = enuguAbujaConfig.waypoints[enuguAbujaConfig.waypoints.length - 1];
    assert.ok(lastWp);
    assert.equal(lastWp.distanceFromOriginKm, 420);
    assert.equal(lastWp.name, 'Utako Terminal');

    // Coordinates are in valid Nigerian bounds
    for (const wp of enuguAbujaConfig.waypoints) {
      assert.ok(wp.latitude >= 4.0 && wp.latitude <= 14.0, `Latitude ${wp.latitude} within Nigeria`);
      assert.ok(wp.longitude >= 2.5 && wp.longitude <= 15.0, `Longitude ${wp.longitude} within Nigeria`);
    }
  });

  await t.test('AC-4 & AC-6: Corridor Progress Interpolation & Bearing Calculation', async () => {
    // Progress at 50% along corridor
    const result = interpolateCorridorProgress('enugu-abuja', 50);
    assert.equal(result.progressPercentage, 50);
    assert.equal(result.currentKilometers, 210);

    // Telematics values
    assert.ok(result.telematics.latitude > 6.44 && result.telematics.latitude < 9.07);
    assert.ok(result.telematics.longitude > 7.4 && result.telematics.longitude < 8.6);
    assert.ok(result.telematics.speedKmh > 50, 'Vehicle in motion should cruise around highway speed');

    // Bearing is within 0-360 degrees
    assert.ok(result.telematics.bearingDegrees >= 0 && result.telematics.bearingDegrees <= 360);

    // Waypoint statuses: earlier waypoints passed, middle current, later upcoming
    const passedWps = result.waypoints.filter((w) => w.status === 'passed');
    const upcomingWps = result.waypoints.filter((w) => w.status === 'upcoming');
    assert.ok(passedWps.length > 0);
    assert.ok(upcomingWps.length > 0);
  });

  await t.test('AC-6 & AC-7: Phase 14 Incident Delay Impact Calculation', async () => {
    const mockIncidents: RoadsideIncidentReport[] = [
      {
        id: 'inc-1',
        tripId: 'trip-1',
        driverId: 'drv-1',
        category: 'mechanical_breakdown',
        description: 'Flat tire near Otukpo bypass',
        reportedAtUtc: new Date().toISOString(),
        status: 'active',
      },
      {
        id: 'inc-2',
        tripId: 'trip-1',
        driverId: 'drv-1',
        category: 'checkpoint_delay',
        description: 'FRSC highway inspection clearance',
        reportedAtUtc: new Date().toISOString(),
        status: 'active',
      },
    ];

    const delayMinutes = calculateIncidentDelayMinutes(mockIncidents);
    // 60 min breakdown + 25 min checkpoint = 85 mins
    assert.equal(delayMinutes, 85);

    // Active breakdown sets current vehicle speed to 0 km/h
    const delayedProgress = interpolateCorridorProgress('enugu-abuja', 45, mockIncidents);
    assert.equal(delayedProgress.telematics.speedKmh, 0);
  });

  await t.test('AC-8: Telematics WAT Formatting & Integrity', async () => {
    const testDate = new Date('2026-10-17T06:30:00Z');
    const formattedWat = formatTelematicsWat(testDate);
    assert.ok(formattedWat.includes('WAT'));
  });
});
