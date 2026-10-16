import type { TripStatus, TicketStatus } from './index.ts';

export interface CheckInPassenger {
  seatNo: number; // 1 to 5
  passengerName: string;
  gender?: string | null;
  phone: string;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  status: TicketStatus;
  checkInAt?: string | null; // ISO UTC
  checkedInByStaffId?: string | null;
  qrPayload: string;
  isStandbyReleased?: boolean;
}

export interface CheckInBookingResult {
  bookingId: string;
  ref: string;
  tripId: string;
  tripDateWat: string;
  departureTimeWat: string;
  originTerminal: {
    id: string;
    code: string;
    name: string;
    city: string;
  };
  destinationTerminal: {
    id: string;
    code: string;
    name: string;
    city: string;
  };
  vehicle?: {
    id: string;
    registrationNumber: string;
    make: string;
    model: string;
  } | null;
  driver?: {
    id: string;
    fullName: string;
    phone: string;
  } | null;
  bookerName: string;
  bookerPhone: string;
  bookingStatus: string;
  passengers: CheckInPassenger[];
  canBoard: boolean;
  isDepartureCutoffPassed: boolean; // within 15 minutes of departure or departed
}

export interface DispatchTrip {
  id: string;
  routeTitle: string;
  originTerminalId: string;
  originTerminalName: string;
  originTerminalCode: string;
  destinationTerminalId: string;
  destinationTerminalName: string;
  destinationTerminalCode: string;
  departureTimeUtc: string;
  departureTimeWat: string;
  tripDateWat: string;
  status: TripStatus;
  fareKobo: number;
  totalSeats: number; // strictly 5 for Toyota Sienna
  bookedSeats: number;
  checkedInSeats: number;
  standbyReleasedSeats: number;
  vehicle: {
    id: string;
    registrationNumber: string;
    make: string;
    model: string;
    year: number;
    hasAirConditioning: boolean;
  } | null;
  driver: {
    id: string;
    fullName: string;
    phone: string;
    licenseNumber: string;
  } | null;
  manifestReady: boolean;
}

export interface HighwayManifestPassenger {
  seatNo: number;
  passengerName: string;
  gender?: string | null;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  status: TicketStatus;
  checkedInAtWat: string | null;
  verifyingStaffId: string | null;
}

export interface HighwayManifest {
  manifestNumber: string; // e.g. ATM-MNF-ENU-20261016-01
  tripId: string;
  referenceCode: string;
  issuedAtWat: string;
  departureDateWat: string;
  departureTimeWat: string;
  originTerminal: {
    id: string;
    name: string;
    city: string;
    address: string;
    phones: string[];
  };
  destinationTerminal: {
    id: string;
    name: string;
    city: string;
    address: string;
    phones: string[];
  };
  corridorDistanceKm: number;
  estimatedDurationHours: number;
  vehicle: {
    registrationNumber: string;
    make: string;
    model: string;
    year: number;
    seatCapacity: number;
    status: string;
  };
  driver: {
    fullName: string;
    phone: string;
    licenseNumber: string;
    licenseExpiry: string;
  };
  stationMaster: {
    name: string;
    roleTitle: string;
    signedAtWat: string;
  };
  passengers: HighwayManifestPassenger[];
  summary: {
    totalSeats: number;
    bookedCount: number;
    checkedInCount: number;
    unoccupiedCount: number;
  };
  statutoryComplianceNotice: string;
}
