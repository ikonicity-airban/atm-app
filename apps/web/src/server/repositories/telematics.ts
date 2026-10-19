import {
  normalisePhone,
  calculateIncidentDelayMinutes,
  interpolateCorridorProgress,
  formatTelematicsWat,
  SEED_TERMINALS,
  BRAND,
  type JourneyTrackingPayload,
  type LiveTripTelematics,
  type HighwayWaypoint,
  type VehicleTelematicsPing,
  type EmergencyAssistanceInfo,
  type RoadsideIncidentReport,
  type JourneyTripStatus,
} from '@atm/shared';
import { dispatchRepository } from './dispatch.ts';
import { DriverRepository } from './driver.ts';

export interface ITelematicsRepository {
  lookupJourneyByBooking(bookingRef: string, passengerPhone?: string): Promise<JourneyTrackingPayload | null>;
  getLiveTripTelematics(tripId: string): Promise<LiveTripTelematics | null>;
}

export class TelematicsRepository implements ITelematicsRepository {
  private driverRepo = new DriverRepository();

  /**
   * Helper to retrieve or create realistic journey payloads for active and completed trips
   */
  async lookupJourneyByBooking(bookingRef: string, passengerPhone?: string): Promise<JourneyTrackingPayload | null> {
    const cleanRef = bookingRef.trim().toUpperCase();

    // 1. Try finding in dispatchRepository
    let checkIn = await dispatchRepository.lookupForCheckIn({ ref: cleanRef });

    // If not found in dispatch store, create or match a deterministic demo booking fixture
    if (!checkIn) {
      if (cleanRef.startsWith('ATM-')) {
        const enuguTerminal = SEED_TERMINALS.find((t) => t.id === 'term-enugu-ogui')!;
        const abujaTerminal = SEED_TERMINALS.find((t) => t.id === 'term-abuja-utako')!;
        const now = new Date();
        const departure = new Date(now.getTime() - 2.5 * 60 * 60 * 1000); // Departed 2.5 hours ago

        checkIn = {
          bookingId: `bk-${cleanRef.toLowerCase()}`,
          ref: cleanRef,
          tripId: 'trip-enugu-abuja-morning',
          tripDateWat: formatTelematicsWat(departure),
          departureTimeWat: formatTelematicsWat(departure),
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
            id: 'drv-enugu-01',
            fullName: 'Emeka Nwosu',
            phone: '+2349070000210',
          },
          bookerName: 'Chioma Adeyemi',
          bookerPhone: '+2348031234567',
          bookingStatus: 'confirmed',
          canBoard: true,
          isDepartureCutoffPassed: false,
          passengers: [
            {
              seatNo: 2,
              passengerName: 'Chioma Adeyemi',
              gender: 'female',
              phone: passengerPhone ? normalisePhone(passengerPhone) : '+2348031234567',
              emergencyContactName: 'Dr. Obinna Adeyemi',
              emergencyContactPhone: '+2348023456781',
              status: 'checked_in',
              qrPayload: `ATM|${cleanRef}|SEAT2`,
              isStandbyReleased: false,
            },
          ],
        };
      } else {
        return null;
      }
    }

    // Phone verification if phone was provided
    if (passengerPhone) {
      try {
        const normSearchPhone = normalisePhone(passengerPhone);
        const bookerMatch = checkIn.bookerPhone && normalisePhone(checkIn.bookerPhone) === normSearchPhone;
        const passengerMatch = checkIn.passengers.some(
          (p) => p.phone && normalisePhone(p.phone) === normSearchPhone
        );
        if (!bookerMatch && !passengerMatch) {
          return null;
        }
      } catch {
        return null;
      }
    }

    // 2. Fetch driver incidents for this trip
    const activeIncidents = await this.driverRepo.getDriverIncidents(checkIn.tripId);

    // 3. Determine trip corridor and progress
    const originTerm = SEED_TERMINALS.find((t) => t.id === checkIn.originTerminal.id) || SEED_TERMINALS[0]!;
    const destTerm = SEED_TERMINALS.find((t) => t.id === checkIn.destinationTerminal.id) || SEED_TERMINALS[1]!;

    const corridorKey = `${originTerm.city.toLowerCase()}-${destTerm.city.toLowerCase()}`;

    // For active demo trips, calculate progress (e.g., 48% along Enugu to Abuja)
    const tripStatus: JourneyTripStatus = activeIncidents.some((i) => i.status === 'active')
      ? 'delayed'
      : 'in_transit';

    const defaultProgress = 52; // 52% completed
    const progressResult = interpolateCorridorProgress(corridorKey, defaultProgress, activeIncidents);

    const delayMinutes = calculateIncidentDelayMinutes(activeIncidents);

    // Calculate dynamic ETA: 7.5 hours base duration + delay minutes
    const now = new Date();
    const scheduledDepTime = new Date(now.getTime() - 3.5 * 60 * 60 * 1000); // 3.5 hours ago
    const estimatedArrTime = new Date(
      scheduledDepTime.getTime() + (7.5 * 60 + delayMinutes) * 60 * 1000
    );

    const emergencyAssistance: EmergencyAssistanceInfo = {
      centralSafetyLine: BRAND.contactPhones[0] || '+2349070000625',
      originTerminalPhone: originTerm.phones[0] || '+2349070000625',
      destinationTerminalPhone: destTerm.phones[0] || '+2349070000210',
      reliefVehicleStatus: activeIncidents.some((i) => i.category === 'mechanical_breakdown')
        ? 'dispatched'
        : 'standby',
      reliefVehiclePlate: activeIncidents.some((i) => i.category === 'mechanical_breakdown')
        ? 'ABJ-892-KT'
        : undefined,
      assignedPatrolUnit: 'FRSC Corridor Patrol Unit 4B',
    };

    const firstPassenger = checkIn.passengers[0];

    const payload: JourneyTrackingPayload = {
      bookingReference: checkIn.ref,
      tripId: checkIn.tripId,
      passengerName: firstPassenger ? firstPassenger.passengerName : checkIn.bookerName,
      seatNumber: firstPassenger ? firstPassenger.seatNo : 1,
      vehicle: {
        plateNumber: checkIn.vehicle?.registrationNumber || 'ENU-418-XY',
        model: checkIn.vehicle ? `${checkIn.vehicle.make} ${checkIn.vehicle.model}` : 'Toyota Sienna',
        cabinDescription: 'Toyota Sienna 5-Seat Executive Cabin, Air Conditioned',
      },
      driver: {
        name: checkIn.driver?.fullName || 'Emeka Nwosu',
        badgeId: 'DRV-ENU-01',
        rating: 4.9,
        phone: checkIn.driver?.phone || '+2349070000210',
      },
      originTerminal: {
        id: originTerm.id,
        name: originTerm.name,
        city: originTerm.city,
        address: originTerm.address,
        phone: originTerm.phones[0] || '+2349070000625',
      },
      destinationTerminal: {
        id: destTerm.id,
        name: destTerm.name,
        city: destTerm.city,
        address: destTerm.address,
        phone: destTerm.phones[0] || '+2349070000210',
      },
      tripStatus,
      scheduledDepartureWat: formatTelematicsWat(scheduledDepTime),
      actualDepartureWat: formatTelematicsWat(scheduledDepTime),
      estimatedArrivalWat: formatTelematicsWat(estimatedArrTime),
      delayMinutes,
      progressPercentage: progressResult.progressPercentage,
      telematics: progressResult.telematics,
      waypoints: progressResult.waypoints,
      activeIncidents,
      emergencyAssistance,
    };

    return payload;
  }

  /**
   * Returns live telematics snapshot for a trip
   */
  async getLiveTripTelematics(tripId: string): Promise<LiveTripTelematics | null> {
    const activeIncidents = await this.driverRepo.getDriverIncidents(tripId);
    const corridorKey = 'enugu-abuja';
    const progressResult = interpolateCorridorProgress(corridorKey, 52, activeIncidents);
    const delayMinutes = calculateIncidentDelayMinutes(activeIncidents);

    const enuguTerm = SEED_TERMINALS.find((t) => t.id === 'term-enugu-ogui')!;
    const abujaTerm = SEED_TERMINALS.find((t) => t.id === 'term-abuja-utako')!;

    const emergencyAssistance: EmergencyAssistanceInfo = {
      centralSafetyLine: BRAND.contactPhones[0] || '+2349070000625',
      originTerminalPhone: enuguTerm.phones[0] || '+2349070000625',
      destinationTerminalPhone: abujaTerm.phones[0] || '+2349070000210',
      reliefVehicleStatus: activeIncidents.some((i) => i.category === 'mechanical_breakdown')
        ? 'dispatched'
        : 'standby',
      reliefVehiclePlate: 'ABJ-892-KT',
      assignedPatrolUnit: 'FRSC Corridor Patrol Unit 4B',
    };

    return {
      tripId,
      vehiclePlate: 'ENU-418-XY',
      corridorTitle: 'Enugu (Ogui Road) to Abuja (Utako)',
      tripStatus: activeIncidents.some((i) => i.status === 'active') ? 'delayed' : 'in_transit',
      progressPercentage: progressResult.progressPercentage,
      delayMinutes,
      telematics: progressResult.telematics,
      currentWaypoint: progressResult.currentWaypoint,
      nextWaypoint: progressResult.nextWaypoint,
      activeIncidents,
      emergencyAssistance,
    };
  }
}

export const telematicsRepository = new TelematicsRepository();
