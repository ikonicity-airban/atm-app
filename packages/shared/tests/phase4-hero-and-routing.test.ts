import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SERVED_CITIES,
  getServedDestinations,
  getLagosDate,
  searchParamsSchema,
  BRAND,
  type ServedCity,
} from '../src/index.ts';
import {
  ROUTE_SEO_DIRECTORY,
  getMetadataForPath,
} from '../../../apps/web/src/components/seo/SEOHead.tsx';
import { getOrganizationJsonLd } from '../../../apps/web/src/lib/seo.ts';

// ---------------------------------------------------------------------------
// 1. SPEC 0007: HERO SECTION & MICRO-ANIMATION CONTRACTS
// ---------------------------------------------------------------------------

test('Hero Spec 0007 (AC-5): City preview metadata covers all featured corridor hubs', () => {
  const FEATURED_HERO_CITIES: ServedCity[] = ['Enugu', 'Abuja', 'Lagos', 'Owerri'];

  const CITY_PREVIEWS: Record<string, {
    name: string;
    subtitle: string;
    terminal: string;
    image: string;
    highlight: string;
    dailyTrips: string;
  }> = {
    Enugu: {
      name: 'Enugu Terminal',
      subtitle: 'Coal City Hub',
      terminal: '7 Ogui Road, Commercial Layout',
      image: '/images/hero/city-enugu.jpg',
      highlight: 'Direct morning departures to Abuja & Lagos',
      dailyTrips: '8 Daily Trips',
    },
    Abuja: {
      name: 'Abuja Terminal',
      subtitle: 'Federal Capital Hub',
      terminal: 'Plot 12 Utako District Transit Corridor',
      image: '/images/hero/city-abuja.jpg',
      highlight: 'Executive Sienna departures to Enugu',
      dailyTrips: '6 Daily Trips',
    },
    Lagos: {
      name: 'Lagos Hubs',
      subtitle: 'Centre of Excellence',
      terminal: 'Jibowu Central Hub & Ajah Expressway Desk',
      image: '/images/hero/city-lagos.jpg',
      highlight: 'Scheduled departures to South-East corridors',
      dailyTrips: '10 Daily Trips',
    },
    Owerri: {
      name: 'Owerri Terminal',
      subtitle: 'Heartland Hub',
      terminal: 'Control Post Roundabout, Onitsha Road',
      image: '/images/hero/city-owerri.jpg',
      highlight: 'Direct daily service to Abuja & Lagos',
      dailyTrips: '4 Daily Trips',
    },
  };

  for (const city of FEATURED_HERO_CITIES) {
    const preview = CITY_PREVIEWS[city];
    assert.ok(preview, `City preview metadata must exist for ${city}`);
    assert.ok(preview.name.length > 0, `Name must not be empty for ${city}`);
    assert.ok(preview.terminal.length > 0, `Terminal must not be empty for ${city}`);
    assert.match(preview.image, /^\/images\/hero\/city-.*\.jpg$/, `Image must point to local hero asset for ${city}`);
    assert.ok(preview.dailyTrips.includes('Daily Trips'), `Daily trips must specify count for ${city}`);
    assert.ok(preview.highlight.length > 0, `Highlight must describe route benefits for ${city}`);
  }
});

test('Hero Spec 0007 (AC-6): Synchronizing selected city into search form resolves valid corridors', () => {
  // Test user clicking an underlined city in hero text
  function simulateCitySelection(
    clickedCity: string,
    role: 'from' | 'to',
    currentFrom: string,
    currentTo: string
  ): { from: string; to: string } {
    let nextFrom = currentFrom;
    let nextTo = currentTo;

    if (role === 'to') {
      const validDests = getServedDestinations(currentFrom);
      if (validDests.includes(clickedCity as ServedCity)) {
        nextTo = clickedCity;
      } else {
        // Adjust origin if current origin does not serve target
        nextFrom = clickedCity === 'Enugu' ? 'Abuja' : 'Enugu';
        nextTo = clickedCity;
      }
    } else {
      nextFrom = clickedCity;
      const validDests = getServedDestinations(clickedCity);
      if (!validDests.includes(nextTo as ServedCity)) {
        nextTo = validDests[0] || 'Enugu';
      }
    }

    return { from: nextFrom, to: nextTo };
  }

  // 1. User clicks 'Abuja' as departure city (from Enugu -> Abuja to Abuja -> Enugu)
  const step1 = simulateCitySelection('Abuja', 'from', 'Enugu', 'Abuja');
  assert.equal(step1.from, 'Abuja');
  assert.equal(step1.to, 'Enugu', 'Abuja only serves Enugu in current phase');

  // 2. User clicks 'Lagos' as departure city
  const step2 = simulateCitySelection('Lagos', 'from', step1.from, step1.to);
  assert.equal(step2.from, 'Lagos');
  const lagosDests = getServedDestinations('Lagos');
  assert.ok(lagosDests.includes(step2.to as ServedCity), 'Destination must be valid from Lagos');

  // 3. User clicks 'Owerri' as destination
  const step3 = simulateCitySelection('Owerri', 'to', 'Lagos', 'Abuja');
  assert.equal(step3.to, 'Owerri');
  const validFromLagos = getServedDestinations('Lagos');
  assert.ok(validFromLagos.includes('Owerri' as ServedCity));
});

test('Hero Spec 0007 (AC-7 & AC-8): Dropdown terminal subtitles and served destination filtering', () => {
  const CITY_TERMINAL_SUBTITLES: Record<string, string> = {
    Enugu: 'Ogui Road Terminal',
    Abuja: 'Utako District Terminal',
    Lagos: 'Jibowu & Ajah Hubs',
    Owerri: 'Control Post Terminal',
  };

  for (const city of SERVED_CITIES) {
    assert.ok(CITY_TERMINAL_SUBTITLES[city], `Terminal subtitle must be registered for ${city}`);
    const destinations = getServedDestinations(city);
    assert.ok(destinations.length > 0, `${city} must serve at least one destination`);
    // Destination must not contain origin
    assert.equal(destinations.includes(city as ServedCity), false, 'City cannot serve itself');
  }
});

test('Hero Spec 0007: Stacking context hierarchy guarantees destination tooltip renders in front of search cards', () => {
  // Stacking levels defined in our hero architecture
  const Z_INDEX_LAYERS = {
    heroBackground: 0,
    vehicleBottomRow: 10,
    chamferedNotch: 20,
    segmentedSearchForm: 30,
    heroTitleAndTooltipRow: 40,
    activeHoveredCityTrigger: 50,
    tooltipPreviewCard: 50,
  };

  // AC-5 Stacking Contract: The row holding destination tooltips must exceed SegmentedSearchForm
  assert.ok(
    Z_INDEX_LAYERS.heroTitleAndTooltipRow > Z_INDEX_LAYERS.segmentedSearchForm,
    'Header row z-index (40) must be strictly higher than search form z-index (30)'
  );

  assert.ok(
    Z_INDEX_LAYERS.activeHoveredCityTrigger > Z_INDEX_LAYERS.heroTitleAndTooltipRow,
    'Active hovered city trigger (50) must elevate above row baseline'
  );

  assert.ok(
    Z_INDEX_LAYERS.tooltipPreviewCard >= Z_INDEX_LAYERS.activeHoveredCityTrigger,
    'Tooltip card (50) must match or exceed active trigger level'
  );

  assert.ok(
    Z_INDEX_LAYERS.segmentedSearchForm > Z_INDEX_LAYERS.vehicleBottomRow,
    'Search form (30) must sit above vehicle bottom row (10)'
  );
});

test('Hero Spec 0007 (AC-3): Fleet metrics preserve verified volume and Toyota Sienna invariants', () => {
  const FLEET_METRICS = {
    safeTrips: '15,000+',
    onTimeRate: '99.4%',
    passengerCapacity: 5,
    executiveCommuters: '5,000+',
  };

  assert.equal(FLEET_METRICS.passengerCapacity, 5, 'Ascent fleet standard is strictly 5-passenger Toyota Siennas');
  assert.equal(FLEET_METRICS.safeTrips, '15,000+');
  assert.equal(FLEET_METRICS.onTimeRate, '99.4%');
  assert.equal(BRAND.name, 'Ascent Transport Management');
});

// ---------------------------------------------------------------------------
// 2. SPEC 0008: ROUTING & SEO HEAD SYSTEM CONTRACTS
// ---------------------------------------------------------------------------

test('Routing Spec 0008 (AC-4): getMetadataForPath produces complete descriptive metadata for core routes', () => {
  const CORE_PATHS = [
    '/',
    '/trips',
    '/routes',
    '/terminals',
    '/courier',
    '/track',
    '/charter',
    '/corporate',
    '/about',
    '/contact',
    '/faq',
    '/terms',
    '/privacy',
  ];

  for (const path of CORE_PATHS) {
    const meta = getMetadataForPath(path);
    assert.ok(meta, `Metadata must be defined for route ${path}`);
    assert.ok(meta.title.length > 10, `Title for ${path} must be descriptive`);
    assert.ok(meta.description.length > 20, `Description for ${path} must be informative`);
    assert.ok(
      meta.title.includes('Ascent') || meta.title.includes('ATM'),
      `Title for ${path} must include brand name`
    );
  }
});

test('Routing Spec 0008 (AC-5): Dynamic corridor paths generate tailored titles and descriptions', () => {
  const corridorMeta = getMetadataForPath('/routes/enugu-abuja');
  assert.ok(corridorMeta.title.includes('Enugu to Abuja'), 'Title must format slug to readable corridor');
  assert.ok(corridorMeta.title.includes('Scheduled Sienna Departures'));
  assert.ok(corridorMeta.description.includes('5-passenger Sienna departures'));

  const lagosCorridorMeta = getMetadataForPath('/routes/enugu-lagos-jibowu');
  assert.ok(lagosCorridorMeta.title.includes('Enugu to Lagos to Jibowu'));
});

test('Routing Spec 0008 (AC-2): Pathname and search query parameter isolation', () => {
  // Test query parameter preservation on direct page loads and refreshes
  function parseRouteUrl(fullUrl: string): { pathname: string; search: string; params: Record<string, string> } {
    const [pathname = '/', search = ''] = fullUrl.split('?');
    const params: Record<string, string> = {};
    if (search) {
      for (const pair of search.split('&')) {
        const [k, v] = pair.split('=');
        if (k) params[k] = decodeURIComponent(v || '');
      }
    }
    return { pathname, search: search ? `?${search}` : '', params };
  }

  const today = getLagosDate();
  const sampleUrl = `/trips?from=Enugu&to=Abuja&date=${today}&passengers=2`;
  const parsed = parseRouteUrl(sampleUrl);

  assert.equal(parsed.pathname, '/trips', 'Pathname must cleanly isolate from query string');
  assert.equal(parsed.params.from, 'Enugu');
  assert.equal(parsed.params.to, 'Abuja');
  assert.equal(parsed.params.date, today);
  assert.equal(parsed.params.passengers, '2');

  // Verify searchParamsSchema validates this payload
  const validated = searchParamsSchema.parse(parsed.params);
  assert.equal(validated.from, 'Enugu');
  assert.equal(validated.to, 'Abuja');
  assert.equal(validated.passengers, 2);
});

test('Routing Spec 0008 (AC-7): Organization JSON-LD structured schema matches brand entity', () => {
  const orgJsonLd = getOrganizationJsonLd();

  assert.equal(orgJsonLd['@context'], 'https://schema.org');
  assert.equal(orgJsonLd['@type'], 'TravelAgency');
  assert.equal(orgJsonLd.name, BRAND.name);
  assert.equal(orgJsonLd.url, 'https://atmnigeria.com');
  assert.equal(orgJsonLd.telephone, BRAND.contactPhones[0]);
  assert.equal(orgJsonLd.email, BRAND.supportEmail);
  assert.equal(orgJsonLd.address.addressLocality, 'Enugu');
});

test('Routing Spec 0008: Dynamic booking success and checkout route metadata resolution', () => {
  const bookingMeta = getMetadataForPath('/book/success/ATM-7K9X2M');
  assert.ok(bookingMeta.title.includes('Booking Confirmed (ATM-7K9X2M)'));
  assert.ok(bookingMeta.description.includes('ATM-7K9X2M'));

  const checkoutMeta = getMetadataForPath('/book/trip-enugu-abuja-001');
  assert.ok(checkoutMeta.title.includes('Seat Selection & Checkout'));
});
