# Scope: Ascent Transport Management (ATM Nigeria)

Intercity passenger transport, parcel express logistics, and vehicle charter platform operating 5 seat Toyota Sienna fleets across major Nigerian travel corridors.

**Build approach:** Tracer Bullet (vertical end to end slices, thin but complete through every layer).  
**Workflow:** Beta (after develop, check verify then test). High risk features like payments and seat hold locks elevate to GA.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Monorepo foundation and data architecture | Foundation | existing |
| 2 | Design system and layout polish | Phase 1 | done |
| 3 | Home and trip query engine | Phase 2 | done |
| 4 | Booking flow and seat hold locks | Phase 3 | done |
| 5 | Paystack payments and ticket delivery | Phase 4 | done |
| 6 | Manage booking and cancellation | Phase 5 | done |
| 7 | Courier booking and parcel tracking | Phase 6 | done |
| 8 | Staff operations and revenue dashboard | Phase 7 | done |
| 9 | Terminal check-in and vehicle dispatch | Phase 8 | done |
| 10 | Admin logistics, CRM, and fleet maintenance | Phase 9 | done |
| 11 | Customer accounts and credit ledger | Phase 10 | done |
| 12 | Charter and corporate logistics | Phase 11 | done |
| 13 | SEO landing pages and launch preparation | Phase 12 | done |
| 14 | Driver mobile web portal and roadside manifest | Phase 13 | in-progress |
| 15 | Real time fleet telematics and journey tracking | Phase 14 | planned |

## Foundations

### 1. Monorepo foundation and data architecture · existing
Configure workspaces, Drizzle ORM schemas, Neon PostgreSQL connection, and shared domain utilities.
**Done when:** packages build and test cleanly, and database tables support all 23 core entities with idempotent migrations.
- [x] Decide architecture (spec): `/architect monorepo foundation`
- [x] Build packages and schemas: `/develop monorepo foundation`
- [x] Run contract and unit tests: `/test`
[Spec 0001](../specs/0001-monorepo-foundation.md) · code in `apps/web`, `packages/db`, `packages/shared`

## Slices

### 2. Design system and layout polish · done
Establish shared UI layout primitives, brand navigation, terminal directory, and static marketing views using calibrated tokens.
**Done when:** header, footer, terminal directory, and static policy pages render with responsive layout, zero pulsing animations, and full WCAG AA contrast.
- [x] Design it (spec): `/architect design system and layout polish`
- [x] Build it: `/develop design system and layout polish`
   - [x] Refine `globals.css` brand tokens, typography, and motion reduction (AC-1, AC-8)
   - [x] Polish `PublicHeader` and `PublicFooter` responsive navigation (AC-2, AC-3)
   - [x] Verify `PageShell` container, breadcrumbs, and 44px touch targets (AC-4, AC-5, AC-7)
   - [x] Audit static skeleton placeholders with zero pulse animations (AC-6)
   - [x] Polish static marketing and terminal directory pages (AC-9)
   - [x] Implement segmented hero floating cards and vehicle highway anchor (Spec 0004)
   - [x] Standardize spatial layout and PageShell density modes (Spec 0012)
- [x] Verify it: `/check verify design system and layout polish`
- [x] Test it: `/test design system and layout polish`
[Spec 0002](../specs/0002-design-system-and-layout-polish.md) · [Spec 0004](../specs/0004-segmented-hero-and-main-page-redesign.md) · [Spec 0007](../specs/0007-hero-section-beautification-and-micro-animations.md) · [Spec 0012](../specs/0012-spatial-layout-and-page-styling-standards/index.md) · code in `apps/web/src/app/globals.css`, `apps/web/src/components/layout`, `apps/web/src/components/ui`, `apps/web/src/app/(public)`

### 3. Home and trip query engine · done
Interactive search widget on the home page querying scheduled Sienna trips by corridor, date, and available seats.
**Done when:** travelers can select origin, destination, and departure date to view real time trips with integer kobo fares and remaining seat counts.
- [x] Design it (spec): `/architect home and trip query engine`
- [x] Build it: `/develop home and trip query engine`
   - [x] Validate search query parameters with shared Zod schema (AC-1, AC-2, AC-3)
   - [x] Implement trip repository search engine with schedule templates and integer kobo pricing (AC-4)
   - [x] Implement real time seat calculation and same day departure cutoff rules (AC-5, AC-6)
   - [x] Render public home hero search form with corridor swap (AC-1, AC-8)
   - [x] Render trip search results page with seven day date strip, terminal filter, and zero pulse skeletons (AC-7, AC-8)
- [x] Verify it: `/check verify home and trip query engine`
- [x] Test it: `/test home and trip query engine`
[Spec 0003](../specs/0003-home-and-trip-query-engine.md) · [Spec 0008](../specs/0008-client-side-browser-routing-and-seo-head-system.md) · code in `apps/web/src/app/(public)/trips`, `apps/web/src/components/booking`, `apps/web/src/server/repositories/trips.ts`, `packages/shared/src/schemas/search.ts`

### 4. Booking flow and seat hold locks · done · GA
Interactive 5 passenger Toyota Sienna seat selector, passenger information capture, and 15 minute temporary database hold locks.
**Done when:** passengers choose specific seats, provide E.164 phone numbers, and hold seats securely for 15 minutes without collision risk.
- [x] Design it (spec): `/architect booking flow and seat hold locks`
- [x] Build it: `/develop booking flow and seat hold locks`
   - [x] Define `booking_holds` database table schema and relations in `packages/db` (AC-4, AC-5)
   - [x] Update shared seat hold schemas and 15-minute constants in `packages/shared` (AC-2, AC-3, AC-4, AC-10)
   - [x] Implement `BookingRepository` atomic hold creation, collision detection, and idempotency (AC-4, AC-5, AC-6, AC-8, AC-9)
   - [x] Create API route handlers for seat availability, hold creation, and hold release (AC-4, AC-5, AC-6)
   - [x] Polish public booking page with 15-minute countdown, non-blocking modal, and stepper (AC-1, AC-2, AC-3, AC-7, AC-10)
- [x] Verify it: `/check verify booking flow and seat hold locks`
- [x] Test it: `/test booking flow and seat hold locks`
[Spec 0009](../specs/0009-booking-flow-and-seat-hold-locks.md) · code in `apps/web/src/app/(public)/book`, `apps/web/src/components/booking`, `packages/db/src/schema`, `packages/shared/src/schemas`

### 5. Paystack payments and ticket delivery · done · GA
Paystack checkout integration, secure idempotent webhook verification, cryptographic QR code ticket generation, and SMS or WhatsApp dispatch.
**Done when:** payments verify idempotently, status transitions to paid, and travelers receive a downloadable PDF ticket with QR code and SMS notification.
- [x] Design it (spec): `/architect paystack payments and ticket delivery`
- [x] Build it: `/develop paystack payments and ticket delivery`
   - [x] Core payment client, schemas, and webhook signature verification (AC-1, AC-4, AC-10)
   - [x] Payment repository, idempotent transitions, and late payment credit logic (AC-5, AC-6, AC-7)
   - [x] API route handlers for checkout initialize, callback verify, and webhooks (AC-1, AC-2, AC-3, AC-4, AC-5, AC-10)
   - [x] SMS notification dispatch and ticket QR issuance service (AC-6, AC-8)
   - [x] Booking review checkout trigger and printable ticket success UI (AC-2, AC-9)
- [ ] Verify it: `/check verify paystack payments and ticket delivery`
- [x] Test it: `/test paystack payments and ticket delivery`
- [ ] Review it (fresh model): `/check review paystack payments and ticket delivery`
- [ ] Document it: `/document paystack payments and ticket delivery`
[Spec 0010](../specs/0010-paystack-payments-and-ticket-delivery.md) · code in `apps/web/src/server/payments`, `apps/web/src/server/repositories/payments.ts`, `apps/web/src/app/api/payments`, `apps/web/src/app/(public)/book/success`

### 6. Manage booking and cancellation · done
Self service booking retrieval via reference code and phone number, with tiered cancellation fee logic and credit refunds.
**Done when:** passengers can view active tickets, request cancellation before departure cutoffs, and receive calculated credit refunds.
- [x] Design it (spec): `/architect manage booking and cancellation`
- [x] Build it: `/develop manage booking and cancellation`
   - [x] Define `cancellations` and `rate_limit_attempts` database schemas (AC-2, AC-7)
   - [x] Implement `ManageBookingRepository` with rate limiting and atomic release (AC-1, AC-2, AC-6, AC-7)
   - [x] Create API route handlers for lookup, quote, and cancellation execution (AC-1, AC-4, AC-5, AC-7)
   - [x] Render `/manage` lookup portal with PageShell compact density (AC-1, AC-2, AC-3)
   - [x] Build interactive cancellation drawer with hybrid credit or gateway reversal (AC-3, AC-4, AC-5, AC-7, AC-8)
- [x] Test it: `/test manage booking and cancellation`
- [ ] Review it (fresh model): `/check review manage booking and cancellation`
- [ ] Document it: `/document manage booking and cancellation`
[Spec 0013](../specs/0013-manage-booking-and-cancellation.md) · code in `apps/web/src/app/(public)/manage`, `apps/web/src/app/api/bookings/manage`, `packages/db/src/schema`, `packages/shared/src/schemas`

### 7. Courier booking and parcel tracking · done
Waybill generation, parcel drop-off booking, and public parcel tracking by tracking code (`ATM-EXP-XXXXXX`).
**Done when:** senders can book parcel freight between terminals, print shipping slips, and track chain of custody updates in real time.
- [x] Design it (spec): `/architect courier booking and parcel tracking`
- [x] Build it: `/develop courier booking and parcel tracking`
   - [x] Implement pure calculation function `calculateParcelDeliveryFee` in `@atm/shared` (AC-2)
   - [x] Define parcel booking schema `createParcelSchema` and pickup code generation in `@atm/shared` (AC-3, AC-4)
   - [x] Implement `ParcelRepository` with static in-memory store and seed fixtures (AC-4, AC-5, AC-7, AC-8)
   - [x] Build courier booking page on `/courier` with interactive price breakdown and waybill pass (AC-1, AC-5, AC-6)
   - [x] Build public tracking page on `/track` with visual chain-of-custody progress stepper and terminal pickup guide (AC-7, AC-8, AC-9)
   - [x] Add API routes `/api/courier/quote`, `/api/courier/book`, and `/api/courier/track`
- [x] Test it: `/test courier booking and parcel tracking`
- [ ] Review it (fresh model): `/check review courier booking and parcel tracking`
- [ ] Document it: `/document courier booking and parcel tracking`
[Spec 0014](../specs/0014-courier-booking-and-parcel-tracking.md) · code in `apps/web/src/app/(public)/courier`, `apps/web/src/app/(public)/track`, `packages/shared/src/utils/courier.ts`, `apps/web/src/server/repositories/parcels.ts`

### 8. Staff operations and revenue dashboard · done · GA
Protected administrative back-office shell with role based authorization for terminal managers and executive revenue reporting.
**Done when:** authorized staff sign in securely, inspect terminal throughput, review booking logs, and export monthly revenue statements.
- [x] Design it (spec): `/architect staff operations and revenue dashboard`
- [x] Build it: `/develop staff operations and revenue dashboard`
   - [x] Implement server side metrics aggregation service in `@/server/repositories/reports.ts` (AC-2, AC-6)
   - [x] Upgrade `/admin` main dashboard with terminal throughput filter, live KPI cards, and recent booking log (AC-2, AC-3, AC-4, AC-5)
   - [x] Build `/admin/reports` financial reporting view with corridor revenue comparisons and CSV export (AC-6, AC-7)
   - [x] Build `/admin/bookings` searchable booking manifest with live status filters (AC-4)
- [x] Test it: `/test staff operations and revenue dashboard`
- [ ] Review it (fresh model): `/check review staff operations and revenue dashboard`
- [ ] Document it: `/document staff operations and revenue dashboard`
[Spec 0015](../specs/0015-staff-operations-and-revenue-dashboard.md) · code in `apps/web/src/app/(admin)/admin`, `apps/web/src/server/repositories`

### 9. Terminal check-in and vehicle dispatch · done · GA
Phone first ticket verification and vehicle departure manifest generation at physical terminal gates.
**Done when:** terminal agents scan tickets or verify phone numbers to mark passengers checked in and print driver trip manifests.
- [x] Design it (spec): `/architect terminal check-in and vehicle dispatch`
- [x] Build it: `/develop terminal check-in and vehicle dispatch`
   - [x] Implement terminal dispatch and check in repository service (AC-2, AC-3, AC-5)
   - [x] Build `/admin/check-in` with live camera QR scanner and phone search fallback (AC-1, AC-2)
   - [x] Build `/admin/trips` departure console with driver and vehicle assignment (AC-4, AC-5)
   - [x] Create printable Nigerian highway manifest on `/admin/trips/[tripId]/manifest` (AC-6)
   - [x] Implement 15-minute departure cutoff standby seat release action (AC-7)
- [x] Verify it: `/check verify terminal check-in and vehicle dispatch`
- [x] Test it: `/test terminal check-in and vehicle dispatch`
- [ ] Review it (fresh model): `/check review terminal check-in and vehicle dispatch`
- [ ] Document it: `/document terminal check-in and vehicle dispatch`
[Spec 0016](../specs/0016-terminal-check-in-and-vehicle-dispatch.md) · code in `apps/web/src/app/(admin)/admin/check-in`, `apps/web/src/app/(admin)/admin/trips`, `apps/web/src/server/repositories/dispatch.ts`

### 10. Admin logistics, CRM, and fleet maintenance · done · GA
Comprehensive management for parcel inventory, customer service inquiries, dynamic pricing overrides, and vehicle service intervals.
**Done when:** admins can manage parcel transfers across hubs, adjust corridor fares, resolve customer complaints, and track vehicle road readiness.
- [x] Design it (spec): `/architect admin logistics and fleet maintenance`
- [x] Build it: `/develop admin logistics and fleet maintenance`
   - [x] Implement shared schemas and domain types for fleet, pricing, and inquiries (AC-1, AC-3, AC-7)
   - [x] Build operations repositories for fleet, pricing, and CRM (AC-1, AC-2, AC-3, AC-4, AC-8)
   - [x] Build `/admin/fleet` maintenance tracking and service logging console (AC-1, AC-2)
   - [x] Build `/admin/pricing` dynamic corridor fare and seasonal multiplier console (AC-3, AC-4)
   - [x] Build `/admin/parcels` hub dispatch and pickup code verification console (AC-5, AC-6)
   - [x] Build `/admin/inquiries` customer support ticket resolution console (AC-7, AC-8)
- [x] Verify it: `/check verify admin logistics and fleet maintenance`
- [x] Test it: `/test admin logistics and fleet maintenance`
- [ ] Review it (fresh model): `/check review admin logistics and fleet maintenance`
- [ ] Document it: `/document admin logistics and fleet maintenance`
[Spec 0017](../specs/0017-admin-logistics-crm-and-fleet-maintenance.md) · code in `apps/web/src/app/(admin)/admin/fleet`, `apps/web/src/app/(admin)/admin/pricing`, `apps/web/src/app/(admin)/admin/parcels`, `apps/web/src/app/(admin)/admin/inquiries`

### 11. Customer accounts and credit ledger · done · GA
Optional traveler profiles, saved passenger details, historical trip records, and promotional credit ledger balances.
**Done when:** repeat customers can manage saved traveler profiles, view previous booking receipts, and redeem store credits during checkout.
- [x] Design it (spec): `/architect customer accounts and credit ledger`
- [x] Build it: `/develop customer accounts and credit ledger`
   - [x] Implement shared schemas and domain types for auth, profile, and credit ledger (AC-2, AC-3, AC-4, AC-7)
   - [x] Build `CustomerRepository` and `AccountRepository` with dual mode state (AC-5, AC-6, AC-7, AC-8)
   - [x] Build split canvas auth views: `/login`, `/register`, `/verify-phone`, `/2fa`, `/forgot-password`, `/reset-password` (AC-1, AC-2, AC-3, AC-4)
   - [x] Implement Next.js App Router auth API handlers under `/api/auth/` (AC-2, AC-3, AC-4)
   - [x] Build `/account` dashboard with profile, credit ledger, trips, and saved companions (AC-5, AC-6, AC-7)
   - [x] Integrate store credit deduction into seat booking checkout (AC-8)
- [x] Test it: `/test customer accounts and credit ledger`
- [ ] Review it (fresh model): `/check review customer accounts and credit ledger`
- [ ] Document it: `/document customer accounts and credit ledger`
[Spec 0018](../specs/0018-customer-accounts-and-credit-ledger.md) · code in `apps/web/src/app/(auth)`, `apps/web/src/app/(account)`, `apps/web/src/server/repositories`

### 12. Charter and corporate logistics · done
Request workflow for private Toyota Sienna charters, intercity corporate transport, and customized cargo shipments.
**Done when:** corporate clients can submit bespoke route requests, receive quotes, and confirm reservations through operations staff.
- [x] Design it (spec): `/architect charter and corporate logistics`
- [x] Build it: `/develop charter and corporate logistics`
   - [x] Shared schemas and pure calculation engine `calculateCharterQuote` (AC-1, AC-2)
   - [x] Server repository `CharterRepository` with seed fixtures (AC-5, AC-6, AC-7)
   - [x] API routes for quote calculation, request submission, and admin review (AC-1, AC-4, AC-5)
   - [x] Public `/charter` private vehicle booking page (AC-1, AC-3)
   - [x] Public `/corporate` organization logistics and invoicing page (AC-4)
   - [x] Administrative `/admin/requests` dispatch console with vehicle and driver assignment (AC-5, AC-6, AC-7)
- [x] Test it: `/test charter and corporate logistics`
[Spec 0019](../specs/0019-charter-and-corporate-logistics.md) · code in `apps/web/src/app/(public)/charter`, `apps/web/src/app/(public)/corporate`, `apps/web/src/app/(admin)/admin/requests`

### 13. SEO landing pages and launch preparation · done
Dynamic corridor landing pages, XML sitemaps, structured metadata, rate limiting, and production readiness checks.
**Done when:** search engines index key corridor routes (such as Enugu to Abuja), Open Graph cards render cleanly, and route security audits pass.
- [x] Design it (spec): `/architect seo landing pages and launch preparation`
- [x] Build it: `/develop seo landing pages and launch preparation`
   - [x] Define corridor SEO profiles, schema types, and metadata registry (AC-1, AC-2)
   - [x] Implement dynamic corridor landing page `/routes/[corridor]` with booking widget and FAQ schema (AC-1, AC-2, AC-3)
   - [x] Build edge Open Graph image generator `/routes/[corridor]/opengraph-image` (AC-4)
   - [x] Implement dynamic `sitemap.ts` and `robots.ts` with private route exclusions (AC-5, AC-6)
   - [x] Configure production HTTP security headers and CSP in `next.config.mjs` (AC-7)
   - [x] Implement system healthcheck endpoint `/api/health` with database ping (AC-8)
- [x] Verify it: `/check verify seo landing pages and launch preparation`
- [x] Test it: `/test seo landing pages and launch preparation`
[Spec 0020](../specs/0020-seo-landing-pages-and-launch-preparation.md) · code in `apps/web/src/app/(public)/routes`, `apps/web/src/app/sitemap.ts`, `apps/web/src/app/robots.ts`, `apps/web/src/app/api/health`, `apps/web/next.config.mjs`

### 14. Driver mobile web portal and roadside manifest · done
Driver facing mobile web application for digital manifest verification, passenger boarding marks, departure status, and roadside incident reporting.
**Done when:** assigned drivers can authenticate via mobile phone number, access their daily passenger manifest, mark boardings, and record arrival times.
- [x] Design it (spec): `/architect driver mobile web portal and roadside manifest`
- [x] Build it: `/develop driver mobile web portal and roadside manifest`
   - [x] Define driver schemas, incident types, and domain models in shared package (AC-2, AC-6)
   - [x] Build driver repository with multi-method auth, trip resolution, and incident logger (AC-2, AC-3, AC-6, AC-7)
   - [x] Implement driver API route handlers for auth, trip data, boarding, and incidents (AC-2, AC-3, AC-4, AC-6, AC-7)
   - [x] Build driver mobile authentication screen `/driver/login` with OTP and PIN tabs (AC-1, AC-2)
   - [x] Build active trip dashboard `/driver` with roster and emergency contacts (AC-1, AC-3, AC-4, AC-8)
   - [x] Implement offline-resilient roadside manifest `/driver/manifest` with FRSC inspection mode (AC-1, AC-5)
   - [x] Build roadside incident advisory reporter with status update dispatch (AC-1, AC-6, AC-7)
- [x] Verify it: `/check verify driver mobile web portal and roadside manifest`
- [x] Test it: `/test driver mobile web portal and roadside manifest`
[Spec 0021](../specs/0021-driver-mobile-web-portal-and-roadside-manifest.md) · code in `apps/web/src/app/(driver)`, `apps/web/src/app/api/driver`, `apps/web/src/server/repositories/driver.ts`, `packages/shared/src/schemas/driver.ts`

### 15. Real time fleet telematics and journey tracking · in-progress
Live transit tracking, GPS coordinates, estimated arrival calculation, and emergency roadside breakdown assistance for passengers and operations staff.
**Done when:** travelers can view a live journey timeline showing vehicle transit progress between terminals, estimated arrival times, and emergency roadside breakdown assistance.
- [x] Design it (spec): `/architect real time fleet telematics and journey tracking`
- [ ] Build it: `/develop real time fleet telematics and journey tracking`
   - [ ] Define shared telematics domain models and schemas (AC-2, AC-4, AC-5)
   - [ ] Define Nigerian highway corridor waypoints and coordinates (AC-4, AC-5)
   - [ ] Implement progression and dynamic ETA calculation engine (AC-4, AC-6)
   - [ ] Build server-side telematics repository and API endpoints (AC-2, AC-3, AC-7)
   - [ ] Upgrade public `/track` hub with segmented switcher (AC-1, AC-2)
   - [ ] Build dedicated `/track/journey/[ref]` journey tracking view (AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9)
- [ ] Verify it: `/check verify real time fleet telematics and journey tracking`
- [ ] Test it: `/test real time fleet telematics and journey tracking`
[Spec 0022](../specs/0022-fleet-telematics-and-live-journey-tracking.md) · code in `apps/web/src/app/(public)/track`, `apps/web/src/app/api/telematics`, `packages/shared/src/types/telematics.ts`, `packages/shared/src/constants/waypoints.ts`

## Deferred
Out of scope for the initial release passes:
- **Mobile app build**: React Native Expo native application (deferred to post launch, consuming shared packages).
- **International payment methods**: Multi currency foreign card processing (deferred until cross border expansion).
- **Driver self-dispatch app**: Driver facing mobile portal (terminal staff manage manifests initially).

