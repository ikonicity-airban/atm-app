/**
 * Dynamic Pricing and Corridor Fare Types
 * Ascent Transport Management
 */

export interface CorridorPricingRule {
  id: string;
  routeId: string; // e.g. "route-enugu-abuja"
  originCity: string;
  destinationCity: string;
  ruleType: 'flat_override' | 'percentage_multiplier';
  baseFareKobo: number; // baseline fare in integer kobo
  overrideFareKobo: number | null; // specific override in integer kobo
  multiplierPercentage: number | null; // e.g. 115 for 15% increase
  effectiveFareKobo: number; // calculated active fare in integer kobo
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
  reason: string; // e.g. "December Festive Rush Surcharge"
  createdByStaffId: string;
  createdAtUtc: string;
}

export interface CorridorPricingSummary {
  routeId: string;
  originCity: string;
  destinationCity: string;
  originTerminalName: string;
  destinationTerminalName: string;
  distanceKm: number;
  standardFareKobo: number;
  currentFareKobo: number;
  hasActiveOverride: boolean;
  activeRule: CorridorPricingRule | null;
}
