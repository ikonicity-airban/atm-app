import type {
  ServiceType,
  TripType,
  BillingMethod,
  CharterStatus,
  CharterQuoteInput,
  CreateCharterRequestInput,
  UpdateCharterRequestInput,
} from '../schemas/charter.ts';

export interface CharterQuoteBreakdown {
  baseCorridorKobo: number;
  dailyVehicleAllocationKobo: number;
  doorToDoorKobo: number;
  armedEscortKobo: number;
  discountKobo: number;
  totalEstimatedKobo: number;
}

export interface CharterQuoteResult {
  params: CharterQuoteInput;
  breakdown: CharterQuoteBreakdown;
  currency: 'NGN';
}

export interface CharterEvent {
  id: string;
  requestId: string;
  status: CharterStatus;
  description: string;
  staffId?: string | null;
  createdAt: string;
}

export interface CharterRequest {
  id: string;
  reference: string;
  customerId?: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  organizationName?: string | null;
  organizationTaxId?: string | null;
  serviceType: ServiceType;
  tripType: TripType;
  originCity: string;
  originAddress: string;
  destinationCity: string;
  destinationAddress: string;
  departureDate: string;
  returnDate?: string | null;
  durationDays: number;
  passengerCount: number;
  specialRequirements?: string | null;
  estimatedFareKobo: number;
  finalFareKobo?: number | null;
  billingMethod: BillingMethod;
  invoiceReference?: string | null;
  status: CharterStatus;
  assignedVehicleId?: string | null;
  assignedDriverId?: string | null;
  dispatchNotes?: string | null;
  events?: CharterEvent[];
  createdAt: string;
  updatedAt: string;
}
