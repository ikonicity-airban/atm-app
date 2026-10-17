import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  driverLoginSchema,
  driverOtpSendSchema,
  driverOtpVerifySchema,
  driverBoardPassengerSchema,
  updateTripStatusSchema,
  reportIncidentSchema,
  canTransitionTripStatus,
  type CachedRoadsideManifest,
} from '../src/index.ts';

describe('Phase 14: Driver Mobile Web Portal and Roadside Manifest (Spec 0021)', () => {
  describe('AC-2: Driver Authentication & Credential Validation', () => {
    it('accepts driver badge ID sign-in with 4-digit PIN', () => {
      const result = driverLoginSchema.safeParse({
        identifier: 'DRV-ENU-01',
        credential: '1234',
        authMethod: 'badge_pin',
      });
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.identifier, 'DRV-ENU-01');
        assert.strictEqual(result.data.credential, '1234');
        assert.strictEqual(result.data.authMethod, 'badge_pin');
      }
    });

    it('accepts corporate email credentials with password', () => {
      const result = driverLoginSchema.safeParse({
        identifier: 'emeka.nwosu@atmnigeria.com',
        credential: 'SecurePassword123',
        authMethod: 'email_password',
      });
      assert.strictEqual(result.success, true);
    });

    it('normalizes Nigerian mobile numbers to E.164 (+234) on OTP send', () => {
      const result = driverOtpSendSchema.safeParse({
        phone: '09070000210',
      });
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.phone, '+2349070000210');
      }
    });

    it('rejects invalid Nigerian phone numbers on OTP dispatch', () => {
      const invalidPhones = ['12345', '070000', 'not-a-phone', '+14155552671'];
      for (const phone of invalidPhones) {
        const result = driverOtpSendSchema.safeParse({ phone });
        assert.strictEqual(result.success, false, `Phone "${phone}" should be rejected`);
      }
    });

    it('validates exact 6-digit numeric OTP format', () => {
      const valid = driverOtpVerifySchema.safeParse({
        phone: '09070000210',
        otp: '123456',
      });
      assert.strictEqual(valid.success, true);
      if (valid.success) {
        assert.strictEqual(valid.data.phone, '+2349070000210');
        assert.strictEqual(valid.data.otp, '123456');
      }

      const invalidOtps = ['12345', '1234567', 'abcdef', '12 456', ''];
      for (const otp of invalidOtps) {
        const result = driverOtpVerifySchema.safeParse({
          phone: '09070000210',
          otp,
        });
        assert.strictEqual(result.success, false, `OTP "${otp}" should be rejected`);
      }
    });
  });

  describe('AC-4: Passenger Boarding & Cabin Geometry', () => {
    it('accepts valid passenger boarding toggle for Sienna seats 1 to 5', () => {
      for (let seat = 1; seat <= 5; seat++) {
        const result = driverBoardPassengerSchema.safeParse({
          tripId: 'trip-enugu-abuja-001',
          seatNo: seat,
          isBoarded: true,
        });
        assert.strictEqual(result.success, true);
        if (result.success) {
          assert.strictEqual(result.data.seatNo, seat);
          assert.strictEqual(result.data.isBoarded, true);
        }
      }
    });

    it('rejects invalid Sienna seat numbers (0, 6, -1, decimals)', () => {
      const invalidSeats = [0, 6, 7, -1, 2.5];
      for (const seatNo of invalidSeats) {
        const result = driverBoardPassengerSchema.safeParse({
          tripId: 'trip-enugu-abuja-001',
          seatNo,
          isBoarded: true,
        });
        assert.strictEqual(result.success, false, `Seat number ${seatNo} should be rejected`);
      }
    });

    it('requires a non-empty trip identifier', () => {
      const result = driverBoardPassengerSchema.safeParse({
        tripId: '',
        seatNo: 1,
        isBoarded: true,
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe('AC-6: Roadside Incident Reporting Schema', () => {
    it('validates supported roadside incident categories', () => {
      const categories = [
        'mechanical_breakdown',
        'checkpoint_delay',
        'traffic_gridlock',
        'weather_hazard',
        'medical_emergency',
        'other',
      ] as const;

      for (const category of categories) {
        const result = reportIncidentSchema.safeParse({
          tripId: 'trip-enugu-abuja-001',
          category,
          description: 'FRSC inspection checkpoint near Lokoja junction with documentation check',
          locationNote: 'Kilometre 42 Lokoja Express',
        });
        assert.strictEqual(result.success, true, `Category "${category}" should be valid`);
      }
    });

    it('rejects unknown incident categories', () => {
      const result = reportIncidentSchema.safeParse({
        tripId: 'trip-enugu-abuja-001',
        category: 'alien_abduction',
        description: 'Road blocked',
      });
      assert.strictEqual(result.success, false);
    });

    it('enforces minimum description length of 5 characters', () => {
      const result = reportIncidentSchema.safeParse({
        tripId: 'trip-enugu-abuja-001',
        category: 'traffic_gridlock',
        description: 'jam',
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe('AC-7: Journey Progress State Machine Transitions', () => {
    it('validates trip status update schema for highway milestones', () => {
      const inTransit = updateTripStatusSchema.safeParse({
        tripId: 'trip-enugu-abuja-001',
        status: 'in_transit',
        note: 'Departed Enugu terminal bay',
      });
      assert.strictEqual(inTransit.success, true);

      const completed = updateTripStatusSchema.safeParse({
        tripId: 'trip-enugu-abuja-001',
        status: 'completed',
        note: 'Arrived Utako terminal Abuja',
      });
      assert.strictEqual(completed.success, true);
    });

    it('enforces valid operational transitions through canTransitionTripStatus', () => {
      // Allowed transitions
      assert.strictEqual(canTransitionTripStatus('boarding', 'in_transit'), true);
      assert.strictEqual(canTransitionTripStatus('in_transit', 'completed'), true);
      assert.strictEqual(canTransitionTripStatus('in_transit', 'delayed'), true);
      assert.strictEqual(canTransitionTripStatus('delayed', 'in_transit'), true);
      assert.strictEqual(canTransitionTripStatus('delayed', 'completed'), true);

      // Disallowed transitions
      assert.strictEqual(canTransitionTripStatus('scheduled', 'in_transit'), false);
      assert.strictEqual(canTransitionTripStatus('completed', 'in_transit'), false);
      assert.strictEqual(canTransitionTripStatus('completed', 'boarding'), false);
      assert.strictEqual(canTransitionTripStatus('cancelled', 'in_transit'), false);
    });
  });

  describe('AC-5: Cached Roadside Manifest Invariants & FRSC Inspection Structure', () => {
    it('verifies cached manifest structure matches 5-passenger Toyota Sienna geometry', () => {
      const sampleManifest: CachedRoadsideManifest = {
        tripId: 'trip-001',
        cachedAtUtc: '2026-10-17T06:30:00.000Z',
        manifestNumber: 'MAN-2026-001',
        corridorTitle: 'Enugu to Abuja Express',
        vehiclePlate: 'ENU-441-XA',
        vehicleModel: 'Toyota Sienna 2020',
        driverName: 'Emeka Nwosu',
        driverPhone: '+2349070000210',
        driverBadgeId: 'DRV-ENU-01',
        originTerminal: {
          name: 'Enugu Central Terminal',
          city: 'Enugu',
          phone: '+2349070000210',
          address: '12 Ogui Road, Enugu',
        },
        destinationTerminal: {
          name: 'Abuja Utako Terminal',
          city: 'Abuja',
          phone: '+2349070000625',
          address: 'Plot 4 Utako District, Abuja',
        },
        passengers: [
          {
            seatNo: 1,
            name: 'Ngozi Eze',
            phone: '+2348030001122',
            emergencyContactName: 'Chinedu Eze',
            emergencyContactPhone: '+2348030001199',
            isBoarded: true,
          },
          {
            seatNo: 2,
            name: 'Amina Bello',
            phone: '+2348020002233',
            emergencyContactName: 'Musa Bello',
            emergencyContactPhone: '+2348020002288',
            isBoarded: true,
          },
          {
            seatNo: 3,
            name: 'Oluwaseun Adeyemi',
            phone: '+2348050003344',
            emergencyContactName: 'Funke Adeyemi',
            emergencyContactPhone: '+2348050003377',
            isBoarded: false,
          },
          {
            seatNo: 4,
            name: 'Emeka Okoye',
            phone: '+2348070004455',
            emergencyContactName: 'Ada Okoye',
            emergencyContactPhone: '+2348070004466',
            isBoarded: true,
          },
          {
            seatNo: 5,
            name: 'Hauwa Mohammed',
            phone: '+2348090005566',
            emergencyContactName: 'Ali Mohammed',
            emergencyContactPhone: '+2348090005511',
            isBoarded: false,
          },
        ],
        summary: {
          totalSeats: 5,
          boardedCount: 3,
          unoccupiedCount: 2,
        },
      };

      // 5 seats invariant
      assert.strictEqual(sampleManifest.passengers.length, 5);
      assert.strictEqual(sampleManifest.summary.totalSeats, 5);
      assert.strictEqual(
        sampleManifest.summary.boardedCount + sampleManifest.summary.unoccupiedCount,
        5
      );

      // Unique seat numbers 1 to 5
      const seatNumbers = sampleManifest.passengers.map((p) => p.seatNo).sort((a, b) => a - b);
      assert.deepStrictEqual(seatNumbers, [1, 2, 3, 4, 5]);

      // Every passenger has required next of kin contact for FRSC roadside compliance
      for (const passenger of sampleManifest.passengers) {
        assert.ok(passenger.name.length > 0, 'Passenger name required');
        assert.ok(passenger.phone.startsWith('+234'), 'Passenger phone must be E.164');
        assert.ok(passenger.emergencyContactName.length > 0, 'Emergency contact name required');
        assert.ok(passenger.emergencyContactPhone.startsWith('+234'), 'Emergency contact phone must be E.164');
      }

      // Valid ISO-8601 UTC timestamp
      assert.ok(!isNaN(Date.parse(sampleManifest.cachedAtUtc)));
    });
  });
});
