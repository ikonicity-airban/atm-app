/**
 * Dynamic Corridor Pricing Repository
 * Ascent Transport Management
 */

import {
  PLACEHOLDER_FARES_KOBO,
  formatWatDateTime,
  type CorridorPricingRule,
  type CorridorPricingSummary,
  type CreateCorridorPricingRuleInput,
} from '@atm/shared';
import { AppError } from '../../lib/errors.ts';

interface BaselineCorridor {
  routeId: string;
  originCity: string;
  destinationCity: string;
  originTerminalName: string;
  destinationTerminalName: string;
  distanceKm: number;
  standardFareKobo: number;
}

export class PricingRepository {
  private rules: Map<string, CorridorPricingRule> = new Map();

  // Baseline standard fares by corridor route
  private baselineCorridors: BaselineCorridor[] = [
    {
      routeId: 'route-enugu-abuja',
      originCity: 'Enugu',
      destinationCity: 'Abuja',
      originTerminalName: 'Enugu (Ogui Road)',
      destinationTerminalName: 'Abuja (Utako)',
      distanceKm: 420,
      standardFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_ABUJA, // 3,200,000 kobo
    },
    {
      routeId: 'route-abuja-enugu',
      originCity: 'Abuja',
      destinationCity: 'Enugu',
      originTerminalName: 'Abuja (Utako)',
      destinationTerminalName: 'Enugu (Ogui Road)',
      distanceKm: 420,
      standardFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_ABUJA, // 3,200,000 kobo
    },
    {
      routeId: 'route-enugu-lagos',
      originCity: 'Enugu',
      destinationCity: 'Lagos',
      originTerminalName: 'Enugu (Ogui Road)',
      destinationTerminalName: 'Lagos (Jibowu Central)',
      distanceKm: 550,
      standardFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_LAGOS, // 3,600,000 kobo
    },
    {
      routeId: 'route-lagos-enugu',
      originCity: 'Lagos',
      destinationCity: 'Enugu',
      originTerminalName: 'Lagos (Jibowu Central)',
      destinationTerminalName: 'Enugu (Ogui Road)',
      distanceKm: 550,
      standardFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_LAGOS, // 3,600,000 kobo
    },
    {
      routeId: 'route-lagos-owerri',
      originCity: 'Lagos',
      destinationCity: 'Owerri',
      originTerminalName: 'Lagos (Jibowu Central)',
      destinationTerminalName: 'Owerri (Egbu Road)',
      distanceKm: 520,
      standardFareKobo: PLACEHOLDER_FARES_KOBO.LAGOS_OWERRI, // 3,800,000 kobo
    },
    {
      routeId: 'route-owerri-lagos',
      originCity: 'Owerri',
      destinationCity: 'Lagos',
      originTerminalName: 'Owerri (Egbu Road)',
      destinationTerminalName: 'Lagos (Jibowu Central)',
      distanceKm: 520,
      standardFareKobo: PLACEHOLDER_FARES_KOBO.LAGOS_OWERRI, // 3,800,000 kobo
    },
  ];

  constructor() {
    this.seedPricingRules();
  }

  private seedPricingRules() {
    // Seed 1: Active 15% Peak Surcharge on Enugu-Abuja Corridor
    const rule1: CorridorPricingRule = {
      id: 'rule-enugu-abj-peak-01',
      routeId: 'route-enugu-abuja',
      originCity: 'Enugu',
      destinationCity: 'Abuja',
      ruleType: 'percentage_multiplier',
      baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_ABUJA,
      overrideFareKobo: null,
      multiplierPercentage: 115, // 115% (+15%)
      effectiveFareKobo: Math.round(PLACEHOLDER_FARES_KOBO.ENUGU_ABUJA * 1.15), // 3,680,000 kobo
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      isActive: true,
      reason: 'Mid-term Holiday Weekend Corridor Surcharge',
      createdByStaffId: 'staff-hq-admin-01',
      createdAtUtc: '2026-09-28T09:00:00Z',
    };

    // Seed 2: Upcoming Christmas Fixed Fare on Lagos-Enugu
    const rule2: CorridorPricingRule = {
      id: 'rule-los-enu-xmas-02',
      routeId: 'route-lagos-enugu',
      originCity: 'Lagos',
      destinationCity: 'Enugu',
      ruleType: 'flat_override',
      baseFareKobo: PLACEHOLDER_FARES_KOBO.ENUGU_LAGOS,
      overrideFareKobo: 4200000, // ₦42,000 flat override
      multiplierPercentage: null,
      effectiveFareKobo: 4200000,
      startDate: '2026-12-15',
      endDate: '2027-01-05',
      isActive: true,
      reason: 'December Festive High-Capacity Return Rush',
      createdByStaffId: 'staff-hq-admin-01',
      createdAtUtc: '2026-10-01T12:00:00Z',
    };

    this.rules.set(rule1.id, rule1);
    this.rules.set(rule2.id, rule2);
  }

  async getCorridorSummaries(dateStr?: string): Promise<CorridorPricingSummary[]> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0] || '2026-10-16';

    return this.baselineCorridors.map((c) => {
      // Find active rule matching this corridor and date
      const activeRule = Array.from(this.rules.values()).find((r) => {
        if (!r.isActive) return false;
        if (r.routeId !== c.routeId) return false;
        return targetDate >= r.startDate && targetDate <= r.endDate;
      }) || null;

      let currentFareKobo = c.standardFareKobo;
      if (activeRule) {
        if (activeRule.ruleType === 'flat_override' && activeRule.overrideFareKobo) {
          currentFareKobo = activeRule.overrideFareKobo;
        } else if (activeRule.ruleType === 'percentage_multiplier' && activeRule.multiplierPercentage) {
          currentFareKobo = Math.round(c.standardFareKobo * (activeRule.multiplierPercentage / 100));
        }
      }

      return {
        routeId: c.routeId,
        originCity: c.originCity,
        destinationCity: c.destinationCity,
        originTerminalName: c.originTerminalName,
        destinationTerminalName: c.destinationTerminalName,
        distanceKm: c.distanceKm,
        standardFareKobo: c.standardFareKobo,
        currentFareKobo,
        hasActiveOverride: Boolean(activeRule),
        activeRule: activeRule ? JSON.parse(JSON.stringify(activeRule)) : null,
      };
    });
  }

  async getAllRules(): Promise<CorridorPricingRule[]> {
    return Array.from(this.rules.values()).map((r) => JSON.parse(JSON.stringify(r)));
  }

  async createRule(input: CreateCorridorPricingRuleInput): Promise<CorridorPricingRule> {
    const corridor = this.baselineCorridors.find((c) => c.routeId === input.routeId);
    if (!corridor) {
      throw new AppError(`Corridor route ${input.routeId} not recognized.`, 404);
    }

    let effectiveFareKobo = corridor.standardFareKobo;
    if (input.ruleType === 'flat_override' && input.overrideFareKobo) {
      effectiveFareKobo = input.overrideFareKobo;
    } else if (input.ruleType === 'percentage_multiplier' && input.multiplierPercentage) {
      effectiveFareKobo = Math.round(corridor.standardFareKobo * (input.multiplierPercentage / 100));
    }

    const newRule: CorridorPricingRule = {
      id: `rule-${corridor.originCity.toLowerCase()}-${corridor.destinationCity.toLowerCase()}-${Date.now()}`,
      routeId: input.routeId,
      originCity: corridor.originCity,
      destinationCity: corridor.destinationCity,
      ruleType: input.ruleType,
      baseFareKobo: corridor.standardFareKobo,
      overrideFareKobo: input.overrideFareKobo || null,
      multiplierPercentage: input.multiplierPercentage || null,
      effectiveFareKobo,
      startDate: input.startDate,
      endDate: input.endDate,
      isActive: true,
      reason: input.reason,
      createdByStaffId: input.staffId,
      createdAtUtc: new Date().toISOString(),
    };

    this.rules.set(newRule.id, newRule);
    return JSON.parse(JSON.stringify(newRule));
  }

  async toggleRule(ruleId: string, isActive: boolean): Promise<CorridorPricingRule> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new AppError(`Pricing rule ${ruleId} was not found.`, 404);
    }

    rule.isActive = isActive;
    this.rules.set(rule.id, rule);
    return JSON.parse(JSON.stringify(rule));
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    return this.rules.delete(ruleId);
  }

  // Calculate live effective fare for any trip corridor and date
  getEffectiveFare(routeId: string, dateStr: string): number {
    const corridor = this.baselineCorridors.find((c) => c.routeId === routeId);
    if (!corridor) return PLACEHOLDER_FARES_KOBO.ENUGU_ABUJA;

    const activeRule = Array.from(this.rules.values()).find((r) => {
      if (!r.isActive) return false;
      if (r.routeId !== routeId) return false;
      return dateStr >= r.startDate && dateStr <= r.endDate;
    });

    if (!activeRule) return corridor.standardFareKobo;

    if (activeRule.ruleType === 'flat_override' && activeRule.overrideFareKobo) {
      return activeRule.overrideFareKobo;
    }
    if (activeRule.ruleType === 'percentage_multiplier' && activeRule.multiplierPercentage) {
      return Math.round(corridor.standardFareKobo * (activeRule.multiplierPercentage / 100));
    }

    return corridor.standardFareKobo;
  }
}

export const pricingRepository = new PricingRepository();
