# 0010. Paystack Payments and Ticket Delivery

**Date**: 2026-10-15
**Status**: Accepted

## Summary

This specification defines the payment processing and passenger ticket issuance engine for Ascent Transport Management. It connects held seat reservations to Paystack hosted checkout, verifies transactions through idempotent webhooks and client redirects, and issues cryptographically signed QR code tickets with automated SMS notifications. Completing this slice gives travelers a reliable end to end booking experience while protecting seat inventory and financial accounting.

## Context

Ascent Transport Management operates five passenger Toyota Sienna fleets across major Nigerian travel corridors. In Slice 4, we implemented seat selection and 15 minute temporary database holds to prevent double booking collisions. Without payment processing, reservations cannot transition into binding commercial bookings, and fleet operators have no verified manifest of paying passengers.

Nigerian digital payments require supporting multiple channels including debit cards, direct bank transfers, USSD codes, and mobile money. Paystack serves as our licensed payment gateway for Nigerian Naira transactions. Online transactions face network drops, delayed bank callbacks, and asynchronous webhook retries. If webhook reconciliation is not strictly idempotent, multiple event deliveries could create duplicate ledger entries.

Furthermore, seat hold locks expire after 15 minutes. A passenger may initialize payment on Paystack at minute 14 and complete their bank transfer after the hold expires. The system must gracefully detect this late payment scenario, safeguard seat inventory, and protect customer funds by issuing immediate credit balances or alerting terminal operations. Once paid, passengers need instant access to their digital ticket with tamper evident QR codes readable by terminal staff during boarding.

## Requirements

**User stories**:
- As a traveler with a held seat reservation, I want to pay securely via Paystack using my card, bank transfer, or USSD code so that my seat is confirmed.
- As a traveler who just paid, I want to see an immediate confirmation screen with a printable QR code ticket and receive an SMS summary on my phone.
- As a terminal operations agent, I want passenger tickets to carry cryptographically signed verification payloads so that boarding verification is instantaneous and cannot be forged.
- As an operations manager, I want every payment recorded idempotently in integer kobo so that financial accounting matches bank statements with zero discrepancies.

**Acceptance criteria**:
- **AC-1**: Passenger initializes checkout for a valid unexpired hold, generating a Paystack hosted payment URL with amount in integer kobo matching booking total.
- **AC-2**: Traveler completes payment through Paystack Standard hosted redirect and returns to the booking confirmation URL with reference parameters.
- **AC-3**: Client return callback route verifies transaction status with Paystack API, updating booking status to confirmed and displaying immediate booking receipt.
- **AC-4**: Webhook endpoint `/api/webhooks/paystack` validates HMAC SHA512 signature in request header `x-paystack-signature` using the configured server secret before reading event data.
- **AC-5**: Webhook processing is fully idempotent, ignoring repeated event deliveries and preventing duplicate payment records or duplicate ticket generation.
- **AC-6**: Successful payment transitions booking status from held to confirmed, creates a verified Payment ledger row, and generates individual Ticket records for all seats with HMAC SHA256 signed QR payloads.
- **AC-7**: If payment succeeds after the 15 minute hold expired and the seats were already taken by another passenger, the transaction is marked as an overbooked payment exception, operations dispatch is alerted, and a customer credit balance is issued.
- **AC-8**: Automated SMS confirmation containing booking reference, travel corridor, departure date, time, and seat numbers is dispatched via Termii gateway with a local stub fallback.
- **AC-9**: Interactive ticket confirmation page at `/book/success/[ref]` renders traveler manifest, individual seat numbers, travel policy, and printable QR boarding passes.
- **AC-10**: In production or strict mode, payment amount mismatches, unverified signatures, or unauthorized hold tokens reject payment verification with appropriate HTTP error codes.

## Options considered

### Option 1: Paystack Standard Redirect with Dual Webhook and Callback Reconciliation

In this approach, the traveler clicks Pay Now on the review step and is redirected to the Paystack hosted checkout page. Upon completion, Paystack redirects the traveler back to `/book/success/[ref]`, which verifies payment status with the Paystack API for instant visual feedback. Simultaneously, Paystack delivers an asynchronous webhook event with HMAC SHA512 signature verification, acting as the definitive server side ledger confirmation.

**Pros**:
- Full payment channel support including 3D Secure card authentication, dynamic bank transfer accounts, USSD, and mobile money without custom form compliance overhead.
- Dual reconciliation ensures travelers see instant confirmation even if webhook delivery is delayed by external queues.
- Webhook signature verification guarantees cryptographic authenticity independent of client browser behavior.

**Cons**:
- Browser redirect navigates travelers temporarily away from the domain before returning.

### Option 2: Paystack Inline Popup Modal Checkout

This approach loads the Paystack JavaScript inline script in the browser and displays an iframe popup over the existing booking page. When the payment completes, an inline JavaScript callback fires, and the client posts the payment reference to the server API.

**Pros**:
- Travelers remain on the same page without a full browser redirect.

**Cons**:
- Inline popup script relies on third party client side JavaScript execution which can be blocked by strict content security policies, browser ad blockers, or mobile web views.
- If the traveler closes their mobile browser before the inline callback triggers, payment confirmation relies entirely on asynchronous webhooks without smooth immediate UI redirection.

### Option 3: Custom Server Side Payment Form via Paystack Direct Charge API

This approach collects card details or bank account numbers directly in application form fields and submits them server side to Paystack charge endpoints.

**Pros**:
- Completely seamless custom branded UI on site.

**Cons**:
- Incurs significant PCI DSS compliance scope and security liabilities for handling cardholder data.
- Does not easily support Nigerian bank transfer accounts, USSD popups, or multi bank biometric challenges.

## Decision

**Chosen option**: Option 1: Paystack Standard Redirect with Dual Webhook and Callback Reconciliation

We adopt Paystack Standard hosted checkout with dual reconciliation. The webhook serves as the definitive financial truth, while the return callback provides instantaneous user experience.

**Implementation skills**: `drizzle-orm` (`drizzle-team/drizzle-orm`, `.agents/skills/drizzle-orm/`) · `zod-schema-validation` (`mindrally/skills`, `.agents/skills/zod-schema-validation/`)

## Rationale

Operating intercity transport across Nigeria requires broad payment channel compatibility. Travelers regularly choose dynamic virtual bank transfers and USSD banking codes when debit card transactions encounter bank network latency. Paystack Standard hosted checkout provides native bank transfer generation, USSD code copy tools, and card 3D Secure workflows without burdening our codebase with sensitive payment credentials.

Dual reconciliation resolves a classic distributed systems challenge in consumer payments. If we rely solely on webhooks, travelers on fast mobile connections might wait several seconds on a loading screen while Paystack webhook retries queue up. If we rely solely on client redirects, a traveler closing their browser tab after bank approval would leave their booking in an unconfirmed state. Combining client verification for immediate display with idempotent webhook processing ensures complete reliability.

## Feature design

**Data model sketch**:

```
customers (id UUID PK, phone VARCHAR UNIQUE, fullName VARCHAR, email VARCHAR, creditsKobo INT)
  │
  ├── 1:N ── bookings (id UUID PK, ref VARCHAR UNIQUE, customerId FK, tripId FK, status VARCHAR,
  │                    totalFareKobo INT, holdExpiresAt TIMESTAMPTZ, pickupTerminalId FK, dropoffTerminalId FK)
  │             │
  │             ├── 1:1 ── payments (id UUID PK, bookingId FK, provider VARCHAR, providerRef VARCHAR UNIQUE,
  │             │                    amountKobo INT, currency VARCHAR, method VARCHAR, status VARCHAR,
  │             │                    metadataJson JSONB, createdAt TIMESTAMPTZ)
  │             │
  │             ├── 1:5 ── tickets (id UUID PK, bookingId FK, tripId FK, seatNo INT, passengerName VARCHAR,
  │             │                   status VARCHAR, fareKobo INT, qrPayload TEXT, checkInAt TIMESTAMPTZ)
  │             │
  │             └── 1:N ── notifications (id UUID PK, channel VARCHAR, recipient VARCHAR, body TEXT,
  │                                      provider VARCHAR, status VARCHAR, createdAt TIMESTAMPTZ)
  │
  └── 1:N ── credit_ledgers (id UUID PK, customerId FK, deltaKobo INT, balanceAfterKobo INT,
                            reason VARCHAR, referenceBookingId FK, createdAt TIMESTAMPTZ)
```

**State transitions**:
- Booking status: `held` -> `confirmed` (upon verified payment) or `expired` (if hold expires unpaid).
- Payment status: `pending` -> `successful` (or `failed`).
- Ticket status: generated in `paid` status (subsequently transitions to `checked_in` at terminal boarding in Phase 8).
- Seat hold: held seats in `booking_holds` or active holds release and convert into confirmed tickets.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/payments/initialize` | POST | `bookingRef: string`, `holdToken: string`, `callbackUrl?: string` | `authorizationUrl: string`, `accessCode: string`, `reference: string` | Public with hold token | 400 invalid, 401 unauthorized, 404 not found, 410 hold expired |
| `/api/payments/verify` | GET | `reference: string` | `booking: object`, `tickets: array`, `status: string` | Public with booking ref | 400 invalid, 404 not found, 422 amount mismatch |
| `/api/webhooks/paystack` | POST | Raw request buffer, header `x-paystack-signature` | `status: "success"` | Cryptographic HMAC signature | 400 bad signature, 500 processing error |
| `/api/bookings/[ref]/ticket` | GET | `ref: string`, query `phone: string` | `booking: object`, `tickets: array`, `trip: object` | Phone ownership verification | 401 unauthorized, 404 not found |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Initialize payment | `amountKobo` | Database column `bookings.totalFareKobo` |
| Initialize payment | `email` | Customer contact email from booking, fallback to `<ref>@tickets.atm.ng` |
| Initialize payment | `reference` | Booking reference column `bookings.ref` |
| Verify payment | `amountKobo` | Paystack API response `data.amount` matched against `bookings.totalFareKobo` |
| Verify payment | `paymentMethod` | Paystack API response `data.channel` |
| Verify payment | `providerRef` | Paystack API response `data.reference` (with `data.id` stored in `metadataJson.gatewayId`) |
| Issue ticket | `qrPayload` | Derived server side HMAC SHA256 signature string `ATM-${ref}-${ticketId}-${hash}` |
| Issue ticket | `fareKobo` | Derived integer kobo `booking.totalFareKobo / seats.length` |
| Dispatch SMS | `recipient` | Booking primary contact phone column `bookings.emergencyContactPhone` or customer record |
| Overbooked credit | `deltaKobo` | Integer kobo column `payments.amountKobo` credited to `credit_ledgers` with `bookings.status = 'expired'` and note `OVERBOOKED_LATE_PAYMENT` |
| Ticket access | `phone` | Query parameter verified against normalized E.164 booking contact phone |

**Key invariants**:
- All currency amounts are strictly stored and compared in integer kobo, never floating point values.
- Transaction amount verified from Paystack must strictly equal `booking.totalFareKobo`. Any mismatch marks payment failed.
- Webhook signature verification operates on raw UTF8 request bytes before any JSON parsing.
- Webhook processing is idempotent: repeated delivery of the same `reference` or `providerRef` returns HTTP 200 without creating duplicate records.
- Ticket QR code payload contains an HMAC SHA256 signature generated with server secrets to prevent fraudulent ticket fabrication.
- A passenger hold that expired prior to payment confirmation cannot overwrite newly booked seats; it triggers an automatic credit balance, flags the booking record with `OVERBOOKED_LATE_PAYMENT`, and alerts terminal operations.

**Security model**:
- `PAYSTACK_SECRET_KEY` and `PAYSTACK_WEBHOOK_SECRET` reside exclusively in server side environment variables and are never bundled into client browser code.
- Public webhook endpoint is secured with HMAC SHA512 header verification against request body.
- Ticket QR payload signatures verify integrity without exposing customer private personal details.
- Public ticket retrieval requires booking reference plus matching passenger phone number.

**Configuration required**:
- `PAYSTACK_SECRET_KEY`: Secret API key for Paystack API authorization.
- `PAYSTACK_PUBLIC_KEY`: Public API key for client side initialization.
- `PAYSTACK_WEBHOOK_SECRET`: Optional dedicated webhook signing secret if distinct from secret key.
- `TERMII_API_KEY`: API key for Termii SMS gateway.
- `TERMII_SENDER_ID`: Registered sender identifier for SMS (e.g. `ATM Nigeria`).
- `TICKET_SIGNING_SECRET`: Cryptographic secret for signing passenger QR payloads (falls back to a local development key in non-production environments).

**Critical test scenarios**:
- Happy path: Traveler initiates payment for a held booking, completes Paystack checkout, callback verifies transaction, booking converts to confirmed, and tickets with signed QR codes are issued, verifies **AC-1**, **AC-2**, **AC-3**, **AC-6**.
- Webhook idempotency: Duplicate `charge.success` webhook events with identical reference are delivered; first event confirms booking, second event logs duplicate and returns HTTP 200 without creating duplicate payment or ticket rows, verifies **AC-4**, **AC-5**.
- Late payment after hold expired: Traveler completes payment after the 15 minute hold expired when another traveler has booked the seat; system records payment, creates customer credit ledger entry, flags overbooked exception, and alerts operations, verifies **AC-7**.
- Signature forgery: Webhook request with invalid or missing `x-paystack-signature` is rejected with HTTP 400, verifies **AC-4**, **AC-10**.
- Amount mismatch tampering: Paystack transaction amount does not match `booking.totalFareKobo`; verification fails with HTTP 422, verifies **AC-10**.
- SMS dispatch: Confirmed booking triggers SMS notification containing trip details, or logs stub in development, verifies **AC-8**.

## Build plan

1. Define shared payment schemas, Zod validation types, and Paystack webhook event interfaces in `packages/shared`, satisfies **AC-1**, **AC-4**, **AC-10**.
2. Enhance `apps/web/src/server/payments/index.ts` with real Paystack REST API client, HMAC SHA512 signature verification, and integer kobo assertions, satisfies **AC-1**, **AC-3**, **AC-4**, **AC-10**.
3. Implement `PaymentRepository` in `apps/web/src/server/repositories/payments.ts` managing idempotent payment recording, booking status transition to confirmed, and overbooked credit allocation, satisfies **AC-5**, **AC-6**, **AC-7**.
4. Implement ticket issuance service generating individual `DbTicket` records with HMAC SHA256 signed QR verification payloads, satisfies **AC-6**, **AC-9**.
5. Implement notification service supporting Termii SMS dispatch and local development stub logger, satisfies **AC-8**.
6. Create API route handler `POST /api/payments/initialize` generating Paystack checkout URLs for held reservations, satisfies **AC-1**, **AC-10**.
7. Create API route handler `GET /api/payments/verify` for return callback verification, satisfies **AC-2**, **AC-3**, **AC-6**.
8. Create API route handler `POST /api/webhooks/paystack` reading raw body and verifying webhook signatures idempotently, satisfies **AC-4**, **AC-5**, **AC-7**.
9. Connect Paystack checkout trigger button to Step 2 review in `apps/web/src/app/(public)/book/[tripId]/page.tsx`, satisfies **AC-1**, **AC-2**.
10. Build public booking success and printable ticket view at `apps/web/src/app/(public)/book/success/[ref]/page.tsx` rendering trip details and QR passes, satisfies **AC-2**, **AC-9**.
11. Build automated test suite in `packages/shared/tests/phase4-paystack-payments.test.ts` validating signature verification, webhook idempotency, amount match invariants, and late payment credit handling, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**, **AC-10**.

## Consequences

**Positive**:
- Travelers can pay using any major Nigerian banking method with automatic reconciliation.
- Dual reconciliation provides instant user feedback while preserving asynchronous webhook reliability.
- Tamper evident QR codes establish a secure foundation for terminal boarding verification.
- Overbooked payment handling protects customer funds when bank networks cause delays beyond the 15 minute hold window.

**Negative / tradeoffs**:
- Paystack Standard redirect temporarily navigates travelers away from the website.
- Late payment handling requires operations monitoring and customer credit ledger administration.

**Neutral**:
- Webhook testing in local development requires webhook tunneling or mock signature simulation.

## Follow-up

- [ ] Configure live Paystack webhook URL in the Paystack merchant dashboard pointing to `https://atm.ng/api/webhooks/paystack`.
- [ ] Register official Sender ID with Termii for Nigerian telecommunications network delivery.
