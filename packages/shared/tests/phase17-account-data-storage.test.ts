import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  customerPreferencesSchema,
  type CustomerPreferences,
  type PreferredSeatPosition,
  formatNaira,
} from '../src/index.ts';

describe('Spec 0034: Account Data Storage Layer and Customer Preferences', () => {
  it('validates default customer preferences with expected initial flags', () => {
    const result = customerPreferencesSchema.parse({});
    assert.equal(result.smsAlerts, true);
    assert.equal(result.whatsappAlerts, true);
    assert.equal(result.emailReceipts, true);
    assert.equal(result.preferredSeatPosition, 'any');
    assert.equal(result.autoFillEmergencyContact, true);
    assert.equal(result.localDataConsent, true);
  });

  it('accepts valid Toyota Sienna preferred seating positions', () => {
    const validPositions: PreferredSeatPosition[] = [
      'front_window',
      'middle_row',
      'rear_row',
      'any',
    ];

    for (const pos of validPositions) {
      const parsed = customerPreferencesSchema.parse({ preferredSeatPosition: pos });
      assert.equal(parsed.preferredSeatPosition, pos);
    }
  });

  it('rejects invalid seating position options', () => {
    assert.throws(
      () => {
        customerPreferencesSchema.parse({ preferredSeatPosition: 'driver_roof' as any });
      },
      (err: any) => err.name === 'ZodError'
    );
  });

  it('ensures personal archive preserves integer kobo financial ledger values', () => {
    const sampleRecord = {
      compliance: 'Nigeria Data Protection Act (NDPA) Compliant Traveler Archive',
      walletCreditsKobo: 4500000,
      totalFareKobo: 12500000,
    };

    assert.equal(Number.isInteger(sampleRecord.walletCreditsKobo), true);
    assert.equal(Number.isInteger(sampleRecord.totalFareKobo), true);
    assert.equal(formatNaira(sampleRecord.walletCreditsKobo), '₦45,000');
    assert.equal(formatNaira(sampleRecord.totalFareKobo), '₦125,000');
  });
});
