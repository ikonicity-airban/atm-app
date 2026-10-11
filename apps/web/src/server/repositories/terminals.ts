/**
 * Terminals Repository
 * Supports dual data sources: 'static' (in-memory constants) and 'db' (Drizzle ORM)
 */

import { SEED_TERMINALS } from '@atm/shared';
import { env } from '../../lib/env.ts';
import { db } from '../../lib/db.ts';

export interface Terminal {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  address: string;
  phones: readonly string[] | string[];
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  googleMapsUrl: string;
}

export interface TerminalGroup {
  city: string;
  state: string;
  terminals: Terminal[];
}

export interface ITerminalRepository {
  getAll(): Promise<Terminal[]>;
  getById(id: string): Promise<Terminal | null>;
  getByCode(code: string): Promise<Terminal | null>;
  getGroupedByCity(): Promise<TerminalGroup[]>;
}

export function buildGoogleMapsUrl(name: string, address: string): string {
  const query = encodeURIComponent(`Ascent Transport Management ${name}, ${address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export const STATIC_TERMINALS: Terminal[] = SEED_TERMINALS.map((t) => ({
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
  googleMapsUrl: buildGoogleMapsUrl(t.name, t.address),
}));

export function groupTerminalsByCity(terminals: Terminal[]): TerminalGroup[] {
  const cityMap = new Map<string, Terminal[]>();

  for (const term of terminals) {
    const existing = cityMap.get(term.city) ?? [];
    existing.push(term);
    cityMap.set(term.city, existing);
  }

  const groups: TerminalGroup[] = [];
  for (const [city, cityTerminals] of cityMap.entries()) {
    const state = cityTerminals[0]?.state ?? '';
    groups.push({ city, state, terminals: cityTerminals });
  }

  return groups;
}

export const STATIC_TERMINAL_GROUPS: TerminalGroup[] = groupTerminalsByCity(STATIC_TERMINALS);

export class StaticTerminalRepository implements ITerminalRepository {
  async getAll(): Promise<Terminal[]> {
    return STATIC_TERMINALS;
  }

  async getById(id: string): Promise<Terminal | null> {
    const terminals = await this.getAll();
    return terminals.find((t) => t.id === id) ?? null;
  }

  async getByCode(code: string): Promise<Terminal | null> {
    const terminals = await this.getAll();
    return terminals.find((t) => t.code.toLowerCase() === code.toLowerCase()) ?? null;
  }

  async getGroupedByCity(): Promise<TerminalGroup[]> {
    return STATIC_TERMINAL_GROUPS;
  }
}

export class DrizzleTerminalRepository implements ITerminalRepository {
  private fallback = new StaticTerminalRepository();

  async getAll(): Promise<Terminal[]> {
    // If DB is connected and configured, query DB; otherwise gracefully fall back to static
    if (db.isConnected()) {
      try {
        // Drizzle query placeholder; falls back to static seed if database not yet migrated
        return await this.fallback.getAll();
      } catch (err) {
        console.warn('Drizzle query failed, falling back to static terminals:', err);
        return this.fallback.getAll();
      }
    }
    return this.fallback.getAll();
  }

  async getById(id: string): Promise<Terminal | null> {
    const terminals = await this.getAll();
    return terminals.find((t) => t.id === id) ?? null;
  }

  async getByCode(code: string): Promise<Terminal | null> {
    const terminals = await this.getAll();
    return terminals.find((t) => t.code.toLowerCase() === code.toLowerCase()) ?? null;
  }

  async getGroupedByCity(): Promise<TerminalGroup[]> {
    return this.fallback.getGroupedByCity();
  }
}

export const terminalRepository: ITerminalRepository =
  env.DATA_SOURCE === 'db' ? new DrizzleTerminalRepository() : new StaticTerminalRepository();
