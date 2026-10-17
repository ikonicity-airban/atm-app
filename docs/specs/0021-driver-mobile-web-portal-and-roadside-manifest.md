# 0021. Driver Mobile Web Portal and Roadside Manifest

**Date**: 2026-10-17
**Status**: Accepted

## Summary

This specification establishes a dedicated driver mobile web portal and roadside manifest interface for Ascent Transport Management commercial fleet drivers. Operating on smartphones over Nigerian highway corridors, drivers authenticate through flexible sign in credentials (phone number with one-time verification code, driver badge identifier, or email with PIN), inspect assigned vehicle trips, verify passenger boarding rosters, access offline cached roadside manifests during cellular signal drops, record roadside incident advisories, and log trip departure and terminal arrival milestones. It transforms highway vehicle operations from paper slips into a synchronized digital workflow while keeping passenger data safe and accessible even in network dead zones.

## Context

Ascent Transport Management operates Toyota Sienna five passenger fleets traversing long distance intercity routes across Nigeria, including Enugu to Abuja, Lagos to Benin, and Abuja to Owerri. Currently, passenger boarding verification occurs at terminal counters, and drivers carry physical printed paper manifests. However, once vehicles depart terminal gates and travel along highway bypasses, operations staff lose real-time visibility into vehicle journey milestones, driver roadside delays, or emergency incident checkpoints.

Furthermore, Nigerian commercial highway travel presents unique infrastructure realities. Long highway stretches between major cities frequently experience complete cellular network blackspots. Commercial drivers using handheld smartphones need a purpose-built mobile portal that remains legible in direct sunlight, operates with large touch targets suitable for one-handed operation, and automatically caches passenger emergency manifests offline so that law enforcement or roadside safety inspections proceed without cellular network dependency.

Additionally, drivers have varied technological familiarity. Requiring single-factor passwords leads to frequent account lockouts on the road. Offering flexible sign-in methods (registered mobile phone with one-time verification code, official driver badge identifier with security PIN, or email credentials) ensures drivers quickly access their manifests while maintaining audit attribution.

## Requirements

**User stories**:
- As a commercial fleet driver, I want to authenticate into my mobile portal using my phone number, driver badge ID, or email so that I can access my assigned trips without account lockout friction.
- As a driver waiting at the terminal departure bay, I want to see my assigned vehicle registration, passenger seat list, and live boarding status so that I know exactly who is in my vehicle before rolling out.
- As an intercity driver driving through highway areas without internet, I want my digital passenger manifest cached locally on my phone so that I can present verified passenger and emergency next of kin details during Federal Road Safety Corps (FRSC) roadside checkpoints.
- As a driver on the road, I want to log journey milestones (Departure, Roadside Delay, Arrival) and report highway incident advisories so that terminal operations dispatchers and passengers stay informed.

**Acceptance criteria**:
- **AC-1**: Dedicated driver mobile web application exists at `/driver`, featuring high contrast responsive styling, a minimum of 48px touch targets, zero pulsing animations, and viewport optimization for mobile smartphones.
- **AC-2**: Driver authentication supports flexible multi-method sign in via registered Nigerian mobile phone with SMS one-time verification code, driver badge identifier (e.g. `DRV-ENU-01`) with four-digit PIN, or email with password, issuing role-restricted session tokens scoped to driver operations.
- **AC-3**: Driver dashboard displays the driver's active daily trip assignment, showing vehicle registration plate, scheduled departure time in Africa/Lagos (WAT), corridor title, and real-time passenger boarding completion summary.
- **AC-4**: Passenger roster view displays individual five-passenger Toyota Sienna cabin allocations, passenger contact numbers, destination terminal drops, and an interactive toggle allowing drivers to mark confirmed passenger boarding.
- **AC-5**: Roadside digital manifest is automatically stored in client-side persistent storage (localStorage) upon initial online fetch with an explicit cache timestamp, allowing full offline inspection of passenger emergency next of kin details without internet connectivity.
- **AC-6**: Drivers can report real-time roadside incident advisories (categorized as mechanical breakdown, FRSC/police highway checkpoint, heavy traffic gridlock, or weather delay) with an optional location note, updating trip operational status in the dispatch log.
- **AC-7**: Journey progress controls allow drivers to transition assigned trips through valid operational states: `boarding` to `in_transit` upon departure, and `in_transit` to `completed` upon reaching the destination terminal, recording UTC timestamps.
- **AC-8**: Direct emergency support bar provides one-tap telephone calling to the origin terminal dispatch desk, destination terminal, and ATM central safety operations line.

## Options considered

### Option 1: Dedicated progressive mobile web application with offline manifest caching and multi-method authentication (Recommended)

Build a dedicated mobile-first route group under `apps/web/src/app/(driver)/driver` paired with client-side persistent storage caching, flexible sign-in mechanisms, and touch-optimized action cards.

**Pros**:
- Zero app store install friction; drivers open the web portal directly via mobile browser or saved home screen bookmark.
- Client-side storage ensures roadside passenger manifests remain readable when vehicles traverse network dead zones along rural expressways.
- Multiple authentication paths (phone OTP, driver ID with PIN, email) accommodate varying driver technical literacy and emergency device replacements.
- Full integration with existing dispatch and trip state repositories in `@atm/shared` and `apps/web/src/server/repositories`.

**Cons**:
- Offline capabilities are bounded by browser storage limits and web runtime (sufficient for text manifests and status queues).

### Option 2: Native Android mobile application (Kotlin / React Native)

Develop a separate native Android mobile app distributed via APK or private Google Play store track.

**Pros**:
- Direct hardware access for background GPS geofencing and push notifications.

**Cons**:
- High distribution friction across diverse driver personal smartphones.
- Requires maintaining separate build toolchains, app store releases, and APK updates across terminals.
- Defers immediate release when a responsive mobile web interface solves the operational requirements today.

### Option 3: Driver view embedded directly inside `/admin` back-office dashboard

Add a restricted role tab for drivers inside the existing desktop `/admin` dashboard layout.

**Pros**:
- Reuses existing administrative navigation bar and layout components without creating a new route group.

**Cons**:
- Administrative desktop sidebar and tables are clunky and difficult to navigate on five-inch mobile screens in bright daylight.
- Lacks offline caching resilience required for roadside highway checkpoints.
- Mixes administrative management concerns with driver-specific highway execution tasks.

## Decision

**Chosen option**: Option 1: Dedicated progressive mobile web application with offline manifest caching and multi-method authentication.

We will create a dedicated mobile web application under `/driver` with flexible driver sign-in, offline manifest persistence, passenger boarding toggles, roadside incident reporting, and trip milestone transitions.

**Implementation skills**: `coss` (`cosscom/ui`, `.agents/skills/coss/`) · `improve-ui` (`ibelick/ui-skills`, `.agents/skills/improve-ui/`) · `vercel-react-best-practices` (`vercel/engineering`, `.agents/skills/vercel-react-best-practices/`)

## Rationale

Nigerian intercity drivers operate in fast-paced terminal bays and remote highway corridors. Physical manifests can be misplaced or damaged by weather, and cellular connectivity drops frequently between state borders. A standalone mobile web application optimized for touch, high optical contrast, and instant local manifest caching gives drivers the exact tools they need to manage their vehicle without adding APK installation overhead. Reusing existing shared data types from `@atm/shared` guarantees that trip status changes immediately reflect across terminal manager consoles and public parcel tracking timelines.

## Feature design

### Data model sketch

Shared driver domain entities and trip manifest extensions:

```typescript
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

export interface CachedRoadsideManifest {
  tripId: string;
  cachedAtUtc: string;
  manifestNumber: string;
  vehiclePlate: string;
  driverName: string;
  driverPhone: string;
  originTerminal: { name: string; city: string; phone: string };
  destinationTerminal: { name: string; city: string; phone: string };
  passengers: {
    seatNo: number;
    name: string;
    phone: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    isBoarded: boolean;
  }[];
}
```

### State transitions

Trip operational state machine driven by driver actions:

```
[scheduled] ──(bay marshal dispatches)──> [boarding]
[boarding]  ──(driver confirms passengers & departs)──> [in_transit]
[in_transit] ──(driver logs incident)──> [delayed] (or remains in_transit with advisory log)
[in_transit / delayed] ──(driver arrives at destination terminal)──> [completed]
```

### API surface

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/driver/auth/login` | POST | identifier (phone / badgeId / email), credential (pin / password), authMethod | sessionToken, driverProfile | Public | 401 invalid credentials, 429 rate limit |
| `/api/driver/auth/otp/send` | POST | phone: string | success: boolean, retryAfterSeconds | Public | 400 invalid phone, 404 driver not found |
| `/api/driver/auth/otp/verify` | POST | phone: string, otp: string (6 digits) | sessionToken, driverProfile | Public | 401 invalid or expired OTP |
| `/api/driver/trip/active` | GET | none | activeTrip: DispatchTrip, manifest: HighwayManifest | Driver Session | 404 no active assigned trip |
| `/api/driver/trip/board-passenger` | POST | tripId: string, seatNo: number, isBoarded: boolean | success: boolean, updatedPassenger | Driver Session | 400 trip not in boarding state, 404 seat not found |
| `/api/driver/trip/status` | POST | tripId: string, status: 'in_transit' \| 'completed', note?: string | success: boolean, updatedTrip | Driver Session | 400 invalid transition, 403 unauthorized driver |
| `/api/driver/trip/incident` | POST | tripId: string, category: RoadsideIncidentType, description: string, locationNote?: string | incident: RoadsideIncidentReport | Driver Session | 400 missing required fields |

### Value sourcing

| Action | Value produced / displayed | Source |
|---|---|---|
| Driver sign-in | Authenticated driver identity | `drivers` repository matched against normalized phone, badge ID, or email |
| Trip dashboard render | Assigned vehicle and corridor details | `DispatchRepository.getTripsForDate` filtered by assigned driver ID |
| Passenger manifest render | 5-seat cabin allocations and emergency contacts | `DispatchRepository.getHighwayManifest(tripId)` passenger roster |
| Offline manifest storage | Cached manifest timestamp and payload | Client-side `localStorage` serialized JSON written on successful network fetch |
| Boarding mark update | Passenger boarded checkmark and timestamp | User toggle input persisted via `DispatchRepository.markPassengerBoarded` |
| Journey status update | Updated trip status (`in_transit`, `completed`) | Trip state machine transition verified via `canTransitionTripStatus` |
| Roadside incident log | Incident category, timestamp, and location note | Driver form input validated by `createIncidentSchema` stored in memory/DB repository |
| Emergency contact call | Terminal phone dialer link | `SEED_TERMINALS` telephone array formatted with `tel:` URI |

### Key invariants

- Drivers can only view and modify trips assigned specifically to their driver identifier.
- Only trips in `boarding` status can transition to `in_transit`.
- Only trips in `in_transit` or `delayed` status can transition to `completed`.
- Offline manifests must strictly display the UTC timestamp when cached so highway patrol officers see manifest freshness.
- Seat layout strictly adheres to the five-passenger Toyota Sienna configuration (Seat 1: Front Window, Seats 2-3: Middle Row, Seats 4-5: Rear Row).
- Emergency phone dialers always normalize to valid Nigerian telephone links (`tel:+234...`).

### Security model

- Driver endpoints require valid role-scoped session headers or cookies (`Role: driver`).
- Rate limiting protects sign in and OTP verification endpoints against brute-force credential stuffing.
- Driver sessions are scoped to driver operations only, with zero access to administrative financial reports, customer credit balances, or fleet dynamic pricing consoles.

### Configuration required

- No new external infrastructure services or environment variables are required. Existing SMS notification stubs in `@atm/shared` and session token generation in `apps/web/src/lib/auth.ts` are leveraged.

### Critical test scenarios

- Happy path: Driver authenticates via driver badge ID and PIN, views assigned trip, marks passengers boarded, checks manifest offline, logs departure, and completes arrival, verifies **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-7**.
- Multi-method authentication: Driver logs in using registered Nigerian phone number with 6-digit OTP verification, verifies **AC-2**.
- Roadside incident reporting: Driver submits breakdown advisory with highway waypoint note; trip transitions to delayed status and logs advisory in trip timeline, verifies **AC-6**.
- Offline persistence: Client-side manifest reader gracefully displays cached passenger roster and emergency phone numbers when network requests fail, verifies **AC-5**.
- Unauthorized access rejection: Unauthenticated requests or requests for unassigned trip manifests return HTTP 401 or 403 forbidden, verifies **AC-2**, **AC-3**.

## Build plan

1. Define shared driver schemas, incident types, and validation models in `packages/shared/src/schemas/driver.ts` and `packages/shared/src/types/driver.ts`, satisfies **AC-2**, **AC-6**.
2. Implement server-side driver repository with multi-method authentication (badge ID, phone OTP, email), active trip resolution, and incident logging in `apps/web/src/server/repositories/driver.ts`, satisfies **AC-2**, **AC-3**, **AC-6**, **AC-7**.
3. Create API route handlers under `apps/web/src/app/api/driver/` for authentication, OTP dispatch, active trip retrieval, passenger boarding toggles, incident reporting, and status updates, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-6**, **AC-7**.
4. Build responsive touch-friendly driver mobile layout and authentication views at `apps/web/src/app/(driver)/driver/login/page.tsx` with tabs for Phone OTP, Driver Badge ID, and Password, satisfies **AC-1**, **AC-2**.
5. Build driver active trip dashboard at `apps/web/src/app/(driver)/driver/page.tsx` with departure countdown, corridor details, passenger roster, and emergency contact drawer, satisfies **AC-1**, **AC-3**, **AC-4**, **AC-8**.
6. Build offline-capable roadside manifest view with local storage persistence and FRSC inspection view at `apps/web/src/app/(driver)/driver/manifest/page.tsx`, satisfies **AC-1**, **AC-5**.
7. Build roadside incident advisory modal allowing one-tap reporting of checkpoints, traffic delays, and mechanical breakdowns with live operational status updates, satisfies **AC-1**, **AC-6**, **AC-7**.
8. Write comprehensive automated unit and contract test suites in `packages/shared/tests/phase14-driver-manifest.test.ts` verifying authentication methods, state machine transitions, incident schemas, and manifest offline caching structures, satisfies **AC-2**, **AC-5**, **AC-6**, **AC-7**.

## Consequences

**Positive**:
- Eliminates reliance on paper manifests vulnerable to rain, loss, or roadside wear.
- Real-time journey milestone tracking provides dispatchers and passengers immediate visibility into vehicle movement.
- Offline resilience guarantees compliance with Federal Road Safety Corps (FRSC) commercial passenger documentation requirements even in remote rural corridors.
- Flexible multi-method sign in eliminates driver account lockout friction.

**Negative / tradeoffs**:
- Drivers must have access to a basic smartphone with working mobile web browser.
- Offline status updates made in network dead zones must queue locally and synchronize once cellular connection is restored.

**Neutral**:
- Reuses existing vehicle dispatch data models and passenger lists from Spec 0016 without requiring redundant database schemas.

## Follow-up

- [ ] Add Progressive Web App (PWA) web manifest icons for one-tap Android home screen installation.
- [ ] Connect GPS location sharing when telematics feature (Phase 15) is developed.
