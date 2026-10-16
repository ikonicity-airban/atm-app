# 0009. Booking flow and seat hold locks

**Date**: 2026-10-15
**Status**: Accepted

## Summary

This specification defines the interactive seat selection, passenger information capture, and temporary seat hold reservation system for Ascent Transport Management. Passengers choose their exact seats within our executive five passenger Toyota Sienna cabin and lock their selection for fifteen minutes while providing emergency manifest details. Temporary seat holds prevent double booking collisions using database row locks and cryptographic tokens, releasing automatically if payment is not completed before expiration.

## Context

Ascent Transport Management operates executive five passenger Toyota Sienna minivans across Nigerian interstate travel corridors. Because each vehicle carries exactly five passenger seats (one front executive seat and four rear window seats), inventory scarcity makes simultaneous seat selection highly competitive during peak travel periods. Without atomic reservation locks, two passengers attempting to book Seat 1 on the morning Enugu to Abuja departure could proceed to payment simultaneously, causing double booking conflicts, customer dissatisfaction, and manual reconciliation overhead.

To protect customers and maintain seat integrity, seat inventory requires an atomic reservation hold before initiating payment. When a passenger selects seats, the system places a temporary fifteen minute hold lock on those specific seat numbers for that departure trip. While held, no other traveler can select or purchase those seats.

In addition, Nigerian Federal Road Safety Corps regulations and interstate passenger safety guidelines require travel operators to collect full passenger manifest records before vehicle departure. This includes passenger full names, E.164 normalized phone numbers, email addresses for ticket delivery, and emergency next of kin phone numbers. Capturing these details during the reservation hold guarantees that all manifest requirements are satisfied prior to checkout.

All existing core domain rules remain strictly preserved:
- Money is stored as integer kobo everywhere, never floating point numbers. Total fare calculations compute as base fare kobo multiplied by passenger count at the interface edge.
- Departure dates and timestamps save in UTC ISO-8601 and display in Africa/Lagos WAT (UTC+1).
- Customer and emergency next of kin phone numbers normalize to E.164 (+234...) on write.
- Server side Zod validation is required on all mutations and form submissions.
- No pulsing animations are permitted under any condition.
- Minimum touch targets of forty four pixels are enforced for all interactive seat buttons.

## Requirements

**User stories**:
- As a traveler, I want to inspect a clear diagram of the five passenger Toyota Sienna vehicle interior so that I can pick my preferred seat (front executive seat or rear window seats).
- As a traveler, I want my selected seats held exclusively for fifteen minutes while I enter my passenger details so that nobody takes my seats while I fill the form.
- As a traveler, I want a live countdown timer showing remaining hold time so that I know exactly how much time I have to review and pay.
- As a traveler, I want my contact information and emergency next of kin details validated clearly so that my travel booking complies with passenger safety standards.
- As a terminal manager, I want atomic database locks on held seats so that double bookings never occur across our fleet departures.

**Acceptance criteria**:
- **AC-1**: The seat selection interface displays an interactive five passenger Toyota Sienna cabin map (Seat 1 front executive, Seats 2 and 3 middle row, Seats 4 and 5 back row), clearly differentiating available, occupied, held, and selected states.
- **AC-2**: Seat selection validation enforces that the number of selected seats strictly equals the passenger count (between one and five passengers) and rejects invalid or driver seat numbers.
- **AC-3**: The passenger details form captures lead passenger full name, E.164 normalized phone number (+234...), contact email, emergency next of kin phone number, and individual passenger names for each seat.
- **AC-4**: Initiating a hold creates a database reservation with an expiration timestamp set to exactly fifteen minutes (900 seconds) in the future.
- **AC-5**: Each hold generates a secure cryptographic token (SHA-256 hash stored in database, raw token returned to client) required to authenticate checkout or manual release.
- **AC-6**: Database operations run with atomic row level isolation, returning a 409 conflict error with friendly explanation if any requested seat was locked by another user.
- **AC-7**: The booking page features a countdown timer indicating minutes and seconds remaining, displaying a gentle warning at two minutes and an accessible expiration dialog at zero.
- **AC-8**: Expired holds are automatically treated as released by seat availability queries, allowing seats to return to available inventory without manual database cleanup.
- **AC-9**: Hold creation accepts a client generated idempotency key, ensuring network retries return the active hold rather than creating duplicate records.
- **AC-10**: Total booking amount is calculated strictly in integer kobo (`baseFareKobo * passengerCount`) and validated server side with shared Zod schemas before locking seats.

## Options considered

### Option 1: PostgreSQL row level hold locks with SHA-256 tokens and fifteen minute timestamps via Drizzle ORM (Chosen)

In this approach, temporary seat holds are stored directly in PostgreSQL within the existing database schema. When a user requests seats, an atomic transaction checks existing active holds (where `status = 'held'` and `holdExpiresAt > NOW()`) and inserts the new hold record with a fifteen minute expiration timestamp. A random cryptographic token is generated, hashed with SHA-256 for database storage, and returned to the client to authorize subsequent payment transitions.

**Pros**:
- Reuses existing PostgreSQL database and Drizzle ORM connection without introducing new infrastructure dependencies or Redis operational costs.
- Guarantees complete ACID consistency: checking availability and locking seats occurs in an atomic database transaction.
- Converting an active hold into a confirmed ticket during payment runs within a single database transaction, eliminating distributed state sync issues.
- Expired holds naturally self invalidate using SQL timestamp filters (`holdExpiresAt <= NOW()`), avoiding reliance on background cleanup jobs.

**Cons**:
- Slightly more database writes during high concurrency seat browsing compared to in-memory caches, though fully negligible for five passenger vehicle volumes.

### Option 2: In-memory Redis cache with TTL key expiration

In this approach, temporary seat holds are stored in an external Redis instance with key expiration (TTL) set to 900 seconds.

**Pros**:
- Fast key lookups in memory with automatic key eviction when TTL expires.

**Cons**:
- Introduces an external Redis service requirement, increasing infrastructure complexity and operational points of failure.
- Distributed synchronization risk: if Redis holds expire while database payment webhooks process, race conditions can cause orphaned transactions.
- Does not align with the project stack rule of keeping dependencies minimal and leveraging Neon PostgreSQL.

## Decision

**Chosen option**: Option 1: PostgreSQL row level hold locks with SHA-256 tokens and fifteen minute timestamps via Drizzle ORM.

We will manage temporary seat reservations directly in PostgreSQL using Drizzle ORM, storing fifteen minute hold expiration timestamps alongside SHA-256 hashed reservation tokens.

**Implementation skills**: `drizzle-orm` (`drizzle-team/drizzle-orm`, `.agents/skills/drizzle-orm/`), `zod-schema-validation` (`mindrally/skills`, `.agents/skills/zod-schema-validation/`), `coss` (`cosscom/ui`, `.agents/skills/coss/`), `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`).

## Rationale

Ascent Transport Management operates executive Toyota Sienna vehicles with five passenger seats per departure. Total transaction throughput per route is orderly and bounded. Introducing an external in memory cache like Redis would add unnecessary operational surface area, deployment overhead, and failure modes without performance benefits.

Storing temporary holds directly in PostgreSQL guarantees strict transactional consistency. When payment confirms in Phase 4, the hold record updates to confirmed status within a single atomic database transaction. Using cryptographic SHA-256 tokens prevents malicious travelers from guessing booking IDs or modifying reservations that do not belong to them.

## Feature design

**Data model sketch**:

```
Table: booking_holds
- id: text (primary key, uuid)
- tripId: text (foreign key -> trips.id, required, indexed)
- seatNumbers: integer array (e.g. [1, 2], required)
- contactName: text (required)
- contactPhone: text (normalized E.164, required)
- contactEmail: text (required)
- nextOfKinPhone: text (normalized E.164, required)
- passengerNames: jsonb (record of seat number to passenger name, required)
- totalFareKobo: integer (baseFareKobo * passengerCount, required)
- holdTokenHash: text (SHA-256 hex digest of client hold token, required)
- idempotencyKey: text (unique, required)
- status: enum ('held', 'converted', 'released', 'expired') (default 'held', indexed)
- createdAt: timestamp with time zone (default now)
- holdExpiresAt: timestamp with time zone (createdAt + 15 minutes, indexed)
```

**State transitions**:
- `held`: Initial state when seats are reserved. Active while `now() < holdExpiresAt`.
- `converted`: Passenger successfully completes Paystack payment (Phase 4). Seats convert to confirmed booking tickets.
- `released`: Passenger cancels hold manually or navigates away. Seats return to inventory immediately.
- `expired`: Current time exceeds `holdExpiresAt` without payment. Ignored by queries, inventory reclaims automatically.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/trips/[tripId]/seats` | GET | `tripId: string` | `occupiedSeats: number[]`, `heldSeats: number[]`, `availableSeats: number[]` | Public | 404 (trip not found) |
| `/api/bookings/hold` | POST | `tripId`, `seatNumbers`, `contactPhone`, `contactName`, `contactEmail`, `nextOfKinPhone`, `passengerNames`, `idempotencyKey` | `holdId`, `holdToken`, `holdExpiresAt`, `totalFareKobo` | Public | 400 (validation), 409 (seat collision), 422 (cutoff passed) |
| `/api/bookings/hold/[holdId]` | GET | `holdId`, `header: x-hold-token` | `holdDetails`, `secondsRemaining`, `status` | Public with Token | 401 (invalid token), 404 (not found), 410 (expired) |
| `/api/bookings/hold/[holdId]/release` | POST | `holdId`, `header: x-hold-token` | `success: boolean` | Public with Token | 401 (invalid token), 404 (not found) |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Load vehicle layout | Five selectable seats diagram | `SIENNA_5_SEAT_LAYOUT` constant in `@atm/shared` |
| Seat availability | Occupied seat numbers | Combined paid tickets and active unexpired holds from database |
| Hold duration | 900 seconds (15 minutes) | System settings repository default (`holdDurationMinutes: 15`) |
| Total fare | Integer kobo total | `trip.fareKobo * selectedSeats.length` derived on client and verified server side |
| Security token | Raw hold token string | `crypto.randomBytes(32).toString('hex')` generated on server |
| Phone numbers | Normalized E.164 strings | `normalisePhone` utility in `@atm/shared` |
| Expiration countdown | Remaining seconds | `Math.max(0, Math.floor((holdExpiresAt - Date.now()) / 1000))` |

**Key invariants**:
- Exactly five passenger seats exist per Toyota Sienna vehicle (Seat 1 executive front, Seats 2 to 5 rear window seats). Driver seat 0 is never selectable.
- A seat cannot be held by more than one active reservation at any instant.
- Fares are strictly non negative integer kobo values, never floating point numbers.
- Expired holds are excluded from active occupancy checks using SQL `where status = 'held' and holdExpiresAt > now()`.
- Customer phone numbers normalize to E.164 (+234...) format on write.

**Security model**:
- Hold creation is rate limited by client IP address to prevent denial of inventory attacks.
- Hold details, remaining time, and release actions require the raw `x-hold-token` header, preventing third parties from accessing or tampering with reservations.
- Database queries use parameterized inputs via Drizzle ORM to eliminate SQL injection vulnerabilities.

**Configuration required**:
- `HOLD_DURATION_MINUTES`: Number of minutes a seat hold remains active before expiration (defaults to 15).

**Critical test scenarios**:
- Happy path: User selects two seats, enters valid passenger and next of kin details, receives active fifteen minute hold token, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-10**.
- Seat collision failure: User B attempts to reserve a seat already locked by User A, receiving an immediate 409 conflict response with seat reselection prompt, verifies **AC-6**.
- Hold expiration: Hold countdown hits zero, status transitions to expired, and seats immediately become bookable by another user, verifies **AC-7**, **AC-8**.
- Idempotent retry: User clicks submit twice rapidly with identical idempotency key; server returns identical hold details without creating duplicate rows, verifies **AC-9**.
- Seat count validation: User attempts to select three seats for two passengers, receiving clear validation error before submission, verifies **AC-2**.

## Build plan

1. Define `booking_holds` database table schema and relations in `packages/db/src/schema/bookings.ts`, satisfies **AC-4**, **AC-5**.
2. Update shared seat hold schemas and fifteen minute duration constants in `packages/shared/src/schemas/booking.ts` and `packages/shared/src/constants/settings.ts`, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-10**.
3. Implement `BookingRepository` methods for atomic hold creation, collision detection, idempotency lookup, and automatic expiration filtering in `apps/web/src/server/repositories/bookings.ts`, satisfies **AC-4**, **AC-5**, **AC-6**, **AC-8**, **AC-9**.
4. Create Next.js API route handlers for `/api/trips/[tripId]/seats`, `/api/bookings/hold`, and `/api/bookings/hold/[holdId]/release`, satisfies **AC-4**, **AC-5**, **AC-6**.
5. Connect `apps/web/src/app/(public)/book/[tripId]/page.tsx` and `SeatMap.tsx` with live 15-minute countdown, non blocking expiration modal, and stepper progression, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-7**, **AC-10**.
6. Write contract and unit tests verifying concurrency collision prevention, expiration filtering, and idempotency, satisfies **AC-6**, **AC-8**, **AC-9**.

## Consequences

**Positive**:
- Eliminates double booking collisions across all scheduled Toyota Sienna departures.
- Provides a calm fifteen minute window for travelers to enter passenger names and emergency contact details without rush.
- Clear visual seating diagram empowers travelers to choose executive front or rear window preferences.
- Transparent countdown timer and friendly expiration modal guide travelers when holds lapse.

**Negative / tradeoffs**:
- Active holds temporarily reduce available seat inventory for fifteen minutes. If a user abandons without paying, those seats remain locked until expiration.
- Mitigated by explicit manual release button on back navigation and automatic query filtering.

**Neutral**:
- Database load remains light as each Sienna trip handles a maximum of five passenger seats.

## References

**Project sources**:
- `apps/web/src/app/(public)/book/[tripId]/page.tsx`
- `apps/web/src/components/booking/SeatMap.tsx`
- `packages/shared/src/constants/vehicle.ts`
- `packages/shared/src/schemas/booking.ts`
- `packages/db/src/schema/bookings.ts`
- Spec `0003-home-and-trip-query-engine.md`
