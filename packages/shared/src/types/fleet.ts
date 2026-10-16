/**
 * Fleet Maintenance and Vehicle Inspection Types
 * Ascent Transport Management (Toyota Sienna Fleet)
 */

export type VehicleMaintenanceStatus = 'active' | 'service_due' | 'in_maintenance' | 'grounded';

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceType: 'routine_oil_filter' | 'brake_pads' | 'tire_replacement' | 'ac_servicing' | 'suspension_overhaul' | 'emergency_repair';
  serviceTypeLabel: string;
  odometerKm: number;
  costKobo: number; // Stored strictly in integer kobo
  serviceDateUtc: string; // ISO-8601 UTC
  serviceDateWat: string; // Africa/Lagos WAT
  workshopName: string;
  technicianName: string;
  notes: string;
  recordedByStaffId: string;
}

export interface FleetVehicleRecord {
  id: string;
  registrationNumber: string; // e.g. "ENU-418-XY"
  make: string;
  model: string;
  year: number;
  seatCapacity: number; // Strictly 5 seats for intercity passenger Sienna
  hasAirConditioning: boolean;
  status: VehicleMaintenanceStatus;
  currentTerminalId: string;
  currentTerminalName: string;
  currentMileageKm: number;
  lastServiceMileageKm: number;
  nextServiceMileageKm: number;
  kmUntilNextService: number;
  isServiceOverdue: boolean;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  insuranceExpiryDate: string; // YYYY-MM-DD
  roadworthinessExpiryDate: string; // YYYY-MM-DD
  isInsuranceExpiringSoon: boolean; // within 30 days
  isRoadworthinessExpiringSoon: boolean; // within 30 days
  recentLogs: MaintenanceLog[];
}

export interface FleetKPIs {
  totalVehicles: number;
  activeVehicles: number;
  serviceDueVehicles: number;
  inMaintenanceVehicles: number;
  groundedVehicles: number;
  totalMaintenanceSpendKobo: number; // Stored in integer kobo
}
