# 0003. Home and trip query engine

**Date**: 2026-10-14
**Status**: Accepted

## Summary

This specification defines the interactive search widget and trip query engine for Ascent Transport Management. Travelers search for scheduled five passenger Toyota Sienna departures across active Nigerian corridors using validated origin, destination, travel date, and passenger counts. The engine computes real time seat availability, enforces cutoff windows before departure, and returns integer kobo fares with zero floating point math.

## Context

Intercity road travel in Nigeria often suffers from unpredictable roadside delays, irregular loading times, and opaque terminal pricing. Ascent Transport Management addresses this problem by running scheduled five passenger Toyota Sienna services along three primary travel corridors connecting Enugu, Abuja, Lagos, and Owerri.

Travelers need a reliable discovery interface on the public home page and dedicated search view. The query engine must answer three core questions in under two hundred milliseconds: which departures exist on a chosen date, how many seats remain open out of the five passenger capacity, and whether booking remains open based on the departure cutoff window.

Failing to define this engine carefully leads to severe operational hazards. A traveler could attempt to book a departed vehicle, search for unsupported routes, or see floating point rounding errors in ticket fares. In addition, time zone confusion between browser local time and West Africa Time (UTC+1) could display departures on the wrong day.

## Requirements

**User stories**:
- As a traveler, I want to select my departure city, destination city, travel date, and passenger count so that I can see available trips that fit my schedule.
- As a traveler, I want to see clear departure times in West Africa Time and exact fares in Naira so that I can make an informed booking decision.
- As a traveler, I want immediate feedback when selecting an unserved corridor so that I understand which routes are active and can adjust my journey.

**Acceptance criteria**:
- **AC-1**: The search widget validates origin and destination pairs against active corridors (Enugu to Abuja, Enugu to Lagos, Lagos to Owerri, and their reverse directions), rejecting invalid pairs with helpful guidance.
- **AC-2**: Travel dates validate against Africa/Lagos calendar days, preventing past date queries and capping advance bookings at thirty days.
- **AC-3**: Passenger counts validate between one and five passengers, directing inquiries for six or more passengers to the corporate charter flow.
- **AC-4**: Trip search queries return scheduled departures with origin terminal, destination terminal, departure timestamp in UTC ISO-8601, and integer kobo fares.
- **AC-5**: Real time seat availability evaluates active tickets and unexpired holds, reporting remaining seats out of five and marking sold out trips clearly.
- **AC-6**: Bookability checks enforce a sixty minute cutoff before departure, marking trips as departed or booking closed when the cutoff passes.
- **AC-7**: The search results page provides a seven day date navigation strip, terminal filter dropdown for multi hub cities, and sorting by earliest departure or lowest fare.
- **AC-8**: All interactive elements maintain touch targets of at least forty four pixels, and loading states render static skeleton blocks with zero pulsing animations.

## Options considered

### Option 1: Client side in memory trip generation with dual repository backing (Chosen)

In this approach, departure templates generate daily trips with real time seat calculations. A clean repository interface supports both in memory static templates for fast preview testing and Drizzle ORM queries against Neon PostgreSQL when database connections are active.

**Pros**:
- Works reliably in preview environments, automated unit tests, and production deployments without hard database coupling.
- Pure shared domain utility functions handle corridor matching and date parsing with zero framework dependencies.
- Very high query performance with minimal latency.

**Cons**:
- In memory mode requires synchronization if deployed across multiple stateful nodes, which is resolved once Postgres is the primary source of truth.

### Option 2: Pure server side database queries for every search request

In this approach, every query executes directly against the PostgreSQL `trips` table with SQL joins across `routes`, `terminals`, and `tickets`.

**Pros**:
- Single central data store with standard relational foreign keys.
- Complex database aggregations can calculate booked seats directly in SQL.

**Cons**:
- Requires active database connection for basic unit testing and preview environments.
- Higher read latency on cold database connections.

### Option 3: Third party search engine index

In this approach, scheduled trips are indexed into an external search engine such as Meilisearch or Algolia.

**Pros**:
- Fast typo tolerance and multi attribute filtering.

**Cons**:
- Unnecessary infrastructure overhead for fixed daily schedules across six terminals.
- Frequent seat inventory updates create high write amplification on external search indices.

## Decision

**Chosen option**: Option 1: Client side in memory trip generation with dual repository backing.

We adopt a dual data source repository architecture backed by pure domain utilities in packages/shared, providing fast, deterministic trip queries that operate seamlessly in local testing, edge runtimes, and database environments.

**Implementation skills**: `drizzle-orm` (`mindrally/skills`, `.agents/skills/drizzle-orm/`) · `zod-schema-validation` (`mindrally/skills`, `.agents/skills/zod-schema-validation/`) · `tailwindcss` (`mindrally/skills`, `.agents/skills/tailwindcss/`) · `turborepo` (`mindrally/skills`, `.agents/skills/turborepo/`) · `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`)

## Rationale

The dual repository pattern matches the project tracer bullet build approach. It allows the front end search interface, date picker, seven day quick pick strip, and result cards to be fully built and verified with high speed unit and contract tests.

By placing corridor definitions, Lagos date calculations, and bookability logic in `packages/shared`, both the browser client and server side API routes share identical validation rules. Integer kobo storage ensures zero currency discrepancies across the system.

## Feature design

**Data model sketch**:
- `terminals`: `id` (text, primary key), `code` (text, unique), `name` (text), `city` (text), `address` (text), `contact_phone` (text).
- `routes`: `id` (text, primary key), `origin_terminal_id` (foreign key to terminals), `destination_terminal_id` (foreign key to terminals), `distance_km` (integer), `duration_hours` (integer).
- `schedules`: `id` (text, primary key), `route_id` (foreign key to routes), `departure_time_lagos` (text, e.g. "06:30"), `days_of_week` (integer array), `base_fare_kobo` (integer).
- `trips`: `id` (text, primary key), `schedule_id` (foreign key to schedules), `route_id` (foreign key to routes), `departure_time` (timestamp UTC), `vehicle_id` (foreign key to vehicles), `fare_kobo` (integer), `status` (text).
- `tickets`: `id` (text, primary key), `trip_id` (foreign key to trips), `seat_no` (integer, 1 to 5), `status` (text), `hold_expires_at` (timestamp UTC).

**State transitions**:
- Trip status: `scheduled` -> `boarding` -> `departed` -> `completed` (or `cancelled`).
- Seat state: `available` -> `held` (fifteen minute hold) -> `paid` (confirmed) -> `checked_in`.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/trips` | GET | `from:string`, `to:string`, `date:YYYY-MM-DD`, `passengers:number` | HTML page with trip list | Public | 400 invalid params |
| `tripRepository.searchTrips` | Function | `originCity:string`, `destinationCity:string`, `date:string`, `passengers:number` | `TripSearchResult[]` | Internal | Empty array on unserved corridor |
| `tripRepository.getTripById` | Function | `id:string` | `TripSearchResult \| null` | Internal | Returns null if not found |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Search trips | Origin and destination city names | Query parameters validated against `SERVED_CITIES` |
| Search trips | Departure date | Query parameter validated against `getLagosDate()` |
| Display trip card | Formatted departure time | `trip.departureTimeUtc` formatted in `Africa/Lagos` |
| Display trip card | Seat price in Naira | `trip.fareKobo` formatted via `formatNaira` |
| Display trip card | Remaining available seats | Computed by subtracting active tickets from five |
| Display trip card | Bookability flag | Evaluated via `isBookable(trip.departureTimeUtc)` |

**Key invariants**:
- Total vehicle capacity is strictly five passenger seats.
- Fares are always positive integers representing kobo.
- Departures are calculated in Africa/Lagos timezone (UTC+1) with zero daylight saving time offsets.
- Trips with departure times within sixty minutes of the current time are not bookable.

**Security model**:
- All search and query endpoints are public and read only.
- Input parameters are strictly validated using Zod to prevent injection and resource exhaustion.
- No user credentials or session tokens are required for searching departures.

**Configuration required**:
- No external third party API keys are required for the query engine.

**Critical test scenarios**:
- Happy path: User searches Enugu to Abuja for today, sees scheduled departures with fares in Naira and seat counts, verifies **AC-1**, **AC-4**, **AC-5**.
- Unserved corridor: User searches Abuja to Owerri, receives an unserved corridor card with suggestions, verifies **AC-1**.
- Cutoff window: Trip departing in thirty minutes is marked as booking closed, verifies **AC-6**.
- Date validation: User requests yesterday date, validation error triggers with message, verifies **AC-2**.
- Passenger bounds: User enters zero or six passengers, form rejects input, verifies **AC-3**.

## Build plan

- [x] 1. Validate search query parameters with shared Zod schema and served corridor matcher, satisfies **AC-1**, **AC-2**, **AC-3**.
- [x] 2. Implement trip repository search engine with schedule templates and integer kobo pricing, satisfies **AC-4**.
- [x] 3. Implement real time seat calculation and same day departure cutoff rules, satisfies **AC-5**, **AC-6**.
- [x] 4. Render public home hero search form with corridor swap and passenger selectors, satisfies **AC-1**, **AC-8**.
- [x] 5. Render trip search results page with seven day date strip, terminal filter, and zero pulse skeletons, satisfies **AC-7**, **AC-8**.
- [x] 6. Run comprehensive unit and contract test suite verifying query logic and edge conditions, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**.

## Consequences

**Positive**:
- Deterministic search behavior across both client components and server code.
- Immediate response times for travelers without database connection overhead in static mode.
- Strong type safety and zero currency floating point errors.

**Negative / tradeoffs**:
- New corridors require updating schedule templates in addition to route tables.
- Schedule generation is computed on read rather than persisted in advance for distant dates.

**Neutral**:
- Multi terminal cities (such as Lagos with Jibowu, Ajah, and Festac) require terminal level filtering on the results page.

## Follow-up

- [ ] Connect trip repository to live PostgreSQL pooler when database connection strings are configured.
