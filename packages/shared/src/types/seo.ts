export interface CorridorSchedule {
  time: string;
  serviceTier: 'Standard Sienna' | 'Executive Sienna';
}

export interface CorridorFAQ {
  question: string;
  answer: string;
}

export interface CorridorSEOProfile {
  slug: string;
  title: string;
  originCity: string;
  originTerminalId: string;
  destinationCity: string;
  destinationTerminalId: string;
  distanceKm: number;
  estimatedDurationHours: number;
  startingFareKobo: number;
  headline: string;
  description: string;
  travelAdvisory: string;
  popularPickupPoints: string[];
  departureSchedules: CorridorSchedule[];
  faqs: CorridorFAQ[];
  isPlaceholder?: boolean;
}
