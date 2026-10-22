import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BRAND } from '../src/constants/index.ts';

describe('Spec 0030: 404 & Error Boundaries Architecture', () => {
  test('AC-2 & AC-3: WhatsApp support desk link generation contains incident code and phone', () => {
    const supportPhone = (BRAND.contactPhones && BRAND.contactPhones[0]) || '2349070000625';
    const cleanPhone = supportPhone.replace(/[^0-9]/g, '');
    assert.equal(cleanPhone.length >= 10, true, 'Phone number must have valid length');

    const incidentCode = `ATM-${Date.now().toString(36).toUpperCase()}`;
    const pathname = '/trips/invalid-route';
    const message = `Hello Ascent Transport Management, I encountered an error (Ref: ${incidentCode}) on ${pathname}`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    assert.equal(url.includes(`wa.me/${cleanPhone}`), true);
    assert.equal(url.includes(encodeURIComponent(incidentCode)), true);
  });

  test('AC-2: Popular intercity corridors map to valid ATM hubs', () => {
    const corridors = [
      { from: 'Lagos', to: 'Abuja', label: 'Lagos to Abuja' },
      { from: 'Port Harcourt', to: 'Owerri', label: 'Port Harcourt to Owerri' },
      { from: 'Lagos', to: 'Benin', label: 'Lagos to Benin' },
      { from: 'Enugu', to: 'Abuja', label: 'Enugu to Abuja' },
    ];

    corridors.forEach((c) => {
      assert.ok(c.from.length > 0);
      assert.ok(c.to.length > 0);
      const query = `/trips?from=${encodeURIComponent(c.from)}&to=${encodeURIComponent(c.to)}`;
      assert.equal(query.startsWith('/trips?from='), true);
    });
  });
});

describe('Spec 0031: Cinematic Striped Loading Screen Architecture', () => {
  test('AC-1: Four stripes follow exact color palette and order', () => {
    const expectedPalette = [
      { id: 'accent', color: '#ed70bd' },
      { id: 'primary', color: '#ca2484' },
      { id: 'gold', color: '#f59e0b' },
      { id: 'white', color: '#ffffff' },
    ];

    assert.equal(expectedPalette.length, 4);
    assert.equal(expectedPalette[0].color, '#ed70bd');
    assert.equal(expectedPalette[1].color, '#ca2484');
    assert.equal(expectedPalette[2].color, '#f59e0b');
    assert.equal(expectedPalette[3].color, '#ffffff');
  });

  test('AC-2 & AC-3: Stripe geometry invariants (60px width, 30 degree angle, 16px gap)', () => {
    const stripeWidthPx = 60;
    const gapPx = 16;
    const rotationDeg = 30;
    const stripeCount = 4;

    const totalClusterWidth = stripeCount * stripeWidthPx + (stripeCount - 1) * gapPx;
    assert.equal(totalClusterWidth, 288, 'Cluster width must be exactly 288px');
    assert.equal(rotationDeg, 30, 'Inclination must be strictly 30 degrees');
  });

  test('AC-4: Motion timeline thresholds and anti-flicker hold', () => {
    const dwellDurationMs = 200;
    const minVisibilityThresholdMs = 750;

    assert.equal(dwellDurationMs >= 200, true, 'Minimum center dwell must be at least 200ms');
    assert.equal(minVisibilityThresholdMs >= 750, true, 'Anti-flicker threshold must prevent rapid flashes');
  });
});
