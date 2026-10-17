# 0022. Real-Time Fleet Telematics and Live Journey Tracking

**Date**: 2026-10-17
**Status**: Accepted

## Summary

This specification defines real-time fleet telematics, waypoint progression tracking, dynamic arrival time calculation, and roadside breakdown assistance for Ascent Transport Management passenger journeys. Operating across major Nigerian highway corridors (such as Enugu to Abuja, Lagos to Benin/Enugu, and Abuja to Owerri), passengers and operations staff can track active Toyota Sienna vehicles in transit using booking reference codes (`ATM-XXXXXX`) or trip identifiers. The system calculates highway progress along realistic Nigerian expressway corridors, updates live estimated time of arrival (ETA) based on transit speed and Phase 14 driver incident advisories, and provides an immediate emergency breakdown assistance drawer with one-tap central safety operations dialing.

## Context

Ascent Transport Management operates executive five-passenger Toyota Sienna fleets across long-distance interstate corridors in Nigeria. In Phase 7 (`docs/specs/0014-courier-booking-and-parcel-tracking.md`), public parcel tracking was established at `/track` for courier waybills (`ATM-EXP-XXXXXX`). In Phase 14 (`docs/specs/0021-driver-mobile-web-portal-and-roadside-manifest.md`), commercial drivers gained a mobile portal at `/driver` to mark passenger boarding, advance trip states (`boarding` -> `in_transit` -> `completed`), and record roadside incident advisories (`RoadsideIncidentReport`).

However, traveling passengers, families awaiting arrivals, and customer support desks lacked real-time visibility into vehicle journey milestones on the road. When travelers check transit status, they want to see where their vehicle is along the interstate highway, whether the vehicle has passed major transit waypoints (such as 9th Mile Corner, Otukpo Bypass, Sagamu Interchange, or Ore Bypass), when it will arrive at the destination terminal in West Africa Time (WAT), and who to call if a roadside breakdown or delay occurs.

By establishing Highway Corridor Waypoint Telematics with simulated GPS coordinates, dynamic speed-based ETA calculations, Phase 14 roadside incident integration, and an integrated tracking hub on `/track` (with direct route `/track/journey/[ref]`), ATM delivers transparent and safe transit monitoring for passengers across Nigeria.

## Requirements

**User stories**:
- As a passenger or family member, I want to enter my booking reference code and passenger phone number on `/track` or open a direct link from my booking confirmation so that I can see the real-time location and progress of my vehicle.
- As a traveler on the road, I want to see an interactive journey timeline displaying passed, current, and upcoming highway corridor waypoints so that I know where we are along the interstate route.
- As a passenger whose vehicle encounters traffic or a mechanical fault, I want the live tracking screen to reflect driver roadside incident advisories and adjust the estimated arrival time dynamically.
- As a traveler experiencing an emergency or delay, I want an easily accessible emergency roadside assistance drawer with one-tap calling to terminal dispatch desks and the central safety team.
- As an operations manager, I want an API endpoint that provides current vehicle GPS coordinates, bearing, transit speed, and waypoint progression for any dispatched trip.

**Acceptance criteria**:
- **AC-1**: Public tracking hub at `/track` features a segmented switcher allowing users to toggle between Courier Waybill tracking (`ATM-EXP-XXXXXX`) and Passenger Journey tracking (`ATM-XXXXXX`), maintaining responsive layout without layout shifts.
- **AC-2**: Passenger journey lookup verifies booking reference format (`ATM-XXXXXX`) and authenticates passenger phone number normalization (E.164 `+234...`), gracefully displaying validation feedback.
- **AC-3**: Dedicated passenger journey tracking view at `/track/journey/[ref]` renders vehicle details (Toyota Sienna, registration plate, driver name and verified badge), departure terminal, destination terminal, and scheduled departure time in WAT.
- **AC-4**: Real-time vehicle telematics displays current simulated GPS latitude and longitude, bearing degrees, current transit speed in km/h, and highway completion percentage.
- **AC-5**: Interactive waypoint corridor stepper visualizes intermediate highway waypoints (e.g. Ogui Terminal -> 9th Mile Corner -> Otukpo Bypass -> Lafia Junction -> Keffi Flyover -> Utako Terminal for Enugu to Abuja) with clear status tags (`passed`, `current`, `upcoming`).
- **AC-6**: Dynamic ETA engine calculates arrival time based on remaining highway corridor distance, vehicle transit speed, and active Phase 14 driver roadside incident reports (breakdowns, checkpoints, weather).
- **AC-7**: Active roadside incidents reported by drivers in Phase 14 render as prominent advisory notices on the journey timeline with reported timestamps and driver notes.
- **AC-8**: Emergency roadside assistance drawer provides immediate one-tap calling to the ATM central safety operations line (`+2349070000625`), origin terminal desk, destination terminal desk, and displays relief vehicle dispatch status when applicable.
- **AC-9**: All user interface elements adhere strictly to design tokens, containing zero `animate-pulse` animations (using static progress bars and clear status badges), and format all timestamps in Africa/Lagos (WAT, UTC+1).

## Options considered

### Option 1: Highway Corridor Waypoint Telematics with simulated GPS engine and integrated tracking hub (Recommended)

Model each interstate corridor as an ordered sequence of real Nigerian highway coordinates with distance markers. For active trips in `in_transit` status, compute current position, bearing, speed, and waypoint progression based on elapsed transit time and driver incident advisories. Provide both a unified tabbed search on `/track` and direct journey links `/track/journey/[ref]`.

**Pros**:
- Realistic, geographically accurate Nigerian highway waypoints (9th Mile, Otukpo, Sagamu, Ore, Benin Bypass) without requiring continuous costly satellite hardware on every Sienna vehicle.
- Seamless unification with existing Phase 7 parcel tracking on `/track` while enabling deep-linking from booking confirmations.
- Fully integrates with Phase 14 driver roadside incident reports to surface live checkpoint, breakdown, and traffic advisories directly to travelers.
- Zero battery drain or cellular data overhead on driver phones.

**Cons**:
- Simulates real-time coordinate movement between known waypoints rather than raw sub-meter satellite hardware telemetry.

### Option 2: Pure raw GPS hardware device stream via MQTT / WebSockets

Require hardwired OBD-II or vehicle GPS tracker boxes sending coordinates via MQTT broker to a WebSocket cluster.

**Pros**:
- True physical hardware GPS coordinates.

**Cons**:
- Requires capital expenditure on vehicle hardware and telecommunications SIM data across fleets before software can launch.
- Fails or drops in cellular blackspots without significant edge buffer firmware.
- Significantly increases deployment complexity for MVP launch when corridor progression satisfies 99% of customer tracking needs.

### Option 3: Separate standalone passenger tracking portal on `/journey`

Create a completely separate top-level route `/journey` rather than integrating into `/track`.

**Pros**:
- Isolates passenger code from courier code.

**Cons**:
- Fragments user mental model: customers visiting "Track" expect to track whatever ATM service they booked (parcel or passenger seat).
- Duplicates navigation links and marketing references across site shells.

## Decision

Adopt **Option 1**: Implement Highway Corridor Waypoint Telematics with simulated GPS coordinates, bearing, transit speed, dynamic ETA calculation, and Phase 14 driver incident integration. Unify tracking into `/track` with a segmented switcher and provide a dedicated deep-linked view at `/track/journey/[ref]`.

## Architectural design

### Corridor waypoints and coordinates

Interstate corridors are modeled with precise geographic coordinates and kilometer offsets:

1. **Enugu to Abuja (420 km)**:
   - Ogui Road Terminal, Enugu (`6.4474, 7.5144` - 0 km)
   - 9th Mile Corner (`6.4250, 7.4100` - 25 km)
   - Obollo-Afor Bypass (`6.9150, 7.5180` - 75 km)
   - Otukpo Expressway Junction (`7.1950, 8.1350` - 165 km)
   - Lafia Bypass (`8.4900, 8.5200` - 290 km)
   - Keffi Flyover (`8.8470, 7.8730` - 370 km)
   - Utako Terminal, Abuja (`9.0621, 7.4398` - 420 km)

2. **Abuja to Enugu (420 km)**:
   - Utako Terminal, Abuja (`9.0621, 7.4398` - 0 km)
   - Keffi Flyover (`8.8470, 7.8730` - 50 km)
   - Lafia Bypass (`8.4900, 8.5200` - 130 km)
   - Otukpo Expressway Junction (`7.1950, 8.1350` - 255 km)
   - Obollo-Afor Bypass (`6.9150, 7.5180` - 345 km)
   - 9th Mile Corner (`6.4250, 7.4100` - 395 km)
   - Ogui Road Terminal, Enugu (`6.4474, 7.5144` - 420 km)

3. **Lagos to Benin / Enugu (530 km)**:
   - Jibowu Terminal, Lagos (`6.5218, 3.3686` - 0 km)
   - Sagamu Interchange (`6.8400, 3.6500` - 65 km)
   - Ore Bypass / Rest Stop (`6.7450, 4.8760` - 210 km)
   - Okada Town Junction (`6.7320, 5.3910` - 290 km)
   - Benin Central Bypass (`6.3350, 5.6037` - 325 km)
   - Asaba Bridgehead (`6.1980, 6.7340` - 445 km)
   - Ogui Road Terminal, Enugu (`6.4474, 7.5144` - 530 km)

4. **Lagos to Owerri (520 km)**:
   - Jibowu Terminal, Lagos (`6.5218, 3.3686` - 0 km)
   - Sagamu Interchange (`6.8400, 3.6500` - 65 km)
   - Ore Bypass (`6.7450, 4.8760` - 210 km)
   - Benin Bypass (`6.3350, 5.6037` - 325 km)
   - Onitsha River Niger Bridge (`6.1520, 6.7820` - 435 km)
   - Ihiala Expressway (`5.8540, 6.8590` - 475 km)
   - Egbo Road Terminal, Owerri (`5.4836, 7.0333` - 520 km)

### API surface

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/telematics/lookup` | POST | `bookingReference: string`, `passengerPhone: string` | `bookingRef`, `tripId`, `trackingUrl`, `status` | Public | 400 invalid input, 404 booking not found, 403 phone mismatch |
| `/api/telematics/journey/[ref]` | GET | query param `phone?: string` | `JourneyTrackingPayload` | Public | 404 booking not found |
| `/api/telematics/trip/[tripId]` | GET | none | `LiveTripTelematics` | Public / Staff | 404 trip not found |

### Data structures

```typescript
export interface HighwayWaypoint {
  id: string;
  name: string;
  landmark: string;
  latitude: number;
  longitude: number;
  distanceFromOriginKm: number;
  status: 'passed' | 'current' | 'upcoming';
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
  tripStatus: 'scheduled' | 'boarding' | 'in_transit' | 'delayed' | 'completed';
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
```

### Dynamic ETA calculation engine

1. **Base Transit Time**: `Total Corridor Distance (km) / Normal Transit Speed (e.g. 70 km/h)`.
2. **Elapsed Progress**: For active trips, calculate elapsed minutes since departure.
3. **Incident Impact**: Sum active driver incident delays from Phase 14 (`mechanical_breakdown` = +60 min, `checkpoint_delay` = +25 min, `traffic_gridlock` = +45 min, `weather_hazard` = +30 min).
4. **Current Speed Calculation**: If an active incident is ongoing, current speed reflects 0-25 km/h; otherwise regular highway cruise speed (65-85 km/h).
5. **Adjusted ETA**: Scheduled Departure + Base Duration + Delay Minutes.

### Value sourcing

| Action | Value produced / displayed | Source |
|---|---|---|
| Journey Lookup | Verified booking reference & trip identifier | Matching `ManageBookingRepository` or Mock Booking Fixtures |
| Vehicle Coordinates | Real-time latitude, longitude, bearing | Corridor waypoint interpolation based on trip start time |
| Waypoint Progression | Passed, current, and upcoming stops | `HIGHWAY_CORRIDOR_WAYPOINTS` progression mapping |
| Incident Advisories | Active roadside hazard reports | Driver incident store from Spec 0021 |
| Dynamic ETA | Estimated arrival in WAT | Distance remaining / current speed + delay adjustments |
| Emergency Drawer | Safety hotline and terminal telephone links | `BRAND.contactPhones` & `SEED_TERMINALS` phone arrays |

### Key invariants

- Booking references must match standard format `ATM-XXXXXX` (alphanumeric uppercase).
- Phone normalization strictly uses E.164 (`+234...`) before identity comparison.
- Money is not directly handled on this tracking interface; all times must format in Africa/Lagos (WAT, UTC+1).
- No `animate-pulse` or pulsing CSS animations anywhere on the screen; use static color indicators and solid progress bars.
- Emergency dialer links always output standard `tel:` URLs with full country code.

## Build plan

- [ ] 1. Define shared telematics domain types and waypoint models in `packages/shared/src/types/telematics.ts` (AC-4, AC-5, AC-8).
- [ ] 2. Define Nigerian highway corridor waypoint constants and coordinate fixtures in `packages/shared/src/constants/waypoints.ts` (AC-4, AC-5).
- [ ] 3. Create Zod lookup and tracking validation schemas in `packages/shared/src/schemas/telematics.ts` (AC-2).
- [ ] 4. Re-export new telematics modules in `packages/shared/src/index.ts` (AC-2, AC-4).
- [ ] 5. Implement pure calculation and progression utility functions `calculateCorridorProgress` and `computeDynamicEta` in `packages/shared/src/utils/telematics.ts` (AC-4, AC-6).
- [ ] 6. Implement server-side `TelematicsRepository` in `apps/web/src/server/repositories/telematics.ts` resolving live trips, bookings, waypoint progressions, and incident injections (AC-3, AC-4, AC-6, AC-7).
- [ ] 7. Create API route handlers:
  - `/api/telematics/lookup` for phone-verified reference search (AC-2).
  - `/api/telematics/journey/[ref]` for full journey tracking payload retrieval (AC-3, AC-4, AC-5, AC-6, AC-7, AC-8).
  - `/api/telematics/trip/[tripId]` for vehicle telematics state (AC-4).
- [ ] 8. Upgrade the public tracking hub at `apps/web/src/app/(public)/track/page.tsx` with a segmented switcher between Courier Freight and Passenger Journey tracking (AC-1, AC-2).
- [ ] 9. Create dedicated passenger journey tracking page at `apps/web/src/app/(public)/track/journey/[ref]/page.tsx` featuring vehicle details, dynamic ETA, highway waypoint stepper, live GPS telematics card, incident alert banner, and emergency roadside breakdown drawer (AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9).
- [ ] 10. Write automated unit and integration tests in `packages/shared/tests/phase15-fleet-telematics.test.ts` verifying waypoint geometry, progress calculation, incident delay math, and lookup validation (AC-2, AC-4, AC-5, AC-6).

## Consequences

**Positive**:
- Passengers and their loved ones have clear visibility into vehicle transit progression and expected arrival time.
- Integrated tracking on `/track` provides a single authoritative portal for all ATM transport tracking (parcels and passenger trips).
- Phase 14 roadside incident advisories logged by drivers immediately surface on passenger timelines, preventing anxious phone inquiries to terminals.
- High contrast emergency roadside assistance drawer empowers passengers with immediate safety contact numbers during breakdowns.

**Negative / tradeoffs**:
- Between physical terminal dispatch and destination arrival, location is modeled via corridor progression rather than live satellite tracking hardware.

**Neutral**:
- Reuses existing driver profiles, booking records, and terminal contact fixtures without modifying the underlying core database schema.
