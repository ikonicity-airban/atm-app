/**
 * Routes Repository
 * Supports dual data sources: 'static' and 'db'
 * Synchronized with CORRIDOR_SEO_PROFILES across all 12 Nigerian corridors
 */

import {
  SEED_TERMINALS,
  CORRIDOR_SEO_PROFILES,
  type CorridorSEOProfile,
} from '@atm/shared';
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
  travelAdvisory?: string;
  popularPickupPoints?: string[];
  departureSchedules?: Array<{ time: string; serviceTier: string }>;
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
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `Ascent Transport ${t.name}, ${t.address}`
    )}`,
  };
}

function mapCorridorProfileToRouteDetail(profile: CorridorSEOProfile): RouteDetail {
  return {
    id: `route-${profile.slug}`,
    slug: profile.slug,
    title: profile.title,
    origin: getTerminal(profile.originTerminalId),
    destination: getTerminal(profile.destinationTerminalId),
    distanceKm: profile.distanceKm,
    durationHours: profile.estimatedDurationHours,
    baseFareKobo: profile.startingFareKobo,
    dailyDepartures: profile.departureSchedules.map((s) => s.time),
    vehicleModel: 'Toyota Sienna',
    passengerCapacity: 5,
    amenities: ['Air Conditioning', '5 Passenger Seats', 'Extra Legroom', 'Refreshments'],
    description: profile.description,
    isPlaceholder: profile.isPlaceholder ?? true,
    travelAdvisory: profile.travelAdvisory,
    popularPickupPoints: profile.popularPickupPoints,
    departureSchedules: profile.departureSchedules,
    faqs: profile.faqs,
  };
}

export const STATIC_ROUTES: RouteDetail[] = CORRIDOR_SEO_PROFILES.map(
  mapCorridorProfileToRouteDetail
);

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
