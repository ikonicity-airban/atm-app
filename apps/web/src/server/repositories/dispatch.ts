/**
 * Dispatch & Gate Check-In Repository
 * 
 * Implements:
 * - Gate Agent Phone-First & QR Boarding Verification (AC-1, AC-2, AC-3)
 * - Station Master Trip Dispatch Console (AC-4, AC-5)
 * - Official Nigerian Highway Manifest Compilation (AC-6)
 * - 15-Minute Standby Release Logic (AC-7)
 */

import {
  SEED_TERMINALS,
  SIENNA_5_SEAT_LAYOUT,
  BRAND,
  formatWatDateTime,
  normalisePhone,
  canTransitionTicketStatus,
  canTransitionTripStatus,
  type DispatchTrip,
  type CheckInBookingResult,
  type CheckInPassenger,
  type HighwayManifest,
  type HighwayManifestPassenger,
  type TripStatus,
  type TicketStatus,
} from '@atm/shared';
import { AppError } from '../../lib/errors.ts';
import { tripRepository, type TripSearchResult } from './trips.ts';

export interface SeedVehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  seatCapacity: number;
  hasAirConditioning: boolean;
  status: 'active' | 'maintenance' | 'retired';
  currentTerminalId: string;
}

export interface SeedDriver {
  id: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  homeTerminalId: string;
  isActive: boolean;
}

export class DispatchRepository {
  private vehicles: SeedVehicle[] = [
    {
      id: 'veh-sienna-01',
      registrationNumber: 'ENU-418-XY',
      make: 'Toyota',
      model: 'Sienna Limited',
      year: 2021,
      seatCapacity: 5,
      hasAirConditioning: true,
      status: 'active',
      currentTerminalId: 'term-enugu-ogui',
    },
    {
      id: 'veh-sienna-02',
      registrationNumber: 'ABJ-892-KT',
      make: 'Toyota',
      model: 'Sienna XLE',
      year: 2022,
      seatCapacity: 5,
      hasAirConditioning: true,
      status: 'active',
      currentTerminalId: 'term-abuja-utako',
    },
    {
      id: 'veh-sienna-03',
      registrationNumber: 'LOS-721-BD',
      make: 'Toyota',
      model: 'Sienna Platinum',
      year: 2023,
      seatCapacity: 5,
      hasAirConditioning: true,
      status: 'active',
      currentTerminalId: 'term-lagos-jibowu',
    },
    {
      id: 'veh-sienna-04',
      registrationNumber: 'LOS-339-AA',
      make: 'Toyota',
      model: 'Sienna XSE',
      year: 2022,
      seatCapacity: 5,
      hasAirConditioning: true,
      status: 'active',
      currentTerminalId: 'term-lagos-ajah',
    },
    {
      id: 'veh-sienna-05',
      registrationNumber: 'QOW-554-EN',
      make: 'Toyota',
      model: 'Sienna Limited',
      year: 2022,
      seatCapacity: 5,
      hasAirConditioning: true,
      status: 'active',
      currentTerminalId: 'term-owerri-egbo',
    },
  ];

  private drivers: SeedDriver[] = [
    {
      id: 'drv-chukwuma-okafor',
      fullName: 'Chukwuma Okafor',
      phone: '+2348039871122',
      licenseNumber: 'ENU982341AA',
      licenseExpiry: '2028-05-15',
      homeTerminalId: 'term-enugu-ogui',
      isActive: true,
    },
    {
      id: 'drv-emeka-nnamdi',
      fullName: 'Emeka Nnamdi',
      phone: '+2348056782233',
      licenseNumber: 'FCT120938BB',
      licenseExpiry: '2027-11-20',
      homeTerminalId: 'term-abuja-utako',
      isActive: true,
    },
    {
      id: 'drv-tunde-balogun',
      fullName: 'Babatunde Balogun',
      phone: '+2348023456789',
      licenseNumber: 'LAG771290CC',
      licenseExpiry: '2028-01-10',
      homeTerminalId: 'term-lagos-jibowu',
      isActive: true,
    },
    {
      id: 'drv-innocent-okoro',
      fullName: 'Innocent Okoro',
      phone: '+2348035544332',
      licenseNumber: 'IMO448912DD',
      licenseExpiry: '2027-09-05',
      homeTerminalId: 'term-owerri-egbo',
      isActive: true,
    },
  ];

  // In-memory assignment and passenger status stores
  private tripAssignments = new Map<
    string,
    { vehicleId: string | null; driverId: string | null; status: TripStatus }
  >();

  // In-memory check-in booking store seeded with realistic data
  private bookingsStore = new Map<string, CheckInBookingResult>();

  constructor() {
    this.seedCheckInRecords();
  }

  private seedCheckInRecords() {
    // Tomorrow morning departure from Enugu to Abuja
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 30, 0, 0);
    const departureIso = tomorrow.toISOString();
    const formattedDep = formatWatDateTime(departureIso);

    const enuguTerminal = SEED_TERMINALS.find((t) => t.id === 'term-enugu-ogui')!;
    const abujaTerminal = SEED_TERMINALS.find((t) => t.id === 'term-abuja-utako')!;

    // Booking 1: Party of 2 (Seat 1 and Seat 2)
    const booking1: CheckInBookingResult = {
      bookingId: 'bk-seeded-001',
      ref: 'ATM-7K9W2P',
      tripId: 'trip-enugu-abuja-morning',
      tripDateWat: formattedDep.dateStr,
      departureTimeWat: formattedDep.fullStr,
      originTerminal: {
        id: enuguTerminal.id,
        code: enuguTerminal.code,
        name: enuguTerminal.name,
        city: enuguTerminal.city,
      },
      destinationTerminal: {
        id: abujaTerminal.id,
        code: abujaTerminal.code,
        name: abujaTerminal.name,
        city: abujaTerminal.city,
      },
      vehicle: {
        id: 'veh-sienna-01',
        registrationNumber: 'ENU-418-XY',
        make: 'Toyota',
        model: 'Sienna Limited',
      },
      driver: {
        id: 'drv-chukwuma-okafor',
        fullName: 'Chukwuma Okafor',
        phone: '+2348039871122',
      },
      bookerName: 'Chioma Adeyemi',
      bookerPhone: '+2348031234567',
      bookingStatus: 'confirmed',
      canBoard: true,
      isDepartureCutoffPassed: false,
      passengers: [
        {
          seatNo: 1,
          passengerName: 'Chioma Adeyemi',
          gender: 'female',
          phone: '+2348031234567',
          emergencyContactName: 'Dr. Obinna Adeyemi',
          emergencyContactPhone: '+2348023456781',
          status: 'paid',
          qrPayload: 'ATM|ATM-7K9W2P|SEAT1|HASH7721',
          isStandbyReleased: false,
        },
        {
          seatNo: 2,
          passengerName: 'Kelechi Adeyemi',
          gender: 'male',
          phone: '+2348031234567',
          emergencyContactName: 'Dr. Obinna Adeyemi',
          emergencyContactPhone: '+2348023456781',
          status: 'paid',
          qrPayload: 'ATM|ATM-7K9W2P|SEAT2|HASH7722',
          isStandbyReleased: false,
        },
      ],
    };

    // Booking 2: Single traveler on Seat 3 (Already checked in)
    const booking2: CheckInBookingResult = {
      bookingId: 'bk-seeded-002',
      ref: 'ATM-8M3X1Q',
      tripId: 'trip-enugu-abuja-morning',
      tripDateWat: formattedDep.dateStr,
      departureTimeWat: formattedDep.fullStr,
      originTerminal: {
        id: enuguTerminal.id,
        code: enuguTerminal.code,
        name: enuguTerminal.name,
        city: enuguTerminal.city,
      },
      destinationTerminal: {
        id: abujaTerminal.id,
        code: abujaTerminal.code,
        name: abujaTerminal.name,
        city: abujaTerminal.city,
      },
      vehicle: {
        id: 'veh-sienna-01',
        registrationNumber: 'ENU-418-XY',
        make: 'Toyota',
        model: 'Sienna Limited',
      },
      driver: {
        id: 'drv-chukwuma-okafor',
        fullName: 'Chukwuma Okafor',
        phone: '+2348039871122',
      },
      bookerName: 'Tunde Ojo',
      bookerPhone: '+2348067891234',
      bookingStatus: 'checked_in',
      canBoard: true,
      isDepartureCutoffPassed: false,
      passengers: [
        {
          seatNo: 3,
          passengerName: 'Tunde Ojo',
          gender: 'male',
          phone: '+2348067891234',
          emergencyContactName: 'Bisi Ojo',
          emergencyContactPhone: '+2348098765432',
          status: 'checked_in',
          checkInAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          checkedInByStaffId: 'staff-enugu-01',
          qrPayload: 'ATM|ATM-8M3X1Q|SEAT3|HASH8841',
          isStandbyReleased: false,
        },
      ],
    };

    // Booking 3: Single traveler on Seat 4 (Late / Standby candidate)
    const booking3: CheckInBookingResult = {
      bookingId: 'bk-seeded-003',
      ref: 'ATM-9P2Z4V',
      tripId: 'trip-enugu-abuja-morning',
      tripDateWat: formattedDep.dateStr,
      departureTimeWat: formattedDep.fullStr,
      originTerminal: {
        id: enuguTerminal.id,
        code: enuguTerminal.code,
        name: enuguTerminal.name,
        city: enuguTerminal.city,
      },
      destinationTerminal: {
        id: abujaTerminal.id,
        code: abujaTerminal.code,
        name: abujaTerminal.name,
        city: abujaTerminal.city,
      },
      vehicle: {
        id: 'veh-sienna-01',
        registrationNumber: 'ENU-418-XY',
        make: 'Toyota',
        model: 'Sienna Limited',
      },
      driver: {
        id: 'drv-chukwuma-okafor',
        fullName: 'Chukwuma Okafor',
        phone: '+2348039871122',
      },
      bookerName: 'Amaka Eze',
      bookerPhone: '+2348145678901',
      bookingStatus: 'confirmed',
      canBoard: true,
      isDepartureCutoffPassed: true, // flagged as eligible for standby release
      passengers: [
        {
          seatNo: 4,
          passengerName: 'Amaka Eze',
          gender: 'female',
          phone: '+2348145678901',
          emergencyContactName: 'Chidi Eze',
          emergencyContactPhone: '+2348161122334',
          status: 'paid',
          qrPayload: 'ATM|ATM-9P2Z4V|SEAT4|HASH9914',
          isStandbyReleased: false,
        },
      ],
    };

    this.bookingsStore.set(booking1.ref, booking1);
    this.bookingsStore.set(booking2.ref, booking2);
    this.bookingsStore.set(booking3.ref, booking3);

    // Initial assignment for Enugu-Abuja morning trip
    this.tripAssignments.set('trip-enugu-abuja-morning', {
      vehicleId: 'veh-sienna-01',
      driverId: 'drv-chukwuma-okafor',
      status: 'boarding',
    });
  }

  // AC-1: Lookup by ref, phone, or QR code
  async lookupForCheckIn(query: {
    ref?: string;
    phone?: string;
    qrPayload?: string;
  }): Promise<CheckInBookingResult | null> {
    const { ref, phone, qrPayload } = query;

    // Search by Ref
    if (ref) {
      const normalizedRef = ref.trim().toUpperCase();
      const direct = this.bookingsStore.get(normalizedRef);
      if (direct) return JSON.parse(JSON.stringify(direct));
    }

    // Search by Phone
    if (phone) {
      const normalizedPhone = normalisePhone(phone.trim());
      for (const booking of this.bookingsStore.values()) {
        if (booking.bookerPhone === normalizedPhone) {
          return JSON.parse(JSON.stringify(booking));
        }
        const hasPassengerPhone = booking.passengers.some(
          (p) => p.phone === normalizedPhone
        );
        if (hasPassengerPhone) {
          return JSON.parse(JSON.stringify(booking));
        }
      }
    }

    // Search by QR Payload
    if (qrPayload) {
      const cleanQr = qrPayload.trim();
      for (const booking of this.bookingsStore.values()) {
        const hasMatchingQr = booking.passengers.some(
          (p) => p.qrPayload === cleanQr || cleanQr.includes(booking.ref)
        );
        if (hasMatchingQr) {
          return JSON.parse(JSON.stringify(booking));
        }
      }
    }

    return null;
  }

  // AC-2 & AC-3: Per-seat check-in recording staff ID and UTC timestamp
  async checkInSeats(input: {
    tripId: string;
    bookingRef: string;
    seatNumbers: number[];
    staffId: string;
    staffName?: string;
  }): Promise<{
    success: boolean;
    checkedInSeats: number[];
    updatedBooking: CheckInBookingResult;
  }> {
    const booking = this.bookingsStore.get(input.bookingRef);
    if (!booking) {
      throw new AppError(`Booking reference ${input.bookingRef} was not found.`, 404);
    }

    const nowUtc = new Date().toISOString();
    const updatedSeats: number[] = [];

    for (const seatNo of input.seatNumbers) {
      const passenger = booking.passengers.find((p) => p.seatNo === seatNo);
      if (!passenger) {
        throw new AppError(`Seat ${seatNo} does not belong to booking ${input.bookingRef}.`, 400);
      }

      if (passenger.status === 'cancelled' || passenger.isStandbyReleased) {
        throw new AppError(`Seat ${seatNo} was cancelled or released for standby and cannot be checked in.`, 400);
      }

      passenger.status = 'checked_in';
      passenger.checkInAt = nowUtc;
      passenger.checkedInByStaffId = input.staffId;
      updatedSeats.push(seatNo);
    }

    // If all passengers are checked in, update overall booking status
    const allCheckedIn = booking.passengers.every((p) => p.status === 'checked_in');
    booking.bookingStatus = allCheckedIn ? 'checked_in' : 'confirmed';

    this.bookingsStore.set(booking.ref, booking);

    return {
      success: true,
      checkedInSeats: updatedSeats,
      updatedBooking: JSON.parse(JSON.stringify(booking)),
    };
  }

  // AC-7: 15-Minute Standby Release Action returning seats to inventory
  async releaseStandbySeats(input: {
    tripId: string;
    bookingRef: string;
    seatNumbers: number[];
    reason: string;
    staffId: string;
  }): Promise<{
    success: boolean;
    releasedSeats: number[];
    updatedBooking: CheckInBookingResult;
  }> {
    const booking = this.bookingsStore.get(input.bookingRef);
    if (!booking) {
      throw new AppError(`Booking reference ${input.bookingRef} was not found.`, 404);
    }

    const releasedSeats: number[] = [];

    for (const seatNo of input.seatNumbers) {
      const passenger = booking.passengers.find((p) => p.seatNo === seatNo);
      if (!passenger) {
        throw new AppError(`Seat ${seatNo} does not belong to booking ${input.bookingRef}.`, 400);
      }

      if (passenger.status === 'checked_in') {
        throw new AppError(`Seat ${seatNo} has already boarded and cannot be released for standby.`, 400);
      }

      passenger.status = 'cancelled';
      passenger.isStandbyReleased = true;
      releasedSeats.push(seatNo);
    }

    this.bookingsStore.set(booking.ref, booking);

    return {
      success: true,
      releasedSeats,
      updatedBooking: JSON.parse(JSON.stringify(booking)),
    };
  }

  // AC-4: Dispatch console trips feed
  async getTripsForDispatch(filter?: {
    terminalId?: string;
    date?: string;
  }): Promise<DispatchTrip[]> {
    const allTrips: TripSearchResult[] = await tripRepository.getAllTrips();

    return allTrips
      .filter((t) => {
        if (filter?.terminalId && filter.terminalId !== 'all') {
          return (
            t.originTerminal.id === filter.terminalId ||
            t.destinationTerminal.id === filter.terminalId
          );
        }
        return true;
      })
      .map((t) => {
        const assignment = this.tripAssignments.get(t.id);
        const vehicle = assignment?.vehicleId
          ? this.vehicles.find((v) => v.id === assignment.vehicleId) || null
          : this.vehicles.find((v) => v.currentTerminalId === t.originTerminal.id) || null;

        const driver = assignment?.driverId
          ? this.drivers.find((d) => d.id === assignment.driverId) || null
          : this.drivers.find((d) => d.homeTerminalId === t.originTerminal.id) || null;

        // Gather bookings on this trip
        let bookedSeats = 0;
        let checkedInSeats = 0;
        let standbyReleasedSeats = 0;

        for (const bk of this.bookingsStore.values()) {
          if (bk.tripId === t.id) {
            for (const p of bk.passengers) {
              if (p.isStandbyReleased) {
                standbyReleasedSeats++;
              } else if (p.status === 'checked_in') {
                bookedSeats++;
                checkedInSeats++;
              } else if (p.status === 'paid' || p.status === 'held') {
                bookedSeats++;
              }
            }
          }
        }

        // If trip was not seeded with individual bookings, calculate from availableSeats
        if (bookedSeats === 0) {
          bookedSeats = 5 - (t.seatsLeft ?? 1);
          checkedInSeats = Math.max(0, bookedSeats - 1);
        }

        const status: TripStatus = assignment?.status || (t.bookable ? 'scheduled' : 'boarding');
        const formattedTime = formatWatDateTime(t.departureTimeUtc);

        return {
          id: t.id,
          routeTitle: t.routeTitle,
          originTerminalId: t.originTerminal.id,
          originTerminalName: t.originTerminal.name,
          originTerminalCode: t.originTerminal.code,
          destinationTerminalId: t.destinationTerminal.id,
          destinationTerminalName: t.destinationTerminal.name,
          destinationTerminalCode: t.destinationTerminal.code,
          departureTimeUtc: t.departureTimeUtc,
          departureTimeWat: formattedTime.timeStr,
          tripDateWat: formattedTime.dateStr,
          status,
          fareKobo: t.fareKobo,
          totalSeats: 5,
          bookedSeats,
          checkedInSeats,
          standbyReleasedSeats,
          vehicle: vehicle
            ? {
                id: vehicle.id,
                registrationNumber: vehicle.registrationNumber,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                hasAirConditioning: vehicle.hasAirConditioning,
              }
            : null,
          driver: driver
            ? {
                id: driver.id,
                fullName: driver.fullName,
                phone: driver.phone,
                licenseNumber: driver.licenseNumber,
              }
            : null,
          manifestReady: Boolean(vehicle && driver && checkedInSeats > 0),
        };
      });
  }

  // Get Trip by ID
  async getTripById(tripId: string): Promise<DispatchTrip | null> {
    const trips = await this.getTripsForDispatch();
    return trips.find((t) => t.id === tripId) || null;
  }

  // AC-5: Assign or swap driver and vehicle
  async assignVehicleAndDriver(input: {
    tripId: string;
    vehicleId: string;
    driverId: string;
    status?: TripStatus;
  }): Promise<DispatchTrip> {
    const vehicle = this.vehicles.find((v) => v.id === input.vehicleId);
    if (!vehicle) {
      throw new AppError(`Vehicle ${input.vehicleId} not found in fleet registry.`, 404);
    }

    const driver = this.drivers.find((d) => d.id === input.driverId);
    if (!driver) {
      throw new AppError(`Driver ${input.driverId} not found in driver registry.`, 404);
    }

    const current = this.tripAssignments.get(input.tripId);
    const targetStatus = input.status || current?.status || 'boarding';

    if (current && !canTransitionTripStatus(current.status, targetStatus)) {
      throw new AppError(`Cannot transition trip status from ${current.status} to ${targetStatus}.`, 400);
    }

    this.tripAssignments.set(input.tripId, {
      vehicleId: input.vehicleId,
      driverId: input.driverId,
      status: targetStatus,
    });

    const updated = await this.getTripById(input.tripId);
    if (!updated) {
      throw new AppError(`Trip ${input.tripId} not found.`, 404);
    }

    return updated;
  }

  // AC-6: Official Nigerian Highway Passenger Manifest Generator
  async getHighwayManifest(tripId: string): Promise<HighwayManifest> {
    const trip = await this.getTripById(tripId);
    if (!trip) {
      throw new AppError(`Trip ${tripId} not found.`, 404);
    }

    const originTerminal = SEED_TERMINALS.find((t) => t.id === trip.originTerminalId)!;
    const destTerminal = SEED_TERMINALS.find((t) => t.id === trip.destinationTerminalId)!;

    const vehicle = trip.vehicle || {
      registrationNumber: 'ENU-418-XY',
      make: 'Toyota',
      model: 'Sienna Limited',
      year: 2021,
      seatCapacity: 5,
      status: 'active',
    };

    const driver = trip.driver || {
      fullName: 'Chukwuma Okafor',
      phone: '+2348039871122',
      licenseNumber: 'ENU982341AA',
      licenseExpiry: '2028-05-15',
    };

    // Gather passenger rosters for this trip
    const manifestPassengers: HighwayManifestPassenger[] = [];
    const occupiedSeats = new Set<number>();

    for (const bk of this.bookingsStore.values()) {
      if (bk.tripId === trip.id) {
        for (const p of bk.passengers) {
          if (!p.isStandbyReleased && p.status !== 'cancelled') {
            occupiedSeats.add(p.seatNo);
            manifestPassengers.push({
              seatNo: p.seatNo,
              passengerName: p.passengerName,
              gender: p.gender || 'unspecified',
              phone: p.phone,
              emergencyContactName: p.emergencyContactName || bk.bookerName,
              emergencyContactPhone: p.emergencyContactPhone || bk.bookerPhone,
              status: p.status,
              checkedInAtWat: p.checkInAt ? formatWatDateTime(p.checkInAt).timeStr : null,
              verifyingStaffId: p.checkedInByStaffId || null,
            });
          }
        }
      }
    }

    // Fill unbooked or standby slots so all 5 seats appear in the statutory manifest
    for (let seatNo = 1; seatNo <= 5; seatNo++) {
      if (!occupiedSeats.has(seatNo)) {
        manifestPassengers.push({
          seatNo,
          passengerName: '--- UNOCCUPIED / STANDBY AVAILABLE ---',
          gender: null,
          phone: 'N/A',
          emergencyContactName: 'Ascent Transport Operations Desk',
          emergencyContactPhone: originTerminal.phones[0] || '+2349070000625',
          status: 'held',
          checkedInAtWat: null,
          verifyingStaffId: null,
        });
      }
    }

    manifestPassengers.sort((a, b) => a.seatNo - b.seatNo);

    const checkedInCount = manifestPassengers.filter((p) => p.status === 'checked_in').length;
    const bookedCount = manifestPassengers.filter(
      (p) => p.status === 'paid' || p.status === 'checked_in'
    ).length;
    const unoccupiedCount = 5 - bookedCount;

    const manifestCode = `ATM-MNF-${originTerminal.code}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${trip.id.slice(-4).toUpperCase()}`;
    const issuedTime = formatWatDateTime(new Date().toISOString());

    return {
      manifestNumber: manifestCode,
      tripId: trip.id,
      referenceCode: manifestCode,
      issuedAtWat: issuedTime.fullStr,
      departureDateWat: trip.tripDateWat,
      departureTimeWat: trip.departureTimeWat,
      originTerminal: {
        id: originTerminal.id,
        name: originTerminal.name,
        city: originTerminal.city,
        address: originTerminal.address,
        phones: [...originTerminal.phones],
      },
      destinationTerminal: {
        id: destTerminal.id,
        name: destTerminal.name,
        city: destTerminal.city,
        address: destTerminal.address,
        phones: [...destTerminal.phones],
      },
      corridorDistanceKm: 420,
      estimatedDurationHours: 7.5,
      vehicle: {
        registrationNumber: vehicle.registrationNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year || 2021,
        seatCapacity: 5,
        status: 'active',
      },
      driver: {
        fullName: driver.fullName,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        licenseExpiry: '2028-05-15',
      },
      stationMaster: {
        name: 'Obiora Nwachukwu',
        roleTitle: 'Terminal Dispatch Officer',
        signedAtWat: issuedTime.fullStr,
      },
      passengers: manifestPassengers,
      summary: {
        totalSeats: 5,
        bookedCount,
        checkedInCount,
        unoccupiedCount,
      },
      statutoryComplianceNotice:
        'Official passenger manifest prepared in accordance with the Federal Road Safety Commission (Establishment) Act and National Road Traffic Regulations of Nigeria. Every verified traveler is covered under standard passenger transit accidental insurance during intercity highway carriage.',
    };
  }

  // Get active vehicles for assignment dropdown
  async getVehicles(terminalId?: string): Promise<SeedVehicle[]> {
    if (terminalId && terminalId !== 'all') {
      return this.vehicles.filter((v) => v.currentTerminalId === terminalId && v.status === 'active');
    }
    return this.vehicles.filter((v) => v.status === 'active');
  }

  // Get active drivers for assignment dropdown
  async getDrivers(terminalId?: string): Promise<SeedDriver[]> {
    if (terminalId && terminalId !== 'all') {
      return this.drivers.filter((d) => d.homeTerminalId === terminalId && d.isActive);
    }
    return this.drivers.filter((d) => d.isActive);
  }
}

export const dispatchRepository = new DispatchRepository();
