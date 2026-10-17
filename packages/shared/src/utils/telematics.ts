import {
  CORRIDOR_WAYPOINTS_MAP,
  type CorridorWaypointsConfig,
  type WaypointCoordinateDefinition,
} from '../constants/waypoints.ts';
import type {
  HighwayWaypoint,
  VehicleTelematicsPing,
  JourneyTripStatus,
  WaypointStatus,
} from '../types/telematics.ts';
import type { RoadsideIncidentReport } from '../types/driver.ts';

export function calculateCorridorBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  const bearing = (toDeg(θ) + 360) % 360;
  return Math.round(bearing);
}

export function formatTelematicsWat(date: Date): string {
  return (
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date) + ' WAT'
  );
}

export function calculateIncidentDelayMinutes(incidents: RoadsideIncidentReport[]): number {
  const activeIncidents = incidents.filter((i) => i.status === 'active');
  return activeIncidents.reduce((total, incident) => {
    switch (incident.category) {
      case 'mechanical_breakdown':
        return total + 60;
      case 'checkpoint_delay':
        return total + 25;
      case 'traffic_gridlock':
        return total + 45;
      case 'weather_hazard':
        return total + 30;
      case 'medical_emergency':
        return total + 90;
      default:
        return total + 20;
    }
  }, 0);
}

export interface CorridorProgressResult {
  progressPercentage: number;
  currentKilometers: number;
  telematics: VehicleTelematicsPing;
  waypoints: HighwayWaypoint[];
  currentWaypoint: HighwayWaypoint;
  nextWaypoint?: HighwayWaypoint;
}

export function interpolateCorridorProgress(
  corridorKey: string,
  progressPercentage: number,
  incidents: RoadsideIncidentReport[] = [],
  currentTime: Date = new Date()
): CorridorProgressResult {
  const config: CorridorWaypointsConfig =
    CORRIDOR_WAYPOINTS_MAP[corridorKey] ?? CORRIDOR_WAYPOINTS_MAP['enugu-abuja']!;
  const clampedProgress = Math.min(100, Math.max(0, progressPercentage));
  const totalKm = config.totalDistanceKm;
  const currentKm = (clampedProgress / 100) * totalKm;

  const rawWaypoints = config.waypoints;
  let prevWp: WaypointCoordinateDefinition = rawWaypoints[0]!;
  let nextWp: WaypointCoordinateDefinition = rawWaypoints[rawWaypoints.length - 1]!;

  for (let i = 0; i < rawWaypoints.length - 1; i++) {
    const w1 = rawWaypoints[i];
    const w2 = rawWaypoints[i + 1];
    if (w1 && w2 && currentKm >= w1.distanceFromOriginKm && currentKm <= w2.distanceFromOriginKm) {
      prevWp = w1;
      nextWp = w2;
      break;
    }
  }

  const segmentDistance = nextWp.distanceFromOriginKm - prevWp.distanceFromOriginKm;
  const segmentProgress = segmentDistance > 0 ? (currentKm - prevWp.distanceFromOriginKm) / segmentDistance : 0;

  const currentLat = prevWp.latitude + (nextWp.latitude - prevWp.latitude) * segmentProgress;
  const currentLon = prevWp.longitude + (nextWp.longitude - prevWp.longitude) * segmentProgress;
  const bearing = calculateCorridorBearing(prevWp.latitude, prevWp.longitude, nextWp.latitude, nextWp.longitude);

  const hasActiveBreakdown = incidents.some(
    (i) => i.status === 'active' && i.category === 'mechanical_breakdown'
  );
  const hasActiveGridlock = incidents.some(
    (i) => i.status === 'active' && i.category === 'traffic_gridlock'
  );

  let speedKmh = 72;
  if (clampedProgress >= 100 || clampedProgress <= 0) {
    speedKmh = 0;
  } else if (hasActiveBreakdown) {
    speedKmh = 0;
  } else if (hasActiveGridlock) {
    speedKmh = 18;
  }

  const formattedWat = formatTelematicsWat(currentTime);

  const telematics: VehicleTelematicsPing = {
    latitude: Number(currentLat.toFixed(5)),
    longitude: Number(currentLon.toFixed(5)),
    bearingDegrees: bearing,
    speedKmh,
    highwayName: config.highwayName,
    lastUpdatedUtc: currentTime.toISOString(),
    lastUpdatedWat: formattedWat,
  };

  const waypoints: HighwayWaypoint[] = rawWaypoints.map((wp, index) => {
    let status: WaypointStatus = 'upcoming';
    if (currentKm >= wp.distanceFromOriginKm + (index === rawWaypoints.length - 1 ? 0 : 5)) {
      status = 'passed';
    } else if (Math.abs(currentKm - wp.distanceFromOriginKm) <= 20 || prevWp.id === wp.id) {
      status = 'current';
    }

    return {
      id: wp.id,
      name: wp.name,
      landmark: wp.landmark,
      latitude: wp.latitude,
      longitude: wp.longitude,
      distanceFromOriginKm: wp.distanceFromOriginKm,
      status,
      passedAtWat: status === 'passed' ? formattedWat : undefined,
    };
  });

  const currentWpIndex = waypoints.findIndex((w) => w.status === 'current');
  const activeCurrentWaypoint: HighwayWaypoint =
    currentWpIndex >= 0 ? waypoints[currentWpIndex]! : waypoints[0]!;
  const activeNextWaypoint =
    currentWpIndex >= 0 && currentWpIndex + 1 < waypoints.length
      ? waypoints[currentWpIndex + 1]
      : undefined;

  return {
    progressPercentage: clampedProgress,
    currentKilometers: Math.round(currentKm),
    telematics,
    waypoints,
    currentWaypoint: activeCurrentWaypoint,
    nextWaypoint: activeNextWaypoint,
  };
}

