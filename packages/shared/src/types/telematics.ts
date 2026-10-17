import type { RoadsideIncidentReport } from './driver.ts';


export type WaypointStatus = 'passed' | 'current' | 'upcoming';

export interface HighwayWaypoint {
  id: string;
  name: string;
  landmark: string;
  latitude: number;
  longitude: number;
  distanceFromOriginKm: number;
  status: WaypointStatus;
  passedAtWat?: string;
  estimatedArrivalWat?: string;
}

export interface VehicleTelematicsPing {
  latitude: number;
  longitude: number;
  bearingDegrees: number;
  speedKmh: number;
  highwayName: string;
  lastUpdatedUtc: string;
  lastUpdatedWat: string;
}

export interface EmergencyAssistanceInfo {
  centralSafetyLine: string;
  originTerminalPhone: string;
  destinationTerminalPhone: string;
  reliefVehicleStatus?: 'none' | 'standby' | 'dispatched' | 'on_scene';
  reliefVehiclePlate?: string;
  assignedPatrolUnit?: string;
}

export type JourneyTripStatus = 'scheduled' | 'boarding' | 'in_transit' | 'delayed' | 'completed';

export interface JourneyTrackingPayload {
  bookingReference: string;
  tripId: string;
  passengerName: string;
  seatNumber: number;
  vehicle: {
    plateNumber: string;
    model: string;
    cabinDescription: string;
  };
  driver: {
    name: string;
    badgeId: string;
    rating: number;
    phone: string;
  };
  originTerminal: {
    id: string;
    name: string;
    city: string;
    address: string;
    phone: string;
  };
  destinationTerminal: {
    id: string;
    name: string;
    city: string;
    address: string;
    phone: string;
  };
  tripStatus: JourneyTripStatus;
  scheduledDepartureWat: string;
  actualDepartureWat?: string;
  estimatedArrivalWat: string;
  delayMinutes: number;
  progressPercentage: number;
  telematics: VehicleTelematicsPing;
  waypoints: HighwayWaypoint[];
  activeIncidents: RoadsideIncidentReport[];
  emergencyAssistance: EmergencyAssistanceInfo;
}

export interface LiveTripTelematics {
  tripId: string;
  vehiclePlate: string;
  corridorTitle: string;
  tripStatus: JourneyTripStatus;
  progressPercentage: number;
  delayMinutes: number;
  telematics: VehicleTelematicsPing;
  currentWaypoint: HighwayWaypoint;
  nextWaypoint?: HighwayWaypoint;
  activeIncidents: RoadsideIncidentReport[];
  emergencyAssistance: EmergencyAssistanceInfo;
}
