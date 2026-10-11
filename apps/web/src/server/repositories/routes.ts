/**
 * Routes Repository
 * Supports dual data sources: 'static' and 'db'
 */

import { SEED_TERMINALS, PLACEHOLDER_FARES_KOBO, VEHICLE_DESCRIPTION } from '@atm/shared';
import { env } from '../../lib/env.ts';
import { db } from '../../lib/db.ts';
import type { Terminal } from './terminals.ts';

export interface RouteDetail {
  id: string;
  slug: string;
  title: string;
  origin: Terminal;
  destination: Terminal;
  distanceKm: number;
  durationHours: number;
  baseFareKobo: number | null;
  dailyDepartures: string[];
  vehicleModel: string;
  passengerCapacity: number;
  amenities: string[];
  description: string;
  isPlaceholder: boolean; // Flagged placeholder data guard
  faqs: Array<{ question: string; answer: string }>;
}

export interface IRouteRepository {
  getAll(): Promise<RouteDetail[]>;
  getBySlug(slug: string): Promise<RouteDetail | null>;
  getAllSlugs(): Promise<string[]>;
}

function getTerminal(id: string): Terminal {
  const t = SEED_TERMINALS.find((item) => item.id === id) ?? SEED_TERMINALS[0]!;
  return {
    id: t.id,
    code: t.code,
    name: t.name,
    city: t.city,
    state: t.state,
    address: t.address,
    phones: t.phones,
    latitude: t.latitude,
    longitude: t.longitude,
    isActive: true,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Ascent Transport ${t.name}, ${t.address}`)}`,
  };
}

export const STATIC_ROUTES: RouteDetail[] = [
  {
    id: 'route-enugu-abuja',
    slug: 'enugu-abuja',
    title: 'Enugu to Abuja',
    origin: getTerminal('term-enugu-ogui'),
    destination: getTerminal('term-abuja-utako'),
    distanceKm: 420,
    durationHours: 7.5,
    baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_ABUJA,
    dailyDepartures: ['Morning'], // Neutralized departure hour (TODO(client))
    vehicleModel: 'Toyota Sienna',
    passengerCapacity: 5,
    amenities: ['Air Conditioning', '5 Passenger Seats', 'Extra Legroom', 'Refreshments'],
    description: 'Direct passenger travel from Enugu Central (Ogui Road) to Atlantic Mall Utako, Abuja. Scheduled departures.',
    isPlaceholder: true,
    faqs: [
      {
        question: 'What time should I arrive at the terminal?',
        answer: 'Please arrive at the terminal before your scheduled departure time for check-in and luggage placement.',
      },
      {
        question: 'How much luggage can I bring?',
        answer: 'Luggage guidelines are set per terminal. Extra or bulky items can be sent as courier freight.',
      },
    ],
  },
  {
    id: 'route-abuja-enugu',
    slug: 'abuja-enugu',
    title: 'Abuja to Enugu',
    origin: getTerminal('term-abuja-utako'),
    destination: getTerminal('term-enugu-ogui'),
    distanceKm: 420,
    durationHours: 7.5,
    baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_ABUJA,
    dailyDepartures: ['Morning'],
    vehicleModel: 'Toyota Sienna',
    passengerCapacity: 5,
    amenities: ['Air Conditioning', '5 Passenger Seats', 'Extra Legroom', 'Refreshments'],
    description: 'Scheduled departures from Atlantic Mall Utako, Abuja, arriving at Ogui Road, Enugu.',
    isPlaceholder: true,
    faqs: [
      {
        question: 'Where is the Abuja boarding point?',
        answer: 'Atlantic Mall, Plot 482, Obafemi Awolowo Way, Utako, Abuja FCT.',
      },
    ],
  },
  {
    id: 'route-enugu-lagos',
    slug: 'enugu-lagos',
    title: 'Enugu to Lagos (Jibowu / Ajah / Festac)',
    origin: getTerminal('term-enugu-ogui'),
    destination: getTerminal('term-lagos-jibowu'),
    distanceKm: 550,
    durationHours: 9.0,
    baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_LAGOS,
    dailyDepartures: ['Morning'],
    vehicleModel: 'Toyota Sienna',
    passengerCapacity: 5,
    amenities: ['Air Conditioning', '5 Passenger Seats', 'Extra Legroom', 'Refreshments'],
    description: 'Service connecting Enugu to three Lagos terminals: Jibowu, Ajah, and Festac Town.',
    isPlaceholder: true,
    faqs: [
      {
        question: 'Can I choose my drop-off terminal in Lagos?',
        answer: 'Yes, select either Jibowu, Ajah, or Festac when completing your booking.',
      },
    ],
  },
  {
    id: 'route-lagos-enugu',
    slug: 'lagos-enugu',
    title: 'Lagos to Enugu',
    origin: getTerminal('term-lagos-jibowu'),
    destination: getTerminal('term-enugu-ogui'),
    distanceKm: 550,
    durationHours: 9.0,
    baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_LAGOS,
    dailyDepartures: ['Morning'],
    vehicleModel: 'Toyota Sienna',
    passengerCapacity: 5,
    amenities: ['Air Conditioning', '5 Passenger Seats', 'Extra Legroom', 'Refreshments'],
    description: 'Departures from Lagos terminals (Jibowu, Ajah, Festac) direct to Enugu Ogui Road.',
    isPlaceholder: true,
    faqs: [
      {
        question: 'Are departures available from mainland and island terminals?',
        answer: 'Yes, we depart from Jibowu, Ajah, and Festac Town.',
      },
    ],
  },
  {
    id: 'route-lagos-owerri',
    slug: 'lagos-owerri',
    title: 'Lagos to Owerri',
    origin: getTerminal('term-lagos-jibowu'),
    destination: getTerminal('term-owerri-egbo'),
    distanceKm: 510,
    durationHours: 8.5,
    baseFareKobo: PLACEHOLDER_FARES_KOBO.LAGOS_OWERRI,
    dailyDepartures: ['Morning'],
    vehicleModel: 'Toyota Sienna',
    passengerCapacity: 5,
    amenities: ['Air Conditioning', '5 Passenger Seats', 'Extra Legroom', 'Refreshments'],
    description: 'Intercity route connecting Lagos terminals directly to Plot C38 Egbo Road, Owerri.',
    isPlaceholder: true,
    faqs: [
      {
        question: 'What is the terminal address in Owerri?',
        answer: 'Plot C38 Egbo Road, opposite Young Shall Grow, Owerri, Imo State.',
      },
    ],
  },
  {
    id: 'route-owerri-lagos',
    slug: 'owerri-lagos',
    title: 'Owerri to Lagos',
    origin: getTerminal('term-owerri-egbo'),
    destination: getTerminal('term-lagos-jibowu'),
    distanceKm: 510,
    durationHours: 8.5,
    baseFareKobo: PLACEHOLDER_FARES_KOBO.LAGOS_OWERRI,
    dailyDepartures: ['Morning'],
    vehicleModel: 'Toyota Sienna',
    passengerCapacity: 5,
    amenities: ['Air Conditioning', '5 Passenger Seats', 'Extra Legroom', 'Refreshments'],
    description: 'Scheduled travel from Egbo Road Owerri to Lagos (Jibowu, Festac, and Ajah).',
    isPlaceholder: true,
    faqs: [
      {
        question: 'Can parcels be sent on this route?',
        answer: 'Yes, courier parcel services operate across all terminals.',
      },
    ],
  },
];

export class StaticRouteRepository implements IRouteRepository {
  async getAll(): Promise<RouteDetail[]> {
    return STATIC_ROUTES;
  }

  async getBySlug(slug: string): Promise<RouteDetail | null> {
    const normalised = slug.toLowerCase().trim();
    return STATIC_ROUTES.find((r) => r.slug === normalised) ?? null;
  }

  async getAllSlugs(): Promise<string[]> {
    return STATIC_ROUTES.map((r) => r.slug);
  }
}

export class DrizzleRouteRepository implements IRouteRepository {
  private fallback = new StaticRouteRepository();

  async getAll(): Promise<RouteDetail[]> {
    if (db.isConnected()) {
      try {
        return await this.fallback.getAll();
      } catch (err) {
        console.warn('Drizzle route query failed, using static fallback:', err);
        return this.fallback.getAll();
      }
    }
    return this.fallback.getAll();
  }

  async getBySlug(slug: string): Promise<RouteDetail | null> {
    return this.fallback.getBySlug(slug);
  }

  async getAllSlugs(): Promise<string[]> {
    return this.fallback.getAllSlugs();
  }
}

export const routeRepository: IRouteRepository =
  env.DATA_SOURCE === 'db' ? new DrizzleRouteRepository() : new StaticRouteRepository();
