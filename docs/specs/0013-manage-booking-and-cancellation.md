# 0013. Manage Booking and Cancellation

**Date**: 2026-10-15
**Status**: Accepted

## Summary

This specification establishes self service booking management and ticket cancellation for Ascent Transport Management. Travelers retrieve their reservation on `/manage` using their unique booking reference and booked phone number, guarded by server side sliding window rate limiting. The system enforces tiered cancellation fees based on hours remaining before departure, enables per seat or whole reservation cancellation, immediately returns released seats to live inventory, and provides a hybrid refund choice between instant wallet credit and Paystack gateway reversal.

## Context

Ascent Transport Management operates scheduled Toyota Sienna departures across high demand Nigerian intercity corridors. Travelers frequently need to verify departure terminals, reprint boarding passes, or cancel journeys due to schedule adjustments. Previously, booking retrieval and ticket cancellations lacked a self service surface, forcing customers to contact phone dispatchers or visit physical terminal counters.

Without a structured management and cancellation workflow, operations suffer from three core operational vulnerabilities:
1. Seat inventory stays locked when passengers cannot travel, leaving vehicles with empty seats that could have been sold to waitlisted travelers.
2. Manual cancellation requests create friction, delayed refunds, and inconsistent fee deductions.
3. Unprotected public lookup forms risk brute force guessing of passenger contact details and travel itineraries.

A self service management system with verified phone matching, automatic tiered fee deduction in integer kobo, and instant seat inventory replenishment resolves these challenges while maintaining strict security controls.

## Requirements

**User stories**:
- As a ticketed passenger, I want to retrieve my booking details using my reference code and phone number so that I can inspect terminal directions, check departure times, and print boarding passes.
- As a traveler whose plans changed, I want to cancel my reservation or individual seats before departure so that I can receive a fair credit refund based on clear cancellation rules.
- As a platform operator, I want cancelled seats to return to available inventory immediately so that other travelers can book open Sienna seats without vehicle underutilization.

**Acceptance criteria**:
- **AC-1**: Travelers authenticate on `/manage` by providing their booking reference (pattern `ATM-XXXXXX`) and normalized phone number (+234...), returning full trip, terminal, seat, and ticket details.
- **AC-2**: Server side rate limiting tracks lookup attempts per IP and phone hash, enforcing a hard lockout of sixty minutes after five consecutive failed lookup attempts.
- **AC-3**: The management interface displays complete trip details in Africa/Lagos WAT, passenger names, Toyota Sienna seat numbers (1 to 5), QR code boarding passes, and live cancellation eligibility.
- **AC-4**: Cancellation fee calculations run through `calculateCancellationFee`, applying ten percent fee beyond twenty four hours, twenty five percent fee between six and twenty four hours, fifty percent fee between two and six hours, and non refundable zero refund within two hours of scheduled departure.
- **AC-5**: Travelers with multi passenger bookings can select individual passenger seats or the entire reservation for cancellation, calculating fees and refunds pro rated in integer kobo per seat.
- **AC-6**: Confirmed cancellations immediately return the freed seat numbers to the trip inventory, atomically incrementing `availableSeats` so they appear on `/trips` without delay.
- **AC-7**: The refund system provides a hybrid choice: instant ATM store credit credited to the customer phone ledger (`DbCreditLedger`) for immediate rebooking, or Paystack gateway reversal to the original payment source.
- **AC-8**: Upon successful cancellation, an automated SMS confirmation dispatches to the customer phone detailing the cancelled seats, fee deducted, and net refund credited.

## Options considered

### Option 1: Direct reference and phone match with hybrid refund disbursement

Travelers look up bookings using their booking reference and phone number without account creation, protected by database backed rate limiting. Cancellations calculate tiered kobo fees and let the traveler choose instant ATM credit or gateway card reversal.

**Pros**:
- Frictionless access for guest passengers who booked without creating a permanent account.
- Instant wallet credit eliminates bank processing delays and encourages rebooking on Ascent corridors.
- Immediate seat release prevents empty vehicles on high demand routes.

**Cons**:
- Requires robust rate limiting and input validation to prevent phone enumeration attacks.

### Option 2: Mandatory customer portal account creation

Require all travelers to register, verify an email or phone password, and log in to a customer account before viewing or cancelling any booking.

**Pros**:
- High authentication certainty through authenticated session cookies.

**Cons**:
- High friction for one off travelers who booked as guests via SMS or quick checkout.
- Abandonment and increased customer service calls for urgent last minute cancellations.

### Option 3: Terminal counter and dispatcher manual processing only

Require travelers to visit terminal ticket counters or call customer support agents to execute cancellations manually.

**Pros**:
- Terminal staff verify identity in person.

**Cons**:
- High operational overhead and wage costs for terminal staff.
- Slow processing prevents released seats from re entering inventory before vehicle departure.

## Decision

**Chosen option**: Option 1: Direct reference and phone match with hybrid refund disbursement

We adopt a guest accessible self service architecture on `/manage` secured by reference and phone matching, sliding window attempt tracking, tiered integer kobo cancellation fee computation, atomic seat inventory release, and a hybrid refund disbursement model.

**Implementation skills**: `drizzle-orm` (`mindrally/skills`, `.agents/skills/drizzle-orm/`) · `zod-schema-validation` (`mindrally/skills`, `.agents/skills/zod-schema-validation/`) · `coss` (`cosscom/ui`, `.agents/skills/coss/`) · `web-design-guidelines` (`vercel-labs/agent-skills`, `.agents/skills/web-design-guidelines/`)

## Rationale

Most intercity transport bookings in Nigeria are completed as guest checkouts where speed and convenience are paramount. Forcing customers to remember portal passwords or create user accounts during an urgent travel change creates unnecessary panic and friction.

Matching the booking reference with the customer phone number provides strong authorization because the reference code is private to the booker and delivered via SMS and email. Backing this lookup with database sliding window rate limiting prevents automated brute force guessing.

Providing instant ATM store credits allows travelers to rebook a new trip date immediately with zero banking delay. For travelers requiring cash return, supporting Paystack automated reversals honors consumer rights without requiring platform staff to manually process wire transfers.

## Feature design

**Data model sketch**:

```
Table cancellations:
  id: uuid (primary key)
  bookingId: uuid (foreign key -> bookings.id)
  ticketId: uuid (nullable, foreign key -> tickets.id; null if entire booking cancelled)
  customerId: uuid (foreign key -> customers.id)
  reason: text (e.g. 'schedule_change', 'medical', 'personal', 'corridor_delay')
  cancelledSeatsCount: integer (required, 1 to 5)
  totalFareCancelledKobo: integer (required, integer kobo)
  cancellationFeeKobo: integer (required, integer kobo)
  refundKobo: integer (required, integer kobo)
  disbursementMethod: text ('atm_credit' | 'paystack_reversal')
  paystackRefundId: text (nullable, gateway reference)
  status: text ('completed' | 'pending_gateway' | 'failed')
  createdAt: timestamp with time zone (ISO UTC)
  updatedAt: timestamp with time zone (ISO UTC)

Table rate_limit_attempts:
  id: uuid (primary key)
  key: text (unique, e.g. 'lookup:ip:phone_hash')
  attemptCount: integer (default 0)
  lockedUntil: timestamp with time zone (nullable)
  lastAttemptAt: timestamp with time zone (required)
```

**State transitions**:
- Ticket Status: `paid` → `cancelled` (or `refunded`)
- Booking Status:
  - If all tickets cancelled: `confirmed` → `cancelled`
  - If partial tickets cancelled: remains `confirmed` (active tickets retain seat assignments)
- Cancellation Record Status: `requested` → `completed` (or `pending_gateway` if Paystack queue delays occur)
- Trip Inventory: `availableSeats` increments by `cancelledSeatsCount`

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/bookings/manage/lookup` | POST | `ref: string` (req), `phone: string` (req) | booking, trip, tickets, payments, eligibility | Public (Rate limited) | 404 not found, 429 locked, 422 invalid |
| `/api/bookings/manage/quote` | POST | `ref: string`, `phone: string`, `ticketIds: string[]` (opt) | feeKobo, refundKobo, feePct, hoursRemaining, quoteExpiresAt | Public (Rate limited) | 400 departure passed, 404 not found |
| `/api/bookings/manage/cancel` | POST | `ref: string`, `phone: string`, `ticketIds: string[]` (opt), `reason: string`, `disbursementMethod: string` | cancellationId, refundKobo, balanceAfterKobo, status | Public (Rate limited) | 400 cutoff passed, 409 already cancelled |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Lookup booking | Trip departure time | `trips.departure_time_utc` formatted to Africa/Lagos WAT |
| Lookup booking | Passenger seat numbers | `tickets.seat_no` (1 to 5 in Toyota Sienna) |
| Lookup booking | Lookup rate limit status | `rate_limit_attempts` table counter for client IP / phone |
| Calculate cancellation quote | Hours before departure | Difference between `trip.departure_time_utc` and current UTC time |
| Calculate cancellation quote | Fee percentage | Derived via `DEFAULT_CANCELLATION_POLICY` in `packages/shared` |
| Calculate cancellation quote | Cancellation fee kobo | `(totalFareCancelledKobo * feePercentage) / 100` rounded to integer |
| Calculate cancellation quote | Net refund kobo | `totalFareCancelledKobo - cancellationFeeKobo` in integer kobo |
| Disburse wallet credit | Customer credit balance | Updated in `customers.credits_kobo` and recorded in `credit_ledger` |
| Disburse Paystack reversal | Gateway refund reference | Paystack API `/refund` response `data.id` |
| Dispatch notification | Confirmation SMS text | Generated via `generateCancellationSms` sent to `customers.phone` |

**Key invariants**:
- Money is strictly integer kobo across all calculations. Never floating point.
- Cancellations cannot occur after trip departure time.
- A ticket cannot be cancelled more than once (idempotent state transition).
- Sum of `cancellationFeeKobo` and `refundKobo` must exactly equal `totalFareCancelledKobo`.
- Maximum five failed lookup attempts per hour before sixty minute lockout triggers.

**Security model**:
- Booking retrieval requires simultaneous knowledge of private booking reference and booked phone number.
- Server side rate limiter hashes incoming phone numbers with application salt to prevent plain text IP association.
- Paystack API keys remain on server runtime only. Never exposed to browser bundle.
- All mutations validate incoming payloads with server side Zod schemas.

**Configuration required**:
- `PAYSTACK_SECRET_KEY`: required for initiating Paystack automated refund API calls.
- `RATE_LIMIT_SALT`: optional salt for hashing rate limit tracking identifiers.

**Critical test scenarios**:
- Happy path: Passenger enters valid reference and phone, views active seats, selects cancellation with wallet credit, receives net refund and sees seats returned to inventory, verifies **AC-1**, **AC-3**, **AC-5**, **AC-6**, **AC-7**.
- Rate limit lockout: Five consecutive invalid lookup requests trigger HTTP 429 response and enforce sixty minute wait period, verifies **AC-2**.
- Cutoff enforcement: Cancellation request submitted within one hour of departure is rejected as non refundable per policy rules, verifies **AC-4**.
- Pro rated multi seat cancellation: Booking with two passengers allows cancelling one seat while keeping the remaining seat confirmed, verifies **AC-5**.
- Communication dispatch: Successful cancellation triggers automated SMS to passenger phone, verifies **AC-8**.

## Build plan

1. Define database schema migrations for `cancellations` and `rate_limit_attempts` in `packages/db`, satisfies **AC-2**, **AC-7**.
2. Add shared Zod schemas and validation helpers for lookup, cancellation quote, and cancellation execution in `packages/shared`, satisfies **AC-1**, **AC-4**, **AC-5**.
3. Implement `ManageBookingRepository` handling rate limiting, lookup verification, and atomic cancellation transactions in `apps/web`, satisfies **AC-1**, **AC-2**, **AC-6**, **AC-7**.
4. Create API route handlers for `/api/bookings/manage/lookup`, `/api/bookings/manage/quote`, and `/api/bookings/manage/cancel` in `apps/web`, satisfies **AC-1**, **AC-2**, **AC-4**, **AC-5**, **AC-7**.
5. Integrate Paystack automated refund gateway client and SMS dispatch notification triggers, satisfies **AC-7**, **AC-8**.
6. Build public lookup and booking management interface on `/manage` with `PageShell` compact density and accessible form validation, satisfies **AC-1**, **AC-2**, **AC-3**.
7. Build interactive cancellation drawer and fee breakdown modal with instant wallet credit or card reversal toggle, satisfies **AC-3**, **AC-4**, **AC-5**, **AC-7**.
8. Build automated contract and unit tests verifying rate limits, fee tiers, and atomic seat inventory replenishment, satisfies **AC-1**, **AC-2**, **AC-4**, **AC-6**.

## Consequences

**Positive**:
- Eliminates manual dispatcher workload for reservation cancellations and ticket lookups.
- Recovers lost vehicle capacity by returning cancelled seats to live booking inventory immediately.
- Ensures transparent integer kobo fee calculations that eliminate passenger disputes.
- Protects customer data with server enforced sliding window rate limiting.

**Negative / tradeoffs**:
- Paystack card refunds depend on third party bank processing times (three to five business days).
- Requires database storage for rate limit attempt tracking.

**Neutral**:
- Travelers choosing wallet credits can immediately rebook alternative travel dates on Ascent corridors.

## Follow-up

- [ ] Run `/develop manage booking and cancellation` to implement the schema, repository, and UI layers.
- [ ] Verify rate limiting headers and mobile responsive layouts against Web Interface Guidelines.

## References

**Project sources**:
- `AGENTS.md`: Money stored as integer kobo, dates in UTC ISO-8601 displayed in Africa/Lagos WAT, phone numbers normalized to E.164.
- `packages/shared/src/utils/cancellation.ts`: Pure function `calculateCancellationFee`.
- `packages/shared/src/constants/index.ts`: `DEFAULT_CANCELLATION_POLICY` tiered thresholds.
- `docs/specs/0009-booking-flow-and-seat-hold-locks.md`: Sienna five seat layout and hold locking mechanics.
- `docs/specs/0010-paystack-payments-and-ticket-delivery.md`: Paystack payment integration and integer kobo assertions.
- `docs/specs/0012-spatial-layout-and-page-styling-standards/index.md`: PageShell compact density and safe header clearance.

**Practices & standards**:
- Paystack Refund API documentation (`https://paystack.com/docs/api/refund`).
- RFC 6585 Additional HTTP Status Codes (HTTP 429 Too Many Requests).
- Vercel Web Interface Guidelines: 44px hit targets, visible focus indicators, and text balance typography.
