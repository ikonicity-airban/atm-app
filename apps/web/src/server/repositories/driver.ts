import {
  normalisePhone,
  canTransitionTripStatus,
  type DriverProfile,
  type RoadsideIncidentReport,
  type RoadsideIncidentType,
  type CachedRoadsideManifest,
  type DispatchTrip,
  type HighwayManifest,
} from '@atm/shared';
import { dispatchRepository } from './dispatch.ts';

export interface IDriverRepository {
  authenticateWithCredential(
    identifier: string,
    credential: string,
    method: 'phone_pin' | 'badge_pin' | 'email_password'
  ): Promise<DriverProfile | null>;
  sendOtp(phone: string): Promise<{ success: boolean; retryAfterSeconds: number }>;
  verifyOtp(phone: string, otp: string): Promise<DriverProfile | null>;
  getActiveTrip(driverId: string): Promise<{
    trip: DispatchTrip | null;
    manifest: HighwayManifest | null;
    cachedManifest: CachedRoadsideManifest | null;
  }>;
  markPassengerBoarded(
    driverId: string,
    tripId: string,
    seatNo: number,
    isBoarded: boolean
  ): Promise<boolean>;
  updateTripStatus(
    driverId: string,
    tripId: string,
    status: 'in_transit' | 'completed',
    note?: string
  ): Promise<{ success: boolean; message: string; updatedTrip?: DispatchTrip }>;
  reportIncident(
    driverId: string,
    tripId: string,
    category: RoadsideIncidentType,
    description: string,
    locationNote?: string
  ): Promise<RoadsideIncidentReport>;
  getDriverIncidents(tripId: string): Promise<RoadsideIncidentReport[]>;
}

export class DriverRepository implements IDriverRepository {
  private drivers: DriverProfile[] = [
    {
      id: 'drv-enugu-01',
      driverBadgeId: 'DRV-ENU-01',
      fullName: 'Emeka Nwosu',
      phone: '+2349070000210',
      email: 'emeka.nwosu@atmnigeria.com',
      pinHash: '1234', // default demo PIN
      licenseNumber: 'FRSC-ENU-99421A',
      licenseExpiry: '2027-08-15',
      assignedTerminalId: 'term-enugu-ogui',
      assignedVehicleId: 'veh-sienna-01',
      isActive: true,
    },
    {
      id: 'drv-abuja-01',
      driverBadgeId: 'DRV-ABJ-01',
      fullName: 'Ibrahim Garba',
      phone: '+2349070000625',
      email: 'ibrahim.garba@atmnigeria.com',
      pinHash: '1234',
      licenseNumber: 'FRSC-ABJ-88123B',
      licenseExpiry: '2028-01-20',
      assignedTerminalId: 'term-abuja-utako',
      assignedVehicleId: 'veh-sienna-02',
      isActive: true,
    },
    {
      id: 'drv-lagos-01',
      driverBadgeId: 'DRV-LOS-01',
      fullName: 'Babatunde Adeleke',
      phone: '+2349070000884',
      email: 'babatunde.adeleke@atmnigeria.com',
      pinHash: '1234',
      licenseNumber: 'FRSC-LOS-77319C',
      licenseExpiry: '2027-11-30',
      assignedTerminalId: 'term-lagos-jibowu',
      assignedVehicleId: 'veh-sienna-03',
      isActive: true,
    },
    {
      id: 'drv-owerri-01',
      driverBadgeId: 'DRV-QOW-01',
      fullName: 'Chidi Okonkwo',
      phone: '+2349070000867',
      email: 'chidi.okonkwo@atmnigeria.com',
      pinHash: '1234',
      licenseNumber: 'FRSC-IMO-55102D',
      licenseExpiry: '2028-06-12',
      assignedTerminalId: 'term-owerri-egbo',
      assignedVehicleId: 'veh-sienna-04',
      isActive: true,
    },
  ];

  private otps: Map<string, { code: string; expiresAt: number }> = new Map();
  private incidents: RoadsideIncidentReport[] = [];
  private boardedSeats: Map<string, Set<number>> = new Map(); // tripId -> Set of seatNos

  async authenticateWithCredential(
    identifier: string,
    credential: string,
    method: 'phone_pin' | 'badge_pin' | 'email_password'
  ): Promise<DriverProfile | null> {
    const norm = identifier.trim().toLowerCase();

    const driver = this.drivers.find((d) => {
      if (method === 'phone_pin') {
        const normalizedInputPhone = normalisePhone(norm);
        return d.phone === normalizedInputPhone;
      }
      if (method === 'badge_pin') {
        return d.driverBadgeId.toLowerCase() === norm;
      }
      if (method === 'email_password') {
        return d.email?.toLowerCase() === norm;
      }
      return false;
    });

    if (!driver || !driver.isActive) {
      return null;
    }

    if (driver.pinHash !== credential.trim()) {
      return null;
    }

    return driver;
  }

  async sendOtp(phone: string): Promise<{ success: boolean; retryAfterSeconds: number }> {
    const normalised = normalisePhone(phone);
    const driver = this.drivers.find((d) => d.phone === normalised);

    if (!driver || !driver.isActive) {
      return { success: false, retryAfterSeconds: 0 };
    }

    const code = '123456'; // Standard testing & demo OTP stub
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    this.otps.set(normalised, { code, expiresAt });

    return { success: true, retryAfterSeconds: 60 };
  }

  async verifyOtp(phone: string, otp: string): Promise<DriverProfile | null> {
    const normalised = normalisePhone(phone);
    const entry = this.otps.get(normalised);

    if (!entry || entry.expiresAt < Date.now() || entry.code !== otp.trim()) {
      return null;
    }

    this.otps.delete(normalised);
    return this.drivers.find((d) => d.phone === normalised) ?? null;
  }

  async getActiveTrip(driverId: string): Promise<{
    trip: DispatchTrip | null;
    manifest: HighwayManifest | null;
    cachedManifest: CachedRoadsideManifest | null;
  }> {
    const driver = this.drivers.find((d) => d.id === driverId);
    if (!driver) {
      return { trip: null, manifest: null, cachedManifest: null };
    }

    const todayWat = new Date().toISOString().split('T')[0]!;
    const trips = await dispatchRepository.getTripsForDispatch({
      terminalId: driver.assignedTerminalId,
      date: todayWat,
    });

    // Find trip where driver is assigned
    let assignedTrip = trips.find((t: DispatchTrip) => t.driver?.id === driverId);

    // Fallback: if not yet assigned in seed dispatch, bind to first active trip in driver's terminal
    if (!assignedTrip && trips.length > 0) {
      assignedTrip = trips[0];
      if (assignedTrip) {
        await dispatchRepository.assignVehicleAndDriver({
          tripId: assignedTrip.id,
          vehicleId: driver.assignedVehicleId || 'veh-sienna-01',
          driverId: driver.id,
        });
      }
    }

    if (!assignedTrip) {
      return { trip: null, manifest: null, cachedManifest: null };
    }

    const manifest = await dispatchRepository.getHighwayManifest(assignedTrip.id);
    const boardedSet = this.boardedSeats.get(assignedTrip.id) ?? new Set<number>();

    // Prepare roadside cached format
    const cachedManifest: CachedRoadsideManifest = {
      tripId: assignedTrip.id,
      cachedAtUtc: new Date().toISOString(),
      manifestNumber: manifest?.manifestNumber || `ATM-MNF-${assignedTrip.id.slice(0, 8)}`,
      corridorTitle: assignedTrip.routeTitle,
      vehiclePlate: manifest?.vehicle.registrationNumber || assignedTrip.vehicle?.registrationNumber || 'ENU-418-XY',
      vehicleModel: manifest?.vehicle.model || 'Toyota Sienna Limited',
      driverName: driver.fullName,
      driverPhone: driver.phone,
      driverBadgeId: driver.driverBadgeId,
      originTerminal: {
        name: manifest?.originTerminal.name || assignedTrip.originTerminalName,
        city: manifest?.originTerminal.city || 'Enugu',
        phone: manifest?.originTerminal.phones[0] || '+2349070000625',
        address: manifest?.originTerminal.address || '263 Ogui Road, Opp. Fire Service',
      },
      destinationTerminal: {
        name: manifest?.destinationTerminal.name || assignedTrip.destinationTerminalName,
        city: manifest?.destinationTerminal.city || 'Abuja',
        phone: manifest?.destinationTerminal.phones[0] || '+2349070000210',
        address: manifest?.destinationTerminal.address || 'Atlantic Mall, Plot 482 Utako',
      },
      passengers: (manifest?.passengers || []).map((p) => ({
        seatNo: p.seatNo,
        name: p.passengerName,
        gender: p.gender,
        phone: p.phone,
        emergencyContactName: p.emergencyContactName,
        emergencyContactPhone: p.emergencyContactPhone,
        isBoarded: boardedSet.has(p.seatNo) || p.status === 'checked_in',
      })),
      summary: {
        totalSeats: 5,
        boardedCount: (manifest?.passengers || []).filter(
          (p) => boardedSet.has(p.seatNo) || p.status === 'checked_in'
        ).length,
        unoccupiedCount:
          5 -
          (manifest?.passengers || []).filter(
            (p) => boardedSet.has(p.seatNo) || p.status === 'checked_in'
          ).length,
      },
    };

    return { trip: assignedTrip, manifest, cachedManifest };
  }

  async markPassengerBoarded(
    driverId: string,
    tripId: string,
    seatNo: number,
    isBoarded: boolean
  ): Promise<boolean> {
    if (seatNo < 1 || seatNo > 5) return false;

    if (!this.boardedSeats.has(tripId)) {
      this.boardedSeats.set(tripId, new Set<number>());
    }

    const set = this.boardedSeats.get(tripId)!;
    if (isBoarded) {
      set.add(seatNo);
    } else {
      set.delete(seatNo);
    }

    return true;
  }

  async updateTripStatus(
    driverId: string,
    tripId: string,
    status: 'in_transit' | 'completed',
    note?: string
  ): Promise<{ success: boolean; message: string; updatedTrip?: DispatchTrip }> {
    const driver = this.drivers.find((d) => d.id === driverId);
    if (!driver) {
      return { success: false, message: 'Driver not found' };
    }

    const todayWat = new Date().toISOString().split('T')[0]!;
    const trips = await dispatchRepository.getTripsForDispatch({
      terminalId: driver.assignedTerminalId,
      date: todayWat,
    });
    const trip = trips.find((t: DispatchTrip) => t.id === tripId);

    if (!trip) {
      return { success: false, message: 'Assigned trip not found' };
    }

    if (!canTransitionTripStatus(trip.status, status)) {
      return {
        success: false,
        message: `Cannot transition trip from ${trip.status} to ${status}`,
      };
    }

    trip.status = status;
    return { success: true, message: `Trip updated to ${status}`, updatedTrip: trip };
  }

  async reportIncident(
    driverId: string,
    tripId: string,
    category: RoadsideIncidentType,
    description: string,
    locationNote?: string
  ): Promise<RoadsideIncidentReport> {
    const report: RoadsideIncidentReport = {
      id: `inc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      tripId,
      driverId,
      category,
      description,
      locationNote,
      reportedAtUtc: new Date().toISOString(),
      status: 'active',
    };

    this.incidents.push(report);
    return report;
  }

  async getDriverIncidents(tripId: string): Promise<RoadsideIncidentReport[]> {
    return this.incidents.filter((i) => i.tripId === tripId);
  }
}

export const driverRepository = new DriverRepository();
