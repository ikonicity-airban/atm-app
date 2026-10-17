export interface DriverProfile {
  id: string; // e.g. "drv-enugu-01"
  driverBadgeId: string; // e.g. "DRV-ENU-01"
  fullName: string;
  phone: string; // E.164 e.g. "+2349070000210"
  email?: string;
  pinHash: string; // 4-digit PIN hash
  licenseNumber: string;
  licenseExpiry: string;
  assignedTerminalId: string;
  assignedVehicleId?: string;
  isActive: boolean;
}

export type RoadsideIncidentType =
  | 'mechanical_breakdown'
  | 'checkpoint_delay'
  | 'traffic_gridlock'
  | 'weather_hazard'
  | 'medical_emergency'
  | 'other';

export interface RoadsideIncidentReport {
  id: string;
  tripId: string;
  driverId: string;
  category: RoadsideIncidentType;
  description: string;
  locationNote?: string;
  reportedAtUtc: string;
  status: 'active' | 'resolved';
}

export interface CachedRoadsideManifestPassenger {
  seatNo: number;
  name: string;
  gender?: string | null;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  isBoarded: boolean;
}

export interface CachedRoadsideManifest {
  tripId: string;
  cachedAtUtc: string;
  manifestNumber: string;
  corridorTitle: string;
  vehiclePlate: string;
  vehicleModel: string;
  driverName: string;
  driverPhone: string;
  driverBadgeId: string;
  originTerminal: { name: string; city: string; phone: string; address: string };
  destinationTerminal: { name: string; city: string; phone: string; address: string };
  passengers: CachedRoadsideManifestPassenger[];
  summary: {
    totalSeats: number;
    boardedCount: number;
    unoccupiedCount: number;
  };
}
