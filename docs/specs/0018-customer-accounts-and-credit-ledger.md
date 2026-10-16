# 0018. Customer Accounts, Modern Split Auth UI, and Credit Ledger

**Date**: 2026-10-16
**Status**: Accepted

## Summary

This specification establishes customer account management, secure multi-channel traveler authentication, two-factor authentication (2FA), and store credit ledger redemption for Ascent Transport Management. It introduces an interactive customer portal at `/account` alongside dedicated authentication workflows (`/login`, `/register`, `/verify-email`, `/verify-phone`, `/2fa`, `/forgot-password`, and `/reset-password`). The authentication interfaces adopt a high craft split canvas design based on the CoLabs visual layout, combining an left side credential form with an right side atmospheric 3D motion panel. Travelers can view past trips, save travel companions for quick seat bookings, verify phone numbers via six digit OTP, configure or challenge two factor authentication, and redeem integer kobo wallet credits directly at checkout.

## Context

Ascent Transport Management operates Toyota Sienna intercity passenger transit connecting major commercial hubs (Enugu, Abuja, Lagos, and Owerri). While guest travelers can search trips and hold seats, repeat customers require a unified hub to manage bookings, track upcoming departures, download official receipt passes, and store repeat companion passenger details.

Furthermore, when bookings are cancelled under our tiered refund policy (Spec 0013), passengers receive wallet credits stored as integer kobo in `DbCreditLedger` and `DbCustomer.creditsKobo`. Currently, there is no self service mechanism for travelers to check their credit balance or redeem it against new seat reservations.

Finally, the customer authentication experience requires visual alignment with high craft modern design standards. Replacing basic placeholder forms with a responsive split canvas card layout elevates user trust, supports social sign-in (Google and Facebook), provides smooth spring micro-interactions, and maintains strict WCAG AA contrast ratios and accessibility.

## Requirements

**User stories**:
- As a repeat traveler, I want to sign in with email and password, phone OTP, or social OAuth (Google and Facebook) on `/login` so that I can securely access my personal travel portal.
- As a new customer, I want to register on `/register`, verify my email and Nigerian mobile number, and complete onboarding so that my booking identity is established.
- As a passenger who forgot their password, I want to request a reset link on `/forgot-password` and update my password on `/reset-password` with clear validation.
- As an account holder on `/account`, I want to inspect my current credit balance in integer kobo, review past trip manifests, and save companion passenger details for one-click checkout.
- As a booking traveler with active store credit, I want to apply my credit balance at checkout so that my out-of-pocket payment via Paystack is reduced or eliminated.

**Acceptance criteria**:
- **AC-1**: Modern split canvas authentication surface renders on `/login` and `/register`, featuring an asymmetrical two-column layout with brand logo, credential inputs, social sign-in buttons (Google and Facebook), and an atmospheric 3D visual showcase with responsive mobile fallback.
- **AC-2**: User registration and sign-in supports standard email and password with client and server Zod validation, secure password hashing, and immediate authentication session creation via Better Auth compatible cookies.
- **AC-3**: Phone number verification flow on `/verify-phone` prompts for a six-digit numeric OTP sent to the customer's normalized E.164 Nigerian phone number, with resend cooldown timers and invalid attempt rate limiting.
- **AC-4**: Email verification on `/verify-email`, password reset initiation on `/forgot-password`, and password update on `/reset-password` enforce secure token expiration and single-use invalidation.
- **AC-5**: Customer dashboard on `/account` displays traveler profile information, live store credit balance formatted in Nigerian Naira from integer kobo, and an audit ledger of credit adjustments with dates and reasons.
- **AC-6**: Customer trip history tab on `/account` lists upcoming and completed journeys with route titles, travel dates in West Africa Time (WAT), seat allocations, and links to view ticket passes.
- **AC-7**: Saved companion passenger roster allows travelers to save up to 5 frequent travel companions (full name, gender, emergency contact phone) with full create, update, and delete actions.
- **AC-8**: Checkout seat booking integrates store credit toggle: if credit balance >= total fare, the booking confirms atomically with zero Paystack interaction; if partial, credit balance is deducted and the remaining integer kobo balance routes to Paystack checkout.

## Options considered

### Option 1: Monolithic guest-only checkout with voucher codes
Keep customers anonymous and issue one-time coupon codes for cancellations.

**Pros**:
- Requires zero authentication routes or customer account database tables.

**Cons**:
- Customers lose track of coupon codes.
- High customer support overhead for lost voucher inquiries.
- Slower checkout for repeat travelers who must re-enter passenger details on every booking.

### Option 2: Unified customer portal with split canvas auth and atomic credit redemption (Chosen)
Build a complete customer account experience backed by dedicated domain repositories (`CustomerRepository` and `AccountRepository`) and create modern split canvas auth surfaces (`/login`, `/register`, `/verify-phone`, `/forgot-password`, `/reset-password`) using Tailwind v4 and motion spring physics.

**Pros**:
- Seamless experience for repeat travelers with saved companions and historical tickets.
- Split canvas layout provides a high-craft brand impression matching the CoLabs visual aesthetic.
- Strict financial integrity: wallet balances and deductions are validated in integer kobo with database transactions.
- Dual authentication channels (email/password, social OAuth, and SMS OTP verification) provide flexibility for Nigerian travelers.

**Cons**:
- Expands the public route surface with additional auth and account views.

## Decision

**Chosen option**: Option 2: Unified customer portal with split canvas auth and atomic credit redemption.

We implement the complete customer account lifecycle and upgrade all authentication views to a high-craft split canvas card design.

**Implementation skills**: `coss` (`cosscom/ui`, `.agents/skills/coss/`) · `improve-ui` (`ibelick/ui-skills`, `.agents/skills/improve-ui/`) · `improve-animations` (`emilkowalski/skills`, `.agents/skills/improve-animations/`) · `zod-schema-validation` (`mindrally/skills`, `.agents/skills/zod-schema-validation/`)

## Rationale

Ascent Transport Management operates in a competitive intercity transit market where seamless repeat booking drives customer loyalty. Providing a modern, trustworthy sign-in experience paired with an effortless wallet credit redemption workflow ensures that travelers whose journeys were rescheduled or cancelled can immediately rebook without calling customer support.

## Feature design

### Visual Layout & Motion Architecture (Split Canvas Auth)
The authentication views (`/login`, `/register`, `/forgot-password`, `/reset-password`) implement a responsive two-column card container:
- **Left Column (Credential Surface)**:
  - Header: Ascent brand pill with gradient sphere icon and typography.
  - Heading: Tight title resting directly on canvas (`text-2xl font-bold tracking-tight text-slate-900 text-balance`).
  - Inputs: Floating focus-ring fields for Email, Phone number, and Password with accessible show/hide password toggle.
  - Remember me toggle: Tactile pill switch (`transition-transform duration-150 ease-out active:scale-95`).
  - Primary Submit: High-craft brand indigo button (`bg-brand-600 hover:bg-brand-700 active:scale-[0.98] transition-transform min-h-[44px]`).
  - Social Divider: "Or continue with" divider with clean hairline borders (`border-slate-200/80`).
  - Social Buttons: Side-by-side or stacked Google and Facebook OAuth buttons with authentic SVG brand marks and hover depth.
  - Footer Link: Subtle prompt leading to registration or login with clean optical alignment.
- **Right Column (Atmospheric Showcase Panel)**:
  - Surface: Rounded inner canvas (`rounded-3xl overflow-hidden bg-slate-950 text-white relative shadow-2xl`).
  - Specular Highlight: Top specular hairline (`h-px bg-gradient-to-r from-transparent via-white/30 to-transparent`).
  - Dynamic Artwork: Deep metallic iridescent ribbon composition (reflecting the 3D Toyota Sienna highway aesthetic).
  - Editorial Headline: Large display text (`text-3xl font-extrabold tracking-tight leading-tight text-balance`).
  - Value Proposition: Crisp description with micro pagination dots indicating key corridor benefits (comfort, safety, guaranteed departure).
- **Motion & Accessibility**:
  - Modal/card entrance: Decelerating curve `cubic-bezier(0.16, 1, 0.3, 1)` (Expo Out), duration 240ms.
  - Button presses: Instant tactile spring `active:scale-[0.97]` with zero layout shift.
  - Reduced Motion: Full respect for `prefers-reduced-motion` disabling continuous canvas loops.

### Data Model Sketch

**Entities**:
- `DbCustomer`:
  - `id`: UUID (Primary Key)
  - `userId`: UUID (Nullable foreign key to `DbUser`)
  - `phone`: String (Unique, E.164 format)
  - `fullName`: String
  - `email`: String (Nullable)
  - `creditsKobo`: Integer (Default 0, strict non-negative integer kobo)
  - `createdAt`: String (ISO UTC)
  - `updatedAt`: String (ISO UTC)
- `DbCompanionPassenger`:
  - `id`: UUID (Primary Key)
  - `customerId`: UUID (Foreign key to `DbCustomer.id`)
  - `fullName`: String
  - `gender`: 'male' | 'female' | 'other'
  - `phone`: String (E.164 format)
  - `isDefaultNextOfKin`: Boolean
  - `createdAt`: String (ISO UTC)
  - `updatedAt`: String (ISO UTC)
- `DbCreditLedger`:
  - `id`: UUID (Primary Key)
  - `customerId`: UUID (Foreign key to `DbCustomer.id`)
  - `deltaKobo`: Integer (Positive for credit additions, negative for redemptions)
  - `balanceAfterKobo`: Integer (Non-negative integer kobo balance)
  - `reason`: String (e.g. "Booking cancellation refund ATM-7K9W2P", "Applied to booking ATM-8M3X1Q")
  - `referenceBookingId`: String (Nullable reference)
  - `createdAt`: String (ISO UTC)
- `DbAuthVerificationToken`:
  - `id`: UUID (Primary Key)
  - `identifier`: String (Normalized phone or email)
  - `token`: String (Hashed 6-digit OTP or secure random string)
  - `type`: 'phone_otp' | 'email_verify' | 'password_reset'
  - `expiresAt`: String (ISO UTC)
  - `usedAt`: String (Nullable ISO UTC)
  - `attempts`: Integer (Default 0)

### State Transitions

**Credit Ledger Balance Lifecycle**:
`Zero Balance (0 kobo)` → `Credited via Cancellation (+deltaKobo)` → `Active Balance` → `Partial Checkout Deduction (-deltaKobo)` → `Depleted / Updated Balance`

**Auth Verification Token Lifecycle**:
`Generated (Active, 10 min expiry)` → `Validated (Single-use, marked usedAt)` | `Expired (Discarded)` | `Locked (>5 failed attempts)`

### API Surface

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/auth/register` | POST | `email:string`, `password:string`, `fullName:string`, `phone:string` | `user`, `sessionToken` | Public | 400 invalid, 409 duplicate email/phone |
| `/api/auth/login` | POST | `identifier:string` (email or phone), `password:string` | `user`, `sessionToken` | Public | 401 invalid credentials, 429 rate limited |
| `/api/auth/otp/send` | POST | `phone:string`, `intent:string` | `sent:boolean`, `cooldownSeconds:number` | Public | 400 invalid phone, 429 cooldown active |
| `/api/auth/otp/verify` | POST | `phone:string`, `code:string` | `verified:boolean`, `sessionToken?:string` | Public | 400 invalid code, 410 expired |
| `/api/auth/password/forgot` | POST | `email:string` | `success:boolean` | Public | 400 invalid email, 429 rate limited |
| `/api/auth/password/reset` | POST | `token:string`, `newPassword:string` | `success:boolean` | Public | 400 weak password, 410 invalid token |
| `/api/account/profile` | GET | none | `customer`, `companions:[]`, `creditsKobo:number` | Customer Session | 401 unauthorized |
| `/api/account/profile` | PATCH | `fullName?:string`, `email?:string` | `customer` | Customer Session | 400 invalid data, 401 unauthorized |
| `/api/account/companions` | POST | `fullName:string`, `gender:string`, `phone:string` | `companion` | Customer Session | 400 max 5 companions, 401 unauthorized |
| `/api/account/companions/[id]` | DELETE | `id:string` | `success:boolean` | Customer Session | 404 not found, 401 unauthorized |
| `/api/account/credits` | GET | none | `balanceKobo:number`, `ledger:[]` | Customer Session | 401 unauthorized |
| `/api/account/trips` | GET | `page?:number`, `status?:string` | `trips:[]`, `totalCount:number` | Customer Session | 401 unauthorized |
| `/api/bookings/checkout-credit` | POST | `bookingRef:string`, `holdToken:string`, `applyCreditKobo:number` | `appliedKobo`, `remainingFareKobo`, `isFullyPaid` | Customer Session | 400 insufficient credit, 404 hold expired |

### Value Sourcing

| Action | Value produced / displayed | Source |
|---|---|---|
| Customer sign in | User session & cookie token | Generated by Better Auth compatible crypto session store |
| OTP dispatch | 6-digit verification code | Cryptographically random numeric generator, hashed before DB persistence |
| Credit balance render | Displayed currency string (e.g. ₦32,000) | Formatted via `formatNaira(creditsKobo)` from `DbCustomer.creditsKobo` |
| Trip departure display | Local formatted time (e.g. Fri, 16 Oct, 6:30 am WAT) | Formatted via `formatWatDateTime(departureTimeUtc)` |
| Seat auto-fill | Passenger names and phone numbers | Sourced from `DbCompanionPassenger` selected by user during checkout |
| Credit checkout reduction | Deducted kobo and net Paystack amount | Calculated in `CustomerRepository.applyCreditToBooking` using integer subtraction |
| Guest booking consolidation | Historical bookings list | Matched on write during sign-in by normalizing customer's phone number against `Booking.contact.phone` |
| Split credit payment tracking | Payment method & provider reference | Logged in `DbPayment` as `method: 'credit_balance'` with `providerRef: 'atm-cred-[bookingRef]-[timestamp]'` |

### Key Invariants

1. **Integer Kobo Financial Storage**: Customer credit balances and ledger movements are stored strictly as integer kobo (`creditsKobo`), never floating point numbers.
2. **Non-Negative Balance**: A customer's credit balance can never be reduced below zero (`creditsKobo >= 0`). Ledger deductions occur in an atomic database transaction.
3. **Guest Booking Consolidation**: When a customer registers or logs in with an E.164 phone number, all prior unauthenticated guest bookings matching that phone number are automatically unified under their customer record.
4. **OAuth Account Linking Invariant**: If a customer signs in with Google or Facebook using an email that already registered via password, the OAuth account is automatically linked to the existing user after email verification, rather than throwing an error or creating a duplicate user.
5. **Partial Credit Payment State**: When store credit covers part of a seat hold fare, the credit is held in escrow (`deltaKobo: -appliedCreditKobo`, status `pending_gateway_completion`); if Paystack checkout succeeds, the hold converts to `confirmed`; if the hold expires or is cancelled, the credit is immediately returned to the customer's wallet ledger.
6. **Companion Limit & Validation**: A single customer account may store a maximum of 5 companion traveler profiles. Each companion profile requires a valid full name, gender, and canonical E.164 mobile number.
7. **Single-Use Tokens**: Password reset tokens and phone verification OTPs are single-use, hashed at rest, and expire within 10 minutes.
8. **Phone Number Canonicalization**: All customer and companion phone numbers are normalized to E.164 (+234...) format on write.
9. **Optical Hierarchy & Anti-Pulse**: Titles rest directly on section backgrounds; all skeleton placeholders are static with zero pulse animations.

### Security Model

- **Session Authentication**: Customer portal endpoints under `/api/account/*` require an active cookie session with `role === 'customer'`.
- **Ownership Scoping**: Customers can only inspect and mutate their own credit ledger, companions, and booking receipts. Cross-tenant queries are blocked by matching `customerId === session.user.id`.
- **Brute Force Protection**: Password login and OTP verification endpoints enforce sliding-window rate limiting (maximum 5 attempts per 15-minute window per IP/phone).
- **Password Security**: Passwords require a minimum of 8 characters, hashed with bcrypt or Argon2 via Better Auth standards. Plaintext passwords are never stored or logged.

### Configuration Required

- `BETTER_AUTH_SECRET`: Cryptographic secret key for session signing and token verification.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: OAuth credentials for Google social sign-in.
- `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET`: OAuth credentials for Facebook social sign-in.
- `SMS_GATEWAY_API_KEY`: API key for Nigerian SMS gateway delivery of phone OTP verification codes.

### Critical Test Scenarios

- **Happy Path**: Traveler registers on `/register`, verifies phone number via OTP on `/verify-phone`, signs in on `/login` with split canvas UI, and inspects credit balance and trip history on `/account`, verifies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-6**.
- **Credit Checkout**: Traveler with ₦40,000 in store credits books a ₦32,000 seat on `/book/[tripId]`, selects "Apply Store Credit", and completes booking instantly with zero gateway charges while balance updates to ₦8,000, verifies **AC-8**.
- **Partial Credit Checkout**: Traveler with ₦15,000 in store credits books a ₦32,000 seat; ₦15,000 credit is deducted and remaining ₦17,000 balance initializes Paystack checkout, verifies **AC-8**.
- **Companion Auto-Fill**: Traveler creates 2 companion profiles in `/account`, selects them during seat booking, and verifies names and emergency contacts populate without typing, verifies **AC-7**.
- **Auth Failure & Lockout**: Entering 5 invalid OTP codes on `/verify-phone` locks the verification attempt for 15 minutes, verifies **AC-3**, **AC-4**.
- **Unauthorized Guard**: Attempting to fetch `/account` or `/api/account/profile` without a valid customer session redirects to `/login`, verifies **AC-5**.

## Build Plan

Following our Tracer Bullet delivery approach, we implement end-to-end vertical slices through every layer:

1. **Shared Schemas and Domain Types**: Define Zod schemas and TypeScript interfaces in `@atm/shared` for customer registration, login credentials, OTP verification, companion profiles, and credit ledger operations, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-7**.
2. **Customer & Auth Server Repositories**: Implement `CustomerRepository` and `AccountRepository` in `apps/web/src/server/repositories/` with dual state support (static in-memory seeds and PostgreSQL tables) for customer profiles, credit ledger balances, and companion passengers, satisfies **AC-5**, **AC-6**, **AC-7**, **AC-8**.
3. **Split Canvas Authentication Interfaces**: Build the high-craft two-column auth surfaces (`/login`, `/register`, `/verify-phone`, `/verify-email`, `/forgot-password`, `/reset-password`) using the CoLabs visual layout, Base UI primitives, specular highlights, and spring micro-interactions, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**.
4. **Auth API Route Handlers**: Implement Next.js App Router route handlers under `apps/web/src/app/api/auth/` for credentials registration, sign-in, OTP dispatch/verification, and password recovery, satisfies **AC-2**, **AC-3**, **AC-4**.
5. **Customer Account Portal**: Implement the `/account` dashboard with tabbed navigation for Traveler Profile, Credit Ledger, Trip History, and Saved Companion Roster, satisfies **AC-5**, **AC-6**, **AC-7**.
6. **Checkout Credit Redemption Integration**: Integrate the store credit redemption toggle into the seat booking flow at `/book/[tripId]`, supporting full wallet bypass and partial Paystack checkout, satisfies **AC-8**.
7. **Comprehensive Test Suite**: Author unit and integration tests in `packages/shared/tests/phase11-customer-accounts.test.ts` verifying authentication schemas, OTP lifecycle, integer kobo credit transactions, and companion bounds, satisfies **AC-1** through **AC-8**.

## Consequences

**Positive**:
- Repeat travelers enjoy a modern, friction-free booking journey with saved passenger auto-fill.
- Cancelled ticket funds are transparently redeemable without staff intervention.
- The split canvas authentication layout establishes high visual trust and eliminates the generic AI look.

**Negative / tradeoffs**:
- Requires managing additional auth routes, OTP cooldown timers, and customer sessions.
- SMS OTP delivery incurs small per-message telecom costs in Nigeria.

**Neutral**:
- Integrates with existing `DbCustomer`, `DbCreditLedger`, and Better Auth schema structures already scaffolded in `packages/db`.

## Follow-up

- [ ] Configure live Google and Facebook OAuth client credentials in production environment variables.
- [ ] Connect production SMS/WhatsApp gateway provider for OTP token delivery.
