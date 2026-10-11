# Ascent Transport Management (ATM Nigeria) - Project Context & Architecture

**Domain:** `atmnigeria.com`  
**Brand Name:** Ascent Transport Management (ATM Nigeria)  
**Tagline:** "Travel Safe and Fast."  
**Founded:** 2019  
**Services:**
1. Intercity Passenger Transport (Primary)
2. Courier & Parcel Freight Express (Primary)
3. Private Vehicle Charter & Corporate Logistics (Secondary)

**Fleet Specification:**
- Dedicated Toyota Sienna (5 passenger seats per vehicle).
- Features: Full Air Conditioning (A/C), generous legroom, complimentary refreshments.
- Fixed daily departure schedules with guaranteed on-time departure.

**Key Geographic Corridors:**
- **Enugu ↔ Abuja:** Central Terminal (Ogui Rd) ↔ Utako Atlantic Mall.
- **Enugu ↔ Lagos:** Daily service connecting Enugu to Jibowu (Yaba), Ajah (Lekki), and Festac Town.
- **Lagos ↔ Owerri:** Daily service connecting all 3 Lagos terminals to Egbo Road, Owerri.

---

## 1. Monorepo Architecture & Stack Decisions

```
.
├── apps/
│   └── web/                   # Next.js (App Router), Tailwind CSS, shadcn/ui primitives
├── packages/
│   ├── db/                    # Drizzle ORM + Neon PostgreSQL, migrations, seed script
│   └── shared/                # Zod schemas, TS types, pure domain utils, unit tests
├── docs/
│   └── PROJECT_CONTEXT.md     # Single source of truth for platform rules
├── src/                       # [DEV-PREVIEW ONLY] Preview harness for AI Studio iframe environment
├── vite.config.ts             # [DEV-PREVIEW ONLY] Preview server configuration
├── metadata.json              # [DEV-PREVIEW ONLY] AI Studio dev harness metadata
└── turbo.json                 # Turborepo task pipelines
```

> **IMPORTANT:** `src/*`, `vite.config.ts`, and `metadata.json` are strictly **dev-preview only** harnesses for previewing the application in environments without active Next.js server runtimes. They must never be imported by `apps/web`. The single source of truth for all pages, layouts, styles, and components is `apps/web/src`.

- **Database:** PostgreSQL (Neon serverless connection pooler) via Drizzle ORM.
- **Authentication:** Better Auth. One `user` table with `role` ("customer" | "staff"). Staff users are provisioned exclusively by administrative management; public self-registration for staff is strictly prohibited.
- **Payments:** Paystack (card, bank transfer, USSD, mobile money). Webhook-driven, fully idempotent.
- **Notifications:** Termii (transactional SMS + WhatsApp) and Resend (email). Implemented behind a pluggable `NotificationProvider` interface.
- **Tickets:** `@react-pdf/renderer` + cryptographic QR code.
- **Future Mobile Support:** Future `apps/mobile` (Expo) will directly consume `packages/shared` and call the Next.js Route Handlers.

---

## 2. Global Engineering Rules

1. **Money Representation:**
   - **Integer kobo everywhere.** Never use floating-point numbers for money in database, domain models, or network APIs.
   - Formatted only at the UI edge with currency symbol (`₦`, en-NG) via `@atm/shared` `formatNaira()`.
2. **Time & Timezones:**
   - All database timestamps and API dates are stored in **UTC** (ISO-8601).
   - Displayed to users in **`Africa/Lagos` (WAT, UTC+1)**. Format: "Fri 10 Oct, 6:30 AM".
3. **Phone Number Normalisation:**
   - Identified by phone number.
   - All input phone numbers are normalised to **E.164 (`+234...`)** on write using `normalisePhone()` in `@atm/shared`.
4. **Environment Variables:**
   - Strictly validated at boot with Zod (`apps/web/src/lib/env.ts`).
   - Zero hardcoded secrets in source control.
5. **Validation:**
   - Strict server-side Zod validation on every mutation; client-side validation is purely for instant feedback.
6. **Accessibility (a11y):**
   - Semantic HTML, minimum 44px touch targets on all interactive elements, visible focus states, WCAG AA contrast.

---

## 3. Design Tokens & Strict Bans

- **Brand Palette:**
  - Primary Brand: Magenta / Purple (`--brand-600: #ca2484`, range `--brand-50` to `--brand-950`).
  - Dark Neutral: Slate 900 / 950 (`#0f172a`, `#020617`).
  - Light Background: White / Slate 50.
- **Hard Bans:**
  - **NO `animate-pulse`** or pulsing animations anywhere in the UI, including skeleton loaders. Use static skeleton blocks or plain text.
  - **NO titles wrapped in pills, badges, or cards**, especially in hero sections. Titles are plain typography resting directly on the section background.
  - Respect `prefers-reduced-motion` at all times.

---

## 4. Authoritative Data Model & Tables

All tables feature UUID primary keys, `created_at`, `updated_at`, and soft-delete (`deleted_at`) flags where applicable:

1. `terminals`: 6 physical hub locations (Enugu, Abuja, Lagos Jibowu, Lagos Ajah, Lagos Festac, Owerri).
2. `routes`: Origin & destination terminal pairs with estimated travel duration and distance.
3. `fares`: Integer kobo pricing rules and surge multipliers.
4. `vehicles`: Fleet inventory with `seat_layout` JSON (Toyota Sienna 5-passenger specification).
5. `drivers`: Vetted commercial driver records, contact phones, and license expiries.
6. `schedules`: Recurring daily departure templates.
7. `trips`: Generated trips with departure timestamps and real-time seat availability.
8. `users`: Better Auth user entity with `role` ("customer" | "staff").
9. `sessions` & `accounts`: Better Auth session management.
10. `staff_users`: Staff profile bound to user, defining terminal assignment and operational duties.
11. `customers`: Customer profiles uniquely keyed by normalized E.164 phone.
12. `bookings`: Reservation records with unique reference code (`ATM-XXXXXX`) and 15-minute `expires_at` hold.
13. `tickets`: **Partial unique index on `Ticket(trip_id, seat_no)`** where status IN (`held`, `paid`, `checked_in`).
14. `payments`: Payment ledger records with unique `provider_ref` (Paystack reference).
15. `cancellations`: Cancellation and refund requests with tiered fee percentage logic.
16. `credit_ledgers`: Customer credits transaction ledger.
17. `parcels`: Courier shipments uniquely identified by tracking code (`ATM-EXP-XXXXXX`).
18. `parcel_events`: Audit milestones for parcel chain of custody.
19. `charter_requests` & `corporate_requests`: B2B and private charter leads.
20. `complaints`: Customer feedback and issue resolution tracking.
21. `notifications`: Audit log of SMS, WhatsApp, and email dispatches.
22. `audit_logs`: Administrative change history.
23. `settings`: Key-value JSON storage for system-wide policies.

---

## 5. Phase Roadmap

- **Phase 0 (Completed):** Monorepo foundation, base TypeScript/lint configs, full Drizzle schema + migration + idempotent seed script, `@atm/shared` pure utils with Vitest unit tests, App Router route tree with placeholder pages, layout shells, auth protection stubs, and documentation.
- **Phase 1:** Design system & layout polish (tokens, header/footer, terminals directory, static pages).
- **Phase 2:** Home + search + trip query engine.
- **Phase 3:** Booking flow: interactive 5-seat Sienna layout, passenger details, 15-min seat hold locks.
- **Phase 4:** Paystack payments, webhooks, `@react-pdf/renderer` ticket generation, QR codes, Termii/Resend notifications.
- **Phase 5:** Manage booking, self-service cancellation, tiered refund calculation.
- **Phase 6:** Courier booking + public parcel tracking by `ATM-EXP-XXXXXX`.
- **Phase 7:** Admin auth + staff dashboard shell + monthly revenue reporting engine.
- **Phase 8:** Phone-first terminal check-in and vehicle dispatch manifest.
- **Phase 9:** Admin parcels, customer CRM, inquiries, pricing overrides, fleet maintenance.
- **Phase 10:** Optional customer accounts, booking history, wallet/credit ledger.
- **Phase 11:** Charter and corporate request workflows with automated notifications.
- **Phase 12:** SEO route landing pages, rate limiting, security audits, and production launch checklist.
