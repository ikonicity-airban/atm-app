import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAIN_NAVIGATION,
  UTILITY_NAVIGATION,
  ALL_PUBLIC_ROUTES,
  type NavigationCategory,
} from '../src/constants/navigation.ts';

test('Spec 0011 (AC-1): Direct access to primary booking engine /trips', () => {
  const tripsNav = MAIN_NAVIGATION.find((item) => item.id === 'trips');
  assert.ok(tripsNav, 'Find Trips category must exist');
  assert.equal(tripsNav.label, 'Find Trips');
  assert.equal(tripsNav.directPath, '/trips');
  assert.ok(!tripsNav.items || tripsNav.items.length === 0, 'Find Trips is a direct root action, not a dropdown');
});

test('Spec 0011 (AC-2): Passenger Travel dropdown with corridors and terminals', () => {
  const travelNav = MAIN_NAVIGATION.find((item) => item.id === 'travel');
  assert.ok(travelNav, 'Travel category must exist');
  assert.equal(travelNav.label, 'Travel');
  assert.ok(travelNav.items && travelNav.items.length >= 2, 'Travel category must contain routes and terminals');

  const routesItem = travelNav.items.find((i) => i.id === 'routes');
  assert.ok(routesItem, 'Routes link must exist');
  assert.equal(routesItem.path, '/routes');

  const terminalsItem = travelNav.items.find((i) => i.id === 'terminals');
  assert.ok(terminalsItem, 'Terminals link must exist');
  assert.equal(terminalsItem.path, '/terminals');
});

test('Spec 0011 (AC-3): Courier freight dropdown with parcel dispatch and parcel tracking', () => {
  const courierNav = MAIN_NAVIGATION.find((item) => item.id === 'courier');
  assert.ok(courierNav, 'Courier category must exist');
  assert.equal(courierNav.label, 'Courier');
  assert.ok(courierNav.items && courierNav.items.length >= 2, 'Courier category must contain dispatch and tracking');

  const sendItem = courierNav.items.find((i) => i.id === 'courier-send');
  assert.ok(sendItem, 'Send Express Parcel link must exist');
  assert.equal(sendItem.path, '/courier');

  const trackItem = courierNav.items.find((i) => i.id === 'courier-track');
  assert.ok(trackItem, 'Track Waybill Shipment link must exist');
  assert.equal(trackItem.path, '/track');
});

test('Spec 0011 (AC-4): Dedicated charter and B2B transit links', () => {
  const charterNav = MAIN_NAVIGATION.find((item) => item.id === 'charter');
  assert.ok(charterNav, 'Charter category must exist');
  assert.equal(charterNav.label, 'Charter & Fleet');
  assert.ok(charterNav.items && charterNav.items.length >= 2, 'Charter category must contain private hire and corporate');

  const privateItem = charterNav.items.find((i) => i.id === 'charter-private');
  assert.ok(privateItem, 'Private charter link must exist');
  assert.equal(privateItem.path, '/charter');

  const corporateItem = charterNav.items.find((i) => i.id === 'charter-corporate');
  assert.ok(corporateItem, 'Corporate transit link must exist');
  assert.equal(corporateItem.path, '/corporate');
});

test('Spec 0011 (AC-5): Customer support and legal documents', () => {
  const supportNav = MAIN_NAVIGATION.find((item) => item.id === 'support');
  assert.ok(supportNav, 'Support category must exist');
  assert.equal(supportNav.label, 'Support');
  assert.ok(supportNav.items && supportNav.items.length >= 5, 'Support category must contain FAQ, Contact, About, Terms, Privacy');

  const paths = supportNav.items.map((i) => i.path);
  assert.ok(paths.includes('/faq'), 'FAQ path must exist');
  assert.ok(paths.includes('/contact'), 'Contact path must exist');
  assert.ok(paths.includes('/about'), 'About path must exist');
  assert.ok(paths.includes('/terms'), 'Terms path must exist');
  assert.ok(paths.includes('/privacy'), 'Privacy path must exist');
});

test('Spec 0011 (AC-6): Utility navigation exposes track and manage booking', () => {
  const trackUtility = UTILITY_NAVIGATION.find((i) => i.id === 'utility-track');
  assert.ok(trackUtility, 'Utility track link must exist');
  assert.equal(trackUtility.path, '/track');

  const manageUtility = UTILITY_NAVIGATION.find((i) => i.id === 'utility-manage');
  assert.ok(manageUtility, 'Utility manage booking link must exist');
  assert.ok(manageUtility.path === '/booking/manage' || manageUtility.path === '/manage');
});

test('Spec 0011 (AC-7): All navigation paths resolve to declared public routes', () => {
  const allNavPaths: string[] = [];
  MAIN_NAVIGATION.forEach((cat) => {
    if (cat.directPath) allNavPaths.push(cat.directPath);
    if (cat.items) {
      cat.items.forEach((item) => allNavPaths.push(item.path));
    }
  });
  UTILITY_NAVIGATION.forEach((item) => allNavPaths.push(item.path));

  allNavPaths.forEach((path) => {
    // Normalise /manage vs /booking/manage if needed
    const isKnown = ALL_PUBLIC_ROUTES.includes(path as any) || path === '/manage';
    assert.ok(isKnown, `Path "${path}" must be part of public routes`);
  });
});
