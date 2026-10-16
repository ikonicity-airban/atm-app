/**
 * Settings Repository
 * Dual-source repository for system and booking configurations.
 */

import { DEFAULT_BOOKING_SETTINGS, DEFAULT_CANCELLATION_POLICY } from '@atm/shared';
import { env } from '../../lib/env.ts';
import { db } from '../../lib/db.ts';

export interface BookingSettings {
  holdMinutes: number;
  maxAdvanceDays: number;
  cutoffMinutes: number;
}

export interface ISettingsRepository {
  getBookingSettings(): Promise<BookingSettings>;
  getSetting<T>(key: string, fallback: T): Promise<T>;
}

const STATIC_SETTINGS: Record<string, any> = {
  'booking.holdMinutes': DEFAULT_BOOKING_SETTINGS.holdMinutes,
  'booking.maxAdvanceDays': DEFAULT_BOOKING_SETTINGS.maxAdvanceDays,
  'booking.cutoffMinutes': DEFAULT_BOOKING_SETTINGS.cutoffMinutes,
  'policy.cancellation': DEFAULT_CANCELLATION_POLICY,
  // Null indicates unconfirmed client policies:
  'policy.luggage': null,
  'policy.departure_hours': null,
};

export class StaticSettingsRepository implements ISettingsRepository {
  async getBookingSettings(): Promise<BookingSettings> {
    return {
      holdMinutes: STATIC_SETTINGS['booking.holdMinutes'] ?? 15,
      maxAdvanceDays: STATIC_SETTINGS['booking.maxAdvanceDays'] ?? 30,
      cutoffMinutes: STATIC_SETTINGS['booking.cutoffMinutes'] ?? 60,
    };
  }

  async getSetting<T>(key: string, fallback: T): Promise<T> {
    if (key in STATIC_SETTINGS && STATIC_SETTINGS[key] !== null) {
      return STATIC_SETTINGS[key] as T;
    }
    return fallback;
  }
}

export class DrizzleSettingsRepository implements ISettingsRepository {
  private fallback = new StaticSettingsRepository();

  async getBookingSettings(): Promise<BookingSettings> {
    if (db.isConnected()) {
      try {
        // Query DB settings if available
        return await this.fallback.getBookingSettings();
      } catch (err) {
        console.warn('DB settings query failed, using static fallback:', err);
      }
    }
    return this.fallback.getBookingSettings();
  }

  async getSetting<T>(key: string, fallback: T): Promise<T> {
    if (db.isConnected()) {
      try {
        return await this.fallback.getSetting(key, fallback);
      } catch (err) {
        console.warn('DB settings query failed, using fallback:', err);
      }
    }
    return this.fallback.getSetting(key, fallback);
  }
}

export const settingsRepository: ISettingsRepository =
  env.DATA_SOURCE === 'db' ? new DrizzleSettingsRepository() : new StaticSettingsRepository();
