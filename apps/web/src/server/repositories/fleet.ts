/**
 * Fleet & Maintenance Operations Repository
 * Ascent Transport Management (Toyota Sienna Fleet)
 */

import {
  formatWatDateTime,
  formatNaira,
  type FleetVehicleRecord,
  type MaintenanceLog,
  type FleetKPIs,
  type VehicleMaintenanceStatus,
  type LogMaintenanceInput,
} from '@atm/shared';
import { AppError } from '../../lib/errors.ts';

export class FleetRepository {
  private vehicles: Map<string, FleetVehicleRecord> = new Map();

  constructor() {
    this.seedFleet();
  }

  private seedFleet() {
    const today = new Date('2026-10-16T08:00:00Z');

    const v1: FleetVehicleRecord = {
      id: 'veh-sienna-01',
      registrationNumber: 'ENU-418-XY',
      make: 'Toyota',
      model: 'Sienna Limited',
      year: 2021,
      seatCapacity: 5,
      hasAirConditioning: true,
      status: 'active',
      currentTerminalId: 'term-enugu-ogui',
      currentTerminalName: 'Enugu (Ogui Road)',
      currentMileageKm: 148500,
      lastServiceMileageKm: 145000,
      nextServiceMileageKm: 150000,
      kmUntilNextService: 1500,
      isServiceOverdue: false,
      assignedDriverId: 'drv-chukwuma-okafor',
      assignedDriverName: 'Chukwuma Okafor',
      insuranceExpiryDate: '2027-04-15',
      roadworthinessExpiryDate: '2027-03-30',
      isInsuranceExpiringSoon: false,
      isRoadworthinessExpiringSoon: false,
      recentLogs: [
        {
          id: 'log-001-1',
          vehicleId: 'veh-sienna-01',
          serviceType: 'routine_oil_filter',
          serviceTypeLabel: 'Engine Oil & Filter Service',
          odometerKm: 145000,
          costKobo: 4500000, // ₦45,000
          serviceDateUtc: '2026-09-10T10:00:00Z',
          serviceDateWat: 'Thu, 10 Sep 2026 11:00 am WAT',
          workshopName: 'Ascent Central Garage (Enugu)',
          technicianName: 'Emeka Nwosu',
          notes: 'Full synthetic 5W-30 oil and OEM filter replaced. Air filter blown clean.',
          recordedByStaffId: 'staff-terminal-enugu-01',
        },
      ],
    };

    const v2: FleetVehicleRecord = {
      id: 'veh-sienna-02',
      registrationNumber: 'ABJ-892-KT',
      make: 'Toyota',
      model: 'Sienna XLE',
      year: 2022,
      seatCapacity: 5,
      hasAirConditioning: true,
      status: 'service_due',
      currentTerminalId: 'term-abuja-utako',
      currentTerminalName: 'Abuja (Utako)',
      currentMileageKm: 95400,
      lastServiceMileageKm: 90000,
      nextServiceMileageKm: 95000,
      kmUntilNextService: -400,
      isServiceOverdue: true,
      assignedDriverId: 'drv-ibrahim-musa',
      assignedDriverName: 'Ibrahim Musa',
      insuranceExpiryDate: '2026-11-05', // Expiring in under 30 days
      roadworthinessExpiryDate: '2026-11-12',
      isInsuranceExpiringSoon: true,
      isRoadworthinessExpiringSoon: true,
      recentLogs: [
        {
          id: 'log-002-1',
          vehicleId: 'veh-sienna-02',
          serviceType: 'brake_pads',
          serviceTypeLabel: 'Front Ceramic Brake Pads',
          odometerKm: 90000,
          costKobo: 3800000, // ₦38,000
          serviceDateUtc: '2026-08-22T14:30:00Z',
          serviceDateWat: 'Sat, 22 Aug 2026 3:30 pm WAT',
          workshopName: 'Utako Express Mechanics',
          technicianName: 'Usman Garba',
          notes: 'Front ceramic pads fitted. Brake fluid topped up.',
          recordedByStaffId: 'staff-terminal-abuja-01',
        },
      ],
    };

    const v3: FleetVehicleRecord = {
      id: 'veh-sienna-03',
      registrationNumber: 'LOS-721-BD',
      make: 'Toyota',
      model: 'Sienna Platinum',
      year: 2023,
      seatCapacity: 5,
      hasAirConditioning: true,
      status: 'active',
      currentTerminalId: 'term-lagos-jibowu',
      currentTerminalName: 'Lagos (Jibowu Central)',
      currentMileageKm: 62100,
      lastServiceMileageKm: 60000,
      nextServiceMileageKm: 65000,
      kmUntilNextService: 2900,
      isServiceOverdue: false,
      assignedDriverId: 'drv-babajide-sanusi',
      assignedDriverName: 'Babajide Sanusi',
      insuranceExpiryDate: '2027-08-10',
      roadworthinessExpiryDate: '2027-08-15',
      isInsuranceExpiringSoon: false,
      isRoadworthinessExpiringSoon: false,
      recentLogs: [],
    };

    const v4: FleetVehicleRecord = {
      id: 'veh-sienna-04',
      registrationNumber: 'LOS-339-AA',
      make: 'Toyota',
      model: 'Sienna XSE',
      year: 2022,
      seatCapacity: 5,
      hasAirConditioning: true,
      status: 'in_maintenance',
      currentTerminalId: 'term-lagos-ajah',
      currentTerminalName: 'Lagos (Ajah Express Desk)',
      currentMileageKm: 112000,
      lastServiceMileageKm: 105000,
      nextServiceMileageKm: 110000,
      kmUntilNextService: -2000,
      isServiceOverdue: true,
      assignedDriverId: null,
      assignedDriverName: null,
      insuranceExpiryDate: '2027-02-20',
      roadworthinessExpiryDate: '2027-02-25',
      isInsuranceExpiringSoon: false,
      isRoadworthinessExpiringSoon: false,
      recentLogs: [
        {
          id: 'log-004-1',
          vehicleId: 'veh-sienna-04',
          serviceType: 'suspension_overhaul',
          serviceTypeLabel: 'Front Suspension & Bushings',
          odometerKm: 112000,
          costKobo: 12500000, // ₦125,000
          serviceDateUtc: '2026-10-14T09:00:00Z',
          serviceDateWat: 'Wed, 14 Oct 2026 10:00 am WAT',
          workshopName: 'Ajah Precision Motors',
          technicianName: 'Sunday Adeleke',
          notes: 'Lower control arms and stabilizer link bars in progress.',
          recordedByStaffId: 'staff-terminal-lagos-01',
        },
      ],
    };

    const v5: FleetVehicleRecord = {
      id: 'veh-sienna-05',
      registrationNumber: 'QOW-554-EN',
      make: 'Toyota',
      model: 'Sienna Limited',
      year: 2021,
      seatCapacity: 5,
      hasAirConditioning: true,
      status: 'active',
      currentTerminalId: 'term-owerri-egbo',
      currentTerminalName: 'Owerri (Egbu Road)',
      currentMileageKm: 132400,
      lastServiceMileageKm: 130000,
      nextServiceMileageKm: 135000,
      kmUntilNextService: 2600,
      isServiceOverdue: false,
      assignedDriverId: 'drv-nnamdi-eze',
      assignedDriverName: 'Nnamdi Eze',
      insuranceExpiryDate: '2027-05-18',
      roadworthinessExpiryDate: '2027-05-12',
      isInsuranceExpiringSoon: false,
      isRoadworthinessExpiringSoon: false,
      recentLogs: [],
    };

    this.vehicles.set(v1.id, v1);
    this.vehicles.set(v2.id, v2);
    this.vehicles.set(v3.id, v3);
    this.vehicles.set(v4.id, v4);
    this.vehicles.set(v5.id, v5);
  }

  async getAllVehicles(): Promise<FleetVehicleRecord[]> {
    return Array.from(this.vehicles.values()).map((v) => JSON.parse(JSON.stringify(v)));
  }

  async getVehicleById(vehicleId: string): Promise<FleetVehicleRecord | null> {
    const v = this.vehicles.get(vehicleId);
    return v ? JSON.parse(JSON.stringify(v)) : null;
  }

  async getKPIs(): Promise<FleetKPIs> {
    const all = Array.from(this.vehicles.values());
    const totalVehicles = all.length;
    const activeVehicles = all.filter((v) => v.status === 'active').length;
    const serviceDueVehicles = all.filter((v) => v.status === 'service_due').length;
    const inMaintenanceVehicles = all.filter((v) => v.status === 'in_maintenance').length;
    const groundedVehicles = all.filter((v) => v.status === 'grounded').length;

    let totalSpendKobo = 0;
    for (const v of all) {
      for (const log of v.recentLogs) {
        totalSpendKobo += log.costKobo;
      }
    }

    return {
      totalVehicles,
      activeVehicles,
      serviceDueVehicles,
      inMaintenanceVehicles,
      groundedVehicles,
      totalMaintenanceSpendKobo: totalSpendKobo,
    };
  }

  async logMaintenance(input: LogMaintenanceInput): Promise<{
    success: boolean;
    vehicle: FleetVehicleRecord;
    log: MaintenanceLog;
  }> {
    const vehicle = this.vehicles.get(input.vehicleId);
    if (!vehicle) {
      throw new AppError(`Vehicle ${input.vehicleId} not found in fleet directory.`, 404);
    }

    const nowUtc = new Date().toISOString();
    const formattedWat = formatWatDateTime(nowUtc);

    const serviceLabels: Record<string, string> = {
      routine_oil_filter: 'Engine Oil & Filter Service',
      brake_pads: 'Brake Pads & Rotors Replacement',
      tire_replacement: 'Tire Balancing & Replacement',
      ac_servicing: 'Air Conditioning Refrigerant Service',
      suspension_overhaul: 'Suspension Bushings & Shock Absorbers',
      emergency_repair: 'Emergency Mechanical Repair',
    };

    const newLog: MaintenanceLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      vehicleId: input.vehicleId,
      serviceType: input.serviceType,
      serviceTypeLabel: serviceLabels[input.serviceType] || 'Vehicle Maintenance',
      odometerKm: input.odometerKm,
      costKobo: input.costKobo,
      serviceDateUtc: nowUtc,
      serviceDateWat: formattedWat.fullStr,
      workshopName: input.workshopName,
      technicianName: input.technicianName,
      notes: input.notes,
      recordedByStaffId: input.staffId,
    };

    // Update vehicle mileage and reset service threshold (+5,000km interval)
    vehicle.currentMileageKm = Math.max(vehicle.currentMileageKm, input.odometerKm);
    vehicle.lastServiceMileageKm = input.odometerKm;
    vehicle.nextServiceMileageKm = input.odometerKm + 5000;
    vehicle.kmUntilNextService = 5000;
    vehicle.isServiceOverdue = false;
    vehicle.status = 'active'; // Returns to active road readiness upon recorded service
    vehicle.recentLogs.unshift(newLog);

    this.vehicles.set(vehicle.id, vehicle);

    return {
      success: true,
      vehicle: JSON.parse(JSON.stringify(vehicle)),
      log: newLog,
    };
  }

  async updateVehicleStatus(input: {
    vehicleId: string;
    status: VehicleMaintenanceStatus;
    reason: string;
    staffId: string;
  }): Promise<FleetVehicleRecord> {
    const vehicle = this.vehicles.get(input.vehicleId);
    if (!vehicle) {
      throw new AppError(`Vehicle ${input.vehicleId} not found.`, 404);
    }

    vehicle.status = input.status;
    this.vehicles.set(vehicle.id, vehicle);

    return JSON.parse(JSON.stringify(vehicle));
  }
}

export const fleetRepository = new FleetRepository();
