# Spec 0019: Charter and Corporate Logistics

**Status**: Proposed  
**Type**: Feature  
**Area**: Apps Web, Shared Packages, Database  
**Created**: 2026-10-16  

## Summary

Private vehicle charters, dedicated Toyota Sienna hire, and bespoke corporate transit logistics for intercity corridors across Nigeria. This feature provides public facing reservation interfaces on `/charter` and `/corporate` with transparent automated fare estimates in integer kobo, coupled with an administrative review console on `/admin/requests` where operations staff can inspect requests, adjust custom quotes, assign vehicles and drivers, and handle corporate post pay billing.

## Requirements

### Acceptance Criteria

- **AC-1 (Instant Fare Estimation)**: Given a customer selecting origin and destination cities, trip type (`one_way`, `round_trip`, or `multi_day`), duration in days, and door to door pickup address, the system must compute an instant transparent fare breakdown in integer kobo using corridor base rates, daily vehicle allocation fees, and optional door to door surcharges.
- **AC-2 (Request Submission Schema Validation)**: All charter submissions must be validated through server side Zod schemas, normalizing customer mobile numbers to Nigerian E.164 format (`+234...`) and enforcing integer kobo values, valid dates in UTC ISO-8601, and a maximum of 5 passengers per Toyota Sienna.
- **AC-3 (Private Charter Client Flow)**: The public `/charter` route must provide an interactive request wizard with step navigation, vehicle feature showcases (Toyota Sienna 5 passenger individual bucket seating, dual climate control, luggage capacity), instant pricing breakdown, and unambiguous booking reference generation (`ATM-CRT-XXXXXX`).
- **AC-4 (Corporate Transit & B2B Billing Flow)**: The public `/corporate` route must capture organization details including company legal name, Tax Identification Number (TIN) or CAC registration number, and purchase order reference, supporting both immediate Paystack online checkout and an "Invoice My Organization" billing option.
- **AC-5 (Staff Operations Request Hub)**: The `/admin/requests` console must allow authorized staff to filter, search, and review incoming charter requests across status stages (`submitted`, `quoted`, `approved`, `assigned`, `completed`, `declined`), inspect customer details, and record dispatch notes.
- **AC-6 (Vehicle & Driver Assignment)**: Operations staff must be able to assign available Toyota Sienna fleet vehicles and vetted drivers directly to approved charter requests, with automatic verification of vehicle road readiness and document validity.
- **AC-7 (Audit Timeline & Event Logging)**: Every status change, quote override, or assignment must append an immutable chronological audit record to `charter_events` with staff identifier and timestamp in UTC.
- **AC-8 (Automated Confirmation Notifications)**: Upon quote approval or booking confirmation, the system must generate a customer notification containing the booking reference, itinerary dates, assigned driver details when available, and invoice or payment instructions.

## Decision

### Architecture & Approach

We build this feature using the project's standard Tracer Bullet approach, establishing a thin end to end thread connecting shared domain logic, repository state, API endpoints, public booking screens, and administrative operations.

1. **Shared Domain (`@atm/shared`)**:
   - Pure calculation engine `calculateCharterQuote` to compute integer kobo estimates cleanly without external side effects.
   - Zod validation schemas for quotes, charter creation, corporate requests, and administrative status transitions.
   - TypeScript domain interfaces for `CharterRequest`, `CharterQuoteResult`, and `CharterEvent`.

2. **Server Repositories & API Routes (`@atm/web`)**:
   - `CharterRepository` providing dual mode in memory storage with realistic seed data and Neon PostgreSQL Drizzle queries.
   - API endpoints:
     - `POST /api/charter/quote` (instant calculation)
     - `POST /api/charter/request` (customer and corporate submission)
     - `GET /api/admin/requests` (staff listing with filters)
     - `PATCH /api/admin/requests/[id]` (staff quote adjustment, vehicle assignment, and status transitions)

3. **User Interfaces (`@atm/web`)**:
   - Public Private Charter view at `apps/web/src/app/(public)/charter/page.tsx`.
   - Public Corporate Transit view at `apps/web/src/app/(public)/corporate/page.tsx`.
   - Administrative Request Console at `apps/web/src/app/(admin)/admin/requests/page.tsx`.

## Data Model

### Entity: `charter_requests`

| Field | Type | Nullable | Description |
|---|---|---|---|
| `id` | `text` | No | Primary key identifier (`crt-uuid`) |
| `reference` | `text` | No | Public unique reference (`ATM-CRT-XXXXXX`) |
| `customerId` | `text` | Yes | Foreign key to `users.id` if authenticated |
| `contactName` | `text` | No | Full name of client or booking coordinator |
| `contactPhone` | `text` | No | E.164 normalized phone number (`+234...`) |
| `contactEmail` | `text` | No | Contact email address |
| `organizationName` | `text` | Yes | Corporate entity name for B2B requests |
| `organizationTaxId` | `text` | Yes | TIN or RC number for corporate invoicing |
| `serviceType` | `text` | No | `'private_charter'`, `'corporate_transit'`, or `'custom_cargo'` |
| `tripType` | `text` | No | `'one_way'`, `'round_trip'`, or `'multi_day'` |
| `originCity` | `text` | No | Departure terminal city (Enugu, Abuja, etc.) |
| `originAddress` | `text` | No | Detailed door to door pickup address |
| `destinationCity` | `text` | No | Arrival city |
| `destinationAddress` | `text` | No | Destination delivery address |
| `departureDate` | `text` | No | UTC ISO-8601 departure date |
| `returnDate` | `text` | Yes | UTC ISO-8601 return date for round trip or multi day |
| `durationDays` | `integer` | No | Trip duration in days, minimum 1 |
| `passengerCount` | `integer` | No | Number of passengers, minimum 1, maximum 5 |
| `specialRequirements` | `text` | Yes | Custom requests, escort, coolbox, cargo notes |
| `estimatedFareKobo` | `integer` | No | Automated baseline estimate in integer kobo |
| `finalFareKobo` | `integer` | Yes | Staff adjusted final quote in integer kobo |
| `billingMethod` | `text` | No | `'paystack_gateway'` or `'corporate_invoice'` |
| `invoiceReference` | `text` | Yes | Corporate purchase order reference |
| `status` | `text` | No | `'submitted'`, `'quoted'`, `'approved'`, `'assigned'`, `'completed'`, `'declined'` |
| `assignedVehicleId` | `text` | Yes | Foreign key to `vehicles.id` |
| `assignedDriverId` | `text` | Yes | Foreign key to `drivers.id` |
| `dispatchNotes` | `text` | Yes | Internal notes by operations managers |
| `createdAt` | `text` | No | UTC ISO-8601 creation timestamp |
| `updatedAt` | `text` | No | UTC ISO-8601 update timestamp |

### Entity: `charter_events`

| Field | Type | Nullable | Description |
|---|---|---|---|
| `id` | `text` | No | Primary key identifier (`crtevt-uuid`) |
| `requestId` | `text` | No | Foreign key to `charter_requests.id` |
| `status` | `text` | No | Target status after event |
| `description` | `text` | No | Human readable narrative of action |
| `staffId` | `text` | Yes | Identifier of staff member who performed action |
| `createdAt` | `text` | No | UTC ISO-8601 creation timestamp |

## Value Sourcing

| Value Needed | Source | Fallback / Invariant |
|---|---|---|
| Base corridor fare | Standard route table in `@atm/shared` | ₦180,000 baseline for unlisted routes |
| Daily charter rate | `durationDays * 120,000 NGN (12,000,000 kobo)` | Minimum 1 day multiplier |
| Door to door fee | Standard flat surcharge of ₦15,000 (1,500,000 kobo) | Omitted if terminal to terminal |
| Return trip discount | 15 percent deduction on return leg base fare | Computed in integer kobo with rounding |
| Booking reference | Secure random generator prefix `ATM-CRT-` | 6 alphanumeric characters |
| Staff identity | Session user id from staff request headers | `staff-ops-default` |

## Build Plan

1. **Shared Schemas and Utilities (`packages/shared`)**:
   - Create `packages/shared/src/schemas/charter.ts` with Zod validation.
   - Create `packages/shared/src/types/charter.ts` with TypeScript contracts.
   - Create `packages/shared/src/utils/charter.ts` with `calculateCharterQuote`.
   - Export charter domain models in `packages/shared/src/index.ts`.
2. **Server Repository & Seed Data (`apps/web`)**:
   - Create `apps/web/src/server/repositories/charter.ts` with stateful in memory repository and realistic Nigerian corporate charter seeds.
3. **API Route Handlers (`apps/web`)**:
   - Create `POST /api/charter/quote`.
   - Create `POST /api/charter/request`.
   - Create `GET /api/admin/requests` and `PATCH /api/admin/requests/[id]`.
4. **Public Charter UI (`apps/web`)**:
   - Upgrade `apps/web/src/app/(public)/charter/page.tsx` with quote calculator, multi step wizard, vehicle features, and instant confirmation view.
5. **Public Corporate Logistics UI (`apps/web`)**:
   - Upgrade `apps/web/src/app/(public)/corporate/page.tsx` with company registration fields, invoice options, executive transit tiers, and agreement form.
6. **Admin Requests Management Console (`apps/web`)**:
   - Upgrade `apps/web/src/app/(admin)/admin/requests/page.tsx` with filter tabs, request detail drawer, quote modifier, vehicle and driver assignment, and status updates.
7. **Verification & Regression Testing**:
   - Create test suite `packages/shared/tests/phase12-charter-logistics.test.ts` verifying quote calculations, Zod validations, phone normalizations, and status transitions.
